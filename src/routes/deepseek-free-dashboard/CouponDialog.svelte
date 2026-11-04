<script lang="ts">
	import { Dialog, DropdownMenu } from 'bits-ui';
	import { tick } from 'svelte';
	import Icon from './Icon.svelte';
	import { isoDate, type Coupon } from './data';

	type Props = {
		open: boolean;
		existingCodes: string[];
		onclose: () => void;
		onsave: (coupon: Coupon) => void;
	};

	let { open, existingCodes, onclose, onsave }: Props = $props();

	let code = $state('');
	let kind = $state<'percent' | 'amount'>('percent');
	let valueText = $state('20');
	let applies = $state('All plans');
	let limitText = $state('100');
	let expires = $state('2026-12-31');
	let errors = $state<{ code?: string; value?: string }>({});
	let saving = $state(false);
	let codeInput = $state<HTMLInputElement | null>(null);
	let timer: ReturnType<typeof setTimeout> | null = null;

	const appliesOptions = ['All plans', 'Studio', 'Annual plans', 'New customers'];

	$effect(() => {
		if (open) {
			code = '';
			kind = 'percent';
			valueText = '20';
			applies = 'All plans';
			limitText = '100';
			expires = isoDate(new Date(2026, 11, 31));
			errors = {};
			saving = false;
			tick().then(() => codeInput?.focus());
		}
	});

	const numericValue = $derived(Number(valueText.replace(/[^0-9.]/g, '')));
	const preview = $derived(
		numericValue > 0
			? kind === 'percent'
				? `${numericValue}% off`
				: `$${numericValue} off`
			: 'No discount yet'
	);

	function validate(): boolean {
		const next: typeof errors = {};
		if (!code.trim()) next.code = 'Add a code customers can enter.';
		else if (!/^[A-Z0-9-]{3,20}$/.test(code))
			next.code = 'Use 3–20 letters, numbers or dashes.';
		else if (existingCodes.includes(code)) next.code = 'That code already exists.';
		if (!Number.isFinite(numericValue) || numericValue <= 0) next.value = 'Enter a discount.';
		else if (kind === 'percent' && numericValue > 100) next.value = 'Keep it at 100% or less.';
		errors = next;
		return Object.keys(next).length === 0;
	}

	function save() {
		if (!validate()) {
			tick().then(() => {
				(document.querySelector('[data-coupon-invalid="true"]') as HTMLElement | null)?.focus();
			});
			return;
		}
		saving = true;
		timer = setTimeout(() => {
			saving = false;
			onsave({
				id: 'cpn_' + Date.now().toString(36),
				code,
				kind,
				value: Math.round(numericValue * 100) / 100,
				applies,
				redemptions: 0,
				limit: limitText ? Math.max(1, Math.round(Number(limitText))) : null,
				status: 'active',
				expires: expires || null
			});
		}, 380);
	}

	$effect(() => {
		return () => {
			if (timer) clearTimeout(timer);
		};
	});

	function handleOpenChange(next: boolean) {
		if (!next && !saving) onclose();
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay class="cd-overlay" />
		<Dialog.Content class="cd-modal" aria-describedby={undefined}>
			<div class="head">
				<div>
					<p class="kicker">Discount</p>
					<Dialog.Title class="cd-title">New coupon</Dialog.Title>
				</div>
				<button class="icon-btn" type="button" onclick={onclose} aria-label="Close dialog">
					<Icon name="x" size={16} />
				</button>
			</div>

			<div class="body">
				<div class="field">
					<label for="coupon-code">Code</label>
					<div class="code-wrap" class:invalid={!!errors.code}>
						<span class="hash" aria-hidden="true">#</span>
						<input
							id="coupon-code"
							bind:this={codeInput}
							bind:value={code}
							oninput={() => {
								code = code.toUpperCase().replace(/[^A-Z0-9-]/g, '');
								if (errors.code) errors = { ...errors, code: undefined };
							}}
							placeholder="SPRING25"
							class="code-input"
							autocomplete="off"
							spellcheck="false"
							data-coupon-invalid={errors.code ? 'true' : undefined}
						/>
					</div>
					<div class="err" data-visible={errors.code ? 'true' : undefined}>
						<div>
							{#if errors.code}<span class="err-text"><Icon name="info" size={13} />{errors.code}</span>{/if}
						</div>
					</div>
				</div>

				<div class="field">
					<span class="field-label">Discount type</span>
					<div class="segmented" style="--i:{kind === 'percent' ? 0 : 1}">
						<span class="seg-thumb"></span>
						<button
							type="button"
							class="seg"
							class:active={kind === 'percent'}
							onclick={() => (kind = 'percent')}
						>Percentage</button>
						<button
							type="button"
							class="seg"
							class:active={kind === 'amount'}
							onclick={() => (kind = 'amount')}
						>Fixed amount</button>
					</div>
				</div>

				<div class="two">
					<div class="field">
						<label for="coupon-value">Amount</label>
						<div class="input-wrap" class:invalid={!!errors.value}>
							<span class="prefix">{kind === 'percent' ? '%' : '$'}</span>
							<input
								id="coupon-value"
								bind:value={valueText}
								inputmode="decimal"
								class="bare"
								data-coupon-invalid={errors.value ? 'true' : undefined}
								oninput={() => {
									if (errors.value) errors = { ...errors, value: undefined };
								}}
							/>
							<span class="suffix">{kind === 'percent' ? 'off' : 'USD'}</span>
						</div>
						<div class="err" data-visible={errors.value ? 'true' : undefined}>
							<div>
								{#if errors.value}<span class="err-text"><Icon name="info" size={13} />{errors.value}</span>{/if}
							</div>
						</div>
					</div>

					<div class="field">
						<label for="coupon-limit">Redemption limit</label>
						<input id="coupon-limit" bind:value={limitText} class="input" inputmode="numeric" />
					</div>
				</div>

				<div class="two">
					<div class="field">
						<span class="field-label">Applies to</span>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger class="cd-select">
								{applies}
								<Icon name="chevron-down" size={14} />
							</DropdownMenu.Trigger>
							<DropdownMenu.Portal>
								<DropdownMenu.Content class="cd-menu" sideOffset={6} align="start">
									<DropdownMenu.RadioGroup bind:value={applies}>
										{#each appliesOptions as option}
											<DropdownMenu.RadioItem value={option} class="cd-menu-item">
												<Icon name="check" size={14} cls="check" />
												{option}
											</DropdownMenu.RadioItem>
										{/each}
									</DropdownMenu.RadioGroup>
								</DropdownMenu.Content>
							</DropdownMenu.Portal>
						</DropdownMenu.Root>
					</div>

					<div class="field">
						<label for="coupon-expiry">Expires</label>
						<input id="coupon-expiry" type="date" bind:value={expires} class="input" />
					</div>
				</div>

				<div class="preview">
					<div class="ticket" aria-hidden="true"><Icon name="ticket" size={17} /></div>
					<div class="preview-copy">
						<p class="preview-code">{code || 'YOURCODE'}</p>
						<p class="preview-meta">{preview} · {applies}</p>
					</div>
					<span class="preview-pill">Ready</span>
				</div>
			</div>

			<div class="foot">
				<button type="button" class="btn ghost" onclick={onclose} disabled={saving}>Cancel</button>
				<button type="button" class="btn primary" onclick={save} disabled={saving}>
					{#if saving}<span class="spinner" aria-hidden="true"></span> Creating…{:else}Create coupon{/if}
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	:global(.cd-overlay) {
		position: fixed;
		inset: 0;
		background: rgb(15 15 15 / 0.34);
		z-index: 80;
		animation: fade-in 200ms ease-out;
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}
	@keyframes modal-in {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.96);
		}
	}
	:global(.cd-modal) {
		position: fixed;
		z-index: 81;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: min(464px, calc(100vw - 32px));
		max-height: calc(100dvh - 48px);
		display: flex;
		flex-direction: column;
		background: #fff;
		border-radius: 18px;
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.06),
			0 24px 64px -12px rgb(0 0 0 / 0.24);
		animation: modal-in 260ms cubic-bezier(0.23, 1, 0.32, 1);
		outline: none;
	}
	.head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		padding: 20px 20px 14px;
	}
	.kicker {
		font-size: 11.5px;
		color: var(--fg2);
		margin: 0 0 3px;
	}
	:global(.cd-title) {
		font-size: 19px;
		font-weight: 600;
		letter-spacing: -0.02em;
		margin: 0;
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
	}
	.icon-btn:hover {
		background: #f4f4f4;
		color: var(--fg);
	}
	.body {
		padding: 4px 20px 8px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 15px;
	}
	.field {
		display: flex;
		flex-direction: column;
	}
	.field label,
	.field-label {
		font-size: 12.5px;
		font-weight: 500;
		margin-bottom: 6px;
		color: var(--fg);
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
		font-family: inherit;
		color: var(--fg);
		outline: none;
		transition: box-shadow 150ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.input:focus {
		box-shadow: 0 0 0 1px var(--accent), 0 0 0 4px var(--ring);
	}
	.code-wrap {
		display: flex;
		align-items: center;
		height: 42px;
		border-radius: 9px;
		box-shadow: 0 0 0 1px var(--line);
		background: #fff;
		transition: box-shadow 150ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.code-wrap:focus-within {
		box-shadow: 0 0 0 1px var(--accent), 0 0 0 4px var(--ring);
	}
	.code-wrap.invalid {
		box-shadow: 0 0 0 1px var(--danger), 0 0 0 4px rgb(220 38 38 / 0.12);
	}
	.hash {
		padding: 0 8px 0 12px;
		color: var(--fg3);
		font-size: 14px;
	}
	.code-input {
		flex: 1;
		min-width: 0;
		height: 100%;
		border: 0;
		outline: none;
		background: transparent;
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 14px;
		letter-spacing: 0.04em;
		color: var(--fg);
		text-transform: uppercase;
	}
	.input-wrap {
		display: flex;
		align-items: center;
		height: 38px;
		border-radius: 9px;
		box-shadow: 0 0 0 1px var(--line);
		background: #fff;
		transition: box-shadow 150ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.input-wrap:focus-within {
		box-shadow: 0 0 0 1px var(--accent), 0 0 0 4px var(--ring);
	}
	.input-wrap.invalid {
		box-shadow: 0 0 0 1px var(--danger), 0 0 0 4px rgb(220 38 38 / 0.12);
	}
	.prefix,
	.suffix {
		font-size: 12.5px;
		color: var(--fg3);
		padding: 0 9px;
	}
	.prefix {
		padding-right: 0;
	}
	.bare {
		flex: 1;
		min-width: 0;
		border: 0;
		outline: none;
		background: transparent;
		height: 100%;
		font-size: 14px;
		font-family: inherit;
		font-variant-numeric: tabular-nums;
	}
	.two {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		align-items: start;
	}
	.segmented {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2px;
		padding: 3px;
		background: #f4f4f4;
		border-radius: 9px;
	}
	.seg-thumb {
		position: absolute;
		top: 3px;
		bottom: 3px;
		left: 3px;
		width: calc((100% - 8px) / 2);
		border-radius: 7px;
		background: #fff;
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
		transform: translateX(calc(var(--i) * (100% + 2px)));
		transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
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
	}
	.seg.active {
		color: var(--fg);
	}
	:global(.cd-select) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		width: 100%;
		height: 38px;
		padding: 0 11px;
		border: 0;
		border-radius: 9px;
		background: #fff;
		box-shadow: 0 0 0 1px var(--line);
		font-family: inherit;
		font-size: 13px;
		color: var(--fg);
		text-align: left;
	}
	:global(.cd-select:hover) {
		box-shadow: 0 0 0 1px #dedede;
	}
	:global(.cd-menu) {
		z-index: 100;
		min-width: 190px;
		background: #fff;
		border-radius: 10px;
		padding: 4px;
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.06),
			0 8px 24px -4px rgb(0 0 0 / 0.12);
		transform-origin: top;
		animation: menu-in 160ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	@keyframes menu-in {
		from {
			opacity: 0;
			transform: scale(0.96) translateY(-3px);
		}
	}
	:global(.cd-menu-item) {
		display: flex;
		align-items: center;
		gap: 7px;
		height: 32px;
		padding: 0 8px;
		border-radius: 7px;
		font-size: 13px;
		color: var(--fg);
		outline: none;
	}
	:global(.cd-menu-item[data-highlighted]) {
		background: #f5f5f5;
	}
	:global(.cd-menu-item) :global(.check) {
		visibility: hidden;
		color: var(--accent);
	}
		:global(.cd-menu-item[data-state='checked']) :global(.check) {
		visibility: visible;
	}
	.err {
		display: grid;
		grid-template-rows: 0fr;
		opacity: 0;
		transition:
			grid-template-rows 200ms cubic-bezier(0.23, 1, 0.32, 1),
			opacity 160ms ease;
	}
	.err[data-visible='true'] {
		grid-template-rows: 1fr;
		opacity: 1;
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
	.preview {
		display: flex;
		align-items: center;
		gap: 11px;
		padding: 11px 12px;
		border-radius: 11px;
		background: #fafafa;
		box-shadow: inset 0 0 0 1px #ededed;
	}
	.ticket {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 8px;
		background: #fff;
		box-shadow: 0 0 0 1px var(--line);
		color: var(--fg2);
	}
	.preview-copy {
		min-width: 0;
		flex: 1;
	}
	.preview-code {
		margin: 0;
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 12.5px;
		font-weight: 500;
		letter-spacing: 0.03em;
		color: var(--fg);
	}
	.preview-meta {
		margin: 2px 0 0;
		font-size: 11.5px;
		color: var(--fg2);
	}
	.preview-pill {
		font-size: 11px;
		font-weight: 500;
		color: var(--fg2);
		background: #fff;
		border-radius: 999px;
		padding: 3px 8px;
		box-shadow: 0 0 0 1px var(--line);
	}
	.foot {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 14px 20px 18px;
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
			background 150ms ease;
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
		.two {
			grid-template-columns: 1fr;
			gap: 15px;
		}
		.foot .btn {
			flex: 1;
			height: 42px;
		}
		.body {
			padding: 4px 16px 8px;
		}
		.head {
			padding: 16px 16px 12px;
		}
		.foot {
			padding: 12px 16px calc(14px + env(safe-area-inset-bottom));
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.cd-overlay),
		:global(.cd-modal),
		:global(.cd-menu) {
			animation: none !important;
		}
		.seg-thumb {
			transition: none !important;
		}
	}
</style>
