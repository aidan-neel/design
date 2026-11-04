<script lang="ts">
	import {
		APPLIANCES,
		CARBON,
		NOW_SLOT,
		PRICES,
		slotLabel,
		type Appliance,
		type ApplianceId
	} from './data';
	import Icon from './Icon.svelte';
	import ReadySelect from './ReadySelect.svelte';
	import { useRegion } from './region.svelte';
	import {
		allowedWindow,
		clampStart,
		contiguousSlots,
		footprint,
		habitSlots,
		planJob,
		sumFootprints,
		type Job,
		type Objective
	} from './schedule';
	import Segmented from './Segmented.svelte';
	import Swap from './Swap.svelte';

	const region = useRegion();

	/** The planner shows 16:00 to 10:00. Every ready-by option fits inside it. */
	const VIEW_SLOTS = 36;
	const AXIS_SLOTS = [0, 8, 16, 24, 32];
	const PRICE_CEILING = 46;
	const CARBON_CEILING = 340;
	const EDGE_SLOTS = 5;

	let objective = $state<Objective>('cost');
	let isEnabled = $state<Record<ApplianceId, boolean>>(
		Object.fromEntries(APPLIANCES.map((appliance) => [appliance.id, true])) as Record<ApplianceId, boolean>
	);
	let readyBy = $state<Record<ApplianceId, number>>(
		Object.fromEntries(APPLIANCES.map((appliance) => [appliance.id, appliance.defaultReadyBy])) as Record<
			ApplianceId,
			number
		>
	);
	/** Start slots the visitor dragged blocks to. Splittable jobs can't be dragged. */
	let movedStarts = $state<Partial<Record<ApplianceId, number>>>({});
	let hoveredSlot = $state<number | null>(null);
	let drag = $state<{ id: ApplianceId; originX: number; originStart: number; slotWidth: number } | null>(
		null
	);

	const rows = $derived(
		APPLIANCES.filter((appliance) => isEnabled[appliance.id]).map((appliance) => {
			const job: Job = { appliance, readyBy: readyBy[appliance.id] };
			const best = planJob(job, objective);
			const movedStart = movedStarts[appliance.id];
			const slots =
				movedStart === undefined || appliance.isSplittable
					? best
					: contiguousSlots(movedStart, appliance.slots);
			return {
				job,
				slots,
				isMoved: slots[0] !== best[0],
				window: allowedWindow(job),
				footprint: footprint(appliance, slots),
				bestFootprint: footprint(appliance, best),
				habit: footprint(appliance, habitSlots(job))
			};
		})
	);
	const planTotal = $derived(sumFootprints(rows.map((row) => row.footprint)));
	const habitTotal = $derived(sumFootprints(rows.map((row) => row.habit)));
	const savedCost = $derived(habitTotal.cost - planTotal.cost);
	const savedPercent = $derived(habitTotal.cost > 0 ? Math.round((savedCost / habitTotal.cost) * 100) : 0);
	const savedCarbonPercent = $derived(
		habitTotal.carbonKg > 0 ? Math.round((1 - planTotal.carbonKg / habitTotal.carbonKg) * 100) : 0
	);
	const busySlots = $derived(new Set(rows.flatMap((row) => row.slots)));
	const hasMovedBlocks = $derived(rows.some((row) => row.isMoved));
	const readoutSlot = $derived(hoveredSlot ?? NOW_SLOT);

	function barHeight(slot: number): number {
		return objective === 'cost' ? PRICES[slot] / PRICE_CEILING : CARBON[slot] / CARBON_CEILING;
	}

	function percent(slot: number): string {
		return `${(slot / VIEW_SLOTS) * 100}%`;
	}

	function toggle(appliance: Appliance) {
		isEnabled[appliance.id] = !isEnabled[appliance.id];
	}

	function setObjective(next: Objective) {
		objective = next;
		movedStarts = {};
	}

	function setReadyBy(id: ApplianceId, slot: number) {
		readyBy[id] = slot;
		const { [id]: _discarded, ...rest } = movedStarts;
		movedStarts = rest;
	}

	function moveTo(job: Job, start: number) {
		movedStarts = { ...movedStarts, [job.appliance.id]: clampStart(job, start) };
	}

	function startDrag(event: PointerEvent, job: Job, start: number) {
		if (event.button !== 0) return;
		const block = event.currentTarget as HTMLElement;
		const trackWidth = block.parentElement?.getBoundingClientRect().width ?? 0;
		block.setPointerCapture(event.pointerId);
		drag = { id: job.appliance.id, originX: event.clientX, originStart: start, slotWidth: trackWidth / VIEW_SLOTS };
	}

	function moveDrag(event: PointerEvent, job: Job) {
		if (!drag || drag.id !== job.appliance.id) return;
		const delta = Math.round((event.clientX - drag.originX) / drag.slotWidth);
		moveTo(job, drag.originStart + delta);
	}

	function nudge(event: KeyboardEvent, job: Job, start: number) {
		const { first, end } = allowedWindow(job);
		const targets: Record<string, number> = {
			ArrowLeft: start - 1,
			ArrowRight: start + 1,
			Home: first,
			End: end - job.appliance.slots
		};
		if (!(event.key in targets)) return;
		event.preventDefault();
		moveTo(job, targets[event.key]);
	}

	function trackHover(event: PointerEvent) {
		const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const slot = Math.floor(((event.clientX - box.left) / box.width) * VIEW_SLOTS);
		hoveredSlot = slot >= 0 && slot < VIEW_SLOTS ? slot : null;
	}

	function signedMoney(amount: number): string {
		return `${amount >= 0 ? '+' : '−'}${region.money(Math.abs(amount))}`;
	}
