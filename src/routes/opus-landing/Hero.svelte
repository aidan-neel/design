<script lang="ts">
	import { onMount } from 'svelte';
	import { NOW_SLOT, PRICES, slotLabel } from './data';
	import Icon from './Icon.svelte';
	import { useRegion } from './region.svelte';
	import {
		defaultJobs,
		describeSlots,
		footprint,
		habitSlots,
		planJob,
		sumFootprints
	} from './schedule';
	import { prefersReducedMotion, scrollToSection } from './sections';

	const region = useRegion();

	/** The hero chart shows 16:00 to 08:00. */
	const CHART_SLOTS = 32;
	const WIDTH = 560;
	const HEIGHT = 168;
	const PRICE_CEILING = 48;
	const MAX_PARALLAX_PX = 40;

	const plan = defaultJobs().map((job) => {
		const slots = planJob(job, 'cost');
		return { job, slots, footprint: footprint(job.appliance, slots) };
	});
	const planned = sumFootprints(plan.map((entry) => entry.footprint));
	const habit = sumFootprints(defaultJobs().map((job) => footprint(job.appliance, habitSlots(job))));
	const savedPercent = Math.round((1 - planned.cost / habit.cost) * 100);
	const plannedSlots = new Set(plan.flatMap((entry) => entry.slots));

	const step = WIDTH / CHART_SLOTS;
	const points = PRICES.slice(0, CHART_SLOTS).map((price, slot) => ({
		x: (slot + 0.5) * step,
		y: HEIGHT - 12 - (price / PRICE_CEILING) * (HEIGHT - 28)
	}));
	const linePath = smoothPath(points);
	const areaPath = `${linePath} L${points[points.length - 1].x},${HEIGHT} L${points[0].x},${HEIGHT} Z`;

	let hoveredSlot = $state<number | null>(null);
	let parallax = $state(0);

	const readoutSlot = $derived(hoveredSlot ?? NOW_SLOT);

	onMount(() => {
		if (prefersReducedMotion()) return;
		let frame = 0;
		const update = () => {
			frame = 0;
			parallax = Math.min(window.scrollY * 0.08, MAX_PARALLAX_PX);
		};
		const schedule = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		window.addEventListener('scroll', schedule, { passive: true });
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('scroll', schedule);
		};
	});

	/** Catmull-Rom through the points, converted to cubic Béziers. */
	function smoothPath(list: { x: number; y: number }[]): string {
		let path = `M${list[0].x},${list[0].y}`;
		for (let index = 0; index < list.length - 1; index++) {
			const previous = list[index - 1] ?? list[index];
			const current = list[index];
			const next = list[index + 1];
			const after = list[index + 2] ?? next;
			const c1x = current.x + (next.x - previous.x) / 6;
			const c1y = current.y + (next.y - previous.y) / 6;
			const c2x = next.x - (after.x - current.x) / 6;
			const c2y = next.y - (after.y - current.y) / 6;
			path += ` C${c1x},${c1y} ${c2x},${c2y} ${next.x},${next.y}`;
		}
		return path;
	}

	function scrub(event: PointerEvent) {
		const box = (event.currentTarget as SVGElement).getBoundingClientRect();
		const ratio = (event.clientX - box.left) / box.width;
		hoveredSlot = Math.min(CHART_SLOTS - 1, Math.max(0, Math.floor(ratio * CHART_SLOTS)));
	}
</script>

