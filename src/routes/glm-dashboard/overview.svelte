<script lang="ts">
	import { CARD, BTN_SEC, daysBetween, resolveRange, shiftIso, money, num, bucketize, fmtDay, subsAt, compact, downloadCsv, FAILURES, FAILURE_TOTAL, FAMILY_COLORS } from './data';
	import { store } from './store.svelte';
	import Kpi from './kpi.svelte';
	import RevenueChart from './chartline.svelte';
	import PlanTable from './plantable.svelte';
	import RangePicker from './rangepicker.svelte';
	import Icon from './Icon.svelte';

	const R = $derived(resolveRange(store.rangeId, store.customFrom, store.customTo));
	const slice = $derived(daysBetween(R.fromIso, R.toIso));
	const len = $derived(slice.length || 1);
	const prevSlice = $derived(daysBetween(shiftIso(R.fromIso, -len), shiftIso(R.toIso, -len)));

	const sum = (s: typeof slice, k: 'revenue') => s.reduce((a, d) => a + d[k], 0);
	const revenue = $derived(sum(slice, 'revenue'));
	const revPrev = $derived(sum(prevSlice, 'revenue'));
	const revDelta = $derived(revPrev ? ((revenue - revPrev) / revPrev) * 100 : 0);

	const last = $derived(slice[slice.length - 1] ?? slice[0]);
	const first = $derived(slice[0] ?? last);
	const mrrDelta = $derived(first && last ? ((last.mrr - first.mrr) / first.mrr) * 100 : 0);
	const subsEnd = $derived(last ? subsAt(last) : 0);
	const subsPrevEnd = $derived(prevSlice[prevSlice.length - 1] ? subsAt(prevSlice[prevSlice.length - 1]) : subsEnd);
	const subsDelta = $derived(subsPrevEnd ? ((subsEnd - subsPrevEnd) / subsPrevEnd) * 100 : 0);
	const subsNet = $derived(slice.reduce((a, d) => a + d.signups - d.churned, 0));
	const arpu = $derived(subsEnd ? last.mrr / subsEnd : 0);
	const arpuPrev = $derived(subsPrevEnd ? (prevSlice[prevSlice.length - 1].mrr / subsPrevEnd) : arpu);
	const arpuDelta = $derived(arpuPrev ? ((arpu - arpuPrev) / arpuPrev) * 100 : 0);
	const churnedCount = $derived(slice.reduce((a, d) => a + d.churned, 0));
	const churnRate = $derived(subsEnd ? (churnedCount / subsEnd) * 100 : 0);
	const churnPrev = $derived(subsPrevEnd ? (prevSlice.reduce((a, d) => a + d.churned, 0) / subsPrevEnd) * 100 : churnRate);

	let metric = $state<'Revenue' | 'MRR'>('Revenue');
	let granOverride = $state<'day' | 'week' | 'month' | null>(null);
	const gran = $derived(granOverride ?? (len <= 31 ? 'day' : len <= 130 ? 'week' : 'month'));
	const buckets = $derived(bucketize(slice, metric === 'Revenue' ? 'revenue' : 'mrr', gran, store.compare ? prevSlice : undefined));
	let bestDay = $derived(slice.reduce((b, d) => (d.revenue > b.revenue ? d : b), slice[0]));
	const fams = $derived(
		Object.entries(
			store.plans.filter((p) => p.status !== 'archived').reduce<Record<string, number>>((m, p) => ({ ...m, [p.family]: (m[p.family] ?? 0) + p.price * p.subscribers }), {})
		).sort((a, b) => b[1] - a[1])
	);
	const famsTotal = $derived(fams.reduce((a, [, v]) => a + v, 0));

	// export this view
	$effect(() => {
		store.exporters.overview = () => {
			downloadCsv(
				'meridian-overview.csv',
				[
					['Metric', 'Value', 'Change'],
					['Net revenue', money(revenue), (store.compare ? revDelta.toFixed(1) : '') + '%'],
					['MRR', money(last?.mrr ?? 0), mrrDelta.toFixed(1) + '%'],
					['Active subscriptions', String(subsEnd), (store.compare ? subsDelta.toFixed(1) : '') + '%'],
					['ARPU', money(Number(arpu.toFixed(2))), (store.compare ? arpuDelta.toFixed(1) : '') + '%'],
					['Churn rate', churnRate.toFixed(1) + '%', (store.compare ? (churnRate - churnPrev).toFixed(1) : '') + '%']
				]
			);
			store.toast('Exported overview KPIs', 'meridian-overview.csv');
		};
	});
