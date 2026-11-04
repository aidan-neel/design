import {
	createSeedConversations,
	findModel,
	WORKSPACES,
	type AssistantMessage,
	type Attachment,
	type Conversation,
	type ModelId,
	type Reply,
	type UserMessage,
	type Workspace,
	type WorkspaceId
} from './data';
import { composeReply, titleFromPrompt } from './responses';

/** Reverses a destructive action for the toast's Undo button. */
export type Undo = () => void;

type ActiveStream = {
	messageId: string;
	reply: Reply;
	timer: ReturnType<typeof setTimeout>;
};

const MAX_CHUNK_WORDS = 3;
const WORD_CHUNKS = /\S+\s*/g;

let idCounter = 0;
export function createId(prefix: string): string {
	idCounter += 1;
	return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

/**
 * Owns every conversation and the one reply that may be streaming.
 * Only one reply streams at a time; starting another stops the current one.
 */
export class ChatStore {
	conversations = $state<Conversation[]>(createSeedConversations());
	workspaceId = $state<WorkspaceId>('northwind');
	activeId = $state<string | null>(null);
	model = $state<ModelId>('halden-4');
	webSearch = $state(false);
	#stream = $state<ActiveStream | null>(null);

	constructor() {
		this.activeId = this.visibleConversations[0]?.id ?? null;
	}

	get workspace(): Workspace {
		return WORKSPACES.find((workspace) => workspace.id === this.workspaceId) ?? WORKSPACES[0];
	}

	get visibleConversations(): Conversation[] {
		return this.conversations
			.filter((conversation) => conversation.workspaceId === this.workspaceId && !conversation.archived)
			.toSorted((a, b) => b.updatedAt - a.updatedAt);
	}

	get archivedConversations(): Conversation[] {
		return this.conversations.filter((conversation) => conversation.archived).toSorted((a, b) => b.updatedAt - a.updatedAt);
	}

	get active(): Conversation | null {
		return this.visibleConversations.find((conversation) => conversation.id === this.activeId) ?? null;
	}

	get streamingMessageId(): string | null {
		return this.#stream?.messageId ?? null;
	}

	get isStreaming(): boolean {
		return this.#stream !== null;
	}

	select(id: string): void {
		this.activeId = id;
	}

	startNewChat(): void {
		this.activeId = null;
	}

	switchWorkspace(id: WorkspaceId): void {
		this.workspaceId = id;
		this.activeId = this.visibleConversations[0]?.id ?? null;
	}

	send(text: string, attachments: Attachment[]): void {
		this.stop();
		const conversation = this.active ?? this.#createConversation(text || attachments[0]?.name || 'New chat');

		const question: UserMessage = { id: createId('m'), role: 'user', text, attachments, createdAt: Date.now() };
		const answer: AssistantMessage = { id: createId('m'), role: 'assistant', replies: [], replyIndex: 0, feedback: null };
		conversation.messages.push(question, answer);

		this.#startReply(conversation, answer.id, this.model);
	}

	regenerate(conversationId: string, messageId: string, model: ModelId): void {
		this.stop();
		this.#startReply(this.#conversation(conversationId), messageId, model);
	}

	editAndResend(conversationId: string, messageId: string, text: string): void {
		this.stop();
		const conversation = this.#conversation(conversationId);
		const index = conversation.messages.findIndex((message) => message.id === messageId);
		const question = conversation.messages[index];
		if (question?.role !== 'user') throw new Error(`Message "${messageId}" is not a user message`);

		question.text = text;
		const answer: AssistantMessage = { id: createId('m'), role: 'assistant', replies: [], replyIndex: 0, feedback: null };
		conversation.messages.splice(index + 1, conversation.messages.length, answer);
		this.#startReply(conversation, answer.id, this.model);
	}

	stop(): void {
		const stream = this.#stream;
		if (!stream) return;

		clearTimeout(stream.timer);
		stream.reply.status = 'stopped';
		this.#stream = null;
	}

	showReply(conversationId: string, messageId: string, index: number): void {
		const message = this.#assistantMessage(this.#conversation(conversationId), messageId);
		message.replyIndex = Math.min(Math.max(index, 0), message.replies.length - 1);
	}

	toggleFeedback(conversationId: string, messageId: string, value: 'up' | 'down'): void {
		const message = this.#assistantMessage(this.#conversation(conversationId), messageId);
		message.feedback = message.feedback === value ? null : value;
	}

	rename(id: string, title: string): void {
		const trimmed = title.trim();
		if (trimmed === '') return;
		this.#conversation(id).title = trimmed;
	}

	togglePin(id: string): void {
		const conversation = this.#conversation(id);
		conversation.pinned = !conversation.pinned;
	}

	archive(id: string): Undo {
		const conversation = this.#conversation(id);
		const wasActive = this.activeId === id;
		this.#stopIfStreamingIn(conversation);
		conversation.archived = true;
		if (wasActive) this.activeId = this.visibleConversations[0]?.id ?? null;

		return () => {
			conversation.archived = false;
			if (wasActive) this.activeId = id;
		};
	}

	unarchive(id: string): void {
		this.#conversation(id).archived = false;
	}

	remove(id: string): Undo {
		const index = this.conversations.findIndex((conversation) => conversation.id === id);
		const conversation = this.#conversation(id);
		const wasActive = this.activeId === id;
		this.#stopIfStreamingIn(conversation);

		const removed = $state.snapshot(conversation);
		this.conversations.splice(index, 1);
		if (wasActive) this.activeId = this.visibleConversations[0]?.id ?? null;

		return () => {
			this.conversations.splice(index, 0, removed);
			if (wasActive) this.activeId = id;
		};
	}

	#createConversation(firstPrompt: string): Conversation {
		const conversation: Conversation = {
			id: createId('c'),
			workspaceId: this.workspaceId,
			title: titleFromPrompt(firstPrompt),
			pinned: false,
			archived: false,
			updatedAt: Date.now(),
			messages: []
		};
		this.conversations.unshift(conversation);
		this.activeId = conversation.id;
		// Read it back through the $state proxy so later mutations are tracked.
		return this.#conversation(conversation.id);
	}

	#startReply(conversation: Conversation, messageId: string, model: ModelId): void {
		const message = this.#assistantMessage(conversation, messageId);
		const question = this.#questionBefore(conversation, messageId);
		const canned = composeReply(question.text, question.attachments, message.replies.length, this.webSearch);

		message.replies.push({ text: '', target: canned.text, model, status: 'thinking', sources: canned.sources, createdAt: Date.now() });
		message.replyIndex = message.replies.length - 1;
		message.feedback = null;
		conversation.updatedAt = Date.now();

		const reply = message.replies[message.replyIndex];
		const chunks = canned.text.match(WORD_CHUNKS) ?? [];
		const { thinkMs, tickMs } = findModel(model);
		let position = 0;

		const streamNextChunk = () => {
			const size = 1 + Math.floor(Math.random() * MAX_CHUNK_WORDS);
			reply.text += chunks.slice(position, position + size).join('');
			position += size;
			if (position >= chunks.length) {
				reply.status = 'done';
				this.#stream = null;
				return;
			}
			this.#schedule(messageId, reply, streamNextChunk, tickMs);
		};

		this.#schedule(
			messageId,
			reply,
			() => {
				reply.status = 'streaming';
				streamNextChunk();
			},
			thinkMs
		);
	}

	#schedule(messageId: string, reply: Reply, run: () => void, delay: number): void {
		this.#stream = { messageId, reply, timer: setTimeout(run, delay) };
	}

	#stopIfStreamingIn(conversation: Conversation): void {
		const streamingId = this.streamingMessageId;
		if (streamingId && conversation.messages.some((message) => message.id === streamingId)) this.stop();
	}

	#conversation(id: string): Conversation {
		const conversation = this.conversations.find((candidate) => candidate.id === id);
		if (!conversation) throw new Error(`Conversation "${id}" not found`);
		return conversation;
	}

	#assistantMessage(conversation: Conversation, messageId: string): AssistantMessage {
		const message = conversation.messages.find((candidate) => candidate.id === messageId);
		if (message?.role !== 'assistant') throw new Error(`Assistant message "${messageId}" not found`);
		return message;
	}

	#questionBefore(conversation: Conversation, messageId: string): UserMessage {
		const index = conversation.messages.findIndex((message) => message.id === messageId);
		const question = conversation.messages[index - 1];
		if (question?.role !== 'user') throw new Error(`No question precedes message "${messageId}"`);
		return question;
	}
}
