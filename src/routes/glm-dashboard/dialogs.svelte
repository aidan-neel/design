<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { BTN_PRI, BTN_SEC, FAMILY_ORDER, INPUT_CLS } from './data';
	import { store } from './store.svelte';
	import Icon from './Icon.svelte';

	let open = $derived(store.dialog !== null);
	let priceVal = $state('');
	let priceErr = $state('');

	// seed the price input whenever a plan is targeted
	$effect(() => {
		const dlg = store.dialog;
		if (dlg?.kind === 'price') {
			const p = store.plans.find((x) => x.id === dlg.planId);
			priceVal = p ? String(p.price) : '';
			priceErr = '';
		}
	});

	function validatePrice(v: string, num: number) {
		if (v === '') return 'Enter an amount, like 79 or 129.50';
		if (isNaN(num)) return 'Numbers only — no currency symbols';
		if (num < 0) return 'Price cannot be negative';
		if (num > 5000) return 'Keep it under $5,000 per month';
		return '';
	}

	function priceInput(e: Event) {
		priceVal = (e.currentTarget as HTMLInputElement).value;
		priceErr = validatePrice(priceVal, Number(priceVal));
	}

	function savePrice() {
		const n = Number(priceVal);
		const err = validatePrice(priceVal, n);
		if (err) {
			priceErr = err;
			return;
		}
		const dlg = store.dialog;
		const pid = dlg && dlg.kind === 'price' ? dlg.planId : null;
		if (pid === null) return;
		store.setPrice(pid, n);
		store.dialog = null;
	}

	// ---- new price form ----
	let npName = $state('');
	let npFamily = $state('Growth');
	let npCycle = $state<'monthly' | 'annual'>('monthly');
	let npPrice = $state('');
	let npTrial = $state('14');
	let npErr = $state('');

	$effect(() => {
		if (store.dialog?.kind === 'addplan') {
			npName = '';
			npFamily = 'Growth';
			npCycle = 'monthly';
			npPrice = '';
			npTrial = '14';
			npErr = '';
		}
	});

	function createPlan() {
		const name = npName.trim();
		const price = Number(npPrice);
		if (!name || isNaN(price) || npPrice === '' || price < 0 || price > 5000) {
			npErr = !name ? 'Name is required' : 'Enter a valid price';
			return;
		}
		const p = new DOMParser().parseFromString(name, 'text/html');
		store.addPlan({
			id: 'np-' + Date.now(),
			name,
			family: npFamily,
			cycle: npCycle,
			price,
			subscribers: 0,
			status: 'beta',
			trialDays: npTrial === '' || Number.isNaN(Number(npTrial)) ? null : Math.max(0, Number(npTrial)),
			since: 'Draft',
			changed: false
		});
		npErr = '';
		store.dialog = null;
	}

	// ---- profile form ----
	let pfName = $state('');
	let pfEmail = $state('');
	let pfErr = $state('');

	$effect(() => {
		if (store.dialog?.kind === 'profile') {
			pfName = store.prefs.name;
			pfEmail = store.prefs.email;
			pfErr = '';
		}
	});

	function saveProfile() {
		const name = pfName.trim();
		const email = pfEmail.trim();
		if (!name) {
			pfErr = 'Name is required';
			return;
		}
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			pfErr = 'Enter a valid email, like ada@northgate.dev';
			return;
		}
		store.prefs = { name, email };
		store.dialog = null;
		store.toast('Profile saved', name + ' · ' + email);
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/[0.38] anim-overlay" />
		<Dialog.Content
			class="anim-panel fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-48px)] w-[calc(100vw-32px)] max-w-[440px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[20px] bg-white p-5 shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_24px_64px_-12px_rgb(0_0_0/0.24)] outline-none"
		>
			{#if store.dialog?.kind === 'price'}
				{@const targetId = store.dialog.planId}
				{@const pp = store.plans.find((x) => x.id === targetId)}
				{#if pp}
					<Dialog.Title class="text-[16px] font-semibold tracking-[-0.01em] text-[#171717]">Edit price · {pp.name}</Dialog.Title>
					<Dialog.Description class="mt-1 text-[13px] text-[#737373]">
						{pp.cycle === 'annual' ? 'Annual price (billed yearly)' : 'Monthly price'} · {pp.subscribers} subscriber{pp.subscribers === 1 ? '' : 's'} pay this at renewal.
					</Dialog.Description>

					<div class="mt-4">
						<label class="mb-1.5 block text-[13px] font-medium text-[#171717]" for="price-input">Price per month (USD)</label>
						<div
							class="flex h-10 items-center gap-1 rounded-[10px] bg-white px-3 font-normal shadow-[0_0_0_1px_#ececec] transition-shadow duration-150 focus-within:shadow-[0_0_0_1px_#255cd1,0_0_0_4px_#255cd126] {priceErr
								? 'shadow-[0_0_0_1px_#dc2626,0_0_0_4px_#dc26262b] focus-within:shadow-[0_0_0_1px_#dc2626,0_0_0_4px_#dc26262b]'
								: ''}"
						>
							<span class="text-[14px] font-medium text-[#737373]">$</span>
							<input id="price-input" type="number" step="0.5" min="0" max="5000" class="h-full w-full bg-transparent text-[14px] text-[#171717] outline-none" bind:value={priceVal} oninput={priceInput} aria-invalid={!!priceErr} />
							<span class="text-[12.5px] whitespace-nowrap text-[#a3a3a3]">{pp.cycle === 'annual' ? '/ mo · billed yearly' : '/ mo'}</span>
						</div>
						{#if priceErr}
							<p class="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-[#dc2626]">
								<Icon name="alert" size={13} />
								{priceErr}
							</p>
						{/if}
					</div>

					{#if !priceErr && priceVal !== ''}
						{@const before = pp.price * pp.subscribers}
						{@const after = Number(priceVal) * pp.subscribers}
						<div class="mt-4 rounded-[10px] bg-[#f7f7f7] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#525252] shadow-[0_0_0_1px_#ececec]">
							Run-rate MRR would move from <strong class="font-medium text-[#171717]">{'$' + before.toLocaleString('en-US')}</strong> to <strong class="font-medium text-[#171717]">{'$' + after.toLocaleString('en-US')}</strong>
							({after - before >= 0 ? '+' : '-'}{'$' + Math.abs(after - before).toLocaleString('en-US')} / mo) as renewals pick it up.
						</div>
					{/if}

					<div class="mt-5 flex justify-end gap-2">
						<button class={BTN_SEC} onclick={() => (store.dialog = null)}>Cancel</button>
						<button class={BTN_PRI} onclick={savePrice}>Save price</button>
					</div>
				{/if}
			{:else if store.dialog?.kind === 'addplan'}
				<Dialog.Title class="text-[16px] font-semibold tracking-[-0.01em] text-[#171717]">New price</Dialog.Title>
				<Dialog.Description class="mt-1 text-[13px] text-[#737373]">Prices start as a beta draft with 0 subscribers, so nothing is charged until you publish.</Dialog.Description>

				<div class="mt-4 grid grid-cols-1 gap-3">
					<label>
						<span class="mb-1.5 block text-[13px] font-medium text-[#171717]">Name</span>
						<input class={INPUT_CLS} placeholder="Growth (2027 pricing)" bind:value={npName} />
					</label>
					<div class="grid grid-cols-2 gap-3">
						<label>
							<span class="mb-1.5 block text-[13px] font-medium text-[#171717]">Family</span>
							<select class={INPUT_CLS + ' appearance-none pr-8'} bind:value={npFamily}>
								{#each FAMILY_ORDER as f (f)}
									<option value={f}>{f}</option>
								{/each}
							</select>
						</label>
						<label>
							<span class="mb-1.5 block text-[13px] font-medium text-[#171717]">Billing cycle</span>
							<div class="flex h-9 items-center gap-0.5 rounded-[10px] bg-[#f0f0f0] p-0.5">
								<button type="button" class="h-8 flex-1 rounded-[8px] text-[12.5px] font-medium outline-none {npCycle === 'monthly' ? 'bg-white text-[#171717] shadow-[0_0_0_1px_#e8e8e8]' : 'text-[#737373]'}" onclick={() => (npCycle = 'monthly')}>Monthly</button>
								<button type="button" class="h-8 flex-1 rounded-[8px] text-[12.5px] font-medium outline-none {npCycle === 'annual' ? 'bg-white text-[#171717] shadow-[0_0_0_1px_#e8e8e8]' : 'text-[#737373]'}" onclick={() => (npCycle = 'annual')}>Annual</button>
							</div>
						</label>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<label>
							<span class="mb-1.5 block text-[13px] font-medium text-[#171717]">Price / mo (USD)</span>
							<input class={INPUT_CLS} type="number" min="0" step="0.5" placeholder="99" bind:value={npPrice} />
						</label>
						<label>
							<span class="mb-1.5 block text-[13px] font-medium text-[#171717]">Trial days</span>
							<input class={INPUT_CLS} type="number" min="0" step="1" placeholder="0 = no trial" bind:value={npTrial} />
						</label>
					</div>
				</div>
				{#if npErr}
					<p class="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-[#dc2626]">
						<Icon name="alert" size={13} />
						{npErr}
					</p>
				{/if}
				<div class="mt-5 flex justify-end gap-2">
					<button class={BTN_SEC} onclick={() => (store.dialog = null)}>Cancel</button>
					<button class={BTN_PRI} onclick={createPlan}>Create price</button>
				</div>
			{:else if store.dialog?.kind === 'shortcuts'}
				<Dialog.Title class="text-[16px] font-semibold tracking-[-0.01em] text-[#171717]">Keyboard shortcuts</Dialog.Title>
				<Dialog.Description class="mt-1 text-[13px] text-[#737373]">Work the dashboard without leaving the keyboard.</Dialog.Description>
				<ul class="mt-4 divide-y divide-[#f0f0f0]">
					{#each [['/', 'Focus the search box'], ['Esc', 'Close overlays, clear search'], ['1 – 4', 'Jump between views'], ['d', 'Toggle table density']] as row (row[0])}
						<li class="flex items-center justify-between py-2.5 text-[13.5px] text-[#171717]">
							{row[1]}
							<kbd class="grid h-6 min-w-7 place-items-center rounded-md bg-[#f7f7f7] px-1.5 text-[12px] font-medium text-[#737373] shadow-[0_0_0_1px_#ececec]">{row[0]}</kbd>
						</li>
					{/each}
				</ul>
				<div class="mt-4 flex justify-end">
					<button class={BTN_SEC} onclick={() => (store.dialog = null)}>Close</button>
				</div>
			{:else if store.dialog?.kind === 'profile'}
				<Dialog.Title class="text-[16px] font-semibold tracking-[-0.01em] text-[#171717]">Profile & workspace</Dialog.Title>
				<Dialog.Description class="mt-1 text-[13px] text-[#737373]">Changes apply locally in this demo workspace.</Dialog.Description>
				<div class="mt-4 grid grid-cols-1 gap-3">
					<label>
						<span class="mb-1.5 block text-[13px] font-medium text-[#171717]">Name</span>
						<input class={INPUT_CLS} bind:value={pfName} />
					</label>
					<label>
						<span class="mb-1.5 block text-[13px] font-medium text-[#171717]">Email</span>
						<input class={INPUT_CLS} type="email" bind:value={pfEmail} />
					</label>
				</div>
				{#if pfErr}
					<p class="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-[#dc2626]">
						<Icon name="alert" size={13} />
						{pfErr}
					</p>
				{/if}
				<div class="mt-5 flex justify-end gap-2">
					<button class={BTN_SEC} onclick={() => (store.dialog = null)}>Cancel</button>
					<button class={BTN_PRI} onclick={saveProfile}>Save profile</button>
				</div>
			{:else if store.dialog?.kind === 'logout'}
				<Dialog.Title class="text-[16px] font-semibold tracking-[-0.01em] text-[#171717]">Log out of {store.org}?</Dialog.Title>
				<Dialog.Description class="mt-1 text-[13px] text-[#737373]">This demo resets on logout: edited prices, moved subscriptions and created prices are restored to their defaults.</Dialog.Description>
				<div class="mt-5 flex justify-end gap-2">
					<button class={BTN_SEC} onclick={() => (store.dialog = null)}>Stay</button>
					<button
						class={BTN_PRI}
						onclick={() => {
							store.revert();
							store.dialog = null;
							store.toast('Reset to demo defaults', 'All local changes were restored');
						}}
					>
						Log out & reset
					</button>
				</div>
			{/if}
			{#if store.dialog && store.dialog.kind !== 'addplan' && store.dialog.kind !== 'profile'}
				<button
					class="absolute top-4 right-4 grid size-7 cursor-default place-items-center rounded-lg text-[#a3a3a3] transition-colors duration-150 outline-none hover:bg-black/[0.04] hover:text-[#171717] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_#255cd12e]"
					onclick={() => (store.dialog = null)}
					aria-label="Close dialog"
				>
					<Icon name="x" size={15} />
				</button>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input[type='number'] {
		appearance: textfield;
		-moz-appearance: textfield;
	}
	.anim-overlay {
		animation: fade-in 200ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}
	.anim-panel {
		animation: panel-in 250ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	@keyframes panel-in {
		from {
			opacity: 0;
			scale: 0.96;
			translate: 0 8px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.anim-overlay,
		.anim-panel {
			animation: none;
		}
	}
</style>
