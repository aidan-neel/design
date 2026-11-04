<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { tick } from 'svelte';
	import type { ChatStore } from './chat.svelte';
	import ConversationMenuItems from './ConversationMenuItems.svelte';
	import { shareUrlFor } from './conversation-actions';
	import Icon from './Icon.svelte';
	import { popIcon } from './motion';
	import Tip from './Tip.svelte';
	import { toaster } from './toasts.svelte';

	type Props = { store: ChatStore; onopendrawer: () => void };
	let { store, onopendrawer }: Props = $props();

	const SHARE_RESET_MS = 1800;

	let isRenaming = $state(false);
	let draftTitle = $state('');
	let titleInput = $state<HTMLInputElement>();
	let isLinkCopied = $state(false);
	let shareResetTimer: ReturnType<typeof setTimeout> | undefined;

	const conversation = $derived(store.active);

	async function startRenaming() {
		if (!conversation) return;
		draftTitle = conversation.title;
		isRenaming = true;
		await tick();
		// Wait a frame: the options menu is still handing focus back when the input mounts.
		requestAnimationFrame(() => {
			titleInput?.focus();
			titleInput?.select();
		});
	}

	function commitRename() {
		if (!isRenaming || !conversation) return;
		store.rename(conversation.id, draftTitle);
		isRenaming = false;
	}

	function handleTitleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') commitRename();
		if (event.key === 'Escape') {
			event.stopPropagation();
			isRenaming = false;
		}
	}

	async function copyShareLink() {
		if (!conversation) return;
		clearTimeout(shareResetTimer);
		try {
			await navigator.clipboard.writeText(shareUrlFor(conversation));
			isLinkCopied = true;
			shareResetTimer = setTimeout(() => (isLinkCopied = false), SHARE_RESET_MS);
		} catch (error) {
			console.error('Clipboard write failed', error);
			toaster.show('Couldn’t copy the link. Check clipboard permissions and try again.', { tone: 'error' });
		}
	}
</script>

<header class="header">
	<Tip label="Open sidebar">
		{#snippet children(props)}
			<button {...props} type="button" class="icon-btn md:hidden" aria-label="Open sidebar" onclick={onopendrawer}>
				<Icon name="menu" size={18} />
			</button>
		{/snippet}
	</Tip>

	<div class="min-w-0 flex-1">
		{#if conversation && isRenaming}
			<input
				bind:this={titleInput}
				bind:value={draftTitle}
				onkeydown={handleTitleKeydown}
				onblur={commitRename}
				aria-label="Chat title"
				maxlength="80"
				class="title-input"
			/>
		{:else if conversation}
			<Tip label="Rename" side="bottom" onclick={startRenaming}>
				{#snippet children(props)}
					<button {...props} type="button" class="title">{conversation.title}</button>
				{/snippet}
			</Tip>
		{:else}
			<h1 class="title title-static">New chat</h1>
		{/if}
	</div>

	{#if conversation}
		<button type="button" class="btn btn-secondary share max-sm:hidden" onclick={copyShareLink}>
			{#key isLinkCopied}
				<span class="grid" in:popIcon><Icon name={isLinkCopied ? 'check' : 'share'} size={15} /></span>
			{/key}
			<span class="share-label" data-copied={isLinkCopied}>
				<span>Share</span>
				<span aria-hidden={!isLinkCopied}>Link copied</span>
			</span>
		</button>
		<span role="status" class="sr-only">{isLinkCopied ? 'Share link copied' : ''}</span>

		<DropdownMenu.Root>
			<Tip label="Chat options" side="bottom">
				{#snippet children(props)}
					<DropdownMenu.Trigger {...props} class="icon-btn" aria-label="Chat options">
						<Icon name="more" size={18} />
					</DropdownMenu.Trigger>
				{/snippet}
			</Tip>
			<DropdownMenu.Portal to=".hd-app">
				<DropdownMenu.Content
					class="menu"
					side="bottom"
					align="end"
					sideOffset={6}
					onCloseAutoFocus={(event) => {
						if (isRenaming) event.preventDefault();
					}}
				>
					<DropdownMenu.Item class="menu-item sm:hidden" onSelect={copyShareLink}>
						<Icon name="share" />Copy share link
					</DropdownMenu.Item>
					<ConversationMenuItems {store} {conversation} onrename={startRenaming} />
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	{/if}

	<Tip label="New chat">
		{#snippet children(props)}
			<button {...props} type="button" class="icon-btn md:hidden" aria-label="New chat" onclick={() => store.startNewChat()}>
				<Icon name="compose" size={18} />
			</button>
		{/snippet}
	</Tip>
</header>

<style>
	.header {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 56px;
		flex-shrink: 0;
		padding: 0 12px 0 16px;
	}

	.title,
	.title-input {
		display: block;
		max-width: 100%;
		height: 32px;
		padding: 0 8px;
		margin-left: -8px;
		overflow: hidden;
		border-radius: 8px;
		color: var(--fg);
		font-size: 15px;
		font-weight: 500;
		letter-spacing: -0.01em;
		line-height: 32px;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: background-color 120ms var(--ease-out);
	}

	@media (hover: hover) {
		.title:hover {
			background: var(--bg-hover);
		}
	}

	.title-static {
		margin-left: 0;
		padding: 0;
	}

	.title-input {
		width: min(100%, 420px);
		background: var(--bg);
		box-shadow:
			0 0 0 1px var(--accent),
			0 0 0 4px var(--ring);
		outline: none;
	}

	.share {
		gap: 6px;
		padding: 0 12px 0 10px;
	}

	/* Both labels share one grid cell, so the button keeps the width of the longer one. */
	.share-label {
		display: grid;
	}

	.share-label > span {
		grid-area: 1 / 1;
		text-align: start;
		transition:
			opacity 150ms var(--ease-out),
			transform 150ms var(--ease-out);
	}

	.share-label > span:last-child,
	.share-label[data-copied='true'] > span:first-child {
		opacity: 0;
		transform: translateY(4px);
	}

	.share-label[data-copied='true'] > span:last-child {
		opacity: 1;
		transform: none;
	}

	@media (min-width: 768px) {
		.header {
			padding: 0 12px 0 20px;
		}
	}
</style>
