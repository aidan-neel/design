<script lang="ts">
	import Icon from './Icon.svelte';
	import { CARD } from './data';
	import { fmtSignedPct } from './data';

	type Props = {
		label: string;
		value: string;
		delta?: number | null;
		note?: string;
		invert?: boolean;
		icon?: 'chart' | 'users' | 'receipt' | 'bars' | 'tag' | 'alert' | 'info';
		loading?: boolean;
	};
	let { label, value, delta = null, note, invert = false, icon = 'chart', loading = false }: Props = $props();

	let good = $derived(delta === null ? null : (invert ? delta < 0 : delta > 0));
	let pillClass = $derived(
		delta === null || delta === 0
			? ' bg-black/[0.04] text-[#737373]'
			: good
				? ' bg-[#ecfdf3] text-[#16a34a]'
				: ' bg-[#fef2f2] text-[#dc2626]'
	);
	let arrow = $derived(delta === null || delta === 0 ? '' : delta > 0 ? '▲' : '▼');
</script>

<div class={CARD + ' flex flex-col gap-2 p-4'}>
	<div class="flex items-center justify-between gap-2">
		<p class="text-[13px] font-medium text-[#737373]">{label}</p>
		{#if icon}
			<span class="grid size-7 place-items-center rounded-lg bg-[#f7f7f7] text-[#737373] shadow-[0_0_0_1px_#ececec]">
				<Icon name={icon} size={15} />
			</span>
		{/if}
	</div>
	{#key value}
		<p class="enter-num font-mono text-[26px] font-medium leading-none tracking-[-0.02em] text-[#171717] tabular-nums">{value}</p>
	{/key}
	<div class="flex min-h-[20px] items-center gap-1.5">
		{#if delta !== null}
			<span class={'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[12px] font-medium ' + pillClass}>{arrow} {fmtSignedPct(delta)}</span>
		{/if}
		{#if note}
			<span class="min-w-0 truncate text-[12px] text-[#a3a3a3]">{note}</span>
		{/if}
	</div>
	{#if loading}
		<div class="skel absolute inset-4 rounded-lg"></div>
	{/if}
</div>

<style>
	.enter-num {
		animation: val-in 200ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	@keyframes val-in {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
	}
	.skel {
		border-radius: 8px;
		background: linear-gradient(90deg, #f5f5f5 0%, #ececec 50%, #f5f5f5 100%);
		background-size: 200% 100%;
		animation: shimmer 1.2s linear infinite;
	}
	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}
</style>
