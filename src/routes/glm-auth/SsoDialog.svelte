<script lang="ts">
	import { Dialog } from 'bits-ui';
	import Icons from './Icons.svelte';
	import { sleep, SSO_DOMAINS, emailError } from './auth.ts';
	import './dialog.css';

	let {
		open = $bindable(false),
		onsignedin,
		onreturnfocus
	}: {
		open?: boolean;
		onsignedin: (email: string, providerName: string) => void;
		onreturnfocus: () => void;
	} = $props();

	let step = $state<'email' | 'found'>('email');
	let email = $state('');
	let err = $state<string | null>(null);
	let found = $state<{ name: string; kind: string } | null>(null);
	let busy = $state(false);
	let inputEl = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (open) {
			step = 'email';
			email = '';
			err = null;
			found = null;
			busy = false;
			requestAnimationFrame(() => inputEl?.focus());
		}
	});

	async function lookup(e: SubmitEvent) {
		e.preventDefault();
		if (busy) return;
		const v = email.trim();
		const basic = emailError(v);
		if (basic) {
			err = basic;
			return;
		}
		const domain = v.split('@')[1]?.toLowerCase() ?? '';
		const hit = SSO_DOMAINS[domain];
		if (!hit) {
			err = 'We couldn\u2019t find Ledgerline SSO for that domain. Ask your admin to enable it, or use another method.';
			inputEl?.select();
			return;
		}
		err = null;
		busy = true;
		await sleep(700);
		found = hit;
		step = 'found';
		busy = false;
	}

	async function go() {
		if (!found || busy) return;
		busy = true;
		await sleep(1200);
		busy = false;
		open = false;
		onsignedin(email.trim(), found.name);
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="ll-ovl" />
		<Dialog.Content
			class="ll-dlg"
			onCloseAutoFocus={(e) => {
				e.preventDefault();
				onreturnfocus();
			}}
		>
			<Dialog.Close class="ll-dlg-x" aria-label="Close">
				<Icons name="x" size={15} />
			</Dialog.Close>

			{#if step === 'email'}
				<Dialog.Title class="ll-dlg-t">Sign in with SSO</Dialog.Title>
				<Dialog.Description class="ll-dlg-d">
					Use your organisation&rsquo;s identity provider &mdash; no new password needed.
				</Dialog.Description>
				<form novalidate onsubmit={lookup}>
					<label class="ll-lbl" for="sso-email">Work email</label>
					<input
						id="sso-email"
						class="ll-in"
						class:invalid={!!err}
						type="email"
						autocomplete="email"
						placeholder="you@company.co"
						bind:value={email}
						bind:this={inputEl}
						aria-invalid={err ? 'true' : undefined}
					/>
					{#if err}
						<p class="ll-err" role="alert"><Icons name="alert" size={13} /><span>{err}</span></p>
					{/if}
					<button class="ll-primary" type="submit" disabled={busy}>
						{#if busy}
							<span class="ll-spin" aria-hidden="true"></span>Checking your domain…
						{:else}
							Continue
						{/if}
					</button>
				</form>
				<p class="ll-note">Works with Okta, Microsoft Entra ID and Google Workspace.</p>
			{:else if found}
				<Dialog.Title class="ll-dlg-t">Continue with {found.name}</Dialog.Title>
				<Dialog.Description class="ll-dlg-d">{email}</Dialog.Description>
				<div class="ll-prov">
					<span class="ll-prov-tile"><Icons name="building" size={18} /></span>
					<span class="ll-prov-name">{found.name}</span>
					<span class="ll-prov-kind">{found.kind}</span>
				</div>
				<button class="ll-primary" disabled={busy} onclick={go}>
					{#if busy}
						<span class="ll-spin" aria-hidden="true"></span>Connecting…
					{:else}
						Continue with {found.name}
					{/if}
				</button>
				<button class="ll-ghost" disabled={busy} onclick={() => (step = 'email')}>
					Use a different email
				</button>
			{/if}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
