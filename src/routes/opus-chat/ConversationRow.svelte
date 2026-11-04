<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { Action } from 'svelte/action';
	import type { ChatStore } from './chat.svelte';
	import ConversationMenuItems from './ConversationMenuItems.svelte';
	import type { Conversation } from './data';
	import Icon from './Icon.svelte';

	type Props = {
		store: ChatStore;
		conversation: Conversation;
		isActive: boolean;
		isStreaming: boolean;
		/** Mounted on the active row's pill so it can slide in from the previous row. */
		pill: Action<HTMLElement>;
		onselect: () => void;
	};
	let { store, conversation, isActive, isStreaming, pill, onselect }: Props = $props();

	let isRenaming = $state(false);
	let draftTitle = $state('');

	function startRenaming() {
		draftTitle = conversation.title;
		isRenaming = true;
	}

	function commitRename() {
		if (!isRenaming) return;
		store.rename(conversation.id, draftTitle);
		isRenaming = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') commitRename();
		if (event.key === 'Escape') {
			event.stopPropagation();
			isRenaming = false;
		}
	}

	// Wait a frame: the row menu is still handing focus back when the input mounts.
	function focusAndSelect(node: HTMLInputElement) {
		requestAnimationFrame(() => {
			node.focus();
			node.select();
		});
	}
</script>

<div class="row" class:active={isActive}>
	{#if isActive}<span class="pill" use:pill></span>{/if}

	{#if isRenaming}
		<input
			use:focusAndSelect
			bind:value={draftTitle}
			onkeydown={handleKeydown}
			onblur={commitRename}
			aria-label="Chat title"
			maxlength="80"
			class="rename"
		/>
	{:else}
		<button type="button" class="select" aria-current={isActive ? 'page' : undefined} onclick={onselect} title={conversation.title}>
			<span class="truncate">{conversation.title}</span>
			{#if isStreaming}<span class="live" aria-label="Replying"></span>{/if}
		</button>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="more" aria-label={`Options for ${conversation.title}`}>
				<Icon name="more" size={16} />
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal to=".hd-app">
				<DropdownMenu.Content
					class="menu"
					side="bottom"
					align="start"
					sideOffset={4}
					onCloseAutoFocus={(event) => {
						if (isRenaming) event.preventDefault();
					}}
				>
					<ConversationMenuItems {store} {conversation} onrename={startRenaming} />
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	{/if}
</div>

<style>
	.row {
		position: relative;
		display: flex;
		align-items: center;
		height: var(--row-height, 32px);
		border-radius: 8px;
		transition: background-color 120ms var(--ease-out);
	}

	@media (hover: hover) {
		.row:not(.active):hover {
			background: var(--bg-hover);
		}
	}

	.pill {
		position: absolute;
		inset: 0;
		border-radius: 8px;
		background: var(--bg);
		box-shadow: var(--shadow-btn);
	}

	.select {
		position: relative;
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		min-width: 0;
		height: 100%;
		padding: 0 34px 0 12px;
		border-radius: 8px;
		color: #525252;
		font-size: 14px;
		text-align: start;
		white-space: nowrap;
		transition: color 120ms var(--ease-out);
	}

	.select:focus-visible {
		outline-offset: -2px;
	}

	.row:hover .select,
	.active .select {
		color: var(--fg);
	}

	.live {
		flex-shrink: 0;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
		animation: live-pulse 1.2s ease-in-out infinite;
	}

	@keyframes live-pulse {
		50% {
			opacity: 0.3;
		}
	}

	.row :global(.more) {
		position: absolute;
		right: 4px;
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 6px;
		color: var(--fg-secondary);
		opacity: 0;
		transition:
			opacity 120ms var(--ease-out),
			background-color 120ms var(--ease-out);
	}

	.row:hover :global(.more),
	.active :global(.more),
	.row :global(.more:focus-visible),
	.row :global(.more[data-state='open']) {
		opacity: 1;
	}

	.row :global(.more:hover),
	.row :global(.more[data-state='open']) {
		background: rgb(0 0 0 / 0.06);
		color: var(--fg);
	}

	.row :global(.more:focus-visible) {
		outline-offset: -2px;
	}

	@media (hover: none) {
		.row :global(.more) {
			opacity: 1;
		}
	}

	.rename {
		position: relative;
		width: 100%;
		height: 100%;
		padding: 0 12px;
		border-radius: 8px;
		background: var(--bg);
		color: var(--fg);
		font-size: 14px;
		box-shadow:
			0 0 0 1px var(--accent),
			0 0 0 4px var(--ring);
	}
</style>
