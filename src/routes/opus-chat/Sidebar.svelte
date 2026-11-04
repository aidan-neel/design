<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { Action } from 'svelte/action';
	import type { ChatStore } from './chat.svelte';
	import ConversationRow from './ConversationRow.svelte';
	import { WORKSPACES } from './data';
	import { groupConversations, matchesSearch } from './format';
	import Icon from './Icon.svelte';
	import type { SettingsTab } from './SettingsDialog.svelte';
	import Tip from './Tip.svelte';

	type Props = {
		store: ChatStore;
		/** Desktop rail mode. The drawer is never collapsed. */
		isCollapsed?: boolean;
		isDrawer?: boolean;
		ontogglecollapse?: () => void;
		onclose?: () => void;
		onopensettings: (tab: SettingsTab) => void;
	};
	let { store, isCollapsed = false, isDrawer = false, ontogglecollapse, onclose, onopensettings }: Props = $props();

	const PILL_SLIDE_MS = 250;

	let query = $state('');
	let searchInput = $state<HTMLInputElement>();
	let currentPill: HTMLElement | null = null;
	let pillSlideFrom: number | null = null;

	const filtered = $derived(store.visibleConversations.filter((conversation) => matchesSearch(conversation, query)));
	const groups = $derived(groupConversations(filtered, Date.now()));
	const streamingConversationId = $derived(
		store.conversations.find((conversation) => conversation.messages.some((message) => message.id === store.streamingMessageId))?.id
	);

	export function focusSearch() {
		searchInput?.focus();
	}

	/** Slides the active pill from the previously active row (FLIP), so it moves instead of blinking. */
	const pill: Action<HTMLElement> = (node) => {
		const from = pillSlideFrom;
		pillSlideFrom = null;
		currentPill = node;

		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (from !== null && !reduceMotion) {
			const delta = from - node.getBoundingClientRect().top;
			if (delta !== 0) {
				node.animate([{ transform: `translateY(${delta}px)` }, { transform: 'none' }], {
					duration: PILL_SLIDE_MS,
					easing: 'cubic-bezier(0.23, 1, 0.32, 1)'
				});
			}
		}

		return {
			destroy() {
				if (currentPill === node) currentPill = null;
			}
		};
	};

	function selectConversation(id: string) {
		pillSlideFrom = currentPill?.getBoundingClientRect().top ?? null;
		store.select(id);
		onclose?.();
	}

	function startNewChat() {
		store.startNewChat();
		onclose?.();
	}

	function expandAndSearch() {
		ontogglecollapse?.();
		requestAnimationFrame(focusSearch);
	}

	function handleSearchKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape' || query === '') return;
		event.stopPropagation();
		query = '';
	}
</script>

