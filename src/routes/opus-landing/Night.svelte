<script lang="ts">
	import { onMount } from 'svelte';
	import { APPLIANCES, NIGHT_STEPS, PRICES, slotLabel } from './data';
	import { useRegion } from './region.svelte';
	import { contiguousSlots, habitSlots, planJob, type Job } from './schedule';
	import { prefersReducedMotion } from './sections';

	const region = useRegion();

	const START_SLOT = 2;
	const END_SLOT = 32;
	const SLOT_COUNT = 48;
	const HOUSE_KWH_PER_SLOT = 0.5;
	const BATTERY_KWH_PER_SLOT = 2.5;

	const SIZE = 480;
	const CENTER = SIZE / 2;
	const BAR_INNER = 150;
	const BAR_MAX = 46;
	const PRICE_CEILING = 44;
	/** The hand starts outside the lanes so it never crosses the clock readout. */
	const HAND_INNER = 140;

	type Lane = {
		label: string;
		radius: number;
		slots: number[];
		kind: 'grid' | 'battery';
		kwhPerSlot: number;
	};

	const jobFor = (id: string): Job => {
		const appliance = APPLIANCES.find((candidate) => candidate.id === id);
		if (!appliance) throw new Error(`Unknown appliance "${id}"`);
		return { appliance, readyBy: 30 };
	};
	const car = jobFor('car');
	const dishwasher = jobFor('dishwasher');
	const heatpump = jobFor('heatpump');

	const lanes: Lane[] = [
		{ label: 'Car', radius: 130, slots: planJob(car, 'cost'), kind: 'grid', kwhPerSlot: car.appliance.kwhPerSlot },
		{ label: 'Dishwasher', radius: 116, slots: planJob(dishwasher, 'cost'), kind: 'grid', kwhPerSlot: dishwasher.appliance.kwhPerSlot },
		{ label: 'Heat pump', radius: 102, slots: planJob(heatpump, 'cost'), kind: 'grid', kwhPerSlot: heatpump.appliance.kwhPerSlot },
		{ label: 'Battery charging', radius: 88, slots: contiguousSlots(21, 4), kind: 'grid', kwhPerSlot: BATTERY_KWH_PER_SLOT },
		{ label: 'Battery to house', radius: 88, slots: [...contiguousSlots(3, 6), ...contiguousSlots(30, 3)], kind: 'battery', kwhPerSlot: 0 }
	];

	/** Cumulative dollars spent by the end of each slot, with Ebb and on autopilot. */
	const spend = buildSpend();

	let track = $state<HTMLElement>();
	let progress = $state(0);

	const currentSlot = $derived(START_SLOT + progress * (END_SLOT - START_SLOT));
	const wholeSlot = $derived(Math.min(SLOT_COUNT - 1, Math.floor(currentSlot)));
	const activeStepIndex = $derived(
		NIGHT_STEPS.reduce((active, step, index) => (currentSlot >= step.slot ? index : active), 0)
	);
	const running = $derived(lanes.filter((lane) => lane.slots.includes(wholeSlot)));
	const isOnBattery = $derived(running.some((lane) => lane.kind === 'battery'));
	const spentWithEbb = $derived(spend.withEbb[wholeSlot] - spend.withEbb[START_SLOT - 1]);
	const spentOnAutopilot = $derived(spend.autopilot[wholeSlot] - spend.autopilot[START_SLOT - 1]);
	const hand = $derived(polar(currentSlot, BAR_INNER + BAR_MAX + 8));
	const handBase = $derived(polar(currentSlot, HAND_INNER));

	onMount(() => {
		let frame = 0;
		const update = () => {
			frame = 0;
			if (!track) return;
			const box = track.getBoundingClientRect();
			const scrollable = box.height - window.innerHeight;
			progress = scrollable > 0 ? Math.min(1, Math.max(0, -box.top / scrollable)) : 0;
		};
		const schedule = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		update();
		window.addEventListener('scroll', schedule, { passive: true });
		window.addEventListener('resize', schedule);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', schedule);
		};
	});

	function buildSpend() {
		const withEbb: number[] = [];
		const autopilot: number[] = [];
		const batterySlots = new Set(lanes.find((lane) => lane.kind === 'battery')?.slots);
		const habitLoads = [car, dishwasher, heatpump].map((job) => ({
			slots: new Set(habitSlots(job)),
			kwh: job.appliance.kwhPerSlot
		}));

		let ebbTotal = 0;
		let autopilotTotal = 0;
		for (let slot = 0; slot < SLOT_COUNT; slot++) {
			const dollarsPerKwh = PRICES[slot] / 100;
			const houseKwh = batterySlots.has(slot) ? 0 : HOUSE_KWH_PER_SLOT;
			const ebbKwh = lanes
				.filter((lane) => lane.kind === 'grid' && lane.slots.includes(slot))
				.reduce((sum, lane) => sum + lane.kwhPerSlot, houseKwh);
			const habitKwh = habitLoads
				.filter((load) => load.slots.has(slot))
				.reduce((sum, load) => sum + load.kwh, HOUSE_KWH_PER_SLOT);

			ebbTotal += ebbKwh * dollarsPerKwh;
			autopilotTotal += habitKwh * dollarsPerKwh;
			withEbb.push(ebbTotal);
			autopilot.push(autopilotTotal);
		}
		return { withEbb, autopilot };
	}

	/** Slot 0 is 16:00. The dial puts midnight at the top. */
	function angleFor(slot: number): number {
		const minutesSinceMidnight = (16 * 60 + slot * 30) % 1440;
		return (minutesSinceMidnight / 1440) * Math.PI * 2 - Math.PI / 2;
	}

	function polar(slot: number, radius: number) {
		const angle = angleFor(slot);
		return { x: CENTER + Math.cos(angle) * radius, y: CENTER + Math.sin(angle) * radius };
	}

	function arcPath(radius: number, from: number, to: number): string {
		const start = polar(from, radius);
		const end = polar(to, radius);
		const isLarge = to - from > SLOT_COUNT / 2 ? 1 : 0;
		return `M${start.x},${start.y} A${radius},${radius} 0 ${isLarge} 1 ${end.x},${end.y}`;
	}

	/** Splits a lane's slots into contiguous [from, to) runs. */
	function runs(slots: readonly number[]): [number, number][] {
		const result: [number, number][] = [];
		for (const slot of slots) {
			const last = result[result.length - 1];
			if (last && last[1] === slot) last[1] = slot + 1;
			else result.push([slot, slot + 1]);
		}
		return result;
	}

	function priceBar(slot: number): string {
		const length = (PRICES[slot] / PRICE_CEILING) * BAR_MAX;
		const inner = polar(slot + 0.5, BAR_INNER);
		const outer = polar(slot + 0.5, BAR_INNER + length);
		return `M${inner.x},${inner.y} L${outer.x},${outer.y}`;
	}

	function fillPrice(text: string, slot: number): string {
		return text.replace('{price}', region.unitPrice(PRICES[slot]));
	}

	function jumpTo(slot: number) {
		if (!track) return;
		const box = track.getBoundingClientRect();
		const scrollable = box.height - window.innerHeight;
		const ratio = (slot - START_SLOT + 0.1) / (END_SLOT - START_SLOT);
		const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
		window.scrollTo({ top: window.scrollY + box.top + ratio * scrollable, behavior });
	}
