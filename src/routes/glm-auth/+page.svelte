<script lang="ts">
	import '@fontsource-variable/inter';
	import { Tooltip } from 'bits-ui';
	import { onDestroy } from 'svelte';
	import { browser } from '$app/env';
	import Icons from './Icons.svelte';
	import Preview from './Preview.svelte';
	import Otp from './Otp.svelte';
	import SsoDialog from './SsoDialog.svelte';
	import LegalDialog from './LegalDialog.svelte';
	import {
		sleep,
		emailError,
		passwordChecks,
		passwordStrength,
		workspaceFromEmail,
		TAKEN_EMAIL,
		BAD_PW,
		PROVIDER_LABEL,
		type View,
		type Provider,
		type Check
	} from './auth.ts';

	/* ---------- view state machine ---------- */
	let shown = $state<View>('signin');
	let leaving = $state(false);
	let vh = $state(0);
	let navTimer: ReturnType<typeof setTimeout> | undefined;

	/* ---------- shared auth state ---------- */
	type Busy =
		| null
		| 'signin'
		| 'google'
		| 'github'
		| 'signup'
		| 'forgot'
		| 'reset'
		| 'verify'
		| 'resend';
	let busy = $state<Busy>(null);
	let banner = $state<string | null>(null);
	let bannerAct: { label: string; run: () => void } | null = $state(null);
	type Session = { email?: string; provider: Provider; providerName?: string };
	let session = $state<Session | null>(null);
	let successKind = $state<'signedin' | 'mail' | 'resetdone'>('signedin');
	let remember = $state(false);
	let caps = $state(false);

	/* ---------- fields ---------- */
	let siEmail = $state('');
	let siPassword = $state('');
	let showSi = $state(false);
	let siEmailErr = $state<string | null>(null);
	let siPwErr = $state<string | null>(null);

	let suName = $state('');
	let suEmail = $state('');
	let suPassword = $state('');
	let showSu = $state(false);
	let terms = $state(false);
	let suNameErr = $state<string | null>(null);
	let suEmailErr = $state<string | null>(null);
	let suPwErr = $state<string | null>(null);
	let termsErr = $state<string | null>(null);

	let fpEmail = $state('');
	let fpEmailErr = $state<string | null>(null);

	let rsEmail = $state('');
	let rsPw = $state('');
	let rsConf = $state('');
	let showRs = $state(false);
	let showRsConf = $state(false);
	let rsPwErr = $state<string | null>(null);
	let rsConfErr = $state<string | null>(null);

	let verifyEmail = $state('');
	let otpErr = $state<string | null>(null);

	let suPwChecks = $derived(passwordChecks(suPassword));
	let suStr = $derived(passwordStrength(suPassword));
	let rsPwChecks = $derived(passwordChecks(rsPw));
	let rsStr = $derived(passwordStrength(rsPw));

	/* ---------- resend cooldown ---------- */
	let cd = $state(0);
	let cdTimer: ReturnType<typeof setInterval> | undefined;
	let resentNote = $state('');
	function startCd(seconds = 30) {
		stopCd();
		cd = seconds;
		cdTimer = setInterval(() => {
			cd -= 1;
			if (cd <= 0) stopCd();
		}, 1000);
	}
	function stopCd() {
		if (cdTimer) clearInterval(cdTimer);
		cdTimer = undefined;
		cd = 0;
	}

	/* ---------- timers ---------- */
	const flowTimers = new Set<ReturnType<typeof setTimeout>>();
	function after(ms: number, fn: () => void) {
		const t = setTimeout(() => {
			flowTimers.delete(t);
			fn();
		}, ms);
		flowTimers.add(t);
	}
	onDestroy(() => {
		stopCd();
		flowTimers.clear();
		if (navTimer) clearTimeout(navTimer);
	});

	/* ---------- element refs ---------- */
	let formEl = $state<HTMLFormElement | null>(null);
	let otpBoxEl = $state<HTMLDivElement | null>(null);
	let otpComp = $state<{ value: () => string; clear: () => void } | null>(null);
	let ssoBtnEl = $state<HTMLButtonElement | null>(null);

	/* ---------- navigation ---------- */
	function swap(next: View, focus = true) {
		if (navTimer) clearTimeout(navTimer);
		leaving = true;
		navTimer = setTimeout(() => {
			leaving = false;
			shown = next;
			banner = null;
			bannerAct = null;
			resentNote = '';
			if (next === 'verify' || (next === 'success' && successKind === 'mail')) startCd();
			after(90, () => {
				if (!focus || !browser) return;
				const sel = shown === 'signin' && siEmail ? '#si-password' : '[data-autofocus]';
				(document.querySelector(sel) as HTMLElement | null)?.focus();
			});
		}, 120);
	}
	function go(next: View) {
		if (busy) return;
		swap(next);
	}

	function focusEl(sel: string) {
		if (browser) (document.querySelector(sel) as HTMLElement | null)?.focus();
	}
	const reduced = () => browser && matchMedia('(prefers-reduced-motion: reduce)').matches;
	function shake(el: HTMLElement | null) {
		if (!el || reduced()) return;
		el.animate(
			[
				{ transform: 'translateX(0)' },
				{ transform: 'translateX(-6px)' },
				{ transform: 'translateX(6px)' },
				{ transform: 'translateX(-4px)' },
				{ transform: 'translateX(2px)' },
				{ transform: 'translateX(0)' }
			],
			{ duration: 320, easing: 'ease-out' }
		);
	}
	function capKey(e: KeyboardEvent) {
		caps = e.getModifierState('CapsLock');
	}

	/* ---------- sign in ---------- */
	async function onSignIn(e: SubmitEvent) {
		e.preventDefault();
		if (busy) return;
		siEmailErr = emailError(siEmail);
		siPwErr = siPassword ? null : 'Enter your password.';
		if (siEmailErr) return focusEl('#si-email');
		if (siPwErr) return focusEl('#si-password');
		busy = 'signin';
		banner = null;
		bannerAct = null;
		await sleep(950);
		if (BAD_PW.test(siPassword)) {
			busy = null;
			banner = 'Incorrect email or password.';
			bannerAct = { label: 'Reset it', run: () => swap('forgot') };
			siPassword = '';
			caps = false;
			after(0, () => {
				shake(formEl);
				focusEl('#si-password');
			});
			return;
		}
		const email = siEmail.trim();
		if (browser) {
			if (remember) localStorage.setItem('ll:email', email);
			else localStorage.removeItem('ll:email');
		}
		session = { email, provider: 'email' };
		successKind = 'signedin';
		swap('handoff', false);
		after(1400, () => {
			busy = null;
			swap('success', false);
		});
	}

	async function sso(provider: 'google' | 'github') {
		if (busy) return;
		busy = provider;
		await sleep(1100);
		session = { provider };
		successKind = 'signedin';
		swap('handoff', false);
		after(1200, () => {
			busy = null;
			swap('success', false);
		});
	}

	function finishSaml(email: string, providerName: string) {
		session = { email, provider: 'saml', providerName };
		successKind = 'signedin';
		swap('handoff', false);
		after(1400, () => swap('success', false));
	}

	/* ---------- sign up ---------- */
	async function onSignUp(e: SubmitEvent) {
		e.preventDefault();
		if (busy) return;
		suNameErr = suName.trim().length >= 2 ? null : 'Enter your name.';
		suEmailErr = emailError(suEmail);
		suPwErr = passwordChecks(suPassword).slice(0, 3).every((c) => c.ok)
			? null
			: 'Your password doesn\u2019t meet the requirements yet.';
		termsErr = terms ? null : 'Please accept the terms to continue.';
		if (suNameErr) return focusEl('#su-name');
		if (suEmailErr) return focusEl('#su-email');
		if (suPwErr) return focusEl('#su-password');
		if (termsErr) return focusEl('#su-terms');
		busy = 'signup';
		banner = null;
		bannerAct = null;
		await sleep(1100);
		if (suEmail.trim().toLowerCase() === TAKEN_EMAIL) {
			busy = null;
			banner = 'An account with this email already exists.';
			bannerAct = { label: 'Sign in instead', run: () => swap('signin') };
			after(0, () => shake(formEl));
			return;
		}
		verifyEmail = suEmail.trim();
		busy = null;
		swap('verify');
	}

	/* ---------- verify ---------- */
	async function onOtp(code: string) {
		if (busy) return;
		otpErr = null;
		busy = 'verify';
		await sleep(950);
		if (code === '000000') {
			otpErr = 'That code has expired. Request a new one.';
			busy = null;
			otpComp?.clear();
			after(0, () => shake(otpBoxEl));
			return;
		}
		session = { email: verifyEmail, provider: 'email' };
		successKind = 'signedin';
		swap('handoff', false);
		after(1300, () => {
			busy = null;
			swap('success', false);
		});
	}
	function verifyClicked() {
		if (busy) return;
		const v = otpComp?.value() ?? '';
		if (v.length < 6) {
			otpErr = 'Enter the 6-digit code.';
			return;
		}
		onOtp(v);
	}

	/* ---------- forgot / reset ---------- */
	async function onForgot(e: SubmitEvent) {
		e.preventDefault();
		if (busy) return;
		fpEmailErr = emailError(fpEmail);
		if (fpEmailErr) return focusEl('#fp-email');
		busy = 'forgot';
		await sleep(900);
		rsEmail = fpEmail.trim();
		successKind = 'mail';
		busy = null;
		swap('success');
	}

	async function resend() {
		if (busy || cd > 0) return;
		busy = 'resend';
		await sleep(850);
		busy = null;
		resentNote = 'Sent again to ' + (shown === 'verify' ? verifyEmail : rsEmail) + '.';
		startCd();
	}

	async function onReset(e: SubmitEvent) {
		e.preventDefault();
		if (busy) return;
		rsPwErr = passwordChecks(rsPw).slice(0, 3).every((c) => c.ok)
			? null
			: 'Your password doesn\u2019t meet the requirements yet.';
		rsConfErr = rsConf && rsConf === rsPw ? null : rsConf ? 'Passwords don\u2019t match.' : 'Re-enter your new password.';
		if (rsPwErr) return focusEl('#rs-password');
		if (rsConfErr) return focusEl('#rs-confirm');
		busy = 'reset';
		await sleep(1000);
		busy = null;
		successKind = 'resetdone';
		swap('success');
	}

	function signOut() {
		session = null;
		siPassword = '';
		swap('signin');
	}

	/* ---------- dialogs ---------- */
	let ssoOpen = $state(false);
	let legalOpen = $state(false);
	let legalDoc = $state<'privacy' | 'terms' | 'security'>('privacy');
	let legalReturn: HTMLElement | null = null;
	function openLegal(d: 'privacy' | 'terms' | 'security', e?: MouseEvent) {
		legalReturn = (e?.currentTarget as HTMLElement) ?? null;
		legalDoc = d;
		legalOpen = true;
	}

	/* ---------- prefill remembered email ---------- */
	$effect(() => {
		if (!browser) return;
		const saved = localStorage.getItem('ll:email');
		if (saved) {
			siEmail = saved;
			remember = true;
		}
	});