<div class="sidebar" class:collapsed={isCollapsed} class:drawer={isDrawer}>
	<div class="top">
		<DropdownMenu.Root>
			<Tip label={store.workspace.name} side="right" disabled={!isCollapsed}>
				{#snippet children(props)}
					<DropdownMenu.Trigger {...props} class="switcher" aria-label={`Workspace: ${store.workspace.name}`}>
						<span class="tile" style:background={store.workspace.tint}>{store.workspace.initial}</span>
						<span class="label truncate font-medium text-(--fg)">{store.workspace.name}</span>
						<Icon name="chevronUpDown" size={14} class="label ml-auto shrink-0 text-(--fg-tertiary)" />
					</DropdownMenu.Trigger>
				{/snippet}
			</Tip>
			<DropdownMenu.Portal to=".hd-app">
				<DropdownMenu.Content class="menu w-[240px]" side="bottom" align="start" sideOffset={6}>
					<p class="menu-label" aria-hidden="true">Workspaces</p>
					<DropdownMenu.RadioGroup value={store.workspaceId} aria-label="Workspaces">
						{#each WORKSPACES as workspace (workspace.id)}
							<DropdownMenu.RadioItem class="menu-item" value={workspace.id} onSelect={() => store.switchWorkspace(workspace.id)}>
								{#snippet children({ checked })}
									<span class="tile tile-sm" style:background={workspace.tint}>{workspace.initial}</span>
									<span class="flex-1 truncate">{workspace.name}</span>
									{#if checked}<Icon name="check" class="text-(--accent)!" />{/if}
								{/snippet}
							</DropdownMenu.RadioItem>
						{/each}
					</DropdownMenu.RadioGroup>
					<DropdownMenu.Separator class="menu-separator" />
					<DropdownMenu.Item class="menu-item" onSelect={() => onopensettings('general')}>
						<Icon name="sliders" />Settings
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>

		{#if isDrawer}
			<button type="button" class="icon-btn size-10!" aria-label="Close sidebar" onclick={onclose}>
				<Icon name="x" size={18} />
			</button>
		{:else if !isCollapsed}
			<Tip label="Collapse sidebar" shortcut="⌘B" onclick={ontogglecollapse}>
				{#snippet children(props)}
					<button {...props} type="button" class="icon-btn" aria-label="Collapse sidebar" aria-expanded="true">
						<Icon name="sidebar" />
					</button>
				{/snippet}
			</Tip>
		{/if}
	</div>

	<div class="actions">
		{#if isCollapsed}
			<Tip label="Expand sidebar" shortcut="⌘B" side="right" onclick={ontogglecollapse}>
				{#snippet children(props)}
					<button {...props} type="button" class="nav-row" aria-label="Expand sidebar" aria-expanded="false">
						<Icon name="sidebar" class="shrink-0" />
					</button>
				{/snippet}
			</Tip>
		{/if}

		<Tip label="New chat" shortcut="⇧⌘O" side="right" disabled={!isCollapsed} onclick={startNewChat}>
			{#snippet children(props)}
				<button {...props} type="button" class="nav-row new-chat" aria-label="New chat">
					<Icon name="compose" class="shrink-0" />
					<span class="label">New chat</span>
					<span class="label shortcut">⇧⌘O</span>
				</button>
			{/snippet}
		</Tip>

		{#if isCollapsed}
			<Tip label="Search chats" shortcut="/" side="right" onclick={expandAndSearch}>
				{#snippet children(props)}
					<button {...props} type="button" class="nav-row" aria-label="Search chats">
						<Icon name="search" class="shrink-0" />
					</button>
				{/snippet}
			</Tip>
		{:else}
			<label class="search">
				<Icon name="search" class="shrink-0 text-(--fg-secondary)" />
				<input
					bind:this={searchInput}
					bind:value={query}
					onkeydown={handleSearchKeydown}
					type="search"
					placeholder="Search chats"
					aria-label="Search chats"
				/>
				{#if query}
					<button type="button" class="clear" aria-label="Clear search" onclick={() => (query = '')}>
						<Icon name="x" size={12} />
					</button>
				{:else}
					<kbd class="kbd max-md:hidden">/</kbd>
				{/if}
			</label>
		{/if}
	</div>

	<nav class="list" aria-label="Chats" inert={isCollapsed}>
		{#each groups as group (group.label)}
			<section class="group">
				<h2 class="group-label">{group.label}</h2>
				<ul class="flex flex-col gap-0.5">
					{#each group.conversations as conversation (conversation.id)}
						<li>
							<ConversationRow
								{store}
								{conversation}
								{pill}
								isActive={conversation.id === store.activeId}
								isStreaming={conversation.id === streamingConversationId}
								onselect={() => selectConversation(conversation.id)}
							/>
						</li>
					{/each}
				</ul>
			</section>
		{:else}
			<div class="px-3 py-2 text-[13px] leading-relaxed text-(--fg-secondary)">
				{#if query}
					<p>No chats match “{query}”.</p>
					<button type="button" class="mt-1 font-medium text-(--fg) underline decoration-(--border) underline-offset-4" onclick={() => (query = '')}>
						Clear search
					</button>
				{:else}
					<p>Chats in {store.workspace.name} show up here. Start one with New chat.</p>
				{/if}
			</div>
		{/each}
	</nav>

	<div class="footer">
		<DropdownMenu.Root>
			<Tip label="Nadia Okafor" side="right" disabled={!isCollapsed}>
				{#snippet children(props)}
					<DropdownMenu.Trigger {...props} class="account" aria-label="Account menu">
						<span class="avatar">NO</span>
						<span class="label min-w-0 flex-1 truncate text-start font-medium text-(--fg)">Nadia Okafor</span>
						<span class="label plan">Plus</span>
					</DropdownMenu.Trigger>
				{/snippet}
			</Tip>
			<DropdownMenu.Portal to=".hd-app">
				<DropdownMenu.Content class="menu w-[240px]" side="top" align="start" sideOffset={6}>
					<div class="px-2.5 pt-1.5 pb-2 leading-tight">
						<p class="text-[13px] font-medium">Nadia Okafor</p>
						<p class="text-[12px] text-(--fg-secondary)">nadia@northwindlabs.com</p>
					</div>
					<DropdownMenu.Separator class="menu-separator" />
					<DropdownMenu.Item class="menu-item" onSelect={() => onopensettings('general')}>
						<Icon name="sliders" />Settings
					</DropdownMenu.Item>
					<DropdownMenu.Item class="menu-item" onSelect={() => onopensettings('archived')}>
						<Icon name="archive" />Archived chats
						<span class="menu-shortcut tabular-nums">{store.archivedConversations.length}</span>
					</DropdownMenu.Item>
					<DropdownMenu.Item class="menu-item" onSelect={() => onopensettings('shortcuts')}>
						<Icon name="keyboard" />Keyboard shortcuts
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	</div>
</div>

<style>
	/* Every row shares two columns: icons centred 30px from the edge, text starting at 48px. */
	.sidebar {
		--row-height: 32px;
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 10px 10px 0;
		overflow: hidden;
	}

	.drawer {
		--row-height: 44px;
	}

	.top {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.label {
		white-space: nowrap;
		transition: opacity 120ms var(--ease-out);
	}

	.collapsed .label,
	.collapsed :global(.label) {
		opacity: 0;
	}

	.top :global(.switcher),
	.footer :global(.account) {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1;
		width: 100%;
		min-width: 0;
		height: 40px;
		padding: 0 10px 0 8px;
		border-radius: 8px;
		font-size: 14px;
		text-align: start;
		transition: background-color 120ms var(--ease-out);
	}

	@media (hover: hover) {
		.top :global(.switcher:hover),
		.footer :global(.account:hover) {
			background: var(--bg-hover);
		}
	}

	.top :global(.switcher[data-state='open']),
	.footer :global(.account[data-state='open']) {
		background: var(--bg-hover);
	}

	.tile {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		border-radius: 7px;
		color: #ffffff;
		font-size: 12px;
		font-weight: 600;
		box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.2);
	}

	.tile-sm {
		width: 20px;
		height: 20px;
		border-radius: 6px;
		font-size: 11px;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-top: 8px;
	}

	.nav-row {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		height: var(--row-height);
		padding: 0 12px;
		border-radius: 8px;
		color: #525252;
		font-size: 14px;
		text-align: start;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out),
			transform 150ms var(--ease-out);
	}

	@media (hover: hover) {
		.nav-row:hover {
			background: var(--bg-hover);
			color: var(--fg);
		}
	}

	.new-chat {
		color: var(--fg);
		font-weight: 500;
		background: linear-gradient(#ffffff, #f9f9f9);
		box-shadow: var(--shadow-btn);
	}

	@media (hover: hover) {
		.new-chat:hover {
			background: linear-gradient(#ffffff, #f3f3f3);
		}
	}

	.new-chat:active {
		transform: scale(0.98);
	}

	.shortcut {
		margin-left: auto;
		color: var(--fg-tertiary);
		font-size: 12px;
		font-weight: 400;
		letter-spacing: 0.04em;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 10px;
		height: var(--row-height);
		padding: 0 8px 0 12px;
		border-radius: 8px;
		color: var(--fg);
		transition:
			background-color 120ms var(--ease-out),
			box-shadow 150ms var(--ease-out);
	}

	@media (hover: hover) {
		.search:hover {
			background: var(--bg-hover);
		}
	}

	.search:focus-within {
		background: var(--bg);
		box-shadow:
			0 0 0 1px var(--accent),
			0 0 0 4px var(--ring);
	}

	.search input {
		flex: 1;
		min-width: 0;
		height: 100%;
		background: transparent;
		font-size: 14px;
	}

	.search input::placeholder {
		color: #737373;
	}

	.search input::-webkit-search-cancel-button {
		display: none;
	}

	.clear {
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: rgb(0 0 0 / 0.08);
		color: var(--fg-secondary);
	}

	.list {
		flex: 1;
		min-height: 0;
		margin: 16px -10px 0;
		padding: 0 10px 16px;
		overflow-y: auto;
		transition: opacity 120ms var(--ease-out);
	}

	.collapsed .list {
		opacity: 0;
	}

	/* Keep rows at full width while the rail animates, so titles clip instead of wrapping. */
	.list > * {
		min-width: 240px;
	}

	.group + .group {
		margin-top: 20px;
	}

	.group-label {
		padding: 0 12px 4px;
		color: var(--fg-tertiary);
		font-size: 12px;
		font-weight: 500;
	}

	.footer {
		margin: 0 -10px;
		padding: 8px 10px 10px;
		box-shadow: 0 -1px 0 rgb(0 0 0 / 0.05);
	}

	.avatar {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #fde7d9;
		color: #9a3412;
		font-size: 10px;
		font-weight: 600;
	}

	.plan {
		padding: 0 6px;
		height: 20px;
		line-height: 20px;
		border-radius: 6px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 11px;
		font-weight: 500;
	}

	.drawer .top :global(.switcher),
	.drawer .footer :global(.account) {
		height: 44px;
	}
</style>
