<script lang="ts">
	import { Slider } from 'bits-ui';
	import {
		BUILDING_HUB_PRICE,
		BUILDING_MAX_UNITS,
		BUILDING_MIN_UNITS,
		clampBuildingUnits,
		HUB_PRICE,
		OWNERSHIP_OPTIONS,
		PLANS,
		type Ownership,
		type Plan
	} from './data';
	import Icon from './Icon.svelte';
	import { estimateSavings, monthlyPrice, type Billing, type HomePlanId } from './pricing';
	import { useRegion } from './region.svelte';
	import Segmented from './Segmented.svelte';
	import Swap from './Swap.svelte';

	let {
		onChoose
	}: { onChoose: (plan: Plan['id'], buildingUnits: number) => void } = $props();

	const region = useRegion();

	const MIN_BILL = 40;
	const MAX_BILL = 400;
	const UNIT_STEP = 10;

	let billing = $state<Billing>('yearly');
	let monthlyBill = $state(140);
	let owned = $state<Set<Ownership>>(new Set(['car', 'heatpump']));
	let buildingUnits = $state(40);

	const estimates = $derived({
		basic: estimateSavings('basic', monthlyBill, owned, billing),
		home: estimateSavings('home', monthlyBill, owned, billing)
	});
	const recommended = $derived<HomePlanId>(
		estimates.home.netYearly > estimates.basic.netYearly ? 'home' : 'basic'
	);

	function toggleOwned(id: Ownership) {
		const next = new Set(owned);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		owned = next;
	}

	function setUnits(units: number) {
		buildingUnits = clampBuildingUnits(units);
	}

	function paybackText(months: number | null): string {
		if (months === null) return 'Doesn’t cover the hub at this bill';
		if (months < 1) return 'Hub pays for itself in under a month';
		return `Hub pays for itself in ${Math.ceil(months)} ${Math.ceil(months) === 1 ? 'month' : 'months'}`;
	}

	function priceLabel(plan: Plan): string {
		const perMonth = monthlyPrice(plan, billing);
		return perMonth === 0 ? region.money(0, 0) : region.money(perMonth, perMonth % 1 === 0 ? 0 : 2);
	}
</script>

