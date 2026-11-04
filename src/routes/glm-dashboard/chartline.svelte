<script lang="ts">
	import { compact, num, money, type Bucket } from './data';

	type Props = { buckets: Bucket[]; unit: '$' | '#'; height?: number };
	let { buckets, unit, height = 240 }: Props = $props();

	let wrap = $state<HTMLElement | null>(null);
	const padL = 52;
	const padR = 12;
	const padT = 10;
	const padB = 26;
	let width = $derived(wrap?.clientWidth || 800);
	let iw = $derived(Math.max(60, width - padL - padR));
	let ih = $derived(height - padT - padB);
	let baseY = $derived(padT + ih);

	let vals = $derived(buckets.map((b) => b.value).concat(buckets.map((b) => b.prev ?? 0)));
	let niceMax = $derived.by(() => {
		const raw = Math.max(...vals, 1) * 1.08;
		const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
		let best = mag * 10;
		for (const m of [1, 2, 2.5, 5, 10]) {
			const c = mag * m * Math.ceil(raw / (mag * m));
			if (c >= raw && c < best) best = c;
		}
		return best;
	});
	let n = $derived(buckets.length);
	let x = $derived(
		buckets.map((_, i) => padL + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw))
	);
	let y = $derived(buckets.map((b) => padT + ih * (1 - b.value / niceMax)));
	let linePath = $derived(buckets.length >= 2 ? buckets.map((_, i) => `${i === 0 ? 'M' : 'L'}${x[i].toFixed(1)} ${y[i].toFixed(1)}`).join(' ') : '');
	let areaPath = $derived(
		buckets.length >= 2
			? `${linePath} L${x[n - 1].toFixed(1)} ${baseY} L${x[0].toFixed(1)} ${baseY} Z`
			: ''
	);
	let prevPts = $derived(
		buckets.map((b, i) => (b.prev == null ? null : { px: x[i], py: padT + ih * (1 - b.prev / niceMax) }))
	);
	let prevPath = $derived(
		prevPts.filter((p) => p !== null).length >= 2
			? prevPts
					.filter((p) => p !== null)
					.map((p, i) => `${i === 0 ? 'M' : 'L'}${p!.px.toFixed(1)} ${p!.py.toFixed(1)}`)
					.join(' ')
			: ''
	);
	let labelEvery = $derived(Math.max(1, Math.ceil(n / 6)));
	let ticks = $derived([0, 1, 2, 3, 4].map((i) => baseY - (ih * i) / 4));

	// hover
	let hover = $state<number | null>(null);
	let hoverX = $derived(hover !== null ? x[hover] : 0);
	let hoverY = $derived(hover !== null ? y[hover] : 0);
	function onMove(e: PointerEvent) {
		const svg = e.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		const rel = ((e.clientX - rect.left) / rect.width) * width;
		let i = Math.round(((rel - padL) / iw) * (n - 1));
		hover = Math.max(0, Math.min(n - 1, i));
	}

	function fmtVal(v: number) {
		return unit === '$' ? compact(v) : num(Math.round(v));
	}
	function deltaText(b: Bucket) {
		if (b.prev == null || b.prev === 0) return '';
		const d = ((b.value - b.prev) / b.prev) * 100;
		return `${d > 0 ? '▲' : d < 0 ? '▼' : ''} ${Math.abs(d).toFixed(1)}%`;
	}

	// brief skeleton on data change (skip first paint)
	let primed = false;
	let loading = $state(false);
	$effect(() => {
		void buckets;
		if (!primed) {
			primed = true;
			return;
		}
		loading = true;
		const t = setTimeout(() => (loading = false), 240);
		return () => clearTimeout(t);
	});
</script>