</script>

{#snippet ferr(id: string, msg: string | null)}
	{#if msg}
		<div class="ferr" id={id} aria-live="polite">
			<div class="ferr-in"><Icons name="alert" size={13} /><span>{msg}</span></div>
		</div>
	{/if}
{/snippet}

{#snippet eye(show: boolean, toggle: () => void)}
	<Tooltip.Root>
		<Tooltip.Trigger
			class="eye"
			type="button"
			aria-label={show ? 'Hide password' : 'Show password'}
			onclick={toggle}
		>
			<Icons name={show ? 'eye-off' : 'eye'} size={16} />
		</Tooltip.Trigger>
		<Tooltip.Portal>
			<Tooltip.Content sideOffset={8} class="ll-tt-c">
				<div class="tt">{show ? 'Hide password' : 'Show password'}</div>
			</Tooltip.Content>
		</Tooltip.Portal>
	</Tooltip.Root>
{/snippet}

{#snippet meter(score: number, label: string)}
	{#if label}
		<div class="meter" data-lv={score || 1} aria-hidden="true">
			{#each [1, 2, 3, 4] as s (s)}
				<span class="seg" class:on={score >= s}></span>
			{/each}
		</div>
		<p class="slabel" data-lv={score || 1}>{label}</p>
	{/if}
{/snippet}

{#snippet checks(id: string, list: Check[])}
	<ul class="checks" {id}>
		{#each list as c, i (i)}
			<li class="chk" class:ok={c.ok}>
				<span class="chk-ic" aria-hidden="true"><Icons name="check" size={10} /></span>
				<span class="chk-l">{c.label}</span>
				{#if c.optional}<span class="chk-o">optional</span>{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<Tooltip.Provider delayDuration={450} skipDelayDuration={400}>
	<div class="ll-root">
		<main class="col-form">
			<header class="brand enter" style="--i:0">
				<span class="bmark" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
						<path d="M6 7.5h12M6 12h8M6 16.5h5" />
					</svg>
				</span>
				<span class="bname">Ledgerline</span>
			</header>

			<div class="stage">
				<div class="viewport" style:height={vh ? vh + 'px' : 'auto'}>
					{#key shown}
						<section class="view" class:leaving bind:clientHeight={vh}>
							{#if shown === 'signin'}
								<h1>Sign in to Ledgerline</h1>
								<p class="sub">Bookkeeping for independent studios.</p>

								{#if banner}
									<div class="banner" role="alert">
										<Icons name="alert" size={14} />
										<span class="banner-t">{banner}</span>
										{#if bannerAct}
											<button type="button" class="banner-a" onclick={bannerAct.run}>{bannerAct.label}</button>
										{/if}
									</div>
								{/if}

								<form novalidate onsubmit={onSignIn} bind:this={formEl}>
									<div class="sso">
										<button type="button" class="btn-sso" onclick={() => sso('google')} disabled={busy !== null}>
											{#if busy === 'google'}
												<span class="spin spin-grey" aria-hidden="true"></span><span>Redirecting to Google…</span>
											{:else}
												<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
													<path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" />
													<path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A9 9 0 0 0 9 18z" />
													<path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.96H.95a9 9 0 0 0 0 8.08l3.02-2.32z" />
													<path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .95 4.96l3.02 2.32C4.68 5.16 6.66 3.58 9 3.58z" />
												</svg>
												<span>Continue with Google</span>
											{/if}
										</button>
										<button type="button" class="btn-sso" onclick={() => sso('github')} disabled={busy !== null}>
											{#if busy === 'github'}
												<span class="spin spin-grey" aria-hidden="true"></span><span>Redirecting to GitHub…</span>
											{:else}
												<svg width="18" height="18" viewBox="0 0 16 16" fill="#171717" aria-hidden="true">
													<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.51-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
												</svg>
												<span>Continue with GitHub</span>
											{/if}
										</button>
										<button type="button" class="btn-sso" bind:this={ssoBtnEl} onclick={() => (ssoOpen = true)} disabled={busy !== null}>
											<Icons name="building" size={17} />
											<span>Enterprise SSO</span>
										</button>
									</div>

									<div class="divider"><span>or continue with email</span></div>

									<div class="field">
										<label class="lbl" for="si-email">Email</label>
										<div class="control" class:invalid={!!siEmailErr}>
											<input
												data-autofocus
												id="si-email"
												type="email"
												autocomplete="email"
												placeholder="you@studio.co"
												bind:value={siEmail}
												onblur={() => (siEmailErr = emailError(siEmail))}
												oninput={() => {
													if (siEmailErr && !emailError(siEmail)) siEmailErr = null;
													banner = null;
													bannerAct = null;
												}}
												aria-invalid={siEmailErr ? 'true' : undefined}
												aria-describedby={siEmailErr ? 'si-email-err' : undefined}
											/>
										</div>
										{@render ferr('si-email-err', siEmailErr)}
									</div>

									<div class="field">
										<label class="lbl" for="si-password">Password</label>
										<div class="control has-eye" class:invalid={!!siPwErr}>
											<input
												id="si-password"
												type={showSi ? 'text' : 'password'}
												autocomplete="current-password"
												placeholder="••••••••"
												bind:value={siPassword}
												onblur={() => {
													siPwErr = siPassword ? null : 'Enter your password.';
													caps = false;
												}}
												oninput={() => {
													siPwErr = null;
													banner = null;
													bannerAct = null;
												}}
												onkeydown={capKey}
												onkeyup={capKey}
												aria-invalid={siPwErr ? 'true' : undefined}
												aria-describedby={siPwErr ? 'si-password-err' : undefined}
											/>
											{@render eye(showSi, () => (showSi = !showSi))}
										</div>
										{#if caps}
											<p class="caps" aria-live="polite"><Icons name="alert" size={12} />Caps Lock is on</p>
										{/if}
										{@render ferr('si-password-err', siPwErr)}
									</div>

									<div class="frow">
										<label class="check">
											<input class="sr" type="checkbox" bind:checked={remember} />
											<span class="box" aria-hidden="true"><Icons name="check" size={11} /></span>
											<span class="clabel">Remember me</span>
										</label>
										<button type="button" class="link" onclick={() => go('forgot')}>Forgot password?</button>
									</div>

									<button class="primary" type="submit" disabled={busy !== null}>
										{#if busy === 'signin'}
											<span class="spin" aria-hidden="true"></span><span>Signing in…</span>
										{:else}
											<span>Sign in</span><Icons name="arrow-right" size={15} />
										{/if}
									</button>
								</form>

								<p class="switchline">
									New to Ledgerline?
									<button type="button" class="link strong" onclick={() => go('signup')}>Create an account</button>
								</p>
							{:else if shown === 'signup'}
								<h1>Create your account</h1>
								<p class="sub">Start your 30-day trial — no card required.</p>

								{#if banner}
									<div class="banner" role="alert">
										<Icons name="alert" size={14} />
										<span class="banner-t">{banner}</span>
										{#if bannerAct}
											<button type="button" class="banner-a" onclick={bannerAct.run}>{bannerAct.label}</button>
										{/if}
									</div>
								{/if}

								<div class="sso">
									<button type="button" class="btn-sso" onclick={() => sso('google')} disabled={busy !== null}>
										{#if busy === 'google'}
											<span class="spin spin-grey" aria-hidden="true"></span><span>Redirecting to Google…</span>
										{:else}
											<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
												<path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z" />
												<path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A9 9 0 0 0 9 18z" />
												<path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.96H.95a9 9 0 0 0 0 8.08l3.02-2.32z" />
												<path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .95 4.96l3.02 2.32C4.68 5.16 6.66 3.58 9 3.58z" />
											</svg>
											<span>Continue with Google</span>
										{/if}
									</button>
									<button type="button" class="btn-sso" onclick={() => sso('github')} disabled={busy !== null}>
										{#if busy === 'github'}
											<span class="spin spin-grey" aria-hidden="true"></span><span>Redirecting to GitHub…</span>
										{:else}
											<svg width="18" height="18" viewBox="0 0 16 16" fill="#171717" aria-hidden="true">
												<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.51-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
											</svg>
											<span>Continue with GitHub</span>
										{/if}
									</button>
								</div>

								<div class="divider"><span>or sign up with email</span></div>

								<form novalidate onsubmit={onSignUp} bind:this={formEl}>
									<div class="field">
										<label class="lbl" for="su-name">Full name</label>
										<div class="control" class:invalid={!!suNameErr}>
											<input
												data-autofocus
												id="su-name"
												type="text"
												autocomplete="name"
												placeholder="Maya Patel"
												bind:value={suName}
												onblur={() => (suNameErr = suName.trim().length >= 2 ? null : 'Enter your name.')}
												oninput={() => {
													if (suNameErr && suName.trim().length >= 2) suNameErr = null;
													banner = null;
													bannerAct = null;
												}}
												aria-invalid={suNameErr ? 'true' : undefined}
												aria-describedby={suNameErr ? 'su-name-err' : undefined}
											/>
										</div>
										{@render ferr('su-name-err', suNameErr)}
									</div>

									<div class="field">
										<label class="lbl" for="su-email">Work email</label>
										<div class="control" class:invalid={!!suEmailErr}>
											<input
												id="su-email"
												type="email"
												autocomplete="email"
												placeholder="you@studio.co"
												bind:value={suEmail}
												onblur={() => (suEmailErr = emailError(suEmail))}
												oninput={() => {
													if (suEmailErr && !emailError(suEmail)) suEmailErr = null;
													banner = null;
													bannerAct = null;
												}}
												aria-invalid={suEmailErr ? 'true' : undefined}
												aria-describedby={suEmailErr ? 'su-email-err' : undefined}
											/>
										</div>
										{@render ferr('su-email-err', suEmailErr)}
									</div>

									<div class="field">
										<label class="lbl" for="su-password">Password</label>
										<div class="control has-eye" class:invalid={!!suPwErr}>
											<input
												id="su-password"
												type={showSu ? 'text' : 'password'}
												autocomplete="new-password"
												placeholder="8+ characters"
												bind:value={suPassword}
												onblur={() =>
													(suPwErr = passwordChecks(suPassword).slice(0, 3).every((c) => c.ok)
														? null
														: 'Your password doesn\u2019t meet the requirements yet.')}
												oninput={() => {
													if (suPwErr && passwordChecks(suPassword).slice(0, 3).every((c) => c.ok)) suPwErr = null;
													banner = null;
													bannerAct = null;
												}}
												onkeydown={capKey}
												onkeyup={capKey}
												aria-invalid={suPwErr ? 'true' : undefined}
												aria-describedby={suPwErr ? 'su-password-err su-pw-checks' : 'su-pw-checks'}
											/>
											{@render eye(showSu, () => (showSu = !showSu))}
										</div>
										{#if caps}
											<p class="caps" aria-live="polite"><Icons name="alert" size={12} />Caps Lock is on</p>
										{/if}
										{@render ferr('su-password-err', suPwErr)}
										{@render meter(suStr.score, suPassword ? suStr.label : '')}
										{@render checks('su-pw-checks', suPwChecks)}
									</div>

									<div class="terms" class:invalid={!!termsErr}>
										<input class="sr" id="su-terms" type="checkbox" bind:checked={terms} />
										<label class="box" for="su-terms" aria-hidden="true"><Icons name="check" size={11} /></label>
										<p class="ttext">
											I agree to the
											<button type="button" class="tlink" onclick={(e) => openLegal('terms', e)}>Terms of Service</button>
											and
											<button type="button" class="tlink" onclick={(e) => openLegal('privacy', e)}>Privacy Policy</button>.
										</p>
										{@render ferr('su-terms-err', termsErr)}
									</div>

									<button class="primary" type="submit" disabled={busy !== null}>
										{#if busy === 'signup'}
											<span class="spin" aria-hidden="true"></span><span>Creating your account…</span>
										{:else}
											<span>Create account</span><Icons name="arrow-right" size={15} />
										{/if}
									</button>
								</form>

								<p class="switchline">
									Already have an account?
									<button type="button" class="link strong" onclick={() => go('signin')}>Sign in</button>
								</p>
							{:else if shown === 'forgot'}
								<h1>Reset your password</h1>
								<p class="sub">Enter your email and we&rsquo;ll send a link to set a new one.</p>
								<form novalidate onsubmit={onForgot}>
									<div class="field">
										<label class="lbl" for="fp-email">Email</label>
										<div class="control" class:invalid={!!fpEmailErr}>
											<input
												data-autofocus
												id="fp-email"
												type="email"
												autocomplete="email"
												placeholder="you@studio.co"
												bind:value={fpEmail}
												onblur={() => (fpEmailErr = emailError(fpEmail))}
												oninput={() => {
													if (fpEmailErr && !emailError(fpEmail)) fpEmailErr = null;
												}}
												aria-invalid={fpEmailErr ? 'true' : undefined}
												aria-describedby={fpEmailErr ? 'fp-email-err' : undefined}
											/>
										</div>
										{@render ferr('fp-email-err', fpEmailErr)}
									</div>
									<button class="primary" type="submit" disabled={busy !== null}>
										{#if busy === 'forgot'}
											<span class="spin" aria-hidden="true"></span><span>Sending link…</span>
										{:else}
											<span>Send reset link</span><Icons name="arrow-right" size={15} />
										{/if}
									</button>
								</form>
								<button type="button" class="link back" onclick={() => go('signin')}>
									<Icons name="arrow-left" size={14} />Back to sign in
								</button>
							{:else if shown === 'reset'}
								<h1>Set a new password</h1>
								<p class="sub">Choose a new password for {rsEmail}.</p>
								<form novalidate onsubmit={onReset}>
									<div class="field">
										<label class="lbl" for="rs-password">New password</label>
										<div class="control has-eye" class:invalid={!!rsPwErr}>
											<input
												data-autofocus
												id="rs-password"
												type={showRs ? 'text' : 'password'}
												autocomplete="new-password"
												placeholder="8+ characters"
												bind:value={rsPw}
												onblur={() =>
													(rsPwErr = passwordChecks(rsPw).slice(0, 3).every((c) => c.ok)
														? null
														: 'Your password doesn\u2019t meet the requirements yet.')}
												oninput={() => {
													if (rsPwErr && passwordChecks(rsPw).slice(0, 3).every((c) => c.ok)) rsPwErr = null;
													if (rsConfErr && rsConf && rsConf === rsPw) rsConfErr = null;
												}}
												onkeydown={capKey}
												onkeyup={capKey}
												aria-invalid={rsPwErr ? 'true' : undefined}
												aria-describedby={rsPwErr ? 'rs-password-err rs-pw-checks' : 'rs-pw-checks'}
											/>
											{@render eye(showRs, () => (showRs = !showRs))}
										</div>
										{#if caps}
											<p class="caps" aria-live="polite"><Icons name="alert" size={12} />Caps Lock is on</p>
										{/if}
										{@render ferr('rs-password-err', rsPwErr)}
										{@render meter(rsStr.score, rsPw ? rsStr.label : '')}
										{@render checks('rs-pw-checks', rsPwChecks)}
									</div>

									<div class="field">
										<label class="lbl" for="rs-confirm">Confirm password</label>
										<div class="control has-eye" class:invalid={!!rsConfErr}>
											<input
												id="rs-confirm"
												type={showRsConf ? 'text' : 'password'}
												autocomplete="new-password"
												placeholder="Repeat it"
												bind:value={rsConf}
												onblur={() =>
													(rsConfErr = rsConf && rsConf === rsPw ? null : rsConf ? 'Passwords don\u2019t match.' : 'Re-enter your new password.')}
												oninput={() => {
													if (rsConfErr && rsConf && rsConf === rsPw) rsConfErr = null;
												}}
												aria-invalid={rsConfErr ? 'true' : undefined}
												aria-describedby={rsConfErr ? 'rs-confirm-err' : undefined}
											/>
											{@render eye(showRsConf, () => (showRsConf = !showRsConf))}
										</div>
										{@render ferr('rs-confirm-err', rsConfErr)}
									</div>

									<button class="primary" type="submit" disabled={busy !== null}>
										{#if busy === 'reset'}
											<span class="spin" aria-hidden="true"></span><span>Updating…</span>
										{:else}
											<span>Update password</span><Icons name="arrow-right" size={15} />
										{/if}
									</button>
								</form>
								<button type="button" class="link back" onclick={() => go('signin')}>
									<Icons name="arrow-left" size={14} />Back to sign in
								</button>
							{:else if shown === 'verify'}
								<h1>Check your inbox</h1>
								<p class="sub">We sent a 6-digit code to <strong>{verifyEmail}</strong>. It expires in 10 minutes.</p>
								<div class="otpzone" bind:this={otpBoxEl}>
									<Otp bind:this={otpComp} disabled={busy !== null} oncomplete={onOtp} />
									{#if otpErr}
										<div class="banner" role="alert">
											<Icons name="alert" size={14} />
											<span class="banner-t">{otpErr}</span>
										</div>
									{/if}
								</div>
								<button class="primary verify" onclick={verifyClicked} disabled={busy !== null}>
									{#if busy === 'verify'}
										<span class="spin" aria-hidden="true"></span><span>Verifying…</span>
									{:else}
										<span>Verify</span><Icons name="arrow-right" size={15} />
									{/if}
								</button>
								<div class="resend-row">
									<button type="button" class="link" onclick={resend} disabled={cd > 0 || busy !== null}>
										{#if busy === 'resend'}
											Sending…
										{:else if cd > 0}
											Resend in {cd}s
										{:else}
											Resend email
										{/if}
									</button>
									{#if resentNote}
										<span class="resent" role="status">{resentNote}</span>
									{/if}
								</div>
								<button type="button" class="link back" onclick={() => go('signup')}>Use a different email</button>
							{:else if shown === 'handoff'}
								<div class="handoff" role="status">
									<span class="spin spin-accent" aria-hidden="true"></span>
									<p>Opening your workspace…</p>
								</div>
							{:else if shown === 'success'}
								{#if successKind === 'mail'}
									<div class="succview">
										<div class="succ-ic mail" aria-hidden="true"><Icons name="mail" size={20} /></div>
										<h1 class="stitle">Check your inbox</h1>
										<p class="sline">We sent a reset link to <strong>{rsEmail}</strong>.<br />The link expires in 30 minutes.</p>
										<button class="primary" type="button" onclick={() => { siEmail = rsEmail; swap('signin'); }}>
											<span>Back to sign in</span>
										</button>
										<button type="button" class="link" onclick={() => swap('reset')}>Open the reset link</button>
										<div class="resend-row">
											<button type="button" class="link" onclick={resend} disabled={cd > 0 || busy !== null}>
												{#if busy === 'resend'}
													Sending…
												{:else if cd > 0}
													Resend in {cd}s
												{:else}
													Resend email
												{/if}
											</button>
											{#if resentNote}
												<span class="resent" role="status">{resentNote}</span>
											{/if}
										</div>
									</div>
								{:else if successKind === 'resetdone'}
									<div class="succview">
										<div class="succ-ic ok" aria-hidden="true">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path class="draw" d="M5 12.5l4.5 4.5L19 7.5" />
											</svg>
										</div>
										<h1 class="stitle">Password updated</h1>
										<p class="sline">Use your new password next time you sign in.</p>
										<button class="primary" type="button" onclick={() => { siEmail = rsEmail; siPassword = ''; swap('signin'); }}>
											<span>Sign in</span><Icons name="arrow-right" size={15} />
										</button>
									</div>
								{:else if session}
									<div class="succview">
										{#if session.provider !== 'email'}
											<span class="ptag">{session.providerName ?? PROVIDER_LABEL[session.provider]}</span>
										{/if}
										<div class="succ-ic ok" aria-hidden="true">
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<path class="draw" d="M5 12.5l4.5 4.5L19 7.5" />
											</svg>
										</div>
										<h1 class="stitle">You&rsquo;re signed in</h1>
										{#if session.email}
											<p class="sline">{session.email}</p>
											<p class="sline">Workspace · {workspaceFromEmail(session.email)}</p>
										{:else}
											<p class="sline">Signed in with {session.providerName ?? PROVIDER_LABEL[session.provider]}.</p>
										{/if}
										<button class="btn-sec" type="button" onclick={signOut}>Sign out</button>
									</div>
								{/if}
							{/if}
						</section>
					{/key}
				</div>
			</div>

			<footer class="foot enter" style="--i:1">
				<button type="button" onclick={(e) => openLegal('privacy', e)}>Privacy</button>
				<button type="button" onclick={(e) => openLegal('terms', e)}>Terms</button>
				<button type="button" onclick={(e) => openLegal('security', e)}>Security</button>
				<span>© 2026 Ledgerline Ltd</span>
			</footer>
		</main>

		<aside class="col-preview enter" style="--i:2">
			<Preview />
		</aside>

		<SsoDialog bind:open={ssoOpen} onsignedin={finishSaml} onreturnfocus={() => ssoBtnEl?.focus()} />
		<LegalDialog bind:open={legalOpen} bind:doc={legalDoc} onreturnfocus={() => legalReturn?.focus()} />
	</div>
</Tooltip.Provider>

<style>
	.ll-root {
		/* giga-ui tokens */
		--accent: #255cd1;
		--accent-hover: color-mix(in oklab, var(--accent), black 8%);
		--accent-soft: #eef4ff;
		--ring: rgb(37 92 209 / 0.28);
		--fg: #171717;
		--fg2: #737373;
		--fg3: #a3a3a3;
		--line: #ececec;
		--line2: #e0e0e0;
		--bg-subtle: #f7f7f7;
		--danger: #dc2626;
		--danger-deep: #b91c1c;
		--danger-soft: #fef2f2;
		--success: #16a34a;
		--success-soft: #ecfdf3;
		--warn: #b45309;
		--ease: cubic-bezier(0.23, 1, 0.32, 1);
		--shadow-btn: 0 1px 2px rgb(40 40 40 / 0.08), 0 0 0 1px var(--line);
		--shadow-primary: inset 0 1px 0 rgb(255 255 255 / 0.18), 0 1px 2px rgb(0 0 0 / 0.16),
			0 0 0 1px color-mix(in oklab, var(--accent), black 14%);

		display: flex;
		min-height: 100dvh;
		background: #fff;
		color: var(--fg);
		font-family: 'Inter Variable', ui-sans-serif, system-ui, -apple-system, sans-serif;
		font-size: 14px;
		line-height: 1.5;
		font-feature-settings: 'cv11', 'ss01';
		-webkit-font-smoothing: antialiased;
	}

	/* ---------- columns ---------- */
	.col-form {
		flex: 1 1 54%;
		min-width: 0;
		display: flex;
		flex-direction: column;
		padding: 24px 48px;
	}
	.col-preview {
		flex: 1 1 46%;
		background: var(--bg-subtle);
		border-left: 1px solid var(--line);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px 32px;
	}

	/* ---------- brand ---------- */
	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.bmark {
		width: 30px;
		height: 30px;
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		display: grid;
		place-items: center;
		flex-shrink: 0;
	}
	.bmark svg {
		width: 16px;
		height: 16px;
	}
	.bname {
		font-size: 15px;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	/* ---------- stage / view swap ---------- */
	.stage {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px 0;
	}
	.viewport {
		width: 100%;
		max-width: 400px;
		transition: height 240ms var(--ease);
	}
	.view {
		animation: view-in 280ms var(--ease);
	}
	.view.leaving {
		animation: view-out 120ms cubic-bezier(0.4, 0, 1, 1) forwards;
	}
	@keyframes view-in {
		from {
			opacity: 0;
			transform: translateY(10px);
			filter: blur(4px);
		}
	}
	@keyframes view-out {
		to {
			opacity: 0;
			transform: translateY(-8px);
			filter: blur(2px);
		}
	}

	h1 {
		margin: 0 0 4px;
		font-size: 23px;
		font-weight: 600;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}
	.sub {
		margin: 0 0 24px;
		font-size: 14px;
		color: var(--fg2);
	}
	.sub strong {
		font-weight: 500;
		color: var(--fg);
	}

	/* ---------- banner ---------- */
	.banner {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		margin: 0 0 16px;
		padding: 10px 12px;
		border-radius: 10px;
		background: var(--danger-soft);
		box-shadow: inset 0 0 0 1px #fde0e0;
		color: var(--danger-deep);
		font-size: 13px;
		line-height: 1.45;
		animation: rise-in 200ms var(--ease);
	}
	.banner > :global(svg) {
		flex-shrink: 0;
		margin-top: 2px;
	}
	.banner-t {
		min-width: 0;
	}
	.banner-a {
		flex-shrink: 0;
		border: 0;
		background: none;
		padding: 0;
		margin-left: auto;
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
		white-space: nowrap;
		border-radius: 4px;
	}
	.banner-a:focus-visible {
		outline: 2px solid var(--danger);
		outline-offset: 2px;
	}

	/* ---------- SSO buttons + divider ---------- */
	.sso {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.btn-sso {
		width: 100%;
		height: 40px;
		border: 0;
		border-radius: 10px;
		background: linear-gradient(#fff, #f7f7f7);
		box-shadow: var(--shadow-btn);
		color: var(--fg);
		font-family: inherit;
		font-size: 14px;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		user-select: none;
		transition: box-shadow 150ms var(--ease), transform 150ms var(--ease), opacity 150ms;
	}
	.btn-sso svg:first-child {
		flex-shrink: 0;
	}
	@media (hover: hover) {
		.btn-sso:hover {
			box-shadow: 0 1px 2px rgb(40 40 40 / 0.08), 0 0 0 1px var(--line2);
		}
	}
	.btn-sso:active {
		transform: scale(0.97);
	}
	.btn-sso:disabled {
		opacity: 0.55;
	}
	.btn-sso:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 20px 0;
		color: var(--fg3);
		font-size: 12px;
	}
	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--line);
	}

	/* ---------- fields ---------- */
	.field + .field,
	.field + .terms {
		margin-top: 16px;
	}
	.lbl {
		display: block;
		margin: 0 0 4px;
		font-size: 13px;
		font-weight: 500;
	}
	.control {
		position: relative;
	}
	.control input {
		width: 100%;
		height: 40px;
		border: 0;
		border-radius: 10px;
		padding: 0 12px;
		font-family: inherit;
		font-size: 14px;
		color: var(--fg);
		background: #fff;
		box-shadow: var(--shadow-btn);
		transition: box-shadow 150ms var(--ease);
	}
	.control input::placeholder {
		color: var(--fg3);
	}
	.control input:focus {
		outline: none;
		box-shadow: 0 0 0 1px var(--accent), 0 0 0 4px var(--ring);
	}
	.control.invalid input {
		box-shadow: 0 0 0 1px var(--danger), 0 0 0 4px rgb(220 38 38 / 0.15);
	}
	.control.has-eye input {
		padding-right: 42px;
	}
	.ll-root :is(input):focus-visible {
		outline: none;
	}
	.control :global(.eye) {
		position: absolute;
		right: 4px;
		top: 50%;
		translate: 0 -50%;
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		display: grid;
		place-items: center;
		color: var(--fg3);
		transition: color 120ms, background 120ms;
	}
	@media (hover: hover) {
		.control :global(.eye:hover) {
			color: var(--fg);
			background: #f4f4f4;
		}
	}
	.control :global(.eye:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.caps {
		display: flex;
		align-items: center;
		gap: 5px;
		margin: 6px 0 0;
		font-size: 12px;
		color: var(--warn);
		animation: rise-in 180ms var(--ease);
	}

	/* ---------- field errors (grid-rows open animation) ---------- */
	.ferr {
		display: grid;
		grid-template-rows: 0fr;
		opacity: 0;
		transform: translateY(-4px);
		animation: ferr-in 200ms var(--ease) forwards;
	}
	.ferr-in {
		overflow: hidden;
		display: flex;
		align-items: flex-start;
		gap: 6px;
		padding-top: 6px;
		font-size: 12.5px;
		line-height: 1.4;
		color: var(--danger-deep);
	}
	.ferr-in :global(svg) {
		flex-shrink: 0;
		margin-top: 2px;
	}
	@keyframes ferr-in {
		from {
			grid-template-rows: 0fr;
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			grid-template-rows: 1fr;
			opacity: 1;
			transform: none;
		}
	}
	@keyframes rise-in {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
	}

	/* ---------- checkbox ---------- */
	.frow {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 16px 0 20px;
	}
	.check {
		position: relative;
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.sr {
		position: absolute;
		width: 16px;
		height: 16px;
		margin: 0;
		opacity: 0;
		pointer-events: none;
	}
	.box {
		width: 16px;
		height: 16px;
		border-radius: 5px;
		background: #fff;
		box-shadow: var(--shadow-btn);
		display: grid;
		place-items: center;
		color: #fff;
		flex-shrink: 0;
		transition: background 150ms var(--ease), box-shadow 150ms var(--ease);
	}
	.box :global(svg) {
		opacity: 0;
		transform: scale(0.8);
		transition: opacity 150ms, transform 180ms cubic-bezier(0.23, 1.4, 0.32, 1);
	}
	input:checked ~ .box {
		background: var(--accent);
		box-shadow: 0 0 0 1px var(--accent);
	}
	input:checked ~ .box :global(svg) {
		opacity: 1;
		transform: scale(1);
	}
	input:focus-visible ~ .box {
		box-shadow: var(--shadow-btn), 0 0 0 3px var(--ring);
	}
	.clabel {
		font-size: 13px;
	}

	.link {
		border: 0;
		background: none;
		padding: 0;
		border-radius: 6px;
		font-family: inherit;
		font-size: 13px;
		font-weight: 500;
		color: var(--fg2);
		transition: color 120ms;
	}
	@media (hover: hover) {
		.link:hover {
			color: var(--fg);
			text-decoration: underline;
			text-underline-offset: 3px;
		}
	}
	.link:disabled {
		opacity: 0.5;
	}
	.link:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.link.strong {
		color: var(--fg);
	}
	.link.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 16px;
	}

	/* ---------- terms row ---------- */
	.terms {
		display: grid;
		grid-template-columns: 16px 1fr;
		gap: 8px;
		position: relative;
	}
	.terms .sr {
		grid-area: 1 / 1;
	}
	.terms .box {
		grid-area: 1 / 1;
		margin-top: 2px;
	}
	.terms .ferr {
		grid-column: 2;
	}
	.terms.invalid .box {
		box-shadow: 0 0 0 1px var(--danger), 0 0 0 4px rgb(220 38 38 / 0.15);
	}
	.ttext {
		grid-column: 2;
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
		color: var(--fg2);
	}
	.tlink {
		border: 0;
		background: none;
		padding: 0;
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		color: var(--fg);
		text-decoration: underline;
		text-underline-offset: 2px;
		text-decoration-color: var(--line2);
		border-radius: 4px;
		transition: color 120ms, text-decoration-color 120ms;
	}
	@media (hover: hover) {
		.tlink:hover {
			text-decoration-color: var(--fg);
		}
	}
	.tlink:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	/* ---------- strength meter + checks ---------- */
	.meter {
		display: flex;
		gap: 4px;
		margin-top: 10px;
	}
	.seg {
		flex: 1;
		height: 4px;
		border-radius: 999px;
		background: var(--line);
		transition: background 200ms var(--ease);
	}
	.seg.on {
		background: var(--fg3);
	}
	.meter[data-lv='1'] .seg.on {
		background: var(--danger);
	}
	.meter[data-lv='2'] .seg.on {
		background: #d97706;
	}
	.meter[data-lv='3'] .seg.on {
		background: var(--accent);
	}
	.meter[data-lv='4'] .seg.on {
		background: var(--success);
	}
	.slabel {
		margin: 6px 0 0;
		font-size: 12px;
		color: var(--fg3);
	}
	.slabel[data-lv='1'] {
		color: var(--danger-deep);
	}
	.slabel[data-lv='2'] {
		color: #b45309;
	}
	.slabel[data-lv='3'] {
		color: var(--accent);
	}
	.slabel[data-lv='4'] {
		color: var(--success);
	}

	.checks {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px 16px;
		margin: 8px 0 0;
		padding: 0;
		list-style: none;
	}
	.chk {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 12.5px;
		color: var(--fg2);
		transition: color 150ms;
	}
	.chk-ic {
		width: 14px;
		height: 14px;
		border-radius: 999px;
		border: 1.5px solid var(--line2);
		display: grid;
		place-items: center;
		color: transparent;
		flex-shrink: 0;
		transition: background 150ms var(--ease), border-color 150ms, color 150ms, transform 150ms var(--ease);
	}
	.chk.ok {
		color: var(--success);
	}
	.chk.ok .chk-ic {
		background: var(--success-soft);
		border-color: transparent;
		color: var(--success);
		transform: scale(1.05);
	}
	.chk-o {
		font-size: 11px;
		color: var(--fg3);
	}

	/* ---------- primary + secondary buttons ---------- */
	.primary {
		width: 100%;
		height: 40px;
		margin-top: 20px;
		border: 0;
		border-radius: 10px;
		background: var(--accent);
		color: #fff;
		font-family: inherit;
		font-size: 14px;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		user-select: none;
		box-shadow: var(--shadow-primary);
		transition: background 150ms var(--ease), transform 150ms var(--ease), opacity 150ms;
	}
	@media (hover: hover) {
		.primary:hover {
			background: var(--accent-hover);
		}
	}
	.primary:active {
		transform: scale(0.97);
	}
	.primary:disabled {
		opacity: 0.55;
	}
	.primary:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.btn-sec {
		width: 100%;
		height: 40px;
		margin-top: 24px;
		border: 0;
		border-radius: 10px;
		background: linear-gradient(#fff, #f7f7f7);
		box-shadow: var(--shadow-btn);
		font-family: inherit;
		font-size: 14px;
		font-weight: 500;
		color: var(--fg);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		user-select: none;
		transition: box-shadow 150ms var(--ease), transform 150ms var(--ease);
	}
	@media (hover: hover) {
		.btn-sec:hover {
			box-shadow: 0 1px 2px rgb(40 40 40 / 0.08), 0 0 0 1px var(--line2);
		}
	}
	.btn-sec:active {
		transform: scale(0.97);
	}
	.btn-sec:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.switchline {
		margin: 24px 0 0;
		text-align: center;
		font-size: 13px;
		color: var(--fg2);
	}

	/* ---------- spinners ---------- */
	.spin {
		width: 14px;
		height: 14px;
		border-radius: 999px;
		border: 2px solid rgb(255 255 255 / 0.35);
		border-top-color: #fff;
		animation: rot 0.7s linear infinite;
		flex-shrink: 0;
	}
	.spin-grey {
		border-color: rgb(0 0 0 / 0.15);
		border-top-color: #525252;
	}
	.spin-accent {
		width: 18px;
		height: 18px;
		border-color: rgb(37 92 209 / 0.25);
		border-top-color: var(--accent);
	}
	@keyframes rot {
		to {
			transform: rotate(1turn);
		}
	}

	/* ---------- verify ---------- */
	.otpzone {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}
	.otpzone .banner {
		width: 100%;
		margin: 0;
	}
	.primary.verify {
		margin-top: 16px;
	}
	.resend-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 16px;
	}
	.resent {
		font-size: 12px;
		color: var(--success);
	}

	/* ---------- handoff + success ---------- */
	.handoff {
		min-height: 240px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}
	.handoff p {
		margin: 0;
		font-size: 13px;
		color: var(--fg2);
	}
	.succview {
		text-align: center;
	}
	.succ-ic {
		width: 44px;
		height: 44px;
		border-radius: 999px;
		display: grid;
		place-items: center;
		margin: 8px auto 16px;
	}
	.succ-ic.ok {
		background: var(--success-soft);
		color: var(--success);
	}
	.succ-ic.mail {
		background: var(--accent-soft);
		color: var(--accent);
	}
	.draw {
		stroke-dasharray: 30;
		stroke-dashoffset: 30;
		animation: draw-in 350ms 80ms var(--ease) forwards;
	}
	@keyframes draw-in {
		to {
			stroke-dashoffset: 0;
		}
	}
	.stitle {
		font-size: 20px;
		margin: 0 0 4px;
	}
	.sline {
		margin: 2px 0 0;
		font-size: 13px;
		color: var(--fg2);
		overflow-wrap: anywhere;
	}
	.sline strong {
		font-weight: 500;
		color: var(--fg);
	}
	.succview .primary {
		margin-top: 24px;
	}
	.succview .link {
		margin-top: 10px;
	}
	.succview .resend-row {
		margin-top: 16px;
		justify-content: center;
	}
	.ptag {
		display: inline-flex;
		align-items: center;
		height: 22px;
		padding: 0 8px;
		border-radius: 6px;
		background: #eef4ff;
		color: #1d4ed8;
		font-size: 12px;
		font-weight: 500;
		box-shadow: inset 0 0 0 1px #dbe6ff;
		margin-bottom: 12px;
	}

	/* ---------- tooltip ---------- */
	.tt {
		background: #171717;
		color: #fff;
		font-size: 12px;
		font-weight: 500;
		padding: 6px 8px;
		border-radius: 8px;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.06), 0 8px 24px -4px rgb(0 0 0 / 0.2);
		animation: tt-in 120ms var(--ease);
	}
	@keyframes tt-in {
		from {
			opacity: 0;
			transform: scale(0.97) translateY(2px);
		}
	}

	/* ---------- footer ---------- */
	.foot {
		display: flex;
		align-items: center;
		gap: 16px;
		padding-top: 16px;
	}
	.foot button {
		border: 0;
		background: none;
		padding: 0;
		font-family: inherit;
		font-size: 12px;
		color: var(--fg3);
		transition: color 120ms;
		border-radius: 4px;
	}
	@media (hover: hover) {
		.foot button:hover {
			color: var(--fg2);
			text-decoration: underline;
			text-underline-offset: 3px;
		}
	}
	.foot button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.foot span {
		margin-left: auto;
		font-size: 12px;
		color: var(--fg3);
	}

	/* ---------- responsive ---------- */
	@media (max-width: 1023px) {
		.col-preview {
			display: none;
		}
		.col-form {
			padding: 20px 24px;
		}
	}
	@media (max-width: 480px) {
		.col-form {
			padding: 16px 20px 24px;
		}
		.stage {
			padding: 32px 0;
		}
		.viewport {
			max-width: none;
		}
		h1 {
			font-size: 21px;
		}
		.control input,
		.btn-sso {
			height: 44px;
		}
		.primary {
			height: 48px;
			font-size: 15px;
			border-radius: 12px;
		}
		.btn-sec {
			height: 48px;
		}
		.foot {
			flex-wrap: wrap;
			gap: 12px;
		}
		.link {
			padding: 8px 0;
		}
		.frow {
			margin: 12px 0 16px;
		}
		.foot button {
			padding: 8px 0;
		}
		.foot span {
			margin-left: auto;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.view,
		.view.leaving,
		.banner,
		.caps,
		.tt {
			animation: none;
		}
		.view.leaving {
			opacity: 0;
		}
		.ferr {
			animation: none;
			grid-template-rows: 1fr;
			opacity: 1;
			transform: none;
		}
		.draw {
			animation: none;
			stroke-dashoffset: 0;
		}
		.viewport {
			transition: none;
		}
	}
</style>
