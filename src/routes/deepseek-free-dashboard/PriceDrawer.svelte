<script lang="ts">
	import { Dialog, Switch } from 'bits-ui';
	import { tick } from 'svelte';
	import Icon from './Icon.svelte';
	import {
		intervalLabel,
		intervalShort,
		money,
		type Interval,
		type Plan,
		type PriceDraft,
		type PriceStatus
	} from './data';

	type Props = {
		open: boolean;
		plan: Plan | null;
		onclose: () => void;
		onsave: (draft: PriceDraft, isNew: boolean) => void;
	};

	let { open, plan, onclose, onsave }: Props = $props();

	let name = $state('');
	let desc = $state('');
	let priceText = $state('');
	let interval = $state<Interval>('month');
	let status = $state<PriceStatus>('active');
	let seats = $state(3);
	let popular = $state(false);
	let errors = $state<{ name?: string; price?: string }>({});
	let saving = $state(false);
	let nameInput = $state<HTMLInputElement | null>(null);
	let timer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (open) {
			name = plan?.name ?? '';
			desc = plan?.desc ?? '';
			priceText = plan ? String(plan.price) : '';
			interval = plan?.interval ?? 'month';
			status = plan?.status ?? 'draft';
			seats = plan?.seats ?? 3;
			popular = plan?.popular ?? false;
			errors = {};
			saving = false;
			tick().then(() => nameInput?.focus());
		}
	});

	$effect(() => {
		return () => {
			if (timer) clearTimeout(timer);
		};
	});

	const parsedPrice = $derived(Number(priceText.replace(/[^0-9.]/g, '')));
	const previewName = $derived(name.trim() || 'Untitled price');
	const previewPrice = $derived(
		Number.isFinite(parsedPrice) && parsedPrice > 0 ? money(parsedPrice) : '$0'
	);

	function clearError(field: 'name' | 'price') {
		if (errors[field]) errors = { ...errors, [field]: undefined };
	}

	function validate(): boolean {
		const next: typeof errors = {};
		if (!name.trim()) next.name = 'Give this price a name so your team can find it.';
		else if (name.trim().length < 2) next.name = 'Use at least 2 characters.';
		const price = Number(priceText.replace(/[^0-9.]/g, ''));
		if (!priceText.trim()) next.price = 'Enter a price.';
		else if (!Number.isFinite(price) || price <= 0) next.price = 'Price must be greater than $0.';
		else if (price > 100_000) next.price = 'Keep the price under $100,000.';
		errors = next;
		return Object.keys(next).length === 0;
	}

	function save() {
		if (!validate()) {
			tick().then(() => {
				(document.querySelector('[data-invalid="true"]') as HTMLElement | null)?.focus();
			});
			return;
		}
		saving = true;
		const draft: PriceDraft = {
			name: name.trim(),
			desc: desc.trim(),
			price: Math.round(Number(priceText.replace(/[^0-9.]/g, '')) * 100) / 100,
			interval,
			status,
			seats: Math.max(0, Math.min(500, Math.round(seats))),
			popular
		};
		timer = setTimeout(() => {
			saving = false;
			onsave(draft, !plan);
		}, 420);
	}

	function handleOpenChange(next: boolean) {
		if (!next && !saving) onclose();
	}

	function stepSeats(delta: number) {
		seats = Math.max(0, Math.min(500, seats + delta));
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay class="pd-overlay" />
		<Dialog.Content
			class="pd-drawer"
			aria-describedby={undefined}
			onOpenAutoFocus={(event) => {
				event.preventDefault();
				tick().then(() => nameInput?.focus());
			}}
		>
			<div class="drawer-head">
				<div class="head-text">
					<p class="kicker">{plan ? 'Edit price' : 'New price'}</p>
					<Dialog.Title class="pd-title">
						{plan ? plan.name : 'Add a price'}
					</Dialog.Title>
				</div>
				<button class="icon-btn" type="button" onclick={onclose} aria-label="Close panel">
					<Icon name="x" size={16} />
				</button>
			</div>

			<div class="drawer-body">
				<div class="preview">
					<div class="preview-top">
						<span class="preview-label">Checkout preview</span>
						<span class="preview-plan">
							{previewName}
							{#if popular}<span class="mini-tag">Popular</span>{/if}
						</span>
					</div>
					<div class="preview-price">
						<span class="preview-amount">{previewPrice}</span>
						<span class="preview-interval">{intervalShort(interval)}</span>
					</div>
					<p class="preview-meta">
						{intervalLabel(interval)} billing · {seats} {seats === 1 ? 'seat' : 'seats'} included
					</p>
				</div>

				<div class="field">
					<label for="price-name">Name</label>
					<input
						id="price-name"
						bind:this={nameInput}
						bind:value={name}
						class="input"
						data-invalid={errors.name ? 'true' : undefined}
						placeholder="Studio"
						autocomplete="off"
						oninput={() => clearError('name')}
						onblur={() => {
							if (!name.trim())
								errors = { ...errors, name: 'Give this price a name so your team can find it.' };
						}}
					/>
					<div class="err" data-visible={errors.name ? 'true' : undefined}>
						<div>
							{#if errors.name}<span class="err-text"><Icon name="info" size={13} />{errors.name}</span>{/if}
						</div>
					</div>
				</div>

				<div class="field">
					<label for="price-desc">Description</label>
					<textarea
						id="price-desc"
						bind:value={desc}
						class="input textarea"
						rows="2"
						maxlength="120"
						placeholder="What this plan includes"
					></textarea>
					<div class="counter">{desc.length}/120</div>
				</div>

				<div class="field">
					<label for="price-amount">Price</label>
					<div class="price-wrap" class:invalid={!!errors.price}>
						<span class="prefix">$</span>
						<input
							id="price-amount"
							bind:value={priceText}
							class="price-input"
							inputmode="decimal"
							placeholder="49"
							data-invalid={errors.price ? 'true' : undefined}
							oninput={() => clearError('price')}
						/>
						<span class="suffix">{intervalShort(interval)}</span>
					</div>
					<div class="err" data-visible={errors.price ? 'true' : undefined}>
						<div>
							{#if errors.price}<span class="err-text"><Icon name="info" size={13} />{errors.price}</span>{/if}
						</div>
					</div>
				</div>

				<div class="field">
					<span class="field-label">Billing interval</span>
					<div class="segmented" style="--i:{interval === 'month' ? 0 : 1}">
						<span class="seg-thumb"></span>
						<button
							type="button"
							class="seg"
							class:active={interval === 'month'}
							onclick={() => (interval = 'month')}
						>Monthly</button>
						<button
							type="button"
							class="seg"
							class:active={interval === 'year'}
							onclick={() => (interval = 'year')}
						>Annual</button>
					</div>
				</div>

				<div class="field">
					<span class="field-label">Status</span>
					<div class="segmented three" style="--i:{status === 'active' ? 0 : status === 'draft' ? 1 : 2}">
						<span class="seg-thumb"></span>
						<button
							type="button"
							class="seg"
							class:active={status === 'active'}
							onclick={() => (status = 'active')}
						>Active</button>
						<button
							type="button"
							class="seg"
							class:active={status === 'draft'}
							onclick={() => (status = 'draft')}
						>Draft</button>
						<button
							type="button"
							class="seg"
							class:active={status === 'archived'}
							onclick={() => (status = 'archived')}
						>Archived</button>
					</div>
					<p class="help">
						{status === 'active'
							? 'Available at checkout right away.'
							: status === 'draft'
								? 'Visible to your team only until you publish it.'
								: 'Hidden from checkout. Existing subscriptions keep this price.'}
					</p>
				</div>

				<div class="split">
					<div class="field">
						<span class="field-label">Seats included</span>
						<div class="stepper">
							<button type="button" onclick={() => stepSeats(-1)} aria-label="Remove a seat">
								<span aria-hidden="true">−</span>
							</button>
							<input
								bind:value={seats}
								type="number"
								min="0"
								max="500"
								aria-label="Seats included"
							/>
							<button type="button" onclick={() => stepSeats(1)} aria-label="Add a seat">
								<Icon name="plus" size={13} />
							</button>
						</div>
					</div>

					<div class="field switch-field">
						<span class="field-label">Highlight at checkout</span>
						<div class="switch-row">
							<Switch.Root bind:checked={popular} class="pd-switch" aria-label="Highlight this price">
								<Switch.Thumb class="pd-thumb" />
							</Switch.Root>
							<span class="switch-label">{popular ? 'Marked as popular' : 'Not highlighted'}</span>
						</div>
					</div>
				</div>

				<div class="note">
					<Icon name="info" size={15} />
					<p>
						New prices apply at checkout immediately. Existing subscriptions keep their current
						price until they change plans.
					</p>
				</div>
			</div>

			<div class="drawer-foot">
				<button type="button" class="btn ghost" onclick={onclose} disabled={saving}>Cancel</button>
				<button type="button" class="btn primary" onclick={save} disabled={saving}>
					{#if saving}
						<span class="spinner" aria-hidden="true"></span>
						Saving…
					{:else}
						{plan ? 'Save changes' : 'Create price'}
					{/if}
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	:global(.pd-overlay) {
		position: fixed;
		inset: 0;
		background: rgb(15 15 15 / 0.34);
		z-index: 80;
		animation: overlay-in 200ms ease-out;
	}
		:global(.pd-overlay[data-state='closed']) {
		animation: overlay-out 140ms ease-in forwards;
	}
	@keyframes overlay-in {
		from {
			opacity: 0;
		}
	}
	@keyframes overlay-out {
		to {
			opacity: 0;
		}
	}

	:global(.pd-drawer) {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: min(448px, 100vw);
		background: #fff;
		z-index: 81;
		display: flex;
		flex-direction: column;
		box-shadow: -24px 0 60px -20px rgb(0 0 0 / 0.2), 0 0 0 1px rgb(0 0 0 / 0.05);
		animation: drawer-in 300ms cubic-bezier(0.32, 0.72, 0, 1);
		outline: none;
	}
	:global(.pd-drawer[data-state='closed']) {
		animation: drawer-out 200ms cubic-bezier(0.4, 0, 1, 1) forwards;
	}
	@keyframes drawer-in {
		from {
			transform: translateX(100%);
		}
	}
	@keyframes drawer-out {
		to {
			transform: translateX(100%);
		}
	}

	.drawer-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		padding: 20px 20px 16px;
		border-bottom: 1px solid var(--line);
	}
	.kicker {
		font-size: 11.5px;
		font-weight: 500;
		letter-spacing: 0.02em;
		color: var(--fg2);
		margin: 0 0 4px;
	}
	:global(.pd-title) {
		font-size: 19px;
		line-height: 1.2;
		font-weight: 600;
		letter-spacing: -0.02em;
		margin: 0;
		color: var(--fg);
	}
	.icon-btn {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: var(--fg2);
		flex: none;
		transition:
			background 140ms ease,
			color 140ms ease;
	}
	.icon-btn:hover {
		background: #f4f4f4;
		color: var(--fg);
	}

	.drawer-body {
		flex: 1;
		overflow-y: auto;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.preview {
		background: #fafafa;
		border-radius: 12px;
		box-shadow: inset 0 0 0 1px #ededed;
		padding: 14px 16px;
	}
	.preview-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.preview-label {
		font-size: 11px;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--fg3);
		font-weight: 500;
	}
	.preview-plan {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 12.5px;
		color: var(--fg2);
		max-width: 60%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.mini-tag {
		height: 18px;
		padding: 0 6px;
		border-radius: 5px;
		background: var(--accent-soft);
		color: var(--accent-ink);
		font-size: 10.5px;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
	}
	.preview-price {
		display: flex;
		align-items: baseline;
		gap: 5px;
		margin-top: 8px;
	}
	.preview-amount {
		font-size: 26px;
		font-weight: 600;
		letter-spacing: -0.03em;
		font-variant-numeric: tabular-nums;
	}
	.preview-interval {
		font-size: 13px;
		color: var(--fg3);
	}
	.preview-meta {
		margin: 2px 0 0;
		font-size: 12px;
		color: var(--fg2);
	}

	.field {
		display: flex;
		flex-direction: column;
	}
	.field label,
	.field-label {
		font-size: 12.5px;
		font-weight: 500;
		color: var(--fg);
		margin-bottom: 6px;
	}
	.input {
		width: 100%;
		height: 38px;
		padding: 0 11px;
		border: 0;
		border-radius: 9px;
		background: #fff;
		box-shadow: 0 0 0 1px var(--line);
		font-size: 13.5px;
		color: var(--fg);
		font-family: inherit;
		transition:
			box-shadow 150ms cubic-bezier(0.23, 1, 0.32, 1),
			background 150ms ease;
		outline: none;
	}
	.input::placeholder {
		color: var(--fg3);
	}
	.input:hover {
		box-shadow: 0 0 0 1px #dedede;
	}
	.input:focus {
		box-shadow: 0 0 0 1px var(--accent), 0 0 0 4px var(--ring);
	}
	.input[data-invalid='true'] {
		box-shadow: 0 0 0 1px var(--danger), 0 0 0 4px rgb(220 38 38 / 0.12);
	}
	.textarea {
		height: auto;
		min-height: 58px;
		padding: 9px 11px;
		resize: vertical;
		line-height: 1.45;
	}
	.counter {
		font-size: 11px;
		color: var(--fg3);
		margin-top: 5px;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.price-wrap {
		display: flex;
		align-items: center;
		height: 40px;
		border-radius: 9px;
		background: #fff;
		box-shadow: 0 0 0 1px var(--line);
		transition: box-shadow 150ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.price-wrap:hover {
		box-shadow: 0 0 0 1px #dedede;
	}
	.price-wrap:focus-within {
		box-shadow: 0 0 0 1px var(--accent), 0 0 0 4px var(--ring);
	}
	.price-wrap.invalid {
		box-shadow: 0 0 0 1px var(--danger), 0 0 0 4px rgb(220 38 38 / 0.12);
	}
	.prefix,
	.suffix {
		font-size: 13.5px;
		color: var(--fg3);
		padding: 0 10px;
	}
	.prefix {
		padding-right: 0;
	}
	.price-input {
		flex: 1;
		min-width: 0;
		height: 100%;
		border: 0;
		outline: none;
		background: transparent;
		font-size: 14px;
		font-family: inherit;
		color: var(--fg);
		font-variant-numeric: tabular-nums;
	}

	.err {
		display: grid;
		grid-template-rows: 0fr;
		opacity: 0;
		transform: translateY(-3px);
		transition:
			grid-template-rows 200ms cubic-bezier(0.23, 1, 0.32, 1),
			opacity 160ms ease,
			transform 200ms ease;
	}
	.err[data-visible='true'] {
		grid-template-rows: 1fr;
		opacity: 1;
		transform: none;
	}
	.err > div {
		overflow: hidden;
	}
	.err-text {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 12px;
		color: var(--danger);
		padding-top: 5px;
	}

	.segmented {
		position: relative;
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 2px;
		padding: 3px;
		background: #f4f4f4;
		border-radius: 9px;
	}
	.segmented.three {
		grid-template-columns: repeat(3, 1fr);
	}
	.seg-thumb {
		position: absolute;
		top: 3px;
		bottom: 3px;
		left: 3px;
		width: calc((100% - 10px) / 2);
		border-radius: 7px;
		background: #fff;
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
		transform: translateX(calc(var(--i) * (100% + 2px)));
		transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.segmented.three .seg-thumb {
		width: calc((100% - 12px) / 3);
		transform: translateX(calc(var(--i) * (100% + 2px)));
	}
	.seg {
		position: relative;
		z-index: 1;
		height: 28px;
		border: 0;
		background: transparent;
		border-radius: 7px;
		font-size: 12.5px;
		font-weight: 500;
		font-family: inherit;
		color: var(--fg2);
		transition: color 140ms ease;
	}
	.seg:hover {
		color: var(--fg);
	}
	.seg.active {
		color: var(--fg);
	}
	.help {
		margin: 6px 0 0;
		font-size: 11.5px;
		color: var(--fg3);
	}

	.split {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
		align-items: start;
	}
	.stepper {
		display: flex;
		align-items: center;
		height: 38px;
		border-radius: 9px;
		box-shadow: 0 0 0 1px var(--line);
		overflow: hidden;
	}
	.stepper input {
		width: 100%;
		min-width: 0;
		height: 100%;
		border: 0;
		outline: none;
		text-align: center;
		font-size: 13.5px;
		font-family: inherit;
		font-variant-numeric: tabular-nums;
		color: var(--fg);
		background: #fff;
		-moz-appearance: textfield;
		appearance: textfield;
	}
	.stepper input::-webkit-outer-spin-button,
	.stepper input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	.stepper button {
		display: grid;
		place-items: center;
		width: 34px;
		height: 100%;
		flex: none;
		border: 0;
		background: #fafafa;
		color: var(--fg2);
		font-size: 16px;
		transition:
			background 130ms ease,
			color 130ms ease;
	}
	.stepper button:hover {
		background: #f1f1f1;
		color: var(--fg);
	}
	.switch-field {
		gap: 0;
	}
	.switch-row {
		display: flex;
		align-items: center;
		gap: 9px;
		height: 38px;
	}
	:global(.pd-switch) {
		position: relative;
		width: 36px;
		height: 21px;
		border-radius: 999px;
		border: 0;
		background: #e3e3e3;
		padding: 0;
		transition: background 180ms ease;
		flex: none;
	}
	:global(.pd-switch[data-state='checked']) {
		background: var(--accent);
	}
	:global(.pd-switch:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	:global(.pd-thumb) {
		display: block;
		width: 17px;
		height: 17px;
		border-radius: 999px;
		background: #fff;
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
		transform: translateX(2px);
		transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
	}
		:global(.pd-switch[data-state='checked']) :global(.pd-thumb) {
		transform: translateX(17px);
	}
	.switch-label {
		font-size: 12px;
		color: var(--fg2);
	}

	.note {
		display: flex;
		gap: 9px;
		padding: 11px 12px;
		border-radius: 10px;
		background: #fafafa;
		color: var(--fg2);
	}
	.note :global(svg) {
		color: var(--fg3);
		margin-top: 1px;
	}
	.note p {
		margin: 0;
		font-size: 12px;
		line-height: 1.5;
	}

	.drawer-foot {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 14px 20px;
		border-top: 1px solid var(--line);
		background: #fff;
	}
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		height: 36px;
		padding: 0 14px;
		border-radius: 9px;
		border: 0;
		font-family: inherit;
		font-size: 13px;
		font-weight: 500;
		transition:
			transform 150ms cubic-bezier(0.23, 1, 0.32, 1),
			background 150ms ease,
			box-shadow 150ms ease;
	}
	.btn:active:not(:disabled) {
		transform: scale(0.97);
	}
	.btn:disabled {
		opacity: 0.55;
	}
	.ghost {
		background: transparent;
		color: var(--fg2);
		box-shadow: 0 0 0 1px var(--line);
	}
	.ghost:hover:not(:disabled) {
		background: #f7f7f7;
		color: var(--fg);
	}
	.primary {
		background: var(--accent);
		color: #fff;
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.16),
			0 1px 2px rgb(0 0 0 / 0.16),
			0 0 0 1px color-mix(in oklab, var(--accent), black 12%);
	}
	.primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}
	.spinner {
		width: 13px;
		height: 13px;
		border-radius: 50%;
		border: 1.5px solid rgb(255 255 255 / 0.4);
		border-top-color: #fff;
		animation: spin 620ms linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (max-width: 480px) {
		:global(.pd-drawer) {
			width: 100vw;
		}
		:global(.pd-switch) {
			position: relative;
		}
		:global(.pd-switch)::after {
			content: '';
			position: absolute;
			inset: -12px -6px;
			border-radius: 999px;
		}
		.drawer-head {
			padding: 16px 16px 14px;
		}
		.drawer-body {
			padding: 16px;
		}
		.drawer-foot {
			padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
		}
		.split {
			grid-template-columns: 1fr;
			gap: 16px;
		}
		.btn {
			height: 42px;
		}
		.drawer-foot .btn {
			flex: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.pd-overlay),
		:global(.pd-drawer),
		.seg-thumb,
		:global(.pd-thumb) {
			animation: none !important;
			transition: none !important;
		}
	}
</style>