</script>

<section class="wrap" id="ebb-night" tabindex="-1" aria-labelledby="night-title">
	<div class="night">
		<div class="container intro">
			<h2 class="h2" id="night-title">One night with Ebb</h2>
			<p class="lede">
				Scroll through tonight. Prices change every half hour, and Ebb fits each job into the
				cheapest time that still has it done when you need it.
			</p>
		</div>

		<div class="track" bind:this={track}>
			<div class="sticky">
				<div class="container stage">
					<ol class="steps">
						{#each NIGHT_STEPS as step, index (step.slot)}
							<li class:is-active={index === activeStepIndex} class:is-past={index < activeStepIndex}>
								<button type="button" onclick={() => jumpTo(step.slot)}>
									<span class="step-time num">{slotLabel(step.slot)}</span>
									<span class="step-title">{fillPrice(step.title, step.slot)}</span>
									<span class="step-body">{fillPrice(step.body, step.slot)}</span>
								</button>
							</li>
						{/each}
					</ol>

					<div class="dial-column">
						<div class="dial">
							<svg viewBox="0 0 {SIZE} {SIZE}" aria-hidden="true">
								{#each Array.from({ length: SLOT_COUNT }, (_, slot) => slot) as slot (slot)}
									<path
										class="bar"
										class:is-past={slot < currentSlot && slot >= START_SLOT}
										d={priceBar(slot)}
									/>
								{/each}
								{#each [0, 6, 12, 18] as hour (hour)}
									{@const slot = (((hour - 16 + 24) % 24) * 60) / 30}
									{@const point = polar(slot, BAR_INNER + BAR_MAX + 22)}
									<text class="hour" x={point.x} y={point.y}>{String(hour).padStart(2, '0')}</text>
								{/each}

								{#each lanes as lane (lane.label)}
									<circle class="lane-track" cx={CENTER} cy={CENTER} r={lane.radius} />
								{/each}
								{#each lanes as lane (lane.label)}
									{#each runs(lane.slots) as [from, to] (from)}
										<path class="arc plan {lane.kind}" d={arcPath(lane.radius, from, to)} />
										{#if currentSlot > from}
											<path
												class="arc done {lane.kind}"
												d={arcPath(lane.radius, from, Math.min(to, currentSlot))}
											/>
										{/if}
									{/each}
								{/each}

								<line class="hand" x1={handBase.x} y1={handBase.y} x2={hand.x} y2={hand.y} />
								<circle class="hand-dot" cx={hand.x} cy={hand.y} r="5" />
							</svg>

							<div class="readout">
								<span class="num clock">{slotLabel(wholeSlot)}</span>
								<span class="num price">{region.unitPrice(PRICES[wholeSlot])}/kWh</span>
								<span class="source" class:is-battery={isOnBattery}>
									{isOnBattery ? 'House on battery' : 'House on grid'}
								</span>
							</div>
						</div>

						<div class="status">
							<ul class="running" aria-label="Running now">
								{#each running as lane (lane.label)}
									<li class="chip {lane.kind}">{lane.label}</li>
								{:else}
									<li class="chip idle">Waiting for cheaper power</li>
								{/each}
							</ul>
							<dl class="spend">
								<div>
									<dt>With Ebb</dt>
									<dd class="num">{region.money(spentWithEbb)}</dd>
								</div>
								<div>
									<dt>On autopilot</dt>
									<dd class="num muted">{region.money(spentOnAutopilot)}</dd>
								</div>
							</dl>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.wrap {
		padding: 0 8px;
		scroll-margin-top: 0;
		outline: none;
	}
	.night {
		--night-bg: #0d0d0d;
		--night-fg: #fafafa;
		--night-fg-2: #a1a1a1;
		--night-fg-3: #6b6b6b;
		--night-line: rgb(255 255 255 / 0.08);
		--night-accent: #2dd4bf;
		--night-battery: #e5e5e5;

		border-radius: 28px;
		background: var(--night-bg);
		color: var(--night-fg);
	}
	.intro {
		padding-top: 96px;
	}
	@media (min-width: 1024px) {
		.intro {
			padding-top: 128px;
		}
	}
	.intro .lede {
		color: var(--night-fg-2);
	}

	.track {
		position: relative;
		height: 420vh;
	}
	.sticky {
		position: sticky;
		top: 0;
		display: flex;
		align-items: center;
		height: 100dvh;
		overflow: hidden;
	}
	.stage {
		display: grid;
		gap: 24px;
		align-items: center;
	}
	@media (min-width: 1024px) {
		.stage {
			grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
			gap: 64px;
		}
	}

	.steps {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.steps li {
		display: none;
	}
	.steps li.is-active {
		display: block;
		animation: step-in 300ms var(--ease-out);
	}
	.steps button {
		display: grid;
		gap: 4px;
		width: 100%;
		padding: 12px 16px;
		border: 0;
		border-radius: 14px;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: start;
		transition:
			background-color 150ms var(--ease-out),
			opacity 200ms var(--ease-out);
	}
	.step-time {
		color: var(--night-accent);
		font-size: 13px;
	}
	.step-title {
		font-size: 18px;
		font-weight: 500;
		letter-spacing: -0.015em;
		line-height: 1.3;
	}
	.step-body {
		color: var(--night-fg-2);
		font-size: 14px;
		line-height: 1.5;
	}

	@media (min-width: 1024px) {
		.steps li,
		.steps li.is-active {
			display: block;
			animation: none;
		}
		.steps button {
			opacity: 0.38;
		}
		.steps li.is-past button {
			opacity: 0.55;
		}
		.steps li.is-active button {
			opacity: 1;
			background: rgb(255 255 255 / 0.05);
		}
		.steps li:not(.is-active) .step-body {
			display: none;
		}
	}
	@media (hover: hover) {
		.steps li:not(.is-active) button:hover {
			opacity: 0.8;
		}
	}
	@media (max-width: 1023px) {
		.steps {
			order: 2;
			min-height: 148px;
		}
		.steps button {
			padding: 0;
		}
	}

	.dial-column {
		display: grid;
		justify-items: center;
		gap: 16px;
	}
	.dial {
		position: relative;
		width: min(100%, 520px, 52dvh);
		aspect-ratio: 1;
	}
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	.bar {
		stroke: rgb(255 255 255 / 0.16);
		stroke-width: 5;
		stroke-linecap: round;
		transition: stroke 200ms var(--ease-out);
	}
	.bar.is-past {
		stroke: rgb(255 255 255 / 0.62);
	}
	.hour {
		fill: var(--night-fg-3);
		font: 500 13px var(--mono);
		text-anchor: middle;
		dominant-baseline: central;
	}
	.lane-track {
		fill: none;
		stroke: var(--night-line);
		stroke-width: 8;
	}
	.arc {
		fill: none;
		stroke-width: 8;
		stroke-linecap: round;
	}
	.arc.plan.grid {
		stroke: color-mix(in oklab, var(--night-accent), transparent 72%);
	}
	.arc.plan.battery {
		stroke: rgb(255 255 255 / 0.18);
	}
	.arc.done.grid {
		stroke: var(--night-accent);
	}
	.arc.done.battery {
		stroke: var(--night-battery);
	}
	.hand {
		stroke: var(--night-fg);
		stroke-width: 1.5;
		opacity: 0.5;
	}
	.hand-dot {
		fill: var(--night-fg);
		stroke: var(--night-bg);
		stroke-width: 3;
	}

	.readout {
		position: absolute;
		inset: 0;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 2px;
		pointer-events: none;
	}
	.clock {
		font-size: clamp(24px, 4vw, 36px);
		font-weight: 500;
		letter-spacing: -0.04em;
	}
	.price {
		color: var(--night-fg-2);
		font-size: 12px;
	}
	.source {
		margin-top: 4px;
		color: var(--night-accent);
		font-size: 11px;
		font-weight: 500;
	}
	.source.is-battery {
		color: var(--night-battery);
	}

	.status {
		display: grid;
		justify-items: center;
		gap: 16px;
		width: 100%;
	}
	.running {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 6px;
		min-height: 26px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		height: 26px;
		padding: 0 10px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 500;
		animation: chip-in 200ms var(--ease-out);
	}
	.chip.grid {
		background: color-mix(in oklab, var(--night-accent), transparent 85%);
		color: #99f6e4;
	}
	.chip.battery {
		background: rgb(255 255 255 / 0.1);
		color: var(--night-battery);
	}
	.chip.idle {
		background: rgb(255 255 255 / 0.05);
		color: var(--night-fg-2);
	}
	.spend {
		display: flex;
		gap: 32px;
		margin: 0;
	}
	.spend div {
		display: grid;
		justify-items: center;
		gap: 2px;
	}
	.spend dt {
		color: var(--night-fg-2);
		font-size: 12px;
	}
	.spend dd {
		margin: 0;
		font-size: 20px;
		font-weight: 500;
	}
	.spend dd.muted {
		color: var(--night-fg-2);
	}

	@keyframes step-in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}
	@keyframes chip-in {
		from {
			opacity: 0;
			transform: scale(0.96);
		}
	}
</style>