</script>

<div class="grid grid-cols-1 gap-4 min-w-0 xl:grid-cols-[1fr_312px]">
	<div class="col-span-1 flex min-w-0 flex-col gap-4">
		<!-- filters row -->
		<div class="flex flex-wrap items-center gap-2">
			<RangePicker />
			{#if store.compare}
				<span class="text-[12.5px] text-[#a3a3a3]">Compared to previous {len === 1 ? 'day' : len + ' days'}</span>
			{/if}
			{#if store.search}
				<button class="ml-auto flex h-7 cursor-default items-center gap-1.5 rounded-full bg-[#eef4ff] px-2.5 text-[12.5px] font-medium text-[#1d4ed8] shadow-[inset_0_0_0_1px_#dbe6ff] outline-none hover:bg-[#e4edff]" onclick={() => (store.search = '')}>
					“{store.search}”
					<Icon name="x" size={11} />
				</button>
			{/if}
		</div>

		<!-- KPIs -->
		<div class="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
			<Kpi label="Net revenue" value={money(revenue)} delta={store.compare ? revDelta : null} note={"prior " + len + "d"} icon="chart" />
			<Kpi label="MRR" value={money(last?.mrr ?? 0)} delta={mrrDelta} note="period" icon="bars" />
			<Kpi label="Active subscriptions" value={num(subsEnd)} delta={store.compare ? subsDelta : null} note={num(subsNet) + ' net'} icon="users" />
			<Kpi label="ARPU" value={money(arpu)} delta={store.compare ? arpuDelta : null} note="monthly" icon="receipt" />
			<Kpi label="Churn rate" value={churnRate.toFixed(1) + '%'} delta={store.compare && churnPrev ? ((churnRate - churnPrev) / churnPrev) * 100 : null} invert note={num(churnedCount) + ' lost'} icon="info" />
		</div>

		<!-- main chart -->
		<div class={CARD + ' p-4'}>
			<div class="flex flex-wrap items-center gap-3">
				<h2 class="text-[15px] font-semibold tracking-[-0.01em] text-[#171717]">{metric}</h2>
				<span class="text-[12.5px] text-[#a3a3a3]">{gran === 'day' ? 'Daily' : gran === 'week' ? 'Weekly' : 'Monthly'} totals</span>
				<div class="ml-auto flex items-center gap-2">
					<div class="flex h-7 items-center gap-0.5 rounded-[9px] bg-[#f0f0f0] p-0.5">
						{#each ['Revenue', 'MRR'] as m (m)}
							<button class="h-6 rounded-[7px] px-2 text-[12.5px] font-medium outline-none transition-[color,box-shadow] duration-150 {metric === m ? 'bg-white text-[#171717] shadow-[0_0_0_1px_#e8e8e8]' : 'text-[#737373]'}" onclick={() => (metric = m as 'Revenue' | 'MRR')}>{m}</button>
						{/each}
					</div>
					<div class="hidden h-7 items-center gap-0.5 rounded-[9px] bg-[#f0f0f0] p-0.5 min-[480px]:flex">
						{#each ['day', 'week', 'month'] as g (g)}
							<button
								class="h-6 rounded-[7px] px-2 text-[12.5px] font-medium outline-none transition-[color,box-shadow] duration-150 {gran === g ? 'bg-white text-[#171717] shadow-[0_0_0_1px_#e8e8e8]' : 'text-[#737373]'}"
								onclick={() => (granOverride = g as 'day' | 'week' | 'month')}
							>
								{g === 'day' ? 'Day' : g === 'week' ? 'Week' : 'Month'}
							</button>
						{/each}
					</div>
				</div>
			</div>
			<div class="mt-2">
				<RevenueChart {buckets} unit="$" height={252} />
			</div>
			<div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#f0f0f0] px-1 pt-2.5 text-[12.5px] text-[#737373]">
				<span>Best day {bestDay ? fmtDay(bestDay.t) : '—'} · <span class="font-medium text-[#171717] tabular-nums">{bestDay ? money(bestDay.revenue) : '—'}</span></span>
				{#if store.compare}
					<span class="ml-auto flex items-center gap-1.5">
						<span class="h-0 w-4 border-t-2 border-dashed border-[#c2c2c8]"></span>
						Previous {len} days
					</span>
				{/if}
			</div>
		</div>

		<!-- plan table (compact) -->
		<div>
			<div class="mb-2 flex items-baseline justify-between px-1">
				<h2 class="text-[15px] font-semibold tracking-[-0.01em] text-[#171717]">Prices</h2>
				<span class="text-[12.5px] text-[#a3a3a3]">Run-rate leaderboard</span>
			</div>
			<PlanTable rows={6} />
		</div>
	</div>

	<!-- right column -->
	<div class="col-span-1 flex min-w-0 flex-col gap-4">
		<div class={CARD + ' p-4'}>
			<div class="flex items-center justify-between">
				<h2 class="text-[15px] font-semibold tracking-[-0.01em] text-[#171717]">Revenue by plan</h2>
				<button class="text-[12.5px] font-medium text-[#255cd1] outline-none hover:underline focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_#255cd12e] rounded-md" onclick={() => (store.view = 'plans')}>Plans →</button>
			</div>
			<ul class="mt-3 flex flex-col gap-3">
				{#each fams.slice(0, 5) as [fam, v] (fam)}
					<li class="flex items-center gap-2.5">
						<span class="size-2.5 shrink-0 rounded-[3px]" style="background:{FAMILY_COLORS[fam]}"></span>
						<div class="min-w-0 flex-1">
							<div class="flex items-baseline justify-between gap-2">
								<p class="truncate text-[13px] font-medium text-[#171717]">{fam}</p>
								<p class="font-mono text-[13px] font-medium text-[#171717] tabular-nums">{money(v)}</p>
							</div>
							<div class="mt-1 flex items-center gap-2">
								<span class="relative h-1 flex-1 overflow-hidden rounded-full bg-[#f0f0f0]">
									<span class="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300" style="width:{(v / famsTotal) * 100}%; background:{FAMILY_COLORS[fam]}"></span>
								</span>
								<span class="w-9 text-right text-[11.5px] text-[#a3a3a3] tabular-nums">{((v / famsTotal) * 100).toFixed(0)}%</span>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</div>

		<div class={CARD + ' p-4'}>
			<div class="flex items-start gap-2.5">
				<span class="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fff7e6] text-[#b45309] shadow-[inset_0_0_0_1px_#f7e0b8]">
					<Icon name="alert" size={15} />
				</span>
				<div class="min-w-0 flex-1">
					<p class="text-[13.5px] font-semibold tracking-[-0.01em] text-[#171717]">{compact(FAILURE_TOTAL) + ' failed this week'}</p>
					<p class="text-[12.5px] text-[#737373]">16 invoices failed · retries are free with Smart Retry</p>
				</div>
			</div>
			<ul class="mt-3 divide-y divide-[#f0f0f0]">
				{#each FAILURES.slice(0, 3) as f (f.company)}
					<li class="flex items-center gap-2 py-2 text-[13px] first:pt-0.5">
						<span class="min-w-0 flex-1 truncate text-[#171717]">{f.company}</span>
						<span class="text-[12px] text-[#a3a3a3]">{f.reason}</span>
						<span class="w-14 text-right font-mono text-[13px] font-medium text-[#171717] tabular-nums">{money(f.amount)}</span>
					</li>
				{/each}
			</ul>
			<button
				class="mt-3 flex h-8 w-full cursor-default items-center justify-center gap-1.5 rounded-[9px] bg-[#255cd1] text-[13px] font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(0_0_0/0.16)] outline-none transition-colors duration-150 hover:bg-[#2253bd] active:scale-[0.97] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_#255cd12e,0_0_0_1px_rgb(24_58_128)]"
				onclick={() => store.toast('Reminders sent', '16 customers got a card-update link')}
			>
				Send card-update reminders
			</button>
		</div>
	</div>
</div>
