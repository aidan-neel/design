<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { snap, BTN_GHOST, BTN_PRI, BTN_SEC, CARD, MENU_ITEM, FAMILY_COLORS, POP_CLASS, SEGM, SEGM_ITEM, money, downloadCsv, num, runRate, type Plan } from './data';
	import { store } from './store.svelte';
	import Icon from './Icon.svelte';

	type Props = { full?: boolean; rows?: number };
	let { full = false, rows = 6 }: Props = $props();

	type SortKey = 'name' | 'price' | 'subscribers' | 'mrr' | 'status';
	let sortKey = $state<SortKey>('mrr');
	let sortDir = $state<1 | -1>(-1);
	let statusF = $state<'all' | Plan['status']>('all');
	let cycleF = $state<'all' | 'monthly' | 'annual'>('all');
	let page = $state(0);
	const PER_PAGE = 8;

	let totalRunRate = $derived(store.plans.filter((p) => p.status !== 'archived').reduce((a, p) => a + runRate(p), 0));

	function matches(p: Plan) {
		const q = store.search.trim().toLowerCase();
		if (q && !(p.name.toLowerCase().includes(q) || p.family.toLowerCase().includes(q) || p.status.includes(q))) return false;
		if (statusF !== 'all' && p.status !== statusF) return false;
		if (cycleF !== 'all' && p.cycle !== cycleF) return false;
		return true;
	}

	let filtered = $derived(store.plans.filter(matches).slice().sort((a, b) => {
		const av = sortKey === 'mrr' ? runRate(a) : sortKey === 'name' ? a.name : (a[sortKey] as string | number);
		const bv = sortKey === 'mrr' ? runRate(b) : sortKey === 'name' ? b.name : (b[sortKey] as string | number);
		if (typeof av === 'string' || typeof bv === 'string') return String(av).localeCompare(String(bv)) * sortDir;
		return (Number(av) - Number(bv)) * sortDir;
	}));

	let visible = $derived(full ? filtered.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE) : filtered.slice(0, rows));
	let pages = $derived(Math.max(1, Math.ceil(filtered.length / PER_PAGE)));
	let rowPad = $derived(store.density === 'compact' ? 'py-1' : 'py-2.5');

	function sortBy(key: SortKey) {
		if (sortKey === key) sortDir = (sortDir * -1) as 1 | -1;
		else {
			sortKey = key;
			sortDir = 1;
		}
	}

	const STATUS_META = {
		active: { label: 'Active', cls: 'bg-[#ecfdf3] text-[#15803d] shadow-[inset_0_0_0_1px_#d1fadf]' },
		beta: { label: 'Beta', cls: 'bg-[#eef4ff] text-[#1d4ed8] shadow-[inset_0_0_0_1px_#dbe6ff]' },
		archived: { label: 'Archived', cls: 'bg-[#f4f4f4] text-[#737373] shadow-[inset_0_0_0_1px_#e4e4e4]' }
	} as const;

	function clearFilters() {
		store.search = '';
		statusF = 'all';
		cycleF = 'all';
	}

	function exportRows() {
		const r = full && store.selection.length ? store.plans.filter((p) => store.selection.includes(p.id)) : filtered;
		downloadCsv(
			'meridian-prices.csv',
			[['Plan', 'Family', 'Cycle', 'Price per month', 'Subscribers', 'Run-rate MRR', 'Status', 'Since'],
				...r.map((p) => [p.name, p.family, p.cycle, p.price, p.subscribers, runRate(p), p.status, p.since])]
		);
		store.toast(`Exported ${r.length} price${r.length === 1 ? '' : 's'}`, 'meridian-prices.csv');
	}
	store.exporters.plans = exportRows;

	let selAll = $derived(visible.length > 0 && visible.every((p) => store.selection.includes(p.id)));
	let selPartial = $derived(visible.some((p) => store.selection.includes(p.id)) && !selAll);
	function toggleAll() {
		if (selAll) store.selection = store.selection.filter((id) => !visible.some((p) => p.id === id));
		else store.selection = [...new Set([...store.selection, ...visible.map((p) => p.id)])];
	}
	function toggleRow(id: string) {
		store.selection = store.selection.includes(id) ? store.selection.filter((x) => x !== id) : [...store.selection, id];
	}
	function bulkArchive() {
		const before = snap(store.plans);
		store.selection.forEach((id) => {
			const p = store.plans.find((x) => x.id === id);
			if (p) p.status = 'archived';
		});
		store.toast(`${store.selection.length} prices archived`, 'Subscribers keep their rate until renewal', () => {
			store.plans = before;
		});
		store.selection = [];
	}
	function bulkPublish() {
		const before = structuredClone(store.plans);
		store.selection.forEach((id) => {
			const p = store.plans.find((x) => x.id === id);
			if (p && p.status !== 'archived') p.status = 'active';
		});
		store.toast(`${store.selection.length} prices published`, 'New signups use these immediately', () => {
			store.plans = before;
		});
		store.selection = [];
	}

	async function copyId(id: string) {
		try {
			await navigator.clipboard.writeText('price_' + id);
			store.toast('Copied', 'price_' + id);
		} catch {
			store.toast('Copy failed', 'Clipboard is unavailable in this browser');
		}
	}

	function rowMenu(p: Plan) {
		store.dialog = { kind: 'price', planId: p.id };
	}