</script>

<section class="section" id="ebb-planner" tabindex="-1" aria-labelledby="planner-title">
	<div class="container">
		<div class="head">
			<div>
				<h2 class="h2" id="planner-title">Try it on tonight’s prices</h2>
				<p class="lede">
					Pick what Ebb should run and when it needs to be done. Then drag a block to see what any
					other time would cost.
				</p>
			</div>
			<div class="objective">
				<span class="control-label" aria-hidden="true">Plan for</span>
				<Segmented
					label="Plan for"
					options={[
						{ value: 'cost', label: 'Lowest cost' },
						{ value: 'carbon', label: 'Lowest carbon' }
					]}
					bind:value={() => objective, setObjective}
				/>
			</div>
		</div>

		<div class="devices" role="group" aria-label="Devices to schedule">
			{#each APPLIANCES as appliance (appliance.id)}
				<button
					type="button"
					class="device"
					aria-pressed={isEnabled[appliance.id]}
					onclick={() => toggle(appliance)}
				>
					<Icon name={appliance.icon} size={16} />
					{appliance.name}
					<span class="device-check" aria-hidden="true"><Icon name="check" size={12} /></span>
				</button>
			{/each}
		</div>

		<div class="panel">
			<div class="summary" aria-live="polite">
				<div class="figure">
					<span class="figure-label">Ebb’s plan</span>
					<span class="figure-value num"><Swap text={region.money(planTotal.cost)} /></span>
					<span class="figure-meta num">{planTotal.carbonKg.toFixed(1)} kg CO₂</span>
				</div>
				<div class="figure">
					<span class="figure-label">Run on habit</span>
					<span class="figure-value num is-muted"><Swap text={region.money(habitTotal.cost)} /></span>
					<span class="figure-meta num">{habitTotal.carbonKg.toFixed(1)} kg CO₂</span>
				</div>
				<div class="figure verdict">
					{#if rows.length === 0}
						<span class="figure-meta">Pick a device above to build a plan.</span>
					{:else}
						<span class="tag {savedCost >= 0 ? 'tag-accent' : 'tag-warning'}">
							<Swap
								text={savedCost >= 0
									? `Saves ${region.money(savedCost)} tonight · ${savedPercent}%`
									: `Costs ${region.money(-savedCost)} more than habit`}
							/>
						</span>
						<span class="figure-meta">
							{savedCarbonPercent >= 0 ? `${savedCarbonPercent}% less` : `${-savedCarbonPercent}% more`}
							carbon · about {region.money(Math.max(savedCost, 0) * 365, 0)} a year at this rate
						</span>
					{/if}
				</div>
				<button
					type="button"
					class="btn btn-secondary btn-sm reset"
					disabled={!hasMovedBlocks}
					onclick={() => (movedStarts = {})}
				>
					<Icon name="refresh" size={14} />
					Reset to Ebb’s plan
				</button>
			</div>

			<div class="plot">
				<div class="plot-label">
					<span class="legend">
						<span class="legend-swatch" aria-hidden="true"></span>
						{objective === 'cost' ? 'Price per kWh' : 'Grid carbon, g/kWh'} · teal is when Ebb runs
					</span>
					<span class="readout" aria-hidden="true">
						<span class="readout-time num">
							{slotLabel(readoutSlot)}–{slotLabel(readoutSlot + 1)}
							{#if hoveredSlot === null}<span class="readout-now">now</span>{/if}
						</span>
						<span class="readout-meta num">
							{region.unitPrice(PRICES[readoutSlot])}/kWh · {CARBON[readoutSlot]} g CO₂/kWh
						</span>
						<span class="readout-meta">
							{busySlots.has(readoutSlot) ? 'Ebb runs here' : 'Nothing scheduled'}
						</span>
					</span>
				</div>
				<div
					class="bars"
					role="img"
					aria-label={objective === 'cost'
						? 'Price per half hour from 16:00 to 10:00. Highest around 18:00, lowest from 02:00 to 04:00.'
						: 'Grid carbon per half hour from 16:00 to 10:00. Highest around 18:00, falling overnight.'}
					onpointermove={trackHover}
					onpointerleave={() => (hoveredSlot = null)}
				>
					{#each Array.from({ length: VIEW_SLOTS }, (_, slot) => slot) as slot (slot)}
						<span
							class="bar"
							class:is-busy={busySlots.has(slot)}
							class:is-hovered={hoveredSlot === slot}
							class:is-past={slot < NOW_SLOT}
							style:transform="scaleY({barHeight(slot)})"
						></span>
					{/each}
					<span class="now" style:left={percent(NOW_SLOT)}><span>Now</span></span>
					{#if hoveredSlot !== null}
						<div
							class="tip"
							class:is-start={hoveredSlot < EDGE_SLOTS}
							class:is-end={hoveredSlot > VIEW_SLOTS - EDGE_SLOTS}
							style:left="calc({percent(hoveredSlot)} + {50 / VIEW_SLOTS}%)"
						>
							<span class="num">{slotLabel(hoveredSlot)}–{slotLabel(hoveredSlot + 1)}</span>
							<span class="num tip-meta">
								{region.unitPrice(PRICES[hoveredSlot])}/kWh · {CARBON[hoveredSlot]} g
							</span>
						</div>
					{/if}
				</div>
				<div class="axis num" aria-hidden="true">
					{#each AXIS_SLOTS as slot (slot)}
						<span style:left={percent(slot)}>{slotLabel(slot)}</span>
					{/each}
				</div>

				<ul class="lanes">
					{#each rows as row (row.job.appliance.id)}
						{@const appliance = row.job.appliance}
						{@const costDelta = row.footprint.cost - row.bestFootprint.cost}
						<li class="lane">
							<div class="lane-info">
								<span class="lane-icon"><Icon name={appliance.icon} size={16} /></span>
								<span class="lane-text">
									<span class="lane-name">{appliance.name}</span>
									<span class="lane-detail">{appliance.detail}</span>
								</span>
								<span class="lane-cost">
									<span class="num">{region.money(row.footprint.cost)}</span>
									{#if row.isMoved && Math.abs(costDelta) >= 0.005}
										<span class="num lane-delta" class:is-worse={costDelta > 0}>
											{signedMoney(costDelta)}
										</span>
									{/if}
								</span>
								<span class="lane-ready">
									<ReadySelect
										label="{appliance.name} ready by"
										value={readyBy[appliance.id]}
										onChange={(slot) => setReadyBy(appliance.id, slot)}
									/>
								</span>
							</div>

							<div
								class="track"
								role="presentation"
								onpointermove={trackHover}
								onpointerleave={() => (hoveredSlot = null)}
							>
								<span
									class="blocked"
									style:left="0"
									style:width={percent(row.window.first)}
									aria-hidden="true"
								></span>
								<span
									class="blocked"
									style:left={percent(row.window.end)}
									style:right="0"
									aria-hidden="true"
								></span>
								<span class="deadline" style:left={percent(row.window.end)} aria-hidden="true"></span>
								{#if hoveredSlot !== null}
									<span
										class="hover-column"
										style:left={percent(hoveredSlot)}
										style:width={percent(1)}
										aria-hidden="true"
									></span>
								{/if}

								{#if appliance.isSplittable}
									{#each row.slots as slot (slot)}
										<span
											class="block is-fixed"
											style:--start={slot}
											style:--span="1"
											title="{appliance.name} charges {slotLabel(slot)}–{slotLabel(slot + 1)}"
										></span>
									{/each}
								{:else}
									{@const start = row.slots[0]}
									<span
										class="block"
										class:is-dragging={drag?.id === appliance.id}
										class:is-moved={row.isMoved}
										style:--start={start}
										style:--span={appliance.slots}
										role="slider"
										tabindex="0"
										aria-label="{appliance.name} start time"
										aria-valuemin={row.window.first}
										aria-valuemax={row.window.end - appliance.slots}
										aria-valuenow={start}
										aria-valuetext="Starts {slotLabel(start)}, done {slotLabel(start + appliance.slots)}"
										onpointerdown={(event) => startDrag(event, row.job, start)}
										onpointermove={(event) => moveDrag(event, row.job)}
										onpointerup={() => (drag = null)}
										onpointercancel={() => (drag = null)}
										onkeydown={(event) => nudge(event, row.job, start)}
									>
										<Icon name="grip" size={14} />
									</span>
								{/if}
							</div>
						</li>
					{:else}
						<li class="empty">
							<p>Nothing to schedule yet.</p>
							<button
								type="button"
								class="btn btn-secondary btn-sm"
								onclick={() => APPLIANCES.forEach((appliance) => (isEnabled[appliance.id] = true))}
							>
								Add all four devices
							</button>
						</li>
					{/each}
				</ul>
			</div>

			<p class="footnote">
				Sample prices and carbon for Wednesday, Nov 4. The car charges in the cheapest half hours and
				can pause between them; the other blocks run in one go. Grey areas are outside each device’s
				window.
			</p>
		</div>
	</div>
</section>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 24px;
	}
	.objective {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.control-label {
		color: var(--fg-2);
		font-size: 13px;
	}

	.devices {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 32px;
	}
	.device {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 40px;
		padding: 0 12px;
		border: 0;
		border-radius: 999px;
		background: transparent;
		box-shadow: inset 0 0 0 1px #e2e2e2;
		color: var(--fg-2);
		font: 500 14px/1 var(--font);
		transition:
			background-color 150ms var(--ease-out),
			box-shadow 150ms var(--ease-out),
			color 150ms var(--ease-out),
			transform 150ms var(--ease-out);
	}
	.device:active {
		transform: scale(0.97);
	}
	.device[aria-pressed='true'] {
		background: var(--bg);
		box-shadow: var(--shadow-btn);
		color: var(--fg);
	}
	@media (hover: hover) {
		.device:hover {
			color: var(--fg);
		}
	}
	.device-check {
		display: grid;
		place-items: center;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--accent);
		color: #fff;
		opacity: 0;
		transform: scale(0.8);
		transition:
			opacity 150ms var(--ease-out),
			transform 200ms var(--ease-out);
	}
	.device[aria-pressed='true'] .device-check {
		opacity: 1;
		transform: none;
	}

	.panel {
		margin-top: 16px;
		padding: 20px;
		border-radius: 24px;
		background: var(--bg);
		box-shadow: var(--shadow-card);
	}
	@media (min-width: 768px) {
		.panel {
			padding: 32px;
		}
	}

	.summary {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 20px 24px;
		align-items: end;
		padding-bottom: 24px;
		border-bottom: 1px solid var(--border);
	}
	@media (min-width: 900px) {
		.summary {
			grid-template-columns: auto auto minmax(0, 1fr) auto;
			gap: 40px;
		}
	}
	.figure {
		display: grid;
		gap: 4px;
	}
	.figure-label {
		color: var(--fg-2);
		font-size: 13px;
	}
	.figure-value {
		font-size: clamp(28px, 3vw, 36px);
		font-weight: 500;
		letter-spacing: -0.04em;
		line-height: 1.1;
	}
	.figure-value.is-muted {
		color: var(--fg-2);
	}
	.figure-meta {
		color: var(--fg-2);
		font-size: 13px;
	}
	.verdict {
		grid-column: 1 / -1;
		justify-items: start;
	}
	@media (min-width: 900px) {
		.verdict {
			grid-column: auto;
		}
	}
	.reset {
		grid-column: 1 / -1;
		justify-self: start;
	}
	@media (min-width: 900px) {
		.reset {
			grid-column: auto;
			justify-self: end;
		}
	}

	.plot {
		--label-width: 0px;
		position: relative;
		display: grid;
		grid-template-columns: var(--label-width) minmax(0, 1fr);
		column-gap: 0;
		margin-top: 24px;
	}
	@media (min-width: 900px) {
		.plot {
			--label-width: 300px;
			column-gap: 24px;
		}
	}
	.plot-label {
		grid-column: 1 / -1;
		margin-bottom: 28px;
		color: var(--fg-2);
		font-size: 13px;
	}
	.legend {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.readout {
		display: none;
	}
	@media (min-width: 900px) {
		.plot-label {
			grid-column: 1;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			margin-bottom: 0;
		}
		.readout {
			display: grid;
			gap: 2px;
		}
		.tip {
			display: none;
		}
	}
	.readout-time {
		color: var(--fg);
		font-size: 20px;
		font-weight: 500;
	}
	.readout-now {
		margin-left: 6px;
		color: var(--fg-3);
		font-family: var(--font);
		font-size: 13px;
		font-weight: 400;
		letter-spacing: 0;
	}
	.readout-meta {
		font-size: 12px;
	}
	.legend-swatch {
		width: 10px;
		height: 10px;
		border-radius: 3px;
		background: var(--accent);
	}

	.bars {
		grid-column: 2;
		position: relative;
		display: grid;
		grid-template-columns: repeat(36, minmax(0, 1fr));
		align-items: end;
		gap: 2px;
		height: 120px;
		touch-action: pan-y;
	}
	.bar {
		height: 100%;
		border-radius: 3px 3px 1px 1px;
		background: #e4e4e4;
		transform-origin: bottom;
		transition:
			transform 300ms var(--ease-out),
			background-color 150ms var(--ease-out);
	}
	.bar.is-past {
		background: #f0f0f0;
	}
	.bar.is-busy {
		background: var(--accent);
	}
	.bar.is-hovered {
		background: #a3a3a3;
	}
	.bar.is-busy.is-hovered {
		background: var(--accent-hover);
	}
	.now {
		position: absolute;
		top: -8px;
		bottom: 0;
		width: 0;
		border-left: 1px dashed #b5b5b5;
		pointer-events: none;
	}
	.now span {
		position: absolute;
		top: -12px;
		left: 4px;
		color: var(--fg-2);
		font-size: 11px;
		font-weight: 500;
	}
	.tip {
		position: absolute;
		bottom: calc(100% + 8px);
		z-index: 2;
		display: grid;
		gap: 2px;
		padding: 8px 10px;
		border-radius: 10px;
		background: #171717;
		color: #fff;
		font-size: 12px;
		white-space: nowrap;
		box-shadow: 0 8px 24px -6px rgb(0 0 0 / 0.3);
		transform: translateX(-50%);
		pointer-events: none;
	}
	.tip.is-start {
		transform: translateX(-12px);
	}
	.tip.is-end {
		transform: translateX(calc(-100% + 12px));
	}
	.tip-meta {
		color: #a3a3a3;
	}
	.axis {
		grid-column: 2;
		position: relative;
		height: 24px;
		margin-top: 8px;
		color: var(--fg-3);
		font-size: 11px;
	}
	.axis span {
		position: absolute;
		top: 0;
	}

	.lanes {
		grid-column: 1 / -1;
		margin: 8px 0 0;
		padding: 0;
		list-style: none;
	}
	.lane {
		display: grid;
		grid-template-columns: var(--label-width) minmax(0, 1fr);
		row-gap: 12px;
		align-items: center;
		padding: 16px 0;
		border-top: 1px solid var(--border);
	}
	@media (min-width: 900px) {
		.lane {
			column-gap: 24px;
			padding: 12px 0;
		}
	}
	.lane-info {
		grid-column: 1 / -1;
		display: grid;
		grid-template-columns: 32px minmax(0, 1fr) auto;
		grid-template-areas: 'icon text cost' 'icon ready ready';
		column-gap: 12px;
		row-gap: 8px;
		align-items: center;
	}
	@media (min-width: 900px) {
		.lane-info {
			grid-column: 1;
			grid-template-areas: 'icon text cost' 'icon ready cost';
		}
	}
	.lane-icon {
		grid-area: icon;
		align-self: start;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 10px;
		background: var(--bg-canvas);
		box-shadow: inset 0 0 0 1px var(--border);
		color: var(--fg-2);
	}
	.lane-text {
		grid-area: text;
		display: grid;
		min-width: 0;
	}
	.lane-name {
		font-size: 14px;
		font-weight: 500;
	}
	.lane-detail {
		overflow: hidden;
		color: var(--fg-2);
		font-size: 12px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.lane-ready {
		grid-area: ready;
	}
	.lane-cost {
		grid-area: cost;
		display: grid;
		justify-items: end;
		align-self: start;
		font-size: 14px;
	}
	.lane-delta {
		color: var(--accent);
		font-size: 12px;
	}
	.lane-delta.is-worse {
		color: var(--warning);
	}

	.track {
		grid-column: 1 / -1;
		position: relative;
		height: 36px;
		border-radius: 10px;
		background: var(--bg-canvas);
		box-shadow: inset 0 0 0 1px var(--border);
		touch-action: pan-y;
		container-type: inline-size;
	}
	@media (min-width: 900px) {
		.track {
			grid-column: 2;
		}
	}
	.blocked {
		position: absolute;
		top: 0;
		bottom: 0;
		border-radius: 10px;
		background: repeating-linear-gradient(
			-45deg,
			transparent 0 4px,
			rgb(0 0 0 / 0.045) 4px 5px
		);
	}
	.deadline {
		position: absolute;
		top: -4px;
		bottom: -4px;
		width: 0;
		border-left: 1.5px solid var(--fg);
	}
	.hover-column {
		position: absolute;
		top: 0;
		bottom: 0;
		background: rgb(0 0 0 / 0.04);
		pointer-events: none;
	}
	.block {
		--slot: calc(100cqw / 36);
		position: absolute;
		top: 4px;
		bottom: 4px;
		left: 0;
		width: calc(var(--span) * var(--slot));
		transform: translateX(calc(var(--start) * var(--slot)));
		display: grid;
		place-items: center;
		border-radius: 7px;
		background: var(--accent);
		color: rgb(255 255 255 / 0.75);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.18),
			0 1px 2px rgb(0 0 0 / 0.12);
		cursor: grab;
		touch-action: none;
		transition:
			transform 200ms var(--ease-out),
			box-shadow 150ms var(--ease-out),
			background-color 150ms var(--ease-out);
	}
	.block:focus-visible {
		outline-offset: 2px;
	}
	.block.is-moved {
		background: color-mix(in oklab, var(--accent), white 25%);
	}
	.block.is-dragging {
		cursor: grabbing;
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.18),
			0 6px 16px -4px rgb(0 0 0 / 0.3);
		transition:
			transform 80ms linear,
			box-shadow 150ms var(--ease-out);
	}
	.block.is-fixed {
		width: calc(var(--slot) - 1px);
		border-radius: 3px;
		cursor: default;
		touch-action: pan-y;
		transition: transform 200ms var(--ease-out);
	}

	.empty {
		display: grid;
		justify-items: start;
		gap: 12px;
		padding: 24px 0 8px;
		border-top: 1px solid var(--border);
		color: var(--fg-2);
	}
	.empty p {
		margin: 0;
	}

	.footnote {
		margin: 16px 0 0;
		color: var(--fg-2);
		font-size: 12px;
		line-height: 1.5;
	}
</style>
