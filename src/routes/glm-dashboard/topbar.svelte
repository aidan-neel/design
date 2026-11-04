<script lang="ts">
	import { DropdownMenu, Tooltip } from 'bits-ui';
	import { BTN_GHOST, MENU_ITEM, POP_CLASS } from './data';
	import { notifications, store, type ViewId } from './store.svelte';
	import Icon from './Icon.svelte';

	let VIEW_LABEL: Record<ViewId, string> = {
		overview: 'Overview',
		revenue: 'Revenue',
		customers: 'Customers',
		plans: 'Plans & prices'
	};

	const notifs = $derived(notifications());

	function exportView() {
		const fn = store.exporters[store.view];
		if (fn) fn();
		else store.toast('Nothing to export', 'This view has no exportable rows');
	}

	async function copySummary() {
		try {
			await navigator.clipboard.writeText(`Meridian · ${store.org} · ${VIEW_LABEL[store.view]} (demo data, Nov 4 2026)`);
			store.toast('Summary copied', 'Paste it anywhere — it references this view');
		} catch {
			store.toast('Copy failed', 'Clipboard is unavailable in this browser');
		}
	}
</script>

<header class="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-[#ececec] bg-white/80 px-4 backdrop-blur-[12px] md:px-6">
	<button
		class="grid size-8 cursor-default place-items-center rounded-lg text-[#737373] outline-none transition-colors duration-150 hover:bg-black/[0.04] hover:text-[#171717] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_#255cd12e] md:hidden"
		onclick={() => (store.drawerOpen = true)}
		aria-label="Open navigation"
	>
		<Icon name="panel" size={17} />
	</button>

	<nav class="flex min-w-0 items-center gap-1.5 text-[13.5px]" aria-label="Breadcrumb">
		<span class="hidden truncate text-[#a3a3a3] md:inline">{store.org}</span>
		<Icon name="chev-right" size={13} class="hidden text-[#d4d4d4] md:inline" />
		<span class="truncate font-medium text-[#171717]">Revenue</span>
		<Icon name="chev-right" size={13} class="text-[#d4d4d4]" />
		<span class="truncate text-[#737373]">{VIEW_LABEL[store.view]}</span>
	</nav>

	<div class="ml-auto flex items-center gap-1">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class={BTN_GHOST + ' max-md:w-8'}>
				<Icon name="download" size={15} />
				<span class="hidden sm:inline">Export</span>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content class={POP_CLASS + ' w-[240px]'} sideOffset={8} align="end">
					<DropdownMenu.Group>
						<p class="px-2.5 pb-1.5 pt-2 text-[11px] font-medium tracking-[0.06em] text-[#a3a3a3] uppercase">Export</p>
					</DropdownMenu.Group>
					<DropdownMenu.Item class={MENU_ITEM} onclick={exportView}>
						<Icon name="download" size={14} class="text-[#737373]" />
						Export {VIEW_LABEL[store.view]} as CSV
					</DropdownMenu.Item>
					<DropdownMenu.Item class={MENU_ITEM} onclick={copySummary}>
						<Icon name="copy" size={14} class="text-[#737373]" />
						Copy summary to clipboard
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>

		<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger class="hidden h-8 w-8 cursor-default place-items-center rounded-lg text-[#737373] transition-colors duration-150 outline-none hover:bg-black/[0.04] hover:text-[#171717] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_#255cd12e] sm:grid" onclick={() => (store.dialog = { kind: 'shortcuts' })} aria-label="Keyboard shortcuts">
				<Icon name="keyboard" size={16} />
			</Tooltip.Trigger>
			<Tooltip.Portal>
				<Tooltip.Content class="z-50 rounded-lg bg-[#171717] px-2 py-1 text-[12px] font-medium text-white shadow-[0_0_0_1px_rgb(0_0_0/0.12),0_8px_20px_-6px_rgb(0_0_0/0.35)]" sideOffset={6}>
					Keyboard shortcuts
					<Tooltip.Arrow class="fill-[#171717]" />
				</Tooltip.Content>
			</Tooltip.Portal>
		</Tooltip.Root>
		</Tooltip.Provider>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="relative grid h-8 w-8 cursor-default place-items-center rounded-lg text-[#737373] transition-colors duration-150 outline-none hover:bg-black/[0.04] hover:text-[#171717] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_#255cd12e]"
				aria-label="Notifications"
			>
				<Icon name="bell" size={16} />
				{#if notifs.length}
					<span class="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#dc2626] shadow-[0_0_0_2px_#fff]"></span>
				{/if}
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content class={POP_CLASS + ' w-[300px]'} sideOffset={10} align="end">
					<div class="flex items-center justify-between px-2.5 pb-1.5 pt-2">
						<p class="text-[11px] font-medium tracking-[0.06em] text-[#a3a3a3] uppercase">Notifications</p>
						{#if notifs.length}
							<button class="text-[12px] font-medium text-[#255cd1] outline-none hover:underline" onclick={() => (store.notifRead = true)}>Mark all read</button>
						{/if}
					</div>
					{#if notifs.length}
						{#each notifs as nf (nf.id)}
							<DropdownMenu.Item class={MENU_ITEM + ' h-auto flex-col items-start gap-0.5 rounded-lg py-2 data-highlighted:bg-[#f4f4f4]'}>
								<p class="text-[13px] font-medium text-[#171717]">{nf.title}</p>
								<p class="text-[12px] font-normal text-[#737373]">{nf.desc}</p>
							</DropdownMenu.Item>
						{/each}
					{:else}
						<div class="flex flex-col items-center gap-1 px-4 pb-4 pt-3 text-center">
							<p class="text-[13px] font-medium text-[#171717]">All caught up</p>
							<p class="text-[12px] text-[#a3a3a3]">Billing alerts and price changes will land here.</p>
						</div>
					{/if}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	</div>
</header>