<section class="hero" id="ebb-top" aria-labelledby="hero-title">
	<div class="container grid">
		<div class="copy">
			<p class="badge reveal" style:--i="0">
				<span class="badge-dot" aria-hidden="true"></span>
				Hub v1 ships January 2027
			</p>
			<h1 id="hero-title" class="reveal" style:--i="1">Run your home on the cheapest hours.</h1>
			<p class="lede reveal" style:--i="2">
				Ebb is a small hub and an app. It moves car charging, heating and laundry to the hours when
				power is cheap and clean, and still has everything ready when you need it.
			</p>
			<div class="ctas reveal" style:--i="3">
				<a
					class="btn btn-ink btn-lg"
					href="#reserve"
					onclick={(event) => {
						event.preventDefault();
						scrollToSection('reserve');
					}}
				>
					Reserve a hub
					<span class="cta-price num">{region.money(149, 0)}</span>
				</a>
				<a
					class="text-link"
					href="#planner"
					onclick={(event) => {
						event.preventDefault();
						scrollToSection('planner');
					}}
				>
					Try the planner
					<Icon name="arrow-down" size={16} />
				</a>
			</div>

			<dl class="facts reveal" style:--i="4">
				<div>
					<dt>Cheaper tonight</dt>
					<dd class="num">{savedPercent}%</dd>
				</div>
				<div>
					<dt>To install</dt>
					<dd class="num">20 min</dd>
				</div>
				<div>
					<dt>Needs internet</dt>
					<dd class="num">No</dd>
				</div>
			</dl>
		</div>

		<div class="visual" style:transform="translateY({-parallax}px)">
			<article class="panel reveal" style:--i="2" aria-label="Sample plan for tonight">
				<header class="panel-head">
					<div>
						<p class="panel-title">Tonight</p>
						<p class="panel-meta">Wed, Nov 4 · sample prices</p>
					</div>
					<span class="tag tag-accent">
						<Icon name="check" size={12} />
						Plan ready
					</span>
				</header>

				<div class="totals">
					<p class="total">
						<span class="num total-value">{region.money(planned.cost)}</span>
						<span class="total-label">planned</span>
					</p>
					<p class="total muted">
						<span class="num">{region.money(habit.cost)}</span>
						<span class="total-label">without Ebb</span>
					</p>
				</div>

				<div class="chart">
					<div class="readout" aria-live="polite">
						<span class="num readout-time">{slotLabel(readoutSlot)}</span>
						<span class="num readout-price">{region.unitPrice(PRICES[readoutSlot])}/kWh</span>
						{#if hoveredSlot === null}
							<span class="readout-note">now</span>
						{:else if plannedSlots.has(hoveredSlot)}
							<span class="readout-note is-planned">Ebb runs here</span>
						{/if}
					</div>
					<svg
						viewBox="0 0 {WIDTH} {HEIGHT}"
						role="img"
						aria-label="Price per kWh from 16:00 to 08:00. Prices peak around 18:00 and are lowest from 01:00 to 04:00."
						onpointermove={scrub}
						onpointerleave={() => (hoveredSlot = null)}
					>
						<defs>
							<clipPath id="hero-planned-clip">
								{#each [...plannedSlots] as slot (slot)}
									<rect x={slot * step} y="0" width={step + 0.5} height={HEIGHT} />
								{/each}
							</clipPath>
						</defs>
						{#each [0.25, 0.5, 0.75] as line (line)}
							<line class="gridline" x1="0" x2={WIDTH} y1={HEIGHT * line} y2={HEIGHT * line} />
						{/each}
						<path class="area" d={areaPath} />
						<path class="area-planned" d={areaPath} clip-path="url(#hero-planned-clip)" />
						<path class="line" d={linePath} pathLength="1" />
						<line
							class="now"
							x1={(readoutSlot + 0.5) * step}
							x2={(readoutSlot + 0.5) * step}
							y1="0"
							y2={HEIGHT}
						/>
						<circle
							class="dot"
							cx={points[readoutSlot].x}
							cy={points[readoutSlot].y}
							r="4.5"
						/>
					</svg>
					<div class="axis num" aria-hidden="true">
						{#each [0, 8, 16, 24, 32] as slot (slot)}
							<span>{slotLabel(slot)}</span>
						{/each}
					</div>
				</div>

				<ul class="jobs">
					{#each plan as entry, index (entry.job.appliance.id)}
						<li class="job" style:--i={index + 4}>
							<span class="job-icon"><Icon name={entry.job.appliance.icon} size={16} /></span>
							<span class="job-name">{entry.job.appliance.name}</span>
							<span class="job-time num">{describeSlots(entry.slots)}</span>
							<span class="job-cost num">{region.money(entry.footprint.cost)}</span>
						</li>
					{/each}
				</ul>
			</article>
		</div>
	</div>
</section>

<style>
	.hero {
		padding: 120px 0 72px;
		scroll-margin-top: 0;
	}
	@media (min-width: 1024px) {
		.hero {
			padding: 152px 0 112px;
		}
	}
	.grid {
		display: grid;
		gap: 56px;
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
			align-items: center;
			gap: 64px;
		}
	}

	.badge {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 28px;
		margin: 0;
		padding: 0 12px 0 10px;
		border-radius: 999px;
		background: var(--bg);
		box-shadow: var(--shadow-btn);
		color: var(--fg-2);
		font-size: 13px;
		font-weight: 500;
	}
	.badge-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}

	h1 {
		margin: 24px 0 0;
		font-size: clamp(44px, 6.2vw, 80px);
		font-weight: 500;
		line-height: 0.98;
		letter-spacing: -0.055em;
		text-wrap: balance;
	}
	.lede {
		margin: 24px 0 0;
		max-width: 480px;
		color: var(--fg-2);
		font-size: 18px;
		line-height: 1.5;
		text-wrap: pretty;
	}

	.ctas {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 24px;
		margin-top: 32px;
	}
	.cta-price {
		padding-left: 10px;
		margin-left: 2px;
		border-left: 1px solid rgb(255 255 255 / 0.2);
		color: rgb(255 255 255 / 0.7);
		font-size: 14px;
	}
	.text-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 44px;
		color: var(--fg);
		font-size: 15px;
		font-weight: 500;
		text-decoration: none;
		border-radius: 8px;
	}
	.text-link :global(svg) {
		color: var(--fg-2);
		transition: transform 200ms var(--ease-out);
	}
	@media (hover: hover) {
		.text-link:hover :global(svg) {
			transform: translateY(2px);
		}
	}

	.facts {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		max-width: 480px;
		margin: 48px 0 0;
		border-top: 1px solid var(--border);
	}
	.facts div {
		padding-top: 16px;
	}
	.facts div + div {
		padding-left: 16px;
	}
	.facts dt {
		color: var(--fg-2);
		font-size: 13px;
	}
	.facts dd {
		margin: 4px 0 0;
		font-size: 22px;
		font-weight: 500;
	}

	.visual {
		will-change: transform;
	}
	.panel {
		padding: 20px;
		border-radius: 24px;
		background: var(--bg);
		box-shadow: var(--shadow-panel);
	}
	@media (min-width: 640px) {
		.panel {
			padding: 24px;
		}
	}
	.panel-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
	}
	.panel-title {
		margin: 0;
		font-size: 16px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.panel-meta {
		margin: 2px 0 0;
		color: var(--fg-2);
		font-size: 13px;
	}

	.totals {
		display: flex;
		align-items: baseline;
		gap: 16px;
		margin-top: 20px;
	}
	.total {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin: 0;
	}
	.total-value {
		font-size: 36px;
		font-weight: 500;
		letter-spacing: -0.04em;
	}
	.total-label {
		color: var(--fg-2);
		font-size: 13px;
	}
	.total.muted .num {
		color: var(--fg-2);
		font-size: 15px;
		text-decoration: line-through;
		text-decoration-color: var(--fg-3);
	}

	.chart {
		position: relative;
		margin-top: 16px;
	}
	.readout {
		display: flex;
		align-items: baseline;
		gap: 8px;
		height: 20px;
		font-size: 13px;
	}
	.readout-time {
		color: var(--fg);
	}
	.readout-price {
		color: var(--fg-2);
	}
	.readout-note {
		color: var(--fg-3);
	}
	.readout-note.is-planned {
		color: var(--accent);
		font-weight: 500;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
		margin-top: 8px;
		overflow: visible;
		touch-action: pan-y;
	}
	.gridline {
		stroke: var(--border);
		stroke-dasharray: 2 4;
	}
	.area {
		fill: #f4f4f4;
	}
	.area-planned {
		fill: var(--accent);
		opacity: 0.85;
		animation: fade 600ms var(--ease-out) 900ms backwards;
	}
	.line {
		fill: none;
		stroke: var(--fg);
		stroke-width: 1.75;
		stroke-dasharray: 1;
		animation: draw 1200ms var(--ease-in-out) 300ms backwards;
	}
	.now {
		stroke: var(--fg-3);
		stroke-dasharray: 3 3;
	}
	.dot {
		fill: var(--bg);
		stroke: var(--fg);
		stroke-width: 1.75;
	}
	.axis {
		display: flex;
		justify-content: space-between;
		margin-top: 8px;
		color: var(--fg-3);
		font-size: 11px;
	}

	.jobs {
		margin: 16px 0 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid var(--border);
	}
	.job {
		display: grid;
		grid-template-columns: 28px minmax(0, 1fr) auto;
		grid-template-areas: 'icon name cost' 'icon time cost';
		align-items: center;
		column-gap: 12px;
		padding: 10px 0;
		border-bottom: 1px solid var(--border);
		animation: rise 500ms var(--ease-out) backwards;
		animation-delay: calc(var(--i) * 60ms + 500ms);
	}
	.job:last-child {
		border-bottom: 0;
		padding-bottom: 0;
	}
	@media (min-width: 640px) {
		.job {
			grid-template-columns: 28px 120px minmax(0, 1fr) auto;
			grid-template-areas: 'icon name time cost';
		}
	}
	.job-icon {
		grid-area: icon;
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 8px;
		background: var(--bg-canvas);
		box-shadow: inset 0 0 0 1px var(--border);
		color: var(--fg-2);
	}
	.job-name {
		grid-area: name;
		font-size: 14px;
		font-weight: 500;
	}
	.job-time {
		grid-area: time;
		color: var(--fg-2);
		font-size: 12px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.job-cost {
		grid-area: cost;
		font-size: 14px;
	}

	.reveal {
		animation: rise 700ms var(--ease-out) backwards;
		animation-delay: calc(var(--i) * 70ms + 60ms);
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(12px);
			filter: blur(4px);
		}
	}
	@keyframes draw {
		from {
			stroke-dashoffset: 1;
		}
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
	}
</style>
