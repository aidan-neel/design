<script lang="ts">
	import '@fontsource-variable/inter';
	import { store } from './store.svelte';
	import Sidebar from './sidebar.svelte';
	import Topbar from './topbar.svelte';
	import Toasts from './toasts.svelte';
	import Dialogs from './dialogs.svelte';
	import Overview from './overview.svelte';
	import RevenueView from './revenueview.svelte';
	import Customers from './customers.svelte';
	import Plans from './plans.svelte';
	import Icon from './Icon.svelte';

	let mainEl = $state<HTMLElement | null>(null);

	function onKeydown(e: KeyboardEvent) {
		const el = document.activeElement;
		const inField = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement || (el instanceof HTMLElement && el.isContentEditable);
		if (e.key === '/' && !inField) {
			e.preventDefault();
			store.focusSearch();
		} else if (e.key === 'Escape') {
			if (store.search) {
				store.search = '';
			}
			if (inField && el instanceof HTMLInputElement) el.blur();
			else mainEl?.focus?.();
		} else if (['1', '2', '3', '4'].includes(e.key) && !inField) {
			store.view = (['overview', 'revenue', 'customers', 'plans'] as const)[Number(e.key) - 1];
		} else if (e.key === 'd' && !inField) {
			store.density = store.density === 'cozy' ? 'compact' : 'cozy';
		}
	}

	$effect(() => {
		if (store.searchTick) {
			const el = document.querySelector('[data-meridian-search]') as HTMLInputElement | null;
			if (el) el.select();
		}
	});
</script>

<svelte:window onkeydown={onKeydown} />

<div class="app flex h-dvh w-full overflow-hidden bg-[#f7f7f7] text-[#171717]">
	<div class="hidden shrink-0 md:flex">
		<Sidebar />
	</div>

	<main bind:this={mainEl} class="flex h-dvh min-w-0 flex-1 flex-col overflow-y-auto bg-white md:my-2 md:mr-2 md:h-[calc(100dvh-16px)] md:rounded-[14px] md:shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)]" tabindex="-1">
		<Topbar />
		<div class="flex-1 p-4 md:p-6 md:pt-5">
			<div class="relative mb-3 md:hidden">
				<Icon name="search" size={15} class="pointer-events-none absolute top-2.5 left-2.5 text-[#a3a3a3]" />
				<input
					data-meridian-search
					type="search"
					placeholder="Search the current view"
					aria-label="Search the current view"
					class="h-9 w-full rounded-[10px] bg-white pr-3 pl-8 text-[13px] text-[#171717] placeholder:text-[#a3a3a3] shadow-[0_0_0_1px_#ececec] outline-none focus:shadow-[0_0_0_1px_#255cd1,0_0_0_4px_#255cd126]"
					bind:value={store.search}
				/>
			</div>
			{#key store.view}
				<div class="enter-view">
					<div class="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
						<h1 class="text-[19px] font-semibold tracking-[-0.02em] text-[#171717]">
							{store.view === 'overview' ? 'Revenue overview' : store.view === 'revenue' ? 'Revenue & MRR' : store.view === 'customers' ? 'Customers' : 'Plans & prices'}
						</h1>
						<p class="text-[13px] text-[#737373]">
							{store.view === 'overview'
								? 'Meridian metering · ' + store.org
								: store.view === 'revenue'
									? 'Monthly movement, plan mix and trends'
									: store.view === 'customers'
										? 'Everyone billed from ' + store.org + '’s Meridian account'
										: 'Every price ' + store.org + ' sells, in one table'}
						</p>
					</div>
					{#if store.view === 'overview'}
						<Overview />
					{:else if store.view === 'revenue'}
						<RevenueView />
					{:else if store.view === 'customers'}
						<Customers />
					{:else}
						<Plans />
					{/if}
				</div>
			{/key}
		</div>
		<footer class="flex flex-wrap items-center justify-between gap-2 border-t border-[#f0f0f0] px-4 py-3 text-[12px] text-[#a3a3a3] md:px-6">
			<span>Meridian admin · demo data, Nov 4 2026</span>
			<span class="tabular-nums">{store.customers.filter((c) => c.status !== 'churned').length} customers · {store.plans.length} prices</span>
		</footer>
	</main>

	<!-- mobile drawer -->
	{#if store.drawerOpen}
		<div class="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
			<button class="drawer-scrim absolute inset-0 bg-black/30" onclick={() => (store.drawerOpen = false)} aria-label="Close navigation"></button>
			<div class="drawer-panel absolute inset-y-0 left-0 flex h-dvh flex-col bg-[#f7f7f7] shadow-[0_0_0_1px_rgb(0_0_0/0.08),24px_0_64px_-24px_rgb(0_0_0/0.3)]">
				<Sidebar drawer />
				<button class="absolute top-3.5 right-3 grid size-8 cursor-default place-items-center rounded-lg text-[#737373] outline-none hover:bg-black/[0.04]" onclick={() => (store.drawerOpen = false)} aria-label="Close">
					<Icon name="x" size={16} />
				</button>
			</div>
		</div>
	{/if}

	<Dialogs />
	<Toasts />
</div>

<style>
	.app {
		font-family: 'Inter Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
		font-feature-settings: 'cv11', 'ss01';
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
	}
	.enter-view {
		animation: view-in 240ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	@keyframes view-in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}
	.drawer-scrim {
		animation: fade 200ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
	}
	.drawer-panel {
		animation: slide 280ms cubic-bezier(0.32, 0.72, 0, 1);
	}
	@keyframes slide {
		from {
			transform: translateX(-100%);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.enter-view,
		.drawer-panel,
		.drawer-scrim {
			animation: none;
		}
	}
</style>
