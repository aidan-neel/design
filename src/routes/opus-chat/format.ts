import { findModel, type AttachmentKind, type Conversation } from './data';

const KILOBYTE = 1000;
const MEGABYTE = KILOBYTE * 1000;

export function formatBytes(bytes: number): string {
	if (bytes >= MEGABYTE) return `${(bytes / MEGABYTE).toFixed(1)} MB`;
	if (bytes >= KILOBYTE) return `${Math.round(bytes / KILOBYTE)} KB`;
	return `${bytes} B`;
}

const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

export function formatTimestamp(at: number): string {
	const isToday = new Date(at).toDateString() === new Date().toDateString();
	return isToday ? timeFormat.format(at) : `${dayFormat.format(at)}, ${timeFormat.format(at)}`;
}

const CODE_EXTENSIONS = /\.(ts|tsx|js|jsx|py|go|rs|rb|java|sql|json|yaml|yml|svelte|css|html|sh)$/i;
const SHEET_EXTENSIONS = /\.(csv|xlsx|xls|numbers|tsv)$/i;

export function attachmentKind(file: File): AttachmentKind {
	if (file.type.startsWith('image/')) return 'image';
	if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) return 'pdf';
	if (CODE_EXTENSIONS.test(file.name)) return 'code';
	if (SHEET_EXTENSIONS.test(file.name)) return 'sheet';
	return 'doc';
}

export type ConversationGroup = { label: string; conversations: Conversation[] };

const DAY_MS = 24 * 60 * 60 * 1000;
const RECENT_DAYS = 7;

/** Sidebar sections: pinned first, then by age. Empty sections are dropped. */
export function groupConversations(conversations: readonly Conversation[], now: number): ConversationGroup[] {
	const startOfToday = new Date(now).setHours(0, 0, 0, 0);
	const startOfRecent = startOfToday - RECENT_DAYS * DAY_MS;
	const unpinned = conversations.filter((conversation) => !conversation.pinned);

	const groups: ConversationGroup[] = [
		{ label: 'Pinned', conversations: conversations.filter((conversation) => conversation.pinned) },
		{ label: 'Today', conversations: unpinned.filter((conversation) => conversation.updatedAt >= startOfToday) },
		{
			label: 'Previous 7 days',
			conversations: unpinned.filter((conversation) => conversation.updatedAt < startOfToday && conversation.updatedAt >= startOfRecent)
		},
		{ label: 'Older', conversations: unpinned.filter((conversation) => conversation.updatedAt < startOfRecent) }
	];
	return groups.filter((group) => group.conversations.length > 0);
}

export function matchesSearch(conversation: Conversation, query: string): boolean {
	const needle = query.trim().toLowerCase();
	if (needle === '') return true;
	if (conversation.title.toLowerCase().includes(needle)) return true;
	return conversation.messages.some((message) => {
		const text = message.role === 'user' ? message.text : message.replies[message.replyIndex]?.text ?? '';
		return text.toLowerCase().includes(needle);
	});
}

export function conversationToMarkdown(conversation: Conversation): string {
	const turns = conversation.messages.map((message) => {
		if (message.role === 'user') {
			const files = message.attachments.map((attachment) => `\n_Attached: ${attachment.name}_`).join('');
			return `**You**\n\n${message.text}${files}`;
		}
		const reply = message.replies[message.replyIndex];
		return `**${findModel(reply.model).name}**\n\n${reply.text}`;
	});
	return `# ${conversation.title}\n\n${turns.join('\n\n---\n\n')}\n`;
}

export function fileNameFor(title: string): string {
	const slug = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	return `${slug || 'chat'}.md`;
}
