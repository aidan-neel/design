<script lang="ts">
	import { tick } from 'svelte';
	import AttachmentChip from './AttachmentChip.svelte';
	import CopyButton from './CopyButton.svelte';
	import type { UserMessage } from './data';
	import { formatTimestamp } from './format';
	import Icon from './Icon.svelte';
	import Tip from './Tip.svelte';

	type Props = {
		message: UserMessage;
		showTimestamp: boolean;
		onresend: (text: string) => void;
	};
	let { message, showTimestamp, onresend }: Props = $props();

	let isEditing = $state(false);
	let draft = $state('');
	let editor = $state<HTMLTextAreaElement>();

	const canResend = $derived(draft.trim() !== '' && draft.trim() !== message.text);

	async function startEditing() {
		draft = message.text;
		isEditing = true;
		await tick();
		editor?.focus();
		editor?.setSelectionRange(draft.length, draft.length);
	}

	function resend() {
		if (!canResend) return;
		isEditing = false;
		onresend(draft.trim());
	}

	function handleEditorKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.stopPropagation();
			isEditing = false;
		}
		if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
			event.preventDefault();
			resend();
		}
	}
</script>

<div class="message group">
	{#if message.attachments.length > 0}
		<div class="flex flex-wrap justify-end gap-2">
			{#each message.attachments as attachment (attachment.id)}
				<AttachmentChip {attachment} />
			{/each}
		</div>
	{/if}

	{#if isEditing}
		<div class="editor">
			<textarea
				bind:this={editor}
				bind:value={draft}
				onkeydown={handleEditorKeydown}
				rows="3"
				aria-label="Edit message"
				class="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none"
			></textarea>
			<div class="flex justify-end gap-2">
				<button type="button" class="btn btn-secondary" onclick={() => (isEditing = false)}>Cancel</button>
				<button type="button" class="btn btn-primary" disabled={!canResend} onclick={resend}>Send</button>
			</div>
		</div>
	{:else if message.text}
		<div class="bubble">{message.text}</div>
		<div class="actions">
			{#if showTimestamp}
				<span class="mr-1 text-[12px] text-(--fg-secondary) tabular-nums">{formatTimestamp(message.createdAt)}</span>
			{/if}
			<CopyButton text={message.text} label="Copy message" />
			<Tip label="Edit" onclick={startEditing}>
				{#snippet children(props)}
					<button {...props} type="button" class="icon-btn size-7!" aria-label="Edit message">
						<Icon name="pencil" size={15} />
					</button>
				{/snippet}
			</Tip>
		</div>
	{/if}
</div>

<style>
	.message {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8px;
	}

	.bubble {
		max-width: min(85%, 560px);
		padding: 10px 16px;
		border-radius: 20px;
		background: #f2f2f2;
		font-size: 15px;
		line-height: 1.6;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.actions {
		position: absolute;
		top: calc(100% + 2px);
		right: 0;
		display: flex;
		align-items: center;
		gap: 2px;
		opacity: 0;
		transition: opacity 150ms var(--ease-out);
	}

	.message:hover .actions,
	.actions:focus-within {
		opacity: 1;
	}

	@media (hover: none) {
		.actions {
			opacity: 1;
		}
	}

	.editor {
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: 100%;
		padding: 12px 12px 10px 16px;
		border-radius: 20px;
		background: #f2f2f2;
		box-shadow: 0 0 0 1px var(--accent), 0 0 0 4px var(--ring);
	}
</style>
