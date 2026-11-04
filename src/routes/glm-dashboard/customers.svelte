<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { BTN_GHOST, BTN_SEC, CARD, MENU_ITEM, POP_CLASS, money, num, downloadCsv, type SubStatus } from './data';
	import { store } from './store.svelte';
	import Icon from './Icon.svelte';
	import Kpi from './kpi.svelte';

	type SortKey = 'company' | 'plan' | 'seats' | 'mrr' | 'next';
	let sortKey = $state<SortKey>('mrr');
	let sortDir = $state<1 | -1>(-1);
	let statusF = $state<'all' | SubStatus>('all');
	let page = $state(0);
	const PER = 10;

	const AVA_TINT = ['#eef4ff', '#ecfdf3', '#fef3e6', '#f4f0ff', '#fdf2f8'];

	const initial = (s: string) => s.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

	const STATUS_META: Record<SubStatus, string> = {
		active: 'bg-[#ecfdf3] text-[#15803d] shadow-[inset_0_0_0_1px_#d1fadf]',
		trialing: 'bg-[#eef4ff] text-[#1d4ed8] shadow-[inset_0_0_0_1px_#dbe6ff]',
		past_due: 'bg-[#fff7e6] text-[#b45309] shadow-[inset_0_0_0_1px_#f7e0b8]',
		churned: 'bg-[#f4f4f4] text-[#737373] shadow-[inset_0_0_0_1px_#e4e4e4]'
	};
	const STATUS_LABEL: Record<SubStatus, string> = { active: 'Active', trialing: 'Trialing', past_due: 'Past due', churned: 'Churned' };

	let planName = $derived.by(() => {
		const m: Record<string, string> = {};
		for (const p of store.plans) m[p.id] = p.name;
		return m;
	});
	let planById = $derived.by(() => {
		const m: Record<string, (typeof store.plans)[number]> = {};
		for (const p of store.plans) m[p.id] = p;
		return m;
	});

	const MON = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 } as const;
	function nextVal(s: string) {
		if (s === '—') return 9e9;
		const [m, d] = s.split(' ');
		const mi = (MON as Record<string, number>)[m] ?? 12;
		return (mi > 9 ? mi - 12 : mi) * 31 + Number(d); // rough: months from Nov
	}

	function matches(c: (typeof store.customers)[number]) {
		const q = store.search.trim().toLowerCase();
		if (q && !(c.company.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || (planName[c.planId] ?? '').toLowerCase().includes(q))) return false;
		if (statusF !== 'all' && c.status !== statusF) return false;
		return true;
	}

	const filtered = $derived(
		store.customers.filter(matches).slice().sort((a, b) => {
			let d = 0;
			if (sortKey === 'company' || sortKey === 'plan') d = (sortKey === 'plan' ? planName[a.planId] ?? '' : a[sortKey]).localeCompare(sortKey === 'plan' ? planName[b.planId] ?? '' : b[sortKey]);
			else if (sortKey === 'mrr') d = a.mrr - b.mrr;
			else if (sortKey === 'seats') d = a.seats - b.seats;
			else d = nextVal(a.nextInvoice) - nextVal(b.nextInvoice);
			return d * sortDir;
		})
	);

	let visible = $derived(filtered.slice(page * PER, page * PER + PER));
	let pages = $derived(Math.max(1, Math.ceil(filtered.length / PER)));
	let rowPad = $derived(store.density === 'compact' ? 'py-1' : 'py-2.5');

	function sortBy(key: SortKey) {
		if (sortKey === key) sortDir = (sortDir * -1) as 1 | -1;
		else {
			sortKey = key;
			sortDir = 1;
		}
	}

	let actives = $derived(store.customers.filter((c) => c.status === 'active').length);
	let pastDue = $derived(store.customers.filter((c) => c.status === 'past_due').length);
	let trialing = $derived(store.customers.filter((c) => c.status === 'trialing').length);
	let avgMrr = $derived.by(() => {
		const paying = store.customers.filter((c) => c.status === 'active');
		return paying.reduce((a, c) => a + c.mrr, 0) / Math.max(1, paying.length);
	});

	async function copyId(c: { id: string; company: string }) {
		try {
			await navigator.clipboard.writeText('cus_' + c.id);
			store.toast('Copied', 'cus_' + c.id);
		} catch {
			store.toast('Copy failed', 'Clipboard is unavailable in this browser');
		}
	}

	$effect(() => {
		store.exporters.customers = () => {
			downloadCsv(
				'meridian-customers.csv',
				[
					['Company', 'Owner', 'Plan', 'Status', 'Seats', 'MRR', 'Since', 'Next invoice'],
					...filtered.map((c) => [c.company, c.name, planName[c.planId] ?? '—', c.status, c.seats, c.mrr, c.since, c.nextInvoice])
				]
			);
			store.toast(`Exported ${filtered.length} customers`, 'meridian-customers.csv');
		};
	});

	const selPlans = $derived(store.plans.filter((p) => p.status !== 'archived'));
