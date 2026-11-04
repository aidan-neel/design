<script lang="ts">
	import { num, money, runRate, compact } from './data';
	import { store } from './store.svelte';
	import PlanTable from './plantable.svelte';
</script>

<div class="flex flex-col gap-4">
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="flex flex-col justify-center rounded-xl bg-[#f7f7f7] px-4 py-3.5">
			<p class="text-[12.5px] font-medium text-[#737373]">Published run-rate</p>
			<p class="mt-1 font-mono text-[17px] font-medium text-[#171717] tabular-nums">{compact(store.plans.filter((p) => p.status !== 'archived').reduce((a, p) => a + runRate(p), 0))}</p>
		</div>
		<div class="flex flex-col justify-center rounded-xl bg-[#f7f7f7] px-4 py-3.5">
			<p class="text-[12.5px] font-medium text-[#737373]">Beta drafts</p>
			<p class="mt-1 font-mono text-[17px] font-medium text-[#171717] tabular-nums">{num(store.plans.filter((p) => p.status === 'beta').length)}</p>
		</div>
		<div class="flex flex-col justify-center rounded-xl bg-[#f7f7f7] px-4 py-3.5">
			<p class="text-[12.5px] font-medium text-[#737373]">Edited this session</p>
			<p class="mt-1 font-mono text-[17px] font-medium text-[#171717] tabular-nums">{num(store.plans.filter((p) => p.changed).length)}</p>
		</div>
		<div class="flex flex-col justify-center rounded-xl bg-[#f7f7f7] px-4 py-3.5">
			<p class="text-[12.5px] font-medium text-[#737373]">Avg paid price</p>
			<p class="mt-1 font-mono text-[17px] font-medium text-[#171717] tabular-nums">{money(store.plans.filter((p) => p.status !== 'archived').reduce((a, p) => a + p.price * p.subscribers, 0) / Math.max(1, store.plans.filter((p) => p.status !== 'archived').reduce((a, p) => a + p.subscribers, 0)))}</p>
		</div>
	</div>

	<p class="px-1 text-[12.5px] text-[#a3a3a3]">
		Run-rate MRR is estimated as list price × subscribers. Edits here change future renewals — billed invoices are archived in Revenue.
	</p>

	<PlanTable full />
</div>
