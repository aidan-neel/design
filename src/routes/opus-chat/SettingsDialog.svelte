<script lang="ts" module>
	export type SettingsTab = 'general' | 'archived' | 'shortcuts';

	export type Preferences = { enterToSend: boolean; showTimestamps: boolean };
</script>

<script lang="ts">
	import { Dialog, Switch, Tabs } from 'bits-ui';
	import type { ChatStore } from './chat.svelte';
	import { deleteConversation } from './conversation-actions';
	import { WORKSPACES } from './data';
	import Icon from './Icon.svelte';
	import { shrinkOut } from './motion';

	type Props = {
		open: boolean;
		tab: SettingsTab;
		store: ChatStore;
		preferences: Preferences;
	};
	let { open = $bindable(), tab = $bindable(), store, preferences = $bindable() }: Props = $props();

	const TABS: readonly { value: SettingsTab; label: string }[] = [
		{ value: 'general', label: 'General' },
		{ value: 'archived', label: 'Archived' },
		{ value: 'shortcuts', label: 'Shortcuts' }
	];

	const SHORTCUTS: readonly { keys: string[]; action: string }[] = [
		{ keys: ['⇧', '⌘', 'O'], action: 'New chat' },
		{ keys: ['⌘', 'B'], action: 'Collapse or expand the sidebar' },
		{ keys: ['/'], action: 'Search chats' },
		{ keys: ['↵'], action: 'Send message' },
		{ keys: ['⇧', '↵'], action: 'New line in a message' },
		{ keys: ['Esc'], action: 'Stop a reply while it streams' }
	];

	const PREFERENCE_ROWS: readonly { key: keyof Preferences; title: string; description: string }[] = [
		{
			key: 'enterToSend',
			title: 'Send with Enter',
			description: 'When off, Enter adds a new line and ⌘ Enter sends.'
		},
		{
			key: 'showTimestamps',
			title: 'Show timestamps',
			description: 'Show when each message was sent, under the message.'
		}
	];

	let tabsList = $state<HTMLElement | null>(null);
	let indicator = $state<{ left: number; width: number } | null>(null);
	let isIndicatorPlaced = $state(false);

	// One indicator slides between tabs; it appears in place first, then animates on later changes.
	$effect(() => {
		void tab;
		const active = tabsList?.querySelector<HTMLElement>('[data-state="active"]');
		if (!active) {
			indicator = null;
			isIndicatorPlaced = false;
			return;
		}
		indicator = { left: active.offsetLeft, width: active.offsetWidth };
		if (!isIndicatorPlaced) requestAnimationFrame(() => (isIndicatorPlaced = true));
	});

	function workspaceName(id: string): string {
		return WORKSPACES.find((workspace) => workspace.id === id)?.name ?? '';
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal to=".hd-app">
		<Dialog.Overlay class="overlay" />
		<Dialog.Content class="dialog">
			<div class="flex items-start justify-between gap-4 px-6 pt-5 pb-1">
				<div>
					<Dialog.Title class="text-[18px] font-semibold tracking-[-0.01em]">Settings</Dialog.Title>
					<Dialog.Description class="mt-0.5 text-[13px] text-(--fg-secondary)">
						Preferences apply to every workspace on this device.
					</Dialog.Description>
				</div>
				<Dialog.Close class="icon-btn -mr-2" aria-label="Close settings">
					<Icon name="x" size={18} />
				</Dialog.Close>
			</div>

			<Tabs.Root bind:value={tab} class="flex min-h-0 flex-1 flex-col">
				<Tabs.List class="tabs-list" bind:ref={tabsList}>
					{#if indicator}
						<span
							class="tabs-indicator"
							class:animated={isIndicatorPlaced}
							style:width={`${indicator.width}px`}
							style:transform={`translateX(${indicator.left}px)`}
						></span>
					{/if}
					{#each TABS as item (item.value)}
						<Tabs.Trigger value={item.value} class="tabs-trigger">
							{item.label}
							{#if item.value === 'archived' && store.archivedConversations.length > 0}
								<span class="count tabular-nums">{store.archivedConversations.length}</span>
							{/if}
						</Tabs.Trigger>
					{/each}
				</Tabs.List>

				<div class="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">
					<Tabs.Content value="general">
						<ul class="divide-y divide-(--border)">
							{#each PREFERENCE_ROWS as row (row.key)}
								<li class="flex items-center justify-between gap-6 py-4">
									<label for={`pref-${row.key}`} class="min-w-0">
										<span class="block font-medium">{row.title}</span>
										<span class="block text-[13px] text-(--fg-secondary)">{row.description}</span>
									</label>
									<Switch.Root id={`pref-${row.key}`} bind:checked={preferences[row.key]} class="switch">
										<Switch.Thumb class="switch-thumb" />
									</Switch.Root>
								</li>
							{/each}
						</ul>
					</Tabs.Content>

					<Tabs.Content value="archived">
						{#if store.archivedConversations.length === 0}
							<div class="py-10 text-center">
								<p class="font-medium">No archived chats</p>
								<p class="mt-1 text-[13px] text-(--fg-secondary)">Archive a chat from its menu to tuck it away here without deleting it.</p>
							</div>
						{:else}
							<ul class="divide-y divide-(--border)">
								{#each store.archivedConversations as conversation (conversation.id)}
									<li class="flex items-center gap-3 py-3" out:shrinkOut>
										<div class="min-w-0 flex-1">
											<p class="truncate font-medium">{conversation.title}</p>
											<p class="text-[12px] text-(--fg-secondary)">{workspaceName(conversation.workspaceId)}</p>
										</div>
										<button type="button" class="btn btn-secondary" onclick={() => store.unarchive(conversation.id)}>Restore</button>
										<button
											type="button"
											class="icon-btn"
											aria-label={`Delete ${conversation.title}`}
											onclick={() => deleteConversation(store, conversation)}
										>
											<Icon name="trash" />
										</button>
									</li>
								{/each}
							</ul>
						{/if}
					</Tabs.Content>

					<Tabs.Content value="shortcuts">
						<ul class="divide-y divide-(--border)">
							{#each SHORTCUTS as shortcut (shortcut.action)}
								<li class="flex items-center justify-between gap-4 py-3">
									<span>{shortcut.action}</span>
									<span class="flex gap-1">
										{#each shortcut.keys as key (key)}<kbd class="kbd">{key}</kbd>{/each}
									</span>
								</li>
							{/each}
						</ul>
					</Tabs.Content>
				</div>
			</Tabs.Root>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	:global(.hd-app .tabs-list) {
		position: relative;
		display: flex;
		gap: 4px;
		margin: 12px 24px 0;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--border);
	}

	:global(.hd-app .tabs-trigger) {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 30px;
		padding: 0 10px;
		border-radius: 8px;
		color: var(--fg-secondary);
		font-size: 14px;
		font-weight: 500;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	:global(.hd-app .tabs-trigger:hover) {
		color: var(--fg);
	}

	:global(.hd-app .tabs-trigger[data-state='active']) {
		color: var(--fg);
	}

	.tabs-indicator {
		position: absolute;
		top: 0;
		left: 0;
		height: 30px;
		border-radius: 8px;
		background: var(--bg-muted);
	}

	.tabs-indicator.animated {
		transition:
			transform 250ms var(--ease-out),
			width 250ms var(--ease-out);
	}

	.count {
		padding: 0 5px;
		border-radius: 5px;
		background: rgb(0 0 0 / 0.06);
		font-size: 11px;
	}

	:global(.hd-app .switch) {
		position: relative;
		flex-shrink: 0;
		width: 36px;
		height: 22px;
		border-radius: 999px;
		background: #e2e2e2;
		transition: background-color 150ms var(--ease-out);
	}

	:global(.hd-app .switch[data-state='checked']) {
		background: var(--accent);
	}

	:global(.hd-app .switch-thumb) {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #ffffff;
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
		transition: transform 200ms cubic-bezier(0.34, 1.3, 0.64, 1);
	}

	:global(.hd-app .switch-thumb[data-state='checked']) {
		transform: translateX(14px);
	}
</style>
