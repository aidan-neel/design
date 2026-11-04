<script lang="ts">
	import { Popover } from 'bits-ui';
	import { BTN_SEC, MENU_ITEM, POP_CLASS, RANGE_PRESETS, resolveRange, type RangeId } from './data';
	import { store } from './store.svelte';
	import Icon from './Icon.svelte';

	let open = $state(false);
	let err = $state('');
	let from = $state('');
	let to = $state('');


	let label = $derived(resolveRange(store.rangeId, store.customFrom, store.customTo).label);

	function pick(id: RangeId) {
		store.rangeId = id;
		open = false;
	}

	function applyCustom() {
		const r = resolveRange('custom', from, to);
		if (r.label === 'Last 30 days' && (from === '' || to === '' || from > to)) {
			err = from > to ? 'End date must be after the start date' : 'Enter both dates';
			return;
		}
		err = '';
		store.customFrom = from;
		store.customTo = to;
		store.rangeId = 'custom';
		open = false;
	}
</script>

<Popover.Root bind:open onOpenChange={(v) => { if (v) { from = store.customFrom; to = store.customTo; err = ''; } }}>
	<Popover.Trigger class={BTN_SEC + ' max-md:h-9'} type="button" aria-label="Date range: {label}">
		<Icon name="calendar" size={15} class="text-[#737373]" />
		<span class="hidden min-[420px]:inline">{label}</span>
		<span class="inline min-[420px]:hidden">Range</span>
		<Icon name="chev-updown" size={13} class="text-[#a3a3a3]" />
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content class={POP_CLASS + ' w-[280px] pb-2.5'} sideOffset={8} align="end">
			<div class="grid grid-cols-2 gap-0.5 p-1">
				{#each RANGE_PRESETS as p (p.id)}
					<button class="flex h-8 cursor-default select-none items-center gap-2 rounded-lg px-2.5 text-[13px] font-medium text-[#171717] outline-none hover:bg-[#f4f4f4] {store.rangeId === p.id ? 'bg-[#eef4ff] text-[#255cd1] hover:bg-[#eef4ff]' : ''}" onclick={() => pick(p.id)}>
						{#if store.rangeId === p.id}
							<Icon name="check" size={13} class="text-[#255cd1]" />
						{/if}
						{p.label}
					</button>
				{/each}
			</div>
			<div class="mx-2 mb-2 h-px bg-[#ececec]"></div>
			<p class="px-3 pb-1.5 text-[11px] font-medium tracking-[0.05em] text-[#a3a3a3] uppercase">Custom range</p>
			<div class="flex gap-2 pb-2">
				<label class="flex-1">
					<span class="block px-1 pb-1 text-[12px] text-[#737373]">From</span>
					<input type="date" bind:value={from} min="2024-11-10" max={store.customTo} class="h-8 w-full rounded-[9px] bg-white px-2 text-[12.5px] text-[#171717] shadow-[0_0_0_1px_#ececec] outline-none focus:shadow-[0_0_0_1px_#255cd1,0_0_0_4px_#255cd126]" />
				</label>
				<label class="flex-1">
					<span class="block px-1 pb-1 text-[12px] text-[#737373]">To</span>
					<input type="date" bind:value={to} min={store.customFrom} class="h-8 w-full rounded-[9px] bg-white px-2 text-[12.5px] text-[#171717] shadow-[0_0_0_1px_#ececec] outline-none focus:shadow-[0_0_0_1px_#255cd1,0_0_0_4px_#255cd126]" />
				</label>
			</div>
			{#if err}
				<p class="flex items-center gap-1.5 px-2 pb-1.5 text-[12px] font-medium text-[#dc2626]">
					<Icon name="alert" size={13} />
					{err}
				</p>
			{/if}
			<div class="flex items-center justify-between px-2 pt-1">
				<button
					class="flex h-8 cursor-default select-none items-center gap-2 rounded-lg px-1.5 text-[13px] font-medium text-[#171717] outline-none data-highlighted:bg-[#f4f4f4] hover:bg-[#f4f4f4]"
					onclick={() => (store.compare = !store.compare)}
				>
					<span class={'grid size-4 place-items-center rounded-[4px] transition-colors duration-100 ' + (store.compare ? 'bg-[#255cd1] text-white shadow-[0_0_0_1px_rgb(24_58_128)]' : 'bg-white text-transparent shadow-[0_0_0_1px_#d4d4d4]')}>
						<Icon name="check" size={10} />
					</span>
					Compare to previous
				</button>
				<button class={MENU_ITEM + ' h-8 w-auto px-2 text-[#255cd1]'} onclick={applyCustom}>Apply</button>
			</div>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
