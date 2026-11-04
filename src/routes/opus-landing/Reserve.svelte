<script lang="ts">
	import { tick } from 'svelte';
	import {
		BUILDING_HUB_PRICE,
		BUILDING_MAX_UNITS,
		BUILDING_MIN_UNITS,
		clampBuildingUnits,
		HUB_PRICE,
		PLANS,
		type Plan
	} from './data';
	import Icon from './Icon.svelte';
	import { useRegion } from './region.svelte';
	import Segmented from './Segmented.svelte';
	import { useToaster } from './toasts.svelte';

	type Field = 'email' | 'postcode';

	let {
		plan = $bindable(),
		note = $bindable(),
		units = $bindable()
	}: { plan: Plan['id']; note: string; units: number } = $props();

	const region = useRegion();
	const toaster = useToaster();

	const NOTE_LIMIT = 200;
	const SUBMIT_DELAY_MS = 900;
	const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

	let email = $state('');
	let postcode = $state('');
	let errors = $state<Record<Field, string>>({ email: '', postcode: '' });
	let status = $state<'editing' | 'submitting' | 'reserved'>('editing');
	let form = $state<HTMLFormElement>();

	const planName = $derived(PLANS.find((candidate) => candidate.id === plan)?.name ?? '');
	const hubTotal = $derived(plan === 'building' ? BUILDING_HUB_PRICE * units : HUB_PRICE);

	function validate(field: Field): string {
		if (field === 'email') {
			const value = email.trim();
			if (value === '') return 'Enter your email so we can tell you when it ships.';
			if (!EMAIL_PATTERN.test(value)) return 'That email looks incomplete. Check for a typo after the @.';
			return '';
		}
		const value = postcode.trim();
		if (value === '') return 'Enter your ZIP or postcode to check your tariff area.';
		if (!/^[a-z0-9][a-z0-9 -]{2,9}$/i.test(value)) return 'Use 3 to 10 letters or numbers.';
		return '';
	}

	/** Punish late, reward early: show errors on blur, clear them as soon as the value is valid. */
	function onBlur(field: Field) {
		errors[field] = validate(field);
	}
	function onInput(field: Field) {
		if (errors[field] && validate(field) === '') errors[field] = '';
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		errors = { email: validate('email'), postcode: validate('postcode') };
		const firstInvalid = (['email', 'postcode'] as const).find((field) => errors[field]);
		if (firstInvalid) {
			form?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
			return;
		}

		status = 'submitting';
		await new Promise((resolve) => setTimeout(resolve, SUBMIT_DELAY_MS));
		status = 'reserved';
		toaster.show(`Hub reserved for ${email.trim()}`, {
			tone: 'neutral',
			action: { label: 'Undo', run: cancelReservation }
		});
	}

	async function cancelReservation() {
		status = 'editing';
		await tick();
		form?.querySelector<HTMLInputElement>('[name="email"]')?.focus();
	}
</script>

