<script lang="ts">
	import { FAMILY_COLORS, compact, money, type MixRow } from './data';

	type Props = { rows: MixRow[]; height?: number };
	let { rows, height = 220 }: Props = $props();

	const FAMS = ['Enterprise', 'Scale', 'Growth', 'Starter', 'Meridian API', 'Legacy'];
	let visible = $state<Record<string, boolean>>(Object.fromEntries(FAMS.map((f) => [f, true])));
	let showAll = $derived(Object.values(visible).some(Boolean));
	function toggle(fam: string) {
		visible = { ...visible, [fam]: !visible[fam] };
	}

	let wrap = $state<HTMLElement | null>(null);
	let width = $derived(wrap?.clientWidth || 640);
	const padB = 24;
	const padT = 6;
	let ih = $derived(height - padT - padB);
	let n = $derived(rows.length);
	let step = $derived(width / Math.max(1, n));
	let barW = $derived(Math.min(30, step * 0.5));
	let totals = $derived(rows.map((r) => FAMS.filter((f) => visible[f]).reduce((a, f) => a + (r.values[f] ?? 0), 0)));
	let niceMax = $derived.by(() => {
		const raw = Math.max(...totals, 1) * 1.08;
		const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
		let best = mag * 10;
		for (const m of [1, 2, 2.5, 5, 10]) {
			const c = mag * m * Math.ceil(raw / (mag * m));
			if (c >= raw && c < best) best = c;
		}
		return best;
	});
	let hoverIdx = $state<number | null>(null);
	function onMove(e: PointerEvent) {
		const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
		const rel = ((e.clientX - rect.left) / rect.width) * width;
		hoverIdx = Math.max(0, Math.min(n - 1, Math.floor(rel / step)));
	}

	let ys = $derived.by(() => {
		const out: { x: number; segments: { fam: string; y: number; h: number }[] }[] = [];
		rows.forEach((r, i) => {
			let acc = 0;
			const segments = FAMS.filter((f) => visible[f]).map((f) => {
				const h = ((r.values[f] ?? 0) / niceMax) * ih;
				const seg = { fam: f, y: padT + ih - acc - h, h };
				acc += h;
				return seg;
			});
			out.push({ x: i * step + (step - barW) / 2, segments });
		});
		return out;
	});
</script>

<div class="grid grid-cols-1 gap-3">
	<div bind:this={wrap} class="relative w-full" style="height:{height}px">
		{#if showAll}
			<svg width={width} {height} class="block cursor-default" role="img" aria-label="Revenue by plan" onpointermove={onMove} onpointerleave={() => (hoverIdx = null)}>
				{#if hoverIdx !== null}
					<rect x={hoverIdx * step} y={0} width={step} height={height - padB} fill="#f7f7f7" />
				{/if}
				{#each ys as col, i (i)}
					{#each col.segments as seg, s (seg.fam)}
						<rect
							x={col.x}
							y={seg.y}
							width={barW}
							height={Math.max(1.5, seg.h)}
							rx={s === col.segments.length - 1 ? 3 : 0}
							fill={FAMILY_COLORS[seg.fam]}
							opacity={hoverIdx === null || hoverIdx === i ? 1 : 0.45}
						/>
					{/each}
				{/each}
				{#each rows.filter((_, i) => i % Math.ceil(n / 6) === 0 || i === n - 1) as r}
					<text x={Math.min(width - 20, (rows.indexOf(r)) * step + step / 2)} y={height - 6} text-anchor="middle" class="axlabel">{r.label}</text>
				{/each}
			</svg>
			{#if hoverIdx !== null}
				<div class="tip" style="left:{Math.max(100, Math.min(width - 100, hoverIdx * step + step / 2))}px; top:20px; transform:translate(-50%,0)">
					<div class="tip-title">{rows[hoverIdx].label}</div>
					{#each FAMS.filter((f) => visible[f]) as f (f)}
						<div class="tip-row">
							<span class="dot" style="background:{FAMILY_COLORS[f]}"></span>
							<span>{f}</span>
							<strong>{money(rows[hoverIdx].values[f])}</strong>
						</div>
					{/each}
					<div class="tip-delta">Total {compact(totals[hoverIdx])}</div>
				</div>
			{/if}
		{:else}
			<div class="flex h-full flex-col items-center justify-center gap-2 text-center text-[13px] text-[#a3a3a3]">
				No plan selected
				<button class="text-[13px] font-medium text-[#255cd1] hover:underline" onclick={() => (visible = Object.fromEntries(FAMS.map((f) => [f, true])))}>Show all plans</button>
			</div>
		{/if}
	</div>
	<div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
		{#each FAMS as fam (fam)}
			<button
				class="flex h-7 cursor-default select-none items-center gap-1.5 rounded-md px-1.5 text-[12.5px] font-medium outline-none transition-opacity duration-150 hover:bg-black/[0.04] {visible[fam] ? 'text-[#525252]' : 'text-[#c4c4c4]'}"
				onclick={() => toggle(fam)}
			>
				<span class="size-2.5 rounded-[3px]" style="background:{visible[fam] ? FAMILY_COLORS[fam] : '#d9d9d9'}"></span>
				{fam}
			</button>
		{/each}
	</div>
</div>

<style>
	.axlabel {
		font-size: 10.5px;
		font-weight: 500;
		fill: #a3a3a3;
	}
	.tip {
		position: absolute;
		background: #1a1a1a;
		color: #fff;
		border-radius: 10px;
		padding: 8px 10px;
		min-width: 170px;
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
		border-radius: 3px;
	}
	.tip-delta {
		margin-top: 4px;
		padding-top: 4px;
		border-top: 1px solid rgb(255 255 255 / 0.12);
		font-size: 11px;
		color: #b3b3b3;
		font-variant-numeric: tabular-nums;
	}
	@keyframes tip-in {
		from {
			opacity: 0;
			scale: 0.97;
		}
	}
</style>