</script>

<div class={CARD + ' overflow-hidden'}>
	{#if full}
		<!-- toolbar -->
		<div class="flex flex-wrap items-center gap-2 px-4 pt-3 pb-3">
			<div class="flex flex-wrap items-center gap-1">
				{#each [['all', 'All'], ['active', 'Active'], ['beta', 'Beta'], ['archived', 'Archived']] as [id, label] (id)}
					{@const count = id === 'all' ? store.plans.length : store.plans.filter((p) => p.status === id).length}
					<button
						class="flex h-7 cursor-default select-none items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium transition-[background,color,box-shadow] duration-150 outline-none focus-visible:shadow-[0_0_0_3px_#255cd12e] {statusF === id ? 'bg-[#eef4ff] text-[#1d4ed8] shadow-[inset_0_0_0_1px_#dbe6ff]' : 'text-[#737373] hover:bg-black/[0.04] hover:text-[#171717]'}"
						onclick={() => { statusF = id as 'all' | Plan['status']; page = 0; }}
					>
						{label} <span class="text-[11px] tabular-nums {statusF === id ? 'text-[#1d4ed8]/70' : 'text-[#a3a3a3]'}">{count}</span>
					</button>
				{/each}
				<div class={SEGM + ' ml-1'}>
					{#each [['all', 'All'], ['monthly', 'Monthly'], ['annual', 'Annual']] as [id, label] (id)}
						<button class={SEGM_ITEM} data-active={cycleF === id ? '' : undefined} onclick={() => { cycleF = id as 'all' | 'monthly' | 'annual'; page = 0; }}>{label}</button>
					{/each}
				</div>
			</div>
			<div class="ml-auto flex items-center gap-1.5">
				<button
					class={BTN_GHOST}
					onclick={() => { store.density = store.density === 'cozy' ? 'compact' : 'cozy'; }}
					aria-label="Toggle table density"
					title="Toggle row density"
				>
					<Icon name="sliders" size={15} />
					<span class="hidden min-[480px]:inline">{store.density === 'cozy' ? 'Compact' : 'Cozy'}</span>
				</button>
				<button class={BTN_SEC} onclick={exportRows}>
					<Icon name="download" size={14} />
					Export
				</button>
				<button
					class={BTN_PRI}
					onclick={() => (store.dialog = { kind: 'addplan' })}
				>
					<Icon name="plus" size={14} />
					New price
				</button>
			</div>
		</div>

		<!-- selection bar -->
		{#if store.selection.length}
			<div class="enter-bar flex flex-wrap items-center gap-2 border-y border-[#eef4ff] bg-[#f6f9ff] px-4 py-2">
				<p class="text-[13px] font-medium text-[#171717]">{store.selection.length} selected</p>
				<div class="ml-auto flex items-center gap-1.5">
					<button class={BTN_SEC + ' h-7'} onclick={bulkPublish}><Icon name="play" size={12} /> Publish</button>
					<button class={BTN_SEC + ' h-7'} onclick={bulkArchive}><Icon name="archive" size={12} /> Archive</button>
					<button class={BTN_SEC + ' h-7'} onclick={exportRows}><Icon name="download" size={12} /> Export</button>
					<button class={BTN_GHOST + ' h-7'} onclick={() => (store.selection = [])}>Clear</button>
				</div>
			</div>
		{/if}
	{/if}

	<div class="overflow-x-auto">
		<table class="w-full min-w-[720px] border-collapse" style="table-layout: auto">
			<thead>
				<tr class="border-b border-[#ececec]">
					{#if full}
						<th class="w-9 pr-0 pl-4">
							<input
								type="checkbox"
								class="accent-[#255cd1] size-[15px] cursor-default align-middle outline-2 outline-offset-2 outline-[#255cd1]"
								checked={selAll}
								indeterminate={selPartial}
								onchange={toggleAll}
								aria-label="Select all visible prices"
							/>
						</th>
					{/if}
					{#each [['name', 'Plan'], ['price', 'Price'], ['subscribers', 'Subscribers'], ['mrr', 'Run-rate MRR'], ['share', 'Share'], ['status', 'Status']] as [key, label] (key)}
					{@const sortable = key !== 'share'}
					{@const right = key === 'price' || key === 'subscribers' || key === 'mrr'}
					<th class="px-3 py-2.5 whitespace-nowrap {right ? 'text-right' : 'text-left'}" aria-sort={sortable && sortKey === key ? (sortDir === 1 ? 'ascending' : 'descending') : undefined}>
						{#if sortable}
							<button
								class="flex cursor-default items-center gap-1 text-[12px] font-medium outline-none hover:text-[#171717] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#255cd12e] {sortKey === key ? 'text-[#171717]' : 'text-[#737373]'} {right ? 'ml-auto' : ''}"
								onclick={() => sortBy(key as SortKey)}
							>
								{label}
								{#if sortKey === key}
									<Icon name="arrow-up" size={11} class="transition-transform duration-150 {sortDir === -1 ? 'rotate-180' : ''}" />
								{/if}
							</button>
						{:else}
							<span class="text-[12px] font-medium {right ? 'block text-right' : ''} {key === 'share' ? 'text-[#a3a3a3]' : 'text-[#737373]'}">{label}</span>
						{/if}
					</th>
				{/each}
					<th class="w-12 text-[12px] font-medium text-[#737373]">{'\u00A0'}</th>
				</tr>
			</thead>
			<tbody>
				{#each visible as p (p.id)}
					{@const rr = runRate(p)}
					{@const share = p.status === 'archived' ? null : rr / totalRunRate}
					<tr class="group border-b border-[#f0f0f0] transition-colors duration-100 last:border-b-0 hover:bg-[#fafafa]">
						{#if full}
							<td class="pl-4">
								<input
									type="checkbox"
									class="accent-[#255cd1] size-[15px] cursor-default align-middle opacity-0 outline-2 outline-offset-2 outline-[#255cd1] group-hover:opacity-100 focus-visible:opacity-100 {store.selection.includes(p.id) ? 'opacity-100' : ''}"
									checked={store.selection.includes(p.id)}
									onchange={() => toggleRow(p.id)}
									aria-label="Select {p.name}"
								/>
							</td>
						{/if}
						<td class="px-3 {rowPad}">
							<div class="flex items-center gap-2">
								<span class="grid size-7 shrink-0 place-items-center rounded-[8px]" style="background: {FAMILY_COLORS[p.family]}26; color: {FAMILY_COLORS[p.family]}00">
									<span class="size-2.5 rounded-full" style="background:{FAMILY_COLORS[p.family]}"></span>
								</span>
								<div class="min-w-0">
									<p class="flex items-center gap-1.5 truncate text-[13.5px] font-medium text-[#171717]">
										{p.name}
										{#if p.changed}
											<span class="tag-tag">Updated</span>
										{/if}
									</p>
									<p class="truncate text-[12px] text-[#a3a3a3]">{p.family} · {p.cycle} {p.cycle === 'annual' ? '· billed yearly' : ''}</p>
								</div>
							</div>
						</td>
						<td class="px-3 {rowPad} text-right">
							<button
								class="inline-flex cursor-default items-center gap-1 rounded-md text-right tabular-nums outline-none transition-colors duration-150 hover:text-[#255cd1] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#255cd12e]"
								onclick={() => rowMenu(p)}
								title="Edit price"
							>
								<span class="font-mono text-[13.5px] font-medium text-[#171717]">{money(p.price, p.price % 1 !== 0)}</span>
								<Icon name="pencil" size={11} class="text-[#a3a3a3] opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:opacity-100" />
							</button>
						</td>
						<td class="px-3 {rowPad} text-right text-[13.5px] text-[#737373] tabular-nums">{num(p.subscribers)}</td>
						<td class="px-3 py-2.5 text-right font-mono text-[13.5px] font-medium text-[#171717] tabular-nums">{money(rr)}</td>
						<td class="px-3 {rowPad}">
							{#if share !== null}
								<div class="flex items-center justify-end gap-2">
									<span class="text-[12.5px] text-[#737373] tabular-nums w-9 text-right">{(share * 100).toFixed(1)}%</span>
									<span class="relative h-1.5 w-16 overflow-hidden rounded-full bg-[#f0f0f0]">
										<span class="absolute inset-y-0 left-0 rounded-full" style="width:{Math.min(100, share * 100)}%; background:{FAMILY_COLORS[p.family]}"></span>
									</span>
								</div>
							{:else}
								<span class="text-[12.5px] text-[#c4c4c4]">—</span>
							{/if}
						</td>
						<td class="px-3 {rowPad}">
							<span class={'inline-flex h-[22px] items-center rounded-md px-2 text-[12px] font-medium ' + STATUS_META[p.status].cls}>{STATUS_META[p.status].label}</span>
						</td>
						<td class="{rowPad} pr-2">
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class="grid size-7 cursor-default place-items-center rounded-lg text-[#a3a3a3] opacity-0 transition-[opacity,background] duration-150 outline-none group-hover:opacity-100 hover:bg-black/[0.05] hover:text-[#171717] focus-visible:opacity-100 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_#255cd12e]"
									aria-label="Actions for {p.name}"
								>
									<Icon name="dots" size={15} />
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content class={POP_CLASS + ' w-[210px]'} sideOffset={6} align="end">
										<DropdownMenu.Item class={MENU_ITEM} onclick={() => rowMenu(p)}>
											<Icon name="pencil" size={14} class="text-[#737373]" />
											Edit price…
										</DropdownMenu.Item>
										<DropdownMenu.Item class={MENU_ITEM} onclick={() => copyId(p.id)}>
											<Icon name="copy" size={14} class="text-[#737373]" />
											Copy price ID
										</DropdownMenu.Item>
										<div class="mx-2 my-1 h-px bg-[#ececec]"></div>
										{#if p.status === 'active'}
											<DropdownMenu.Item class={MENU_ITEM} onclick={() => store.setStatus(p.id, 'beta')}>
												<Icon name="pause" size={14} class="text-[#737373]" />
												Pause sales (beta)
											</DropdownMenu.Item>
										{:else if p.status === 'beta'}
											<DropdownMenu.Item class={MENU_ITEM} onclick={() => store.setStatus(p.id, 'active')}>
												<Icon name="play" size={14} class="text-[#737373]" />
												Publish
											</DropdownMenu.Item>
										{/if}
										{#if p.status !== 'archived'}
											<DropdownMenu.Item class={MENU_ITEM} onclick={() => store.setStatus(p.id, 'archived')}>
												<Icon name="archive" size={14} class="text-[#dc2626]" />
												Archive price
											</DropdownMenu.Item>
										{:else}
											<DropdownMenu.Item class={MENU_ITEM} onclick={() => store.setStatus(p.id, 'active')}>
												<Icon name="refresh" size={14} class="text-[#737373]" />
												Restore
											</DropdownMenu.Item>
										{/if}
										<DropdownMenu.Item class={MENU_ITEM} onclick={() => store.duplicate(p.id)}>
											<Icon name="copy" size={14} class="text-[#737373]" />
											Duplicate as draft
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</td>
					</tr>
				{:else}
					<tr>
						<td colspan={full ? 8 : 7} class="px-4 py-10 text-center">
							<p class="text-[13.5px] font-medium text-[#171717]">No prices match “{store.search}”</p>
							<p class="mt-0.5 text-[12.5px] text-[#737373]">Try a different search, or clear the filters.</p>
							<button class={BTN_SEC + ' mt-3 mx-auto'} onclick={clearFilters}>Clear search & filters</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if full}
		<div class="flex items-center justify-between px-4 py-3">
			<p class="text-[12.5px] text-[#737373] tabular-nums">{filtered.length} of {store.plans.length} prices</p>
			<div class="flex items-center gap-1">
				<button class={BTN_GHOST + ' h-7 px-2'} disabled={page === 0} onclick={() => page--} aria-label="Previous page">
					<Icon name="chev-down" size={13} class="rotate-90" />
				</button>
				{#each Array(pages) as _, i (i)}
					<button
						class="grid size-7 cursor-default place-items-center rounded-lg text-[12.5px] font-medium outline-none {page === i ? 'bg-[#f0f0f0] text-[#171717]' : 'text-[#737373] hover:bg-black/[0.04]'}"
						onclick={() => (page = i)}
					>
						{i + 1}
					</button>
				{/each}
				<button class={BTN_GHOST + ' h-7 px-2'} disabled={page >= pages - 1} onclick={() => page++} aria-label="Next page">
					<Icon name="chev-down" size={13} class="-rotate-90" />
				</button>
			</div>
		</div>
	{:else}
		<div class="border-t border-[#f0f0f0] px-4 py-2.5 text-center">
			<button class="text-[13px] font-medium text-[#255cd1] outline-none hover:underline focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_#255cd12e] rounded-md" onclick={() => (store.view = 'plans')}>
				View all {store.plans.length} prices
			</button>
		</div>
	{/if}
</div>

<style>
	.tag-tag {
		display: inline-flex;
		align-items: center;
		height: 18px;
		padding: 0 6px;
		border-radius: 5px;
		font-size: 11px;
		font-weight: 500;
		background: #f4f4f4;
		color: #737373;
		box-shadow: inset 0 0 0 1px #e8e8e8;
	}
	.enter-bar {
		animation: bar-in 180ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	@keyframes bar-in {
		from {
			opacity: 0;
			transform: translateY(-3px);
		}
	}
</style>