</script>

<div class="flex flex-col gap-4">
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
		<Kpi label="Active customers" value={num(actives)} note={num(trialing) + ' trialing on top'} icon="users" />
		<Kpi label="Past due" value={num(pastDue)} note={pastDue ? 'Needs a reminder' : 'All healthy'} icon="alert" />
		<Kpi label="Avg MRR / customer" value={money(avgMrr)} note="active, company-level" icon="receipt" />
	</div>

	<div class="flex flex-wrap items-center gap-2">
		{#each [['all', 'All'], ['active', 'Active'], ['trialing', 'Trialing'], ['past_due', 'Past due'], ['churned', 'Churned']] as [id, label] (id)}
			{@const count = id === 'all' ? store.customers.length : store.customers.filter((c) => c.status === id).length}
			<button
				class="flex h-7 cursor-default select-none items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium transition-[background,color,box-shadow] duration-150 outline-none focus-visible:shadow-[0_0_0_3px_#255cd12e] {statusF === id ? 'bg-[#eef4ff] text-[#1d4ed8] shadow-[inset_0_0_0_1px_#dbe6ff]' : 'text-[#737373] hover:bg-black/[0.04] hover:text-[#171717]'}"
				onclick={() => { statusF = id as 'all' | SubStatus; page = 0; }}
			>
				{label} <span class="text-[11px] tabular-nums {statusF === id ? 'text-[#1d4ed8]/70' : 'text-[#a3a3a3]'}">{count}</span>
			</button>
		{/each}
		<button class={BTN_SEC + ' ml-auto'} onclick={() => { store.exporters.customers?.(); }}>
			<Icon name="download" size={14} />
			Export
		</button>
	</div>

	<div class={CARD + ' overflow-hidden'}>
		<div class="overflow-x-auto">
			<table class="w-full min-w-[760px] border-collapse">
				<thead>
					<tr class="border-b border-[#ececec] text-[12px] font-medium text-[#737373]">
						<th class="px-4 py-2.5 text-left" aria-sort={sortKey === 'company' ? (sortDir === 1 ? 'ascending' : 'descending') : undefined}>
							<button class="flex cursor-default items-center gap-1 outline-none hover:text-[#171717] {sortKey === 'company' ? 'text-[#171717]' : ''}" onclick={() => sortBy('company')}>
								Customer {#if sortKey === 'company'}<Icon name="arrow-up" size={11} class={sortDir === -1 ? 'rotate-180' : ''} />{/if}
							</button>
						</th>
						<th class="px-3 py-2.5 text-left" aria-sort={sortKey === 'plan' ? (sortDir === 1 ? 'ascending' : 'descending') : undefined}>
							<button class="flex cursor-default items-center gap-1 outline-none hover:text-[#171717] {sortKey === 'plan' ? 'text-[#171717]' : ''}" onclick={() => sortBy('plan')}>
								Plan {#if sortKey === 'plan'}<Icon name="arrow-up" size={11} class={sortDir === -1 ? 'rotate-180' : ''} />{/if}
							</button>
						</th>
						<th class="px-3 py-2.5 text-left">Status</th>
						<th class="px-3 py-2.5 text-right">
							<button class="ml-auto flex cursor-default items-center gap-1 outline-none hover:text-[#171717] {sortKey === 'seats' ? 'text-[#171717]' : ''}" onclick={() => sortBy('seats')}>
								Seats {#if sortKey === 'seats'}<Icon name="arrow-up" size={11} class={sortDir === -1 ? 'rotate-180' : ''} />{/if}
							</button>
						</th>
						<th class="px-3 py-2.5 text-right" aria-sort={sortKey === 'mrr' ? (sortDir === 1 ? 'ascending' : 'descending') : undefined}>
							<button class="ml-auto flex cursor-default items-center gap-1 outline-none hover:text-[#171717] {sortKey === 'mrr' ? 'text-[#171717]' : ''}" onclick={() => sortBy('mrr')}>
								MRR {#if sortKey === 'mrr'}<Icon name="arrow-up" size={11} class={sortDir === -1 ? 'rotate-180' : ''} />{/if}
							</button>
						</th>
						<th class="px-3 py-2.5 text-right">
							<button class="ml-auto flex cursor-default items-center gap-1 outline-none hover:text-[#171717] {sortKey === 'next' ? 'text-[#171717]' : ''}" onclick={() => sortBy('next')}>
								Next invoice {#if sortKey === 'next'}<Icon name="arrow-up" size={11} class={sortDir === -1 ? 'rotate-180' : ''} />{/if}
							</button>
						</th>
						<th class="w-12"></th>
					</tr>
				</thead>
				<tbody>
					{#each visible as c (c.id)}
						<tr class="group border-b border-[#f0f0f0] transition-colors duration-100 last:border-b-0 hover:bg-[#fafafa]">
							<td class="px-4 {rowPad}">
								<div class="flex items-center gap-2.5">
									<span class="grid size-7 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold" style="background:{AVA_TINT[c.id.charCodeAt(3) % AVA_TINT.length]}" aria-hidden="true">
										<span class="text-[#475569]">{initial(c.company)}</span>
									</span>
									<div class="min-w-0">
										<p class="truncate text-[13.5px] font-medium text-[#171717]">{c.company}</p>
										<p class="truncate text-[12px] text-[#a3a3a3]">{c.name}</p>
									</div>
								</div>
							</td>
							<td class="px-3 py-2.5 text-[13.5px] text-[#737373]">{planName[c.planId] ?? '—'}</td>
							<td class="px-3 {rowPad}"><span class={'inline-flex h-[22px] items-center rounded-md px-2 text-[12px] font-medium ' + STATUS_META[c.status]}>{STATUS_LABEL[c.status]}</span></td>
							<td class="px-3 {rowPad} text-right text-[13.5px] text-[#737373] tabular-nums">{num(c.seats)}</td>
							<td class="px-3 py-2.5 text-right font-mono text-[13.5px] font-medium text-[#171717] tabular-nums">{c.mrr ? money(c.mrr) : '—'}</td>
							<td class="px-3 py-2.5 text-right text-[13px] text-[#737373] tabular-nums">{c.nextInvoice}</td>
							<td class="py-2.5 pr-2">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger class="grid size-7 cursor-default place-items-center rounded-lg text-[#a3a3a3] opacity-0 transition-[opacity,background] duration-150 outline-none group-hover:opacity-100 hover:bg-black/[0.05] hover:text-[#171717] focus-visible:opacity-100 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_#255cd12e]" aria-label="Actions for {c.company}">
										<Icon name="dots" size={15} />
									</DropdownMenu.Trigger>
									<DropdownMenu.Portal>
										<DropdownMenu.Content class={POP_CLASS + ' w-[218px]'} sideOffset={6} align="end">
											<DropdownMenu.Sub>
												<DropdownMenu.SubTrigger class={MENU_ITEM}>
													<Icon name="tag" size={14} class="text-[#737373]" />
													Change plan
													<Icon name="chev-right" size={13} class="ml-auto text-[#a3a3a3]" />
												</DropdownMenu.SubTrigger>
												<DropdownMenu.Portal>
													<DropdownMenu.SubContent class={POP_CLASS + ' w-[220px]'} sideOffset={6}>
														<DropdownMenu.RadioGroup value={c.planId} onValueChange={(v) => store.setCustomerPlan(c.id, v)}>
															{#each selPlans as p (p.id)}
																<DropdownMenu.RadioItem value={p.id} class={MENU_ITEM}>
																	{p.name}
																	<span class="ml-auto text-[12px] font-normal text-[#a3a3a3] tabular-nums">{p.cycle === 'annual' ? money(p.price) + '/mo·yr' : money(p.price) + '/mo'}</span>
																</DropdownMenu.RadioItem>
															{/each}
														</DropdownMenu.RadioGroup>
													</DropdownMenu.SubContent>
												</DropdownMenu.Portal>
											</DropdownMenu.Sub>
											<DropdownMenu.Item class={MENU_ITEM} onclick={() => copyId(c)}><Icon name="copy" size={14} class="text-[#737373]" /> Copy customer ID</DropdownMenu.Item>
											<div class="mx-2 my-1 h-px bg-[#ececec]"></div>
											{#if c.status === 'past_due'}
												<DropdownMenu.Item class={MENU_ITEM} onclick={() => store.remindPastDue(c.id)}>
													<Icon name="mail" size={14} class="text-[#737373]" />
													Send payment reminder
												</DropdownMenu.Item>
											{/if}
											{#if c.status !== 'churned'}
												<DropdownMenu.Item class={MENU_ITEM + ' text-[#b91c1c]'} onclick={() => store.cancelCustomer(c.id)}>
													<Icon name="x" size={14} class="text-[#dc2626]" />
													Cancel subscription
												</DropdownMenu.Item>
											{:else}
												<DropdownMenu.Item class={MENU_ITEM} onclick={() => store.resubscribe(c.id)}>
													<Icon name="refresh" size={14} class="text-[#737373]" />
													Reactivate subscription
												</DropdownMenu.Item>
											{/if}
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="px-4 py-10 text-center">
								<p class="text-[13.5px] font-medium text-[#171717]">No customers match “{store.search}”</p>
								<p class="mt-0.5 text-[12.5px] text-[#737373]">Try another name or clear the status filter.</p>
								<button class={BTN_SEC + ' mx-auto mt-3'} onclick={() => { store.search = ''; statusF = 'all'; }}>Clear search & filters</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<div class="flex items-center justify-between px-4 py-3">
			<p class="text-[12.5px] text-[#737373] tabular-nums">{filtered.length} of {store.customers.length} customers</p>
			<div class="flex items-center gap-1">
				<button class={BTN_GHOST + ' h-7 px-2'} disabled={page === 0} onclick={() => page--} aria-label="Previous page">
					<Icon name="chev-down" size={13} class="rotate-90" />
				</button>
				{#each Array(pages) as _, i (i)}
					<button class="grid size-7 cursor-default place-items-center rounded-lg text-[12.5px] font-medium outline-none {page === i ? 'bg-[#f0f0f0] text-[#171717]' : 'text-[#737373] hover:bg-black/[0.04]'}" onclick={() => (page = i)}>{i + 1}</button>
				{/each}
				<button class={BTN_GHOST + ' h-7 px-2'} disabled={page >= pages - 1} onclick={() => page++} aria-label="Next page">
					<Icon name="chev-down" size={13} class="-rotate-90" />
				</button>
			</div>
		</div>
	</div>
</div>
