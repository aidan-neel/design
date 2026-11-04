<script lang="ts">
	import '@fontsource-variable/inter';
	import './ui.css';
	import { Dialog, Tooltip } from 'bits-ui';
	import { tick } from 'svelte';
	import { ChatStore } from './chat.svelte';
	import ChatHeader from './ChatHeader.svelte';
	import SettingsDialog, { type Preferences, type SettingsTab } from './SettingsDialog.svelte';
	import Sidebar from './Sidebar.svelte';
	import { readStored, writeStored } from './storage';
	import Thread from './Thread.svelte';
	import Toasts from './Toasts.svelte';

	const COLLAPSED_KEY = 'halden:sidebar-collapsed';
	const PREFERENCES_KEY = 'halden:preferences';
	const DEFAULT_PREFERENCES: Preferences = { enterToSend: true, showTimestamps: false };

	const store = new ChatStore();
	const desktopQuery = window.matchMedia('(min-width: 768px)');

	let isDesktop = $state(desktopQuery.matches);
	let isCollapsed = $state(readStored(COLLAPSED_KEY, false, (value) => typeof value === 'boolean'));
	let preferences = $state(readStored(PREFERENCES_KEY, DEFAULT_PREFERENCES, isPreferences));
	let isDrawerOpen = $state(false);
	let isSettingsOpen = $state(false);
	let settingsTab = $state<SettingsTab>('general');
	let sidebar = $state<Sidebar>();
	let thread = $state<Thread>();

	$effect(() => writeStored(COLLAPSED_KEY, isCollapsed));
	$effect(() => writeStored(PREFERENCES_KEY, { ...preferences }));

	$effect(() => {
		const syncViewport = () => {
			isDesktop = desktopQuery.matches;
			if (isDesktop) isDrawerOpen = false;
		};
		desktopQuery.addEventListener('change', syncViewport);
		return () => desktopQuery.removeEventListener('change', syncViewport);
	});

	function isPreferences(value: unknown): value is Preferences {
		return (
			typeof value === 'object' &&
			value !== null &&
			'enterToSend' in value &&
			typeof value.enterToSend === 'boolean' &&
			'showTimestamps' in value &&
			typeof value.showTimestamps === 'boolean'
		);
	}

	function openSettings(tab: SettingsTab) {
		settingsTab = tab;
		isDrawerOpen = false;
		isSettingsOpen = true;
	}

	function toggleSidebar() {
		if (isDesktop) isCollapsed = !isCollapsed;
		else isDrawerOpen = !isDrawerOpen;
	}

	async function startNewChat() {
		store.startNewChat();
		await tick();
		thread?.focusComposer();
	}

	async function focusSearch() {
		if (!isDesktop) return;
		isCollapsed = false;
		await tick();
		sidebar?.focusSearch();
	}

	function isTypingIn(target: EventTarget | null): boolean {
		return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
	}

	function handleShortcut(event: KeyboardEvent) {
		const hasModifier = event.metaKey || event.ctrlKey;
		const key = event.key.toLowerCase();

		if (hasModifier && !event.shiftKey && key === 'b') {
			event.preventDefault();
			toggleSidebar();
		} else if (hasModifier && event.shiftKey && key === 'o') {
			event.preventDefault();
			startNewChat();
		} else if (key === '/' && !hasModifier && !isTypingIn(event.target)) {
			event.preventDefault();
			focusSearch();
		} else if (key === 'escape' && store.isStreaming && !isSettingsOpen && !isDrawerOpen && !isTypingIn(event.target)) {
			store.stop();
		}
	}
</script>

<svelte:head>
	<title>Halden</title>
</svelte:head>

<svelte:window onkeydown={handleShortcut} />

<Tooltip.Provider delayDuration={500} skipDelayDuration={400} ignoreNonKeyboardFocus>
	<div class="hd-app">
		<aside class="sidebar-shell" class:collapsed={isCollapsed} aria-label="Sidebar">
			<Sidebar
				bind:this={sidebar}
				{store}
				{isCollapsed}
				ontogglecollapse={toggleSidebar}
				onopensettings={openSettings}
			/>
		</aside>

		<main class="panel">
			<ChatHeader {store} onopendrawer={() => (isDrawerOpen = true)} />
			<Thread bind:this={thread} {store} enterToSend={preferences.enterToSend} showTimestamps={preferences.showTimestamps} />
		</main>

		<Dialog.Root bind:open={isDrawerOpen}>
			<Dialog.Portal to=".hd-app">
				<Dialog.Overlay class="overlay" />
				<Dialog.Content class="drawer-panel">
					<Dialog.Title class="sr-only">Chats</Dialog.Title>
					<Sidebar {store} isDrawer onclose={() => (isDrawerOpen = false)} onopensettings={openSettings} />
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>

		<SettingsDialog bind:open={isSettingsOpen} bind:tab={settingsTab} bind:preferences {store} />
		<Toasts />
	</div>
</Tooltip.Provider>

<style>
	.sidebar-shell {
		flex-shrink: 0;
		width: 264px;
		height: 100%;
		transition: width 220ms var(--ease-out);
	}

	.sidebar-shell.collapsed {
		width: 60px;
	}

	/* Inset shell: the sidebar shares the tinted canvas, the chat floats on a white panel. */
	.panel {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
		margin: 8px 8px 8px 0;
		overflow: hidden;
		border-radius: 14px;
		background: var(--bg);
		box-shadow: var(--shadow-panel);
	}

	@media (max-width: 767px) {
		.sidebar-shell {
			display: none;
		}

		.panel {
			margin: 0;
			border-radius: 0;
			box-shadow: none;
		}
	}
</style>
