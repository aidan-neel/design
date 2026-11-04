import type { ChatStore } from './chat.svelte';
import type { Conversation } from './data';
import { conversationToMarkdown, fileNameFor } from './format';
import { toaster } from './toasts.svelte';

/** Menu actions shared by the sidebar rows and the chat header. Destructive ones apply at once and offer Undo. */

export function archiveConversation(store: ChatStore, conversation: Conversation): void {
	const title = conversation.title;
	const undo = store.archive(conversation.id);
	toaster.show(`Archived “${title}”`, { action: { label: 'Undo', run: undo } });
}

export function deleteConversation(store: ChatStore, conversation: Conversation): void {
	const title = conversation.title;
	const undo = store.remove(conversation.id);
	toaster.show(`Deleted “${title}”`, { action: { label: 'Undo', run: undo } });
}

export function downloadConversation(conversation: Conversation): void {
	const blob = new Blob([conversationToMarkdown(conversation)], { type: 'text/markdown' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileNameFor(conversation.title);
	link.click();
	URL.revokeObjectURL(url);
	toaster.show(`Downloaded ${link.download}`);
}

export function shareUrlFor(conversation: Conversation): string {
	return `https://halden.app/share/${conversation.id}`;
}