<section class="section" id="ebb-reserve" tabindex="-1" aria-labelledby="reserve-title">
	<div class="container">
		<div class="card">
			<div class="pitch">
				<h2 class="h2" id="reserve-title">Reserve a hub for January</h2>
				<p class="lede">
					The first batch ships in January 2027. Reserving holds one for you and costs nothing today.
				</p>
				<ul class="promises">
					<li><Icon name="check" size={16} />No charge until your hub ships</li>
					<li><Icon name="check" size={16} />Cancel any time with one email</li>
					<li><Icon name="check" size={16} />30 days to send it back after it arrives</li>
				</ul>
			</div>

			<div class="form-area">
				{#if status === 'reserved'}
					<div class="done" role="status">
						<svg class="done-mark" viewBox="0 0 48 48" aria-hidden="true">
							<circle cx="24" cy="24" r="22" />
							<path d="M15 24.5l6 6L33 18" pathLength="1" />
						</svg>
						<h3>Your hub is reserved</h3>
						<p>We’ll email {email.trim()} before it ships. Nothing is charged until then.</p>
						<dl class="receipt">
							<div><dt>Plan</dt><dd>{planName}</dd></div>
							{#if plan === 'building'}
								<div><dt>Hubs</dt><dd class="num">{units}</dd></div>
							{/if}
							<div><dt>Due when it ships</dt><dd class="num">{region.money(hubTotal, 0)}</dd></div>
							<div><dt>Area</dt><dd class="num">{postcode.trim().toUpperCase()}</dd></div>
						</dl>
						<button type="button" class="btn btn-secondary" onclick={cancelReservation}>
							Edit reservation
						</button>
					</div>
				{:else}
					<form bind:this={form} onsubmit={submit} novalidate>
						<div class="field">
							<label for="reserve-email">Email</label>
							<input
								id="reserve-email"
								name="email"
								type="email"
								autocomplete="email"
								placeholder="you@example.com"
								bind:value={email}
								onblur={() => onBlur('email')}
								oninput={() => onInput('email')}
								aria-invalid={errors.email ? 'true' : undefined}
								aria-describedby="reserve-email-error"
							/>
							{@render fieldError('reserve-email-error', errors.email)}
						</div>

						<div class="field">
							<label for="reserve-postcode">ZIP or postcode</label>
							<input
								id="reserve-postcode"
								name="postcode"
								type="text"
								autocomplete="postal-code"
								placeholder="94110"
								bind:value={postcode}
								onblur={() => onBlur('postcode')}
								oninput={() => onInput('postcode')}
								aria-invalid={errors.postcode ? 'true' : undefined}
								aria-describedby="reserve-postcode-error"
							/>
							{@render fieldError('reserve-postcode-error', errors.postcode)}
						</div>

						<div class="field">
							<span class="label" aria-hidden="true">Plan</span>
							<Segmented
								label="Plan"
								options={PLANS.map((option) => ({ value: option.id, label: option.name }))}
								bind:value={plan}
							/>
						</div>

						{#if plan === 'building'}
							<div class="field">
								<label for="reserve-units">Number of hubs</label>
								<input
									id="reserve-units"
									name="units"
									type="number"
									inputmode="numeric"
									min={BUILDING_MIN_UNITS}
									max={BUILDING_MAX_UNITS}
									value={units}
									onchange={(event) => (units = clampBuildingUnits(Number(event.currentTarget.value)))}
									class="units-input"
								/>
							</div>
						{/if}

						<div class="field">
							<div class="label-row">
								<label for="reserve-note">What should Ebb run? <span class="optional">Optional</span></label>
								<span class="num counter" class:is-full={note.length >= NOTE_LIMIT}>
									{note.length}/{NOTE_LIMIT}
								</span>
							</div>
							<textarea
								id="reserve-note"
								name="note"
								rows="3"
								maxlength={NOTE_LIMIT}
								placeholder="A 7 kW charger and a heat pump with SG Ready"
								bind:value={note}
							></textarea>
						</div>

						<button
							type="submit"
							class="btn btn-ink btn-lg submit"
							disabled={status === 'submitting'}
							aria-busy={status === 'submitting'}
						>
							<span class="submit-label" class:is-hidden={status === 'submitting'}>
								Reserve, pay {region.money(hubTotal, 0)} when it ships
							</span>
							{#if status === 'submitting'}
								<span class="spinner" aria-label="Reserving"></span>
							{/if}
						</button>
					</form>
				{/if}
			</div>
		</div>
	</div>
</section>

{#snippet fieldError(id: string, message: string)}
	<div class="field-error" class:is-visible={message !== ''} {id} aria-live="polite">
		<div>
			<p><Icon name="alert" size={14} />{message}</p>
		</div>
	</div>
{/snippet}

<style>
	.card {
		display: grid;
		gap: 40px;
		padding: 24px;
		border-radius: 28px;
		background: var(--bg);
		box-shadow: var(--shadow-panel);
	}
	@media (min-width: 1024px) {
		.card {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			gap: 64px;
			padding: 56px;
		}
	}
	.promises {
		display: grid;
		gap: 12px;
		margin: 32px 0 0;
		padding: 0;
		list-style: none;
		font-size: 15px;
	}
	.promises li {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.promises :global(svg) {
		color: var(--accent);
	}

	form {
		display: grid;
		gap: 20px;
	}
	.field {
		display: grid;
		gap: 8px;
	}
	label,
	.label {
		font-size: 14px;
		font-weight: 500;
	}
	.label-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}
	.optional {
		color: var(--fg-2);
		font-weight: 400;
	}
	.counter {
		color: var(--fg-3);
		font-size: 12px;
	}
	.counter.is-full {
		color: var(--warning);
	}

	input,
	textarea {
		width: 100%;
		border: 0;
		border-radius: 12px;
		background: #fff;
		box-shadow: var(--shadow-btn);
		color: var(--fg);
		font: 400 16px/1.4 var(--font);
		transition: box-shadow 150ms var(--ease-out);
	}
	input {
		height: 44px;
		padding: 0 14px;
	}
	textarea {
		padding: 12px 14px;
		resize: vertical;
	}
	input::placeholder,
	textarea::placeholder {
		color: var(--fg-3);
	}
	input:focus,
	textarea:focus {
		outline: none;
		box-shadow:
			0 0 0 1px var(--accent),
			0 0 0 4px var(--ring);
	}
	input[aria-invalid='true'] {
		box-shadow:
			0 0 0 1px var(--danger),
			0 0 0 4px rgb(220 38 38 / 0.12);
	}
	.units-input {
		max-width: 160px;
		font-family: var(--mono);
	}

	.field-error {
		display: grid;
		grid-template-rows: 0fr;
		margin-top: -8px;
		opacity: 0;
		transform: translateY(-4px);
		transition:
			grid-template-rows 200ms var(--ease-out),
			margin-top 200ms var(--ease-out),
			opacity 160ms var(--ease-out),
			transform 200ms var(--ease-out);
	}
	.field-error.is-visible {
		grid-template-rows: 1fr;
		margin-top: 0;
		opacity: 1;
		transform: none;
	}
	.field-error > div {
		overflow: hidden;
	}
	.field-error p {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 0;
		color: var(--danger);
		font-size: 13px;
	}
	.field-error :global(svg) {
		flex-shrink: 0;
	}

	.submit {
		position: relative;
		width: 100%;
		margin-top: 4px;
	}
	.submit:disabled {
		opacity: 1;
		cursor: progress;
	}
	.submit-label {
		transition:
			opacity 150ms var(--ease-out),
			filter 150ms var(--ease-out);
	}
	.submit-label.is-hidden {
		opacity: 0;
		filter: blur(2px);
	}
	.spinner {
		position: absolute;
		width: 16px;
		height: 16px;
		border: 1.5px solid rgb(255 255 255 / 0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 700ms linear infinite;
	}

	.done {
		display: grid;
		justify-items: start;
		gap: 8px;
		animation: done-in 350ms var(--ease-out);
	}
	.done-mark {
		width: 48px;
		height: 48px;
		margin-bottom: 8px;
	}
	.done-mark circle {
		fill: var(--accent-soft);
	}
	.done-mark path {
		fill: none;
		stroke: var(--accent);
		stroke-width: 2.5;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 1;
		animation: check-draw 300ms var(--ease-out) 150ms backwards;
	}
	.done h3 {
		margin: 0;
		font-size: 24px;
		font-weight: 500;
		letter-spacing: -0.025em;
	}
	.done > p {
		margin: 0;
		color: var(--fg-2);
	}
	.receipt {
		display: grid;
		width: 100%;
		margin: 16px 0 24px;
		border-top: 1px solid var(--border);
	}
	.receipt div {
		display: flex;
		justify-content: space-between;
		padding: 12px 0;
		border-bottom: 1px solid var(--border);
		font-size: 14px;
	}
	.receipt dt {
		color: var(--fg-2);
	}
	.receipt dd {
		margin: 0;
		font-weight: 500;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes check-draw {
		from {
			stroke-dashoffset: 1;
		}
	}
	@keyframes done-in {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}
</style>