<div bind:this={wrap} class="relative w-full" style="height:{height}px">
	{#if buckets.length >= 2}
		<svg
			width={width}
			{height}
			onpointermove={onMove}
			onpointerleave={() => (hover = null)}
			class="block {loading ? 'opacity-40 transition-opacity duration-150' : 'opacity-100'}"
			role="img"
			aria-label="Chart"
		>
			<defs>
				<linearGradient id="mc-area" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#255cd1" stop-opacity="0.14" />
					<stop offset="100%" stop-color="#255cd1" stop-opacity="0" />
				</linearGradient>
			</defs>
			{#each ticks as ty (ty)}
				<line x1={padL} x2={padL + iw} y1={ty} y2={ty} stroke="#f0f0f0" stroke-dasharray={ty === baseY ? '' : '3 4'} />
				<text x={padL - 10} y={ty + 4} text-anchor="end" class="axlabel">{fmtVal((niceMax * (baseY - ty)) / ih)}</text>
			{/each}
			{#each buckets as b, i (b.t + '-' + i)}
				{#if hover === i}
					<line x1={x[i]} x2={x[i]} y1={padT} y2={baseY} stroke="#d4d4d4" stroke-dasharray="3 3" />
				{/if}
				{#if i % labelEvery === 0 && (n - 1 - i) >= labelEvery / 2 || i === n - 1}
					<text x={x[i]} y={baseY + 18} text-anchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} class="axlabel">{b.label}</text>
				{/if}
			{/each}
			{#if prevPath}
				<path d={prevPath} fill="none" stroke="#c2c2c8" stroke-width="1.5" stroke-dasharray="4 4" />
			{/if}
			{#if areaPath}
				<path d={areaPath} fill="url(#mc-area)" />
				<path d={linePath} fill="none" stroke="#255cd1" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" />
			{/if}
			{#if hover !== null}
				<circle cx={hoverX} cy={hoverY} r="3.5" fill="#255cd1" stroke="#fff" stroke-width="2" />
			{/if}
		</svg>
		{#if hover !== null}
			<div
				class="tip"
				style="left:{Math.max(84, Math.min(width - 84, hoverX))}px; top:{Math.max(hoverY, 78)}px"
			>
				<div class="tip-title">{buckets[hover].label}</div>
				<div class="tip-row">
					<span class="dot"></span>
					<span>Current</span>
					<strong>{unit === '$' ? money(buckets[hover].value, buckets[hover].value < 1000) : num(Math.round(buckets[hover].value))}</strong>
				</div>
				{#if buckets[hover].prev != null}
					<div class="tip-row">
						<span class="dot dot-prev"></span>
						<span>Previous</span>
						<strong>{unit === '$' ? money(buckets[hover].prev!) : num(Math.round(buckets[hover].prev!))}</strong>
					</div>
				{/if}
				{#if deltaText(buckets[hover])}
					<div class="tip-delta">{deltaText(buckets[hover])} vs previous period</div>
				{/if}
			</div>
		{/if}
		{#if loading}
			<div class="skel absolute" style="left:{padL}px; top:{padT}px; width:{iw}px; height:{ih}px"></div>
		{/if}
	{:else}
		<div class="grid h-full place-items-center text-[13px] text-[#a3a3a3]">Pick a wider range to chart this metric</div>
	{/if}
</div>

<style>
	.axlabel {
		font-size: 10.5px;
		font-weight: 500;
		fill: #a3a3a3;
		font-variant-numeric: tabular-nums;
	}
	.tip {
		position: absolute;
		transform: translate(-50%, calc(-100% - 12px));
		background: #1a1a1a;
		color: #fff;
		border-radius: 10px;
		padding: 8px 10px;
		min-width: 168px;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.1), 0 12px 28px -8px rgb(0 0 0 / 0.4);
		pointer-events: none;
		animation: tip-in 140ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.tip-title {
		font-size: 12px;
		font-weight: 600;
		margin-bottom: 4px;
	}
	.tip-row {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: #b3b3b3;
	}
	.tip-row strong {
		margin-left: auto;
		color: #fff;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #5b7ff0;
	}
	.dot-prev {
		background: transparent;
		box-shadow: inset 0 0 0 1.5px #b3b3b3;
	}
	.tip-delta {
		margin-top: 4px;
		padding-top: 4px;
		border-top: 1px solid rgb(255 255 255 / 0.12);
		font-size: 11px;
		color: #b3b3b3;
	}
	@keyframes tip-in {
		from {
			opacity: 0;
			transform: translate(-50%, calc(-100% - 8px)) scale(0.97);
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
