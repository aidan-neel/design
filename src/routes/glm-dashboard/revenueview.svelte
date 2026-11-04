<script lang="ts">
	import { CARD, MOVEMENT, MIX, money, num, bucketize, daysBetween, resolveRange, shiftIso, downloadCsv, fmtDay, compact } from './data';
	import { store } from './store.svelte';
	import RevenueChart from './chartline.svelte';
	import MixBars from './mixbars.svelte';
	import RangePicker from './rangepicker.svelte';
	import Icon from './Icon.svelte';

	const R = $derived(resolveRange(store.rangeId, store.customFrom, store.customTo));
	const slice = $derived(daysBetween(R.fromIso, R.toIso));
	const len = $derived(slice.length || 1);
	const prevSlice = $derived(daysBetween(shiftIso(R.fromIso, -len), shiftIso(R.toIso, -len)));

	let metric = $state<'Revenue' | 'MRR'>('Revenue');
	const gran = $derived(len <= 31 ? 'day' : len <= 130 ? 'week' : 'month');
	const buckets = $derived(bucketize(slice, metric === 'Revenue' ? 'revenue' : 'mrr', gran, store.compare ? prevSlice : undefined));
	const rangeRevenue = $derived(slice.reduce((a, d) => a + d.revenue, 0));
	const rangePrev = $derived(prevSlice.reduce((a, d) => a + d.revenue, 0));
	const delta = $derived(rangePrev ? ((rangeRevenue - rangePrev) / rangePrev) * 100 : 0);
	const bestDay = $derived(slice.reduce((b, d) => (d.revenue > b.revenue ? d : b), slice[0]));
	const netNew = $derived(slice.reduce((a, d) => a + d.signups - d.churned, 0));

	$effect(() => {
		store.exporters.revenue = () => {
			downloadCsv(
				'meridian-mrr-movement.csv',
				[
					['Month', 'Opening MRR', 'New', 'Expansion', 'Contraction', 'Churned', 'Net new', 'Closing MRR'],
					...MOVEMENT.map((m) => [m.label, m.opening, m.new, m.expansion, m.contraction, m.churned, m.new + m.expansion + m.contraction + m.churned, m.closing])
				]
			);
			store.toast('Exported 12-month movement', 'meridian-mrr-movement.csv');
		};
	});
</script>

<div class="flex flex-col gap-4">
		<div class="flex flex-wrap items-center gap-2">
			<RangePicker />
			{#if store.compare}
				<span class="text-[12.5px] text-[#a3a3a3]">Compared to previous {len} days</span>
			{/if}
			<span class="ml-auto text-[10.5px] text-[#a3a3a3] min-[820px]:inline hidden">{gran === 'day' ? 'Daily' : gran === 'week' ? 'Weekly' : 'Monthly'} totals</span>
		</div>

	<div class={CARD + ' p-4'}>
		<div class="flex flex-wrap items-center gap-3">
			<h2 class="text-[15px] font-semibold tracking-[-0.01em] text-[#171717]">{metric} trend</h2>
			<div class="ml-auto flex items-center gap-2">
				<div class="flex h-7 items-center gap-0.5 rounded-[9px] bg-[#f0f0f0] p-0.5">
					{#each ['Revenue', 'MRR'] as m (m)}
						<button class="h-6 rounded-[7px] px-2 text-[12.5px] font-medium outline-none transition-[color,box-shadow] duration-150 {metric === m ? 'bg-white text-[#171717] shadow-[0_0_0_1px_#e8e8e8]' : 'text-[#737373]'}" onclick={() => (metric = m as 'Revenue' | 'MRR')}>{m}</button>
					{/each}
				</div>
			</div>
		</div>
		<div class="mt-2">
			<RevenueChart {buckets} unit="$" height={280} />
		</div>
		<div class="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-[#f0f0f0] px-1 pt-2.5 text-[12.5px] text-[#737373]">
			<span>Total <span class="font-medium text-[#171717] tabular-nums">{compact(rangeRevenue)}</span></span>
			{#if store.compare}
				<span>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs previous {len} days</span>
			{/if}
			<span>Best day <span class="font-medium text-[#171717] tabular-nums">{fmtDay(bestDay.t)} · {money(bestDay.revenue)}</span></span>
			<span class="ml-auto">Net new subs <span class="font-medium text-[#171717] tabular-nums">{num(netNew)}</span></span>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
		<div class={CARD + ' p-4 lg:col-span-7'}>
			<div class="flex items-center justify-between">
				<h2 class="text-[15px] font-semibold tracking-[-0.01em] text-[#171717]">Revenue by plan</h2>
				<span class="text-[12.5px] text-[#a3a3a3]">Monthly · 12 months</span>
			</div>
			<div class="mt-3">
				<MixBars rows={MIX} height={216} />
			</div>
		</div>

		<div class={CARD + ' overflow-hidden lg:col-span-5'}>
			<div class="flex items-center justify-between px-4 pt-3.5 pb-2">
				<h2 class="text-[15px] font-semibold tracking-[-0.01em] text-[#171717]">MRR movement</h2>
				<span class="text-[12.5px] text-[#a3a3a3]">Last 12 months</span>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full min-w-[420px] border-collapse">
					<thead>
						<tr class="border-b border-[#ececec] text-[11.5px] font-medium text-[#a3a3a3]">
							<th class="px-4 py-1.5 text-left">Month</th>
							<th class="px-2 py-1.5 text-right">New</th>
							<th class="px-2 py-1.5 text-right">Exp.</th>
							<th class="px-2 py-1.5 text-right">Churn</th>
							<th class="px-2 py-1.5 text-right">Net</th>
							<th class="px-4 py-1.5 text-right">MRR</th>
						</tr>
					</thead>
					<tbody>
						{#each MOVEMENT as m (m.label)}
							{@const net = m.new + m.expansion + m.contraction + m.churned}
							<tr class="border-b border-[#f0f0f0] text-[12.5px] tabular-nums last:border-b-0 hover:bg-[#fafafa]">
								<td class="py-2 pl-4 font-medium text-[#171717]">{m.label}</td>
								<td class="px-2 py-2 text-right text-[#16a34a]">{num(m.new).replace('-', '−')}</td>
								<td class="px-2 py-2 text-right text-[#16a34a]">{num(m.expansion).replace('-', '−')}</td>
								<td class="px-2 py-2 text-right text-[#dc2626]">{num(m.churned).replace('-', '−')}</td>
								<td class="px-2 py-2 text-right font-medium {net >= 0 ? 'text-[#171717]' : 'text-[#dc2626]'}">{net >= 0 ? '+' : '−'}{num(Math.abs(net))}</td>
								<td class="py-2 pr-4 text-right font-mono font-medium text-[#171717]">{money(m.closing)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