<section class="section" id="ebb-pricing" tabindex="-1" aria-labelledby="pricing-title">
	<div class="container">
		<div class="head">
			<div>
				<h2 class="h2" id="pricing-title">Buy the hub once. Add a plan if it pays.</h2>
				<p class="lede">
					The hub is {region.money(HUB_PRICE, 0)}. Basic is free for as long as you own it. Tell us
					about your home and we’ll show what each plan would save.
				</p>
			</div>
			<Segmented
				label="Billing period"
				options={[
					{ value: 'monthly', label: 'Monthly' },
					{ value: 'yearly', label: 'Yearly, 2 months free' }
				]}
				bind:value={billing}
			/>
		</div>

		<div class="calculator">
			<div class="bill">
				<div class="bill-head">
					<span class="control-label" id="bill-label">Your monthly electricity bill</span>
					<span class="num bill-value">{region.money(monthlyBill, 0)}</span>
				</div>
				<Slider.Root
					type="single"
					bind:value={monthlyBill}
					min={MIN_BILL}
					max={MAX_BILL}
					step={10}
					class="slider"
					aria-labelledby="bill-label"
				>
					<span class="slider-track">
						<Slider.Range class="slider-range" />
					</span>
					<Slider.Thumb index={0} class="slider-thumb" aria-label="Monthly electricity bill" />
				</Slider.Root>
				<div class="bill-scale num" aria-hidden="true">
					<span>{region.money(MIN_BILL, 0)}</span>
					<span>{region.money(MAX_BILL, 0)}</span>
				</div>
			</div>
			<div class="owned">
				<span class="control-label">You have</span>
				<div class="owned-list" role="group" aria-label="What you have at home">
					{#each OWNERSHIP_OPTIONS as option (option.id)}
						<button
							type="button"
							class="owned-chip"
							aria-pressed={owned.has(option.id)}
							onclick={() => toggleOwned(option.id)}
						>
							<span class="box" aria-hidden="true"><Icon name="check" size={12} /></span>
							{option.label}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<div class="plans">
			{#each PLANS as plan (plan.id)}
				{@const isRecommended = plan.id === recommended}
				{@const estimate = plan.id === 'building' ? null : estimates[plan.id]}
				<article class="plan" class:is-recommended={isRecommended} aria-labelledby="plan-{plan.id}">
					<header class="plan-head">
						<h3 id="plan-{plan.id}">{plan.name}</h3>
						{#if isRecommended}
							<span class="tag tag-accent">Best for your home</span>
						{/if}
					</header>
					<p class="plan-summary">{plan.summary}</p>

					<p class="price">
						<span class="num price-value"><Swap text={priceLabel(plan)} /></span>
						<span class="price-period">
							{plan.id === 'building' ? 'per unit / month' : 'per month'}
						</span>
					</p>
					<p class="price-note">
						{#if plan.monthly === 0}
							Free with the hub, no card needed
						{:else if billing === 'yearly'}
							Billed {region.money(plan.yearly, 0)} a year{plan.id === 'building' ? ' per unit' : ''}
						{:else}
							Billed monthly, cancel any time
						{/if}
					</p>

					{#if estimate}
						<div class="estimate">
							<p class="estimate-value">
								<span class="num"
									><Swap text={region.money(Math.max(estimate.netYearly, 0), 0)} /></span
								>
								<span>a year saved after plan cost</span>
							</p>
							<p class="estimate-note">{paybackText(estimate.paybackMonths)}</p>
						</div>
					{:else}
						<div class="estimate">
							<div class="stepper">
								<button
									type="button"
									class="icon-btn"
									aria-label="Fewer units"
									disabled={buildingUnits <= BUILDING_MIN_UNITS}
									onclick={() => setUnits(buildingUnits - UNIT_STEP)}
								>
									<Icon name="minus" size={16} />
								</button>
								<label class="units">
									<input
										type="number"
										inputmode="numeric"
										min={BUILDING_MIN_UNITS}
										max={BUILDING_MAX_UNITS}
										value={buildingUnits}
										onchange={(event) => setUnits(Number(event.currentTarget.value))}
										aria-label="Number of units"
									/>
									<span>units</span>
								</label>
								<button
									type="button"
									class="icon-btn"
									aria-label="More units"
									disabled={buildingUnits >= BUILDING_MAX_UNITS}
									onclick={() => setUnits(buildingUnits + UNIT_STEP)}
								>
									<Icon name="plus" size={16} />
								</button>
							</div>
							<p class="estimate-note">
								<span class="num">{region.money(monthlyPrice(plan, billing) * buildingUnits, 0)}</span> a
								month, plus <span class="num">{region.money(BUILDING_HUB_PRICE, 0)}</span> per hub
							</p>
						</div>
					{/if}

					<ul class="features">
						{#each plan.features as feature (feature)}
							<li><Icon name="check" size={14} />{feature}</li>
						{/each}
					</ul>

					<button
						type="button"
						class="btn {isRecommended ? 'btn-ink' : 'btn-secondary'} plan-cta"
						onclick={() => onChoose(plan.id, buildingUnits)}
					>
						{plan.id === 'building' ? `Reserve ${buildingUnits} hubs` : `Reserve with ${plan.name}`}
					</button>
				</article>
			{/each}
		</div>
		<p class="footnote">
			Estimates use sample prices and typical shares of a bill for each device. Your savings depend
			on your tariff and habits.
		</p>
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

	.calculator {
		display: grid;
		gap: 24px;
		margin-top: 40px;
		padding: 20px;
		border-radius: 20px;
		background: var(--bg);
		box-shadow: var(--shadow-card);
	}
	@media (min-width: 900px) {
		.calculator {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			gap: 48px;
			padding: 24px 28px;
		}
	}
	.control-label {
		color: var(--fg-2);
		font-size: 13px;
	}
	.bill-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}
	.bill-value {
		font-size: 20px;
		font-weight: 500;
	}
	:global(.ebb .slider) {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
		height: 32px;
		margin-top: 8px;
		touch-action: none;
	}
	.slider-track {
		position: relative;
		width: 100%;
		height: 6px;
		overflow: hidden;
		border-radius: 999px;
		background: var(--bg-muted);
	}
	:global(.ebb .slider-range) {
		position: absolute;
		height: 100%;
		background: var(--ink);
	}
	:global(.ebb .slider-thumb) {
		display: block;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: #fff;
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.08),
			0 2px 6px rgb(0 0 0 / 0.16);
		transition:
			transform 150ms var(--ease-out),
			box-shadow 150ms var(--ease-out);
	}
	:global(.ebb .slider-thumb[data-active]) {
		transform: scale(1.1);
	}
	:global(.ebb .slider-thumb:focus-visible) {
		outline: none;
		box-shadow:
			0 0 0 1px var(--accent),
			0 0 0 4px var(--ring),
			0 2px 6px rgb(0 0 0 / 0.16);
	}
	.bill-scale {
		display: flex;
		justify-content: space-between;
		color: var(--fg-3);
		font-size: 11px;
	}

	.owned {
		display: grid;
		gap: 12px;
		align-content: start;
	}
	.owned-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.owned-chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 40px;
		padding: 0 14px 0 10px;
		border: 0;
		border-radius: 10px;
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
	.owned-chip:active {
		transform: scale(0.97);
	}
	.owned-chip[aria-pressed='true'] {
		background: var(--bg);
		box-shadow: var(--shadow-btn);
		color: var(--fg);
	}
	.box {
		display: grid;
		place-items: center;
		width: 18px;
		height: 18px;
		border-radius: 5px;
		box-shadow: inset 0 0 0 1.5px #d4d4d4;
		color: transparent;
		transition:
			background-color 150ms var(--ease-out),
			box-shadow 150ms var(--ease-out),
			color 150ms var(--ease-out);
	}
	.owned-chip[aria-pressed='true'] .box {
		background: var(--ink);
		box-shadow: none;
		color: #fff;
	}
	.box :global(svg) {
		transform: scale(0.8);
		transition: transform 200ms var(--ease-out);
	}
	.owned-chip[aria-pressed='true'] .box :global(svg) {
		transform: none;
	}

	.plans {
		display: grid;
		gap: 16px;
		margin-top: 16px;
	}
	@media (min-width: 960px) {
		.plans {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	.plan {
		display: flex;
		flex-direction: column;
		padding: 24px;
		border-radius: 20px;
		background: var(--bg);
		box-shadow: var(--shadow-card);
		transition: box-shadow 250ms var(--ease-out);
	}
	.plan.is-recommended {
		box-shadow:
			0 0 0 1.5px var(--ink),
			0 16px 40px -20px rgb(0 0 0 / 0.25);
	}
	.plan-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 24px;
	}
	h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 500;
		letter-spacing: -0.015em;
	}
	.plan-summary {
		margin: 4px 0 0;
		color: var(--fg-2);
		font-size: 14px;
	}
	.price {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin: 24px 0 0;
	}
	.price-value {
		font-size: 40px;
		font-weight: 500;
		letter-spacing: -0.05em;
		line-height: 1;
	}
	.price-period {
		color: var(--fg-2);
		font-size: 13px;
	}
	.price-note {
		margin: 8px 0 0;
		color: var(--fg-2);
		font-size: 13px;
	}

	.estimate {
		display: grid;
		gap: 4px;
		min-height: 84px;
		margin-top: 20px;
		padding-top: 16px;
		border-top: 1px solid var(--border);
	}
	.estimate-value {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0 8px;
		margin: 0;
		font-size: 13px;
		color: var(--fg-2);
	}
	.estimate-value .num {
		color: var(--accent);
		font-size: 22px;
		font-weight: 500;
	}
	.estimate-note {
		margin: 0;
		color: var(--fg-2);
		font-size: 13px;
	}
	.estimate-note .num {
		color: var(--fg);
	}
	.stepper {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.stepper :global(.icon-btn) {
		box-shadow: var(--shadow-btn);
		background: linear-gradient(#fff, #f7f7f7);
	}
	.stepper :global(.icon-btn:disabled) {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.units {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
		padding: 0 8px;
		color: var(--fg-2);
		font-size: 13px;
	}
	.units input {
		width: 3.2ch;
		border: 0;
		border-bottom: 1px dashed #c4c4c4;
		background: transparent;
		color: var(--fg);
		font: 500 22px var(--mono);
		text-align: center;
		appearance: textfield;
		-moz-appearance: textfield;
	}
	.units input::-webkit-inner-spin-button,
	.units input::-webkit-outer-spin-button {
		appearance: none;
	}
	.units input:focus-visible {
		border-bottom-color: var(--accent);
	}

	.features {
		display: grid;
		gap: 10px;
		margin: 20px 0 24px;
		padding: 0;
		list-style: none;
		font-size: 14px;
	}
	.features li {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.features :global(svg) {
		flex-shrink: 0;
		color: var(--accent);
	}
	.plan-cta {
		width: 100%;
		margin-top: auto;
	}

	.footnote {
		margin: 16px 0 0;
		color: var(--fg-2);
		font-size: 12px;
	}
</style>
