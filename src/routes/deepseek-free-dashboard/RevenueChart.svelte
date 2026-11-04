<script lang="ts">
	import { money, type ChartPoint } from './data';

	type Props = {
		data: ChartPoint[];
		compareData?: ChartPoint[];
		compare?: boolean;
		height?: number;
		seriesLabel?: string;
	};
	let {
		data,
		compareData = [],
		compare = false,
		height = 234,
		seriesLabel = 'Net revenue'
	}: Props = $props();

	let width = $state(0);
	let hover = $state<number | null>(null);

	const pad = { top: 14, right: 8, bottom: 28, left: 46 };

	const innerW = $derived(Math.max(0, width - pad.left - pad.right));
	const innerH = $derived(height - pad.top - pad.bottom);
	const count = $derived(data.length);

	function niceMax(value: number): number {
		if (value <= 0) return 1;
		const pow = Math.pow(10, Math.floor(Math.log10(value)));
		const n = value / pow;
		const steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
		const step = steps.find((candidate) => n <= candidate) ?? 10;
		return step * pow;
	}

	const maxValue = $derived.by(() => {
		const values = data.map((d) => d.net);
		if (compare) values.push(...compareData.map((d) => d.net));
		return niceMax(Math.max(1, ...values) * 1.02);
	});

	const ticks = $derived(
		[0, 1 / 3, 2 / 3, 1].map((t) => ({
			value: maxValue * t,
			y: pad.top + innerH - t * innerH
		}))
	);

	function xAt(i: number): number {
		if (count <= 1) return pad.left + innerW / 2;
		return pad.left + (i / (count - 1)) * innerW;
	}

	function yAt(v: number): number {
		return pad.top + innerH - (v / maxValue) * innerH;
	}

	function linePath(points: ChartPoint[]): string {
		if (!points.length) return '';
		return points
			.map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)} ${yAt(p.net).toFixed(1)}`)
			.join(' ');
	}

	const mainPath = $derived(linePath(data));
	const prevPath = $derived(compare ? linePath(compareData) : '');
	const areaPath = $derived.by(() => {
		if (!data.length || !innerW) return '';
		const lastX = xAt(data.length - 1);
		const firstX = xAt(0);
		const base = pad.top + innerH;
		return `${mainPath} L${lastX.toFixed(1)} ${base} L${firstX.toFixed(1)} ${base} Z`;
	});

	const labelIndices = $derived.by(() => {
		if (!count) return [] as number[];
		const maxLabels = innerW > 0 ? Math.max(2, Math.min(6, Math.floor(innerW / 96))) : 4;
		const step = Math.max(1, Math.round((count - 1) / (maxLabels - 1)));
		const idx: number[] = [];
		for (let i = 0; i < count; i += step) idx.push(i);
		if (idx[idx.length - 1] !== count - 1) idx.push(count - 1);
		return idx;
	});

	const hoverPoint = $derived(hover !== null ? data[hover] : null);
	const hoverPrev = $derived(hover !== null ? compareData[hover] : undefined);
	const hoverX = $derived(hover !== null ? xAt(hover) : 0);
	const hoverY = $derived(hoverPoint ? yAt(hoverPoint.net) : 0);

	const tipLeft = $derived(
		Math.min(Math.max(hoverX, 84), Math.max(84, width - 84))
	);
	const tipTop = $derived(hoverY < 100 ? hoverY + 18 : hoverY - 12);
	const tipBelow = $derived(hoverY < 100);

	const delta = $derived(
		hoverPoint && hoverPrev && hoverPrev.net > 0
			? ((hoverPoint.net - hoverPrev.net) / hoverPrev.net) * 100
			: null
	);

	function onPointerMove(event: PointerEvent) {
		const svg = (event.currentTarget as SVGRectElement).ownerSVGElement;
		if (!svg || !count) return;
		const rect = svg.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const rel = (x - pad.left) / Math.max(1, innerW);
		const idx = Math.round(rel * (count - 1));
		hover = Math.max(0, Math.min(count - 1, idx));
	}

	function axisMoney(v: number): string {
		if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
		if (v >= 1000) return '$' + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(/\.0$/, '') + 'k';
		return '$' + Math.round(v);
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		if (hover === null) {
			hover = event.key === 'ArrowLeft' ? 0 : count - 1;
			return;
		}
		hover = Math.min(count - 1, Math.max(0, hover + (event.key === 'ArrowRight' ? 1 : -1)));
	}
</script>

<div
	class="chart"
	bind:clientWidth={width}
	role="img"
	tabindex="0"
	aria-label="{seriesLabel} over {count} points. Use the left and right arrow keys to inspect each value."
	onkeydown={onKeydown}
	onblur={() => (hover = null)}
>
	{#if width > 20}
		<svg width={width} height={height} viewBox="0 0 {width} {height}" aria-hidden="true">
			<defs>
				<linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#255cd1" stop-opacity="0.13" />
					<stop offset="100%" stop-color="#255cd1" stop-opacity="0" />
				</linearGradient>
			</defs>

			{#each ticks as tick}
				<line
					x1={pad.left}
					x2={width - pad.right}
					y1={tick.y}
					y2={tick.y}
					class="grid"
					class:base={tick.value === 0}
				/>
				<text x={pad.left - 10} y={tick.y + 3.5} class="axis" text-anchor="end">
					{axisMoney(tick.value)}
				</text>
			{/each}

			{#if compare && prevPath}
				<path d={prevPath} class="prev-line" />
			{/if}

			{#if areaPath}
				<path d={areaPath} fill="url(#chart-fill)" />
			{/if}
			<path d={mainPath} class="main-line" />

			{#if hoverPoint}
				<line x1={hoverX} x2={hoverX} y1={pad.top} y2={pad.top + innerH} class="crosshair" />
				{#if hoverPrev}
					<circle cx={hoverX} cy={yAt(hoverPrev.net)} r="3" class="prev-dot" />
				{/if}
				<circle cx={hoverX} cy={hoverY} r="4.5" class="hover-dot" />
			{/if}

			{#each labelIndices as idx, pos}
				<text
					x={xAt(idx)}
					y={height - 8}
					class="x-label"
					text-anchor={pos === 0 ? 'start' : idx === count - 1 ? 'end' : 'middle'}
				>
					{data[idx].label}
				</text>
			{/each}

			<rect
				x={pad.left}
				y={pad.top}
				width={innerW}
				height={innerH}
				fill="transparent"
				onpointermove={onPointerMove}
				onpointerleave={() => (hover = null)}
			/>
		</svg>

		{#if hoverPoint}
			<div
				class="tip"
				class:below={tipBelow}
				style="left:{tipLeft}px; top:{tipTop}px"
				aria-hidden="true"
			>
				<div class="tip-date">{hoverPoint.fullLabel}</div>
				<div class="tip-row">
					<span class="swatch"></span>
					<span>{seriesLabel}</span>
					<strong>{money(hoverPoint.net)}</strong>
				</div>
				{#if compare && hoverPrev}
					<div class="tip-row sub">
						<span class="swatch prev"></span>
						<span>Previous</span>
						<strong>{money(hoverPrev.net)}</strong>
					</div>
					{#if delta !== null}
						<div class="tip-delta" class:up={delta >= 0} class:down={delta < 0}>
							{delta >= 0 ? '▲' : '▼'}
							{Math.abs(delta).toFixed(1)}% vs previous
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	{/if}

	<span class="sr-only" aria-live="polite">
		{#if hoverPoint}{hoverPoint.fullLabel}: {money(hoverPoint.net)}{/if}
	</span>
</div>

<style>
	.chart {
		position: relative;
		width: 100%;
		border-radius: 10px;
		outline: none;
	}
	.chart:focus-visible {
		box-shadow: 0 0 0 2px #fff, 0 0 0 4px color-mix(in oklab, #255cd1, transparent 55%);
	}
	svg {
		display: block;
		overflow: visible;
	}
	.grid {
		stroke: #f1f1f1;
		stroke-width: 1;
	}
	.grid.base {
		stroke: #e8e8e8;
	}
	.axis {
		font-size: 10.5px;
		fill: var(--fg3);
		font-variant-numeric: tabular-nums;
	}
	.x-label {
		font-size: 10.5px;
		fill: var(--fg3);
		font-variant-numeric: tabular-nums;
	}
	.main-line {
		fill: none;
		stroke: #255cd1;
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.prev-line {
		fill: none;
		stroke: #c9c9c9;
		stroke-width: 1.6;
		stroke-dasharray: 4 4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.crosshair {
		stroke: #d4d4d4;
		stroke-width: 1;
		stroke-dasharray: 3 3;
	}
	.hover-dot {
		fill: #255cd1;
		stroke: #fff;
		stroke-width: 2;
	}
	.prev-dot {
		fill: #c9c9c9;
		stroke: #fff;
		stroke-width: 1.5;
	}
	.tip {
		position: absolute;
		transform: translate(-50%, -100%);
		background: #171717;
		color: #fafafa;
		border-radius: 10px;
		padding: 9px 11px 10px;
		box-shadow: 0 8px 24px -6px rgb(0 0 0 / 0.3);
		width: max-content;
		max-width: 210px;
		pointer-events: none;
		z-index: 5;
		animation: tip-in 120ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.tip.below {
		transform: translate(-50%, 0);
	}
	@keyframes tip-in {
		from {
			opacity: 0;
			transform: translate(-50%, calc(-100% + 4px));
		}
	}
	.tip.below {
		animation-name: tip-in-below;
	}
	@keyframes tip-in-below {
		from {
			opacity: 0;
			transform: translate(-50%, -4px);
		}
	}
	.tip-date {
		font-size: 11.5px;
		color: #a3a3a3;
		margin-bottom: 6px;
		white-space: nowrap;
	}
	.tip-row {
		display: grid;
		grid-template-columns: 7px 1fr auto;
		align-items: center;
		gap: 7px;
		font-size: 12.5px;
		line-height: 1.5;
	}
	.tip-row + .tip-row {
		margin-top: 2px;
	}
	.tip-row span:nth-child(2) {
		color: #d4d4d4;
	}
	.tip-row strong {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.tip-row.sub strong {
		color: #d4d4d4;
		font-weight: 500;
	}
	.swatch {
		width: 7px;
		height: 7px;
		border-radius: 2px;
		background: #6c8fe8;
	}
	.swatch.prev {
		background: #6b6b6b;
		border-radius: 50%;
	}
	.tip-delta {
		margin-top: 7px;
		padding-top: 7px;
		border-top: 1px solid rgb(255 255 255 / 0.12);
		font-size: 11.5px;
		color: #a3a3a3;
	}
	.tip-delta.up {
		color: #86efac;
	}
	.tip-delta.down {
		color: #fca5a5;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	@media (prefers-reduced-motion: reduce) {
		.tip {
			animation: none;
		}
	}
	@media (max-width: 700px) {
		.axis,
		.x-label {
			font-size: 10px;
		}
	}
</style>
