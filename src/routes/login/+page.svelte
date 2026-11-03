<script lang="ts">
	// GIGA-UI skill: calm, precise, alive — split auth card, paper monochrome, Inter.
	import '@fontsource-variable/inter';
	import FieldError from '#lib/kit/FieldError.svelte';
	import { shake } from '#lib/kit/shake.js';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	type Status = 'idle' | 'loading' | 'success';
	type Mode = 'signin' | 'reset' | 'sent';

	/** The demo accepts any password of at least this length; shorter ones play the "wrong password" path. */
	const MIN_PASSWORD = 8;
	const REQUEST_MS = 900;

	let mode = $state<Mode>('signin');
	let email = $state('');
	let password = $state('');
	let showPw = $state(false);
	let emailTouched = $state(false);
	let pwTouched = $state(false);
	let status = $state<Status>('idle');
	let authError = $state<string | null>(null);
	let slide = $state(0);
	let paused = $state(false);
	let formEl: HTMLFormElement | undefined = $state();
	let passwordEl: HTMLInputElement | undefined = $state();

	const slides = [0, 1, 2];
	const emailOk = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()));
	const emailErr = $derived(emailTouched && !emailOk ? 'Enter a valid work email.' : null);
	const pwErr = $derived(pwTouched && password.length === 0 ? 'Enter your password.' : null);

	function request(): Promise<void> {
		status = 'loading';
		return new Promise((resolve) => setTimeout(resolve, REQUEST_MS));
	}

	async function signIn(e: SubmitEvent) {
		e.preventDefault();
		if (status !== 'idle') return;
		emailTouched = true;
		pwTouched = true;
		authError = null;
		if (!emailOk || password.length === 0) return;

		await request();
		if (password.length < MIN_PASSWORD) {
			status = 'idle';
			authError = 'That email and password don’t match. Try again or reset your password.';
			if (formEl) shake(formEl);
			passwordEl?.select();
			return;
		}
		status = 'success';
	}

	async function sendReset(e: SubmitEvent) {
		e.preventDefault();
		if (status !== 'idle') return;
		emailTouched = true;
		if (!emailOk) return;
		await request();
		status = 'idle';
		mode = 'sent';
	}

	function switchMode(next: Mode) {
		mode = next;
		status = 'idle';
		authError = null;
		emailTouched = false;
		pwTouched = false;
	}

	function onPasswordInput() {
		authError = null;
	}

	$effect(() => {
		if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		const t = setInterval(() => {
			slide = (slide + 1) % slides.length;
		}, 5000);
		return () => clearInterval(t);
	});
</script>

<svelte:head>
	<title>Sign in · Relay</title>
	<meta name="description" content="Sign in to your Relay workspace." />
</svelte:head>

{#snippet submitButton(idleLabel: string, doneLabel: string, busyLabel: string)}
	<button type="submit" class="btn btn-primary reveal r8" class:done={status === 'success'} disabled={status !== 'idle'} data-status={status}>
		<span class="face" data-active={status === 'idle' ? '' : undefined} aria-hidden={status !== 'idle'}>{idleLabel}</span>
		<span class="face" data-active={status === 'loading' ? '' : undefined} aria-hidden="true"><span class="spinner"></span></span>
		<span class="face" data-active={status === 'success' ? '' : undefined} aria-hidden="true">
			{#if status === 'success'}
				<svg class="check" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M20 6 9 17l-5-5" pathLength="1" />
				</svg>
			{/if}
			{doneLabel}
		</span>
		<span class="sr-status" role="status">{status === 'loading' ? busyLabel : status === 'success' ? doneLabel : ''}</span>
	</button>
{/snippet}

<div class="login">
	<header class="topbar">
		<a class="brand" href="/login" aria-label="Relay home">
			<span class="logo-tile">
				<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<rect x="3.5" y="7.5" width="17" height="9" rx="4.5" stroke="#fff" stroke-width="2.4" />
				</svg>
			</span>
		</a>
		<p class="topbar-help">
			<span>Trouble signing in?</span>
			<a href="/login">Contact us</a>
		</p>
	</header>

	<main class="stage">
		<section class="auth-card" aria-label="Sign in to Relay">
			<div class="form-side">
				{#if mode === 'signin'}
					<form class="form" bind:this={formEl} onsubmit={signIn} novalidate in:fly={{ y: 8, duration: 260, easing: cubicOut }}>
						<div class="form-mark reveal r1">
							<span class="logo-circle">
								<span class="logo-tile sm">
									<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<rect x="3.5" y="7.5" width="17" height="9" rx="4.5" stroke="#fff" stroke-width="2.4" />
									</svg>
								</span>
							</span>
						</div>
						<h1 class="reveal r2">Welcome back</h1>
						<p class="sub reveal r3">Sign in to your Relay workspace.</p>

						<button type="button" class="btn btn-google reveal r4">
							<svg viewBox="0 0 18 18" aria-hidden="true">
								<path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62Z" />
								<path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z" />
								<path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z" />
								<path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z" />
							</svg>
							Continue with Google
						</button>

						<div class="divider reveal r5" role="separator"><span>or</span></div>

						<div class="field reveal r6">
							<label for="email">Work email</label>
							<input
								id="email"
								type="email"
								placeholder="name@company.com"
								autocomplete="email"
								bind:value={email}
								class:invalid={emailErr}
								aria-invalid={!!emailErr}
								aria-describedby="email-err"
								onblur={() => (emailTouched = email.length > 0 || emailTouched)}
							/>
							<FieldError id="email-err" message={emailErr} />
						</div>

						<div class="field reveal r7">
							<div class="field-head">
								<label for="password">Password</label>
								<button type="button" class="forgot" onclick={() => switchMode('reset')}>Forgot password?</button>
							</div>
							<div class="pw-wrap">
								<input
									id="password"
									type={showPw ? 'text' : 'password'}
									placeholder="Enter your password"
									autocomplete="current-password"
									bind:this={passwordEl}
									bind:value={password}
									oninput={onPasswordInput}
									class:invalid={pwErr || authError}
									aria-invalid={!!(pwErr || authError)}
									aria-describedby="pw-err auth-err"
									onblur={() => (pwTouched = password.length > 0 || pwTouched)}
								/>
								<button
									type="button"
									class="pw-toggle"
									aria-label={showPw ? 'Hide password' : 'Show password'}
									aria-pressed={showPw}
									onclick={() => (showPw = !showPw)}
								>
									<svg data-active={showPw ? '' : undefined} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
										<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
										<path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
										<path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
										<path d="m2 2 20 20" />
									</svg>
									<svg data-active={showPw ? undefined : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
										<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
										<circle cx="12" cy="12" r="3" />
									</svg>
								</button>
							</div>
							<FieldError id="pw-err" message={pwErr} />
						</div>

						<FieldError id="auth-err" message={authError} />

						{@render submitButton('Continue', 'Signed in', 'Signing in')}

						<p class="form-foot reveal r9">No account? <a href="/login">Create one free</a></p>
					</form>
				{:else if mode === 'reset'}
					<form class="form" onsubmit={sendReset} novalidate in:fly={{ y: 8, duration: 260, easing: cubicOut }}>
						<div class="form-mark">
							<span class="logo-circle">
								<span class="logo-tile sm">
									<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
										<rect x="3.5" y="7.5" width="17" height="9" rx="4.5" stroke="#fff" stroke-width="2.4" />
									</svg>
								</span>
							</span>
						</div>
						<h1>Reset your password</h1>
						<p class="sub">We’ll email you a link to choose a new one.</p>

						<div class="field field-first">
							<label for="reset-email">Work email</label>
							<input
								id="reset-email"
								type="email"
								placeholder="name@company.com"
								autocomplete="email"
								bind:value={email}
								class:invalid={emailErr}
								aria-invalid={!!emailErr}
								aria-describedby="reset-email-err"
								onblur={() => (emailTouched = email.length > 0 || emailTouched)}
							/>
							<FieldError id="reset-email-err" message={emailErr} />
						</div>

						{@render submitButton('Send reset link', 'Sent', 'Sending')}

						<p class="form-foot"><button type="button" class="link" onclick={() => switchMode('signin')}>Back to sign in</button></p>
					</form>
				{:else}
					<div class="form sent" role="status" in:fly={{ y: 8, duration: 260, easing: cubicOut }}>
						<span class="sent-icon">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<rect x="2" y="4" width="20" height="16" rx="2" />
								<path d="m22 7-10 6L2 7" />
							</svg>
						</span>
						<h1>Check your inbox</h1>
						<p class="sub">We sent a reset link to <strong>{email.trim()}</strong>. It expires in 30 minutes.</p>
						<button type="button" class="btn btn-google" onclick={() => switchMode('signin')}>Back to sign in</button>
					</div>
				{/if}
			</div>

			<div
				class="preview-side"
				role="group"
				aria-roledescription="carousel"
				aria-label="Relay product preview"
				onmouseenter={() => (paused = true)}
				onmouseleave={() => (paused = false)}
			>
				<div class="slides">
					<!-- Slide 1 · task list -->
					<div class="slide" class:active={slide === 0} aria-hidden={slide !== 0}>
						<h2>Every task in one calm list</h2>
						<p>Home gathers what's due today from every project.</p>
						<div class="mock mock-tasks">
							<div class="due-pop" aria-hidden="true">
								<p class="pop-label">Due date</p>
								<div class="pop-row">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /></svg>
									Today
								</div>
								<div class="pop-row sel">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /></svg>
									Tomorrow
									<svg class="pcheck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
								</div>
								<div class="pop-row">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /></svg>
									Next week
								</div>
							</div>
							<header>
								<p class="mock-title">Good morning, Aidan</p>
								<p class="mock-sub">Tuesday · 2 tasks due today</p>
							</header>
							<div class="task-list">
								<div class="task-row done">
									<span class="tcheck ok">
										<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
									</span>
									<span class="tlabel">Send the onboarding questionnaire</span>
								</div>
								<div class="task-row">
									<span class="tcheck"></span>
									<span class="tlabel">Review navigation labels</span>
									<span class="pill pill-dark">Tomorrow</span>
								</div>
								<div class="task-row">
									<span class="tcheck"></span>
									<span class="tlabel">Prepare the kickoff agenda</span>
									<span class="pill pill-grey">Today</span>
								</div>
							</div>
							<div class="toast" aria-hidden="true">
								<svg class="toast-check" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
								Task completed
								<span class="undo">Undo</span>
							</div>
						</div>
					</div>

					<!-- Slide 2 · week planner -->
					<div class="slide" class:active={slide === 1} aria-hidden={slide !== 1}>
						<h2>Plan the week in minutes</h2>
						<p>Drag tasks between days — Relay finds the gaps.</p>
						<div class="mock mock-week" aria-hidden="true">
							<div class="wk-col">
								<p class="wk-day">Mon</p>
								<div class="wk-block b-mid">1:1 Maya</div>
							</div>
							<div class="wk-col">
								<p class="wk-day">Tue</p>
								<div class="wk-block b-ink">Design</div>
								<div class="wk-block b-soft">Ship v2</div>
							</div>
							<div class="wk-col">
								<p class="wk-day">Wed</p>
								<div class="wk-block b-soft">Writing</div>
							</div>
							<div class="wk-col">
								<p class="wk-day">Thu</p>
								<div class="wk-block b-mid">Sprint</div>
							</div>
							<div class="wk-col">
								<p class="wk-day">Fri</p>
								<div class="wk-block b-mid">Retro</div>
							</div>
						</div>
					</div>

					<!-- Slide 3 · focus timer -->
					<div class="slide" class:active={slide === 2} aria-hidden={slide !== 2}>
						<h2>Focus without the noise</h2>
						<p>One priority at a time, with a timer that keeps you honest.</p>
						<div class="mock mock-focus">
							<p class="pop-label">Focus session</p>
							<p class="timer">25:00</p>
							<div class="track"><div class="fill"></div></div>
							<p class="mock-sub">Deep work · Login redesign</p>
						</div>
					</div>
				</div>

				<div class="dots">
					{#each slides as i (i)}
						<button
							type="button"
							class="dot"
							class:active={slide === i}
							aria-label={`Show slide ${i + 1} of ${slides.length}`}
							aria-current={slide === i}
							onclick={() => (slide = i)}
						></button>
					{/each}
				</div>
			</div>
		</section>
	</main>

	<footer class="page-foot">
		<p>By continuing you agree to our <a href="/login">Terms</a> and <a href="/login">Privacy policy</a>.</p>
	</footer>
</div>

<style>
	.login {
		/* Paper monochrome tokens */
		--bg: #faf9f5;
		--accent: #1a1915;
		--accent-hover: #000000;
		--accent-soft: #f0eee6;
		--ring: color-mix(in oklab, var(--accent), transparent 88%);
		--fg: #191817;
		--fg-2: #6e6b62;
		--fg-3: #a8a49b;
		--line: #e8e6dd;
		--bg-subtle: #f4f2ec;
		--danger: #dc2626;
		--kit-danger: var(--danger);
		--kit-field-error-gap: 0;
		--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
		--shadow-btn: 0 1px 2px rgb(35 32 26 / 0.06), 0 0 0 1px var(--line);
		--shadow-btn-primary:
			inset 0 1px 0 rgb(255 255 255 / 0.14), 0 1px 2px rgb(0 0 0 / 0.2),
			0 0 0 1px rgb(0 0 0 / 0.24);
		--shadow-card: 0 1px 2px rgb(0 0 0 / 0.03), 0 0 0 1px var(--line);
		--shadow-pop:
			0 0 0 1px rgb(35 32 26 / 0.07), 0 8px 24px -4px rgb(35 32 26 / 0.12),
			0 2px 6px rgb(35 32 26 / 0.04);

		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background: var(--bg);
		color: var(--fg);
		font-family: 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif;
		font-size: 14px;
		line-height: 1.5;
		font-feature-settings: 'cv11', 'ss01';
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
	}

	.login a {
		color: inherit;
		text-decoration: none;
	}

	/* ── Top bar ─────────────────────────────────────────── */
	.topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 56px;
		padding: 0 28px;
		border-bottom: 1px solid var(--line);
		flex-shrink: 0;
	}

	.brand {
		display: inline-flex;
	}

	.logo-tile {
		width: 34px;
		height: 34px;
		border-radius: 10px;
		background: var(--accent);
		display: grid;
		place-items: center;
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.18),
			0 1px 2px rgb(0 0 0 / 0.16);
	}

	.logo-tile svg {
		width: 18px;
		height: 18px;
	}

	.logo-tile.sm {
		width: 26px;
		height: 26px;
		border-radius: 8px;
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.18),
			0 1px 2px rgb(0 0 0 / 0.14);
	}

	.logo-tile.sm svg {
		width: 14px;
		height: 14px;
	}

	.topbar-help {
		font-size: 13px;
		color: var(--fg-2);
		display: flex;
		gap: 6px;
	}

	.topbar-help a {
		color: var(--fg);
		font-weight: 500;
	}

	.topbar-help a:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	/* ── Stage / split card ──────────────────────────────── */
	.stage {
		flex: 1;
		display: grid;
		place-items: center;
		padding: 32px 24px;
	}

	.auth-card {
		width: min(1080px, 100%);
		display: flex;
		min-height: 560px;
		border-radius: 20px;
		background: var(--bg-subtle);
		box-shadow: var(--shadow-card);
	}

	.form-side {
		width: 420px;
		flex-shrink: 0;
		display: grid;
		place-items: center;
		padding: 36px 32px;
		background: #fff;
		border-radius: 16px;
		box-shadow:
			0 1px 2px rgb(0 0 0 / 0.04),
			0 12px 32px -12px rgb(0 0 0 / 0.12),
			0 0 0 1px var(--line);
		position: relative;
		z-index: 1;
	}

	.form {
		width: 100%;
		max-width: 300px;
		display: flex;
		flex-direction: column;
	}

	.form-mark {
		display: flex;
		justify-content: center;
	}

	.logo-circle {
		width: 48px;
		height: 48px;
		border-radius: 9999px;
		background: var(--accent-soft);
		display: grid;
		place-items: center;
	}

	.form h1 {
		margin: 14px 0 0;
		font-size: 20px;
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.2;
		text-align: center;
	}

	.form .sub {
		margin: 4px 0 0;
		font-size: 13px;
		color: var(--fg-2);
		text-align: center;
	}

	/* ── Buttons ─────────────────────────────────────────── */
	.btn {
		height: 36px;
		padding: 0 12px;
		border: 0;
		border-radius: 9px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-family: inherit;
		font-size: 14px;
		font-weight: 500;
		color: var(--fg);
		user-select: none;
		transition:
			transform 150ms var(--ease-out),
			box-shadow 150ms var(--ease-out),
			background 150ms var(--ease-out);
	}

	.btn:active:not(:disabled) {
		transform: scale(0.97);
	}

	.btn-google {
		width: 100%;
		margin-top: 16px;
		background: linear-gradient(#fff, #f6f4ed);
		box-shadow: var(--shadow-btn);
	}

	.btn-google:hover {
		background: linear-gradient(#fff, #f0ede3);
	}

	.btn-google svg {
		width: 16px;
		height: 16px;
	}

	.btn-primary {
		display: grid;
		width: 100%;
		height: 40px;
		margin-top: 14px;
		background: var(--accent);
		color: #fff;
		box-shadow: var(--shadow-btn-primary);
	}

	.btn-primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.btn-primary.done {
		background: var(--accent-hover);
	}

	.btn-primary .check {
		width: 16px;
		height: 16px;
	}

	/* idle → busy → done share one button; the faces cross-fade and rise into place */
	.btn-primary .face {
		grid-area: 1 / 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition:
			opacity 180ms var(--ease-out),
			transform 220ms var(--ease-out),
			filter 180ms var(--ease-out);
	}

	.btn-primary .face:not([data-active]) {
		opacity: 0;
		transform: translateY(6px);
		filter: blur(2px);
	}

	.sr-status {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
	}

	.btn-primary .check path {
		stroke-dasharray: 1;
		stroke-dashoffset: 1;
		animation: draw 300ms var(--ease-out) 50ms forwards;
	}

	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	.spinner {
		width: 16px;
		height: 16px;
		border-radius: 9999px;
		border: 2px solid rgb(255 255 255 / 0.35);
		border-top-color: #fff;
		animation: spin 700ms linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(1turn);
		}
	}

	.btn:focus-visible,
	.pw-toggle:focus-visible,
	.dot:focus-visible,
	.topbar-help a:focus-visible,
	.forgot:focus-visible,
	.form-foot a:focus-visible,
	.page-foot a:focus-visible,
	.brand:focus-visible {
		outline: none;
		box-shadow: var(--shadow-focus, 0 0 0 3px var(--ring)), var(--shadow-btn);
	}

	.btn-primary:focus-visible {
		box-shadow: 0 0 0 3px var(--ring), var(--shadow-btn-primary);
	}

	/* ── Divider / fields ────────────────────────────────── */
	.divider {
		display: flex;
		align-items: center;
		gap: 12px;
		margin: 14px 0;
		color: var(--fg-3);
		font-size: 12px;
	}

	.divider::before,
	.divider::after {
		content: '';
		height: 1px;
		flex: 1;
		background: var(--line);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field + .field {
		margin-top: 10px;
	}

	.field label {
		font-size: 13px;
		font-weight: 500;
		color: var(--fg);
	}

	.field-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}

	.forgot,
	.link {
		padding: 0;
		border: 0;
		background: none;
		font-family: inherit;
	}

	.forgot {
		font-size: 13px;
		font-weight: 500;
		color: var(--fg-2);
		transition: color 100ms var(--ease-out);
	}

	.forgot:hover {
		color: var(--fg);
	}

	.field input {
		height: 36px;
		width: 100%;
		border: 0;
		border-radius: 9px;
		padding: 0 11px;
		background: #fff;
		color: var(--fg);
		font-family: inherit;
		font-size: 14px;
		box-shadow: var(--shadow-btn);
		transition: box-shadow 150ms var(--ease-out);
	}

	.field input::placeholder {
		color: var(--fg-3);
	}

	.field input:focus,
	.field input:focus-visible {
		outline: none;
		box-shadow:
			0 0 0 1px var(--accent),
			0 0 0 4px var(--ring);
	}

	.field input.invalid {
		box-shadow:
			0 0 0 1px var(--danger),
			0 0 0 4px rgb(220 38 38 / 0.15);
	}

	.pw-wrap {
		position: relative;
	}

	.pw-wrap input {
		padding-right: 40px;
	}

	.pw-toggle {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 28px;
		height: 28px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		display: grid;
		place-items: center;
		color: var(--fg-3);
		transition: color 100ms var(--ease-out);
	}

	.pw-toggle:hover {
		color: var(--fg-2);
	}

	/* eye ↔ eye-off cross-fade in place */
	.pw-toggle svg {
		grid-area: 1 / 1;
		width: 16px;
		height: 16px;
		transition:
			opacity 150ms var(--ease-out),
			transform 200ms var(--ease-out),
			filter 150ms var(--ease-out);
	}

	.pw-toggle svg:not([data-active]) {
		opacity: 0;
		transform: scale(0.6);
		filter: blur(2px);
	}

	/* reset flow */
	.field-first {
		margin-top: 20px;
	}

	.link {
		font-size: 13px;
		font-weight: 500;
		color: var(--fg);
	}

	.link:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.sent {
		align-items: center;
		text-align: center;
	}

	.sent-icon {
		display: grid;
		place-items: center;
		width: 44px;
		height: 44px;
		margin: 0 auto 14px;
		border-radius: 9999px;
		background: var(--accent-soft);
		color: var(--fg);
		animation: pop-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	.sent-icon svg {
		width: 20px;
		height: 20px;
	}

	.sent strong {
		font-weight: 500;
		color: var(--fg);
	}

	@keyframes pop-in {
		from {
			opacity: 0;
			transform: scale(0.6);
		}
	}

	.form-foot {
		margin: 14px 0 0;
		font-size: 13px;
		color: var(--fg-2);
		text-align: center;
	}

	.form-foot a {
		color: var(--fg);
		font-weight: 500;
	}

	.form-foot a:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	/* ── Preview side ────────────────────────────────────── */
	.preview-side {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 32px 40px 28px;
		border-radius: 0 20px 20px 0;
		animation: fade 500ms var(--ease-out) 150ms both;
	}

	.slides {
		display: grid;
		width: 100%;
		max-width: 440px;
	}

	.slide {
		grid-area: 1 / 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		opacity: 0;
		transform: translateY(6px) scale(0.985);
		transition:
			opacity 220ms ease-out,
			transform 220ms ease-out;
		pointer-events: none;
	}

	.slide.active {
		opacity: 1;
		transform: none;
		transition:
			opacity 400ms var(--ease-out) 100ms,
			transform 400ms var(--ease-out) 100ms;
		pointer-events: auto;
	}

	.slide h2 {
		font-size: 18px;
		font-weight: 600;
		letter-spacing: -0.01em;
		text-align: center;
	}

	.slide > p {
		margin: 2px 0 0;
		font-size: 13px;
		color: var(--fg-2);
		text-align: center;
	}

	.dots {
		display: flex;
		gap: 6px;
		margin-top: 20px;
	}

	.dot {
		position: relative;
		width: 6px;
		height: 6px;
		padding: 0;
		border: 0;
		border-radius: 9999px;
		background: #d8d4c8;
		transition:
			width 250ms var(--ease-out),
			background-color 250ms var(--ease-out);
	}

	.dot::before {
		content: '';
		position: absolute;
		inset: -5px;
	}

	.dot.active {
		width: 18px;
		background: var(--accent);
	}

	/* ── Mockups ─────────────────────────────────────────── */
	.mock {
		margin-top: 32px;
		width: 100%;
		max-width: 380px;
		padding: 12px;
		background: #fff;
		border-radius: 14px;
		box-shadow:
			0 1px 2px rgb(0 0 0 / 0.04),
			0 12px 32px -12px rgb(0 0 0 / 0.1),
			0 0 0 1px var(--line);
		position: relative;
		text-align: left;
	}

	.mock-title {
		font-size: 14px;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.mock-sub {
		margin-top: 2px;
		font-size: 12px;
		color: var(--fg-2);
	}

	.task-list {
		margin-top: 8px;
	}

	.task-row {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 30px;
		padding: 0 2px;
	}

	.task-row + .task-row {
		border-top: 1px solid var(--line);
	}

	.tcheck {
		width: 14px;
		height: 14px;
		flex-shrink: 0;
		border-radius: 9999px;
		box-shadow: 0 0 0 1px #d8d4c8;
		display: grid;
		place-items: center;
	}

	.tcheck svg {
		width: 10px;
		height: 10px;
	}

	.tcheck.ok {
		background: var(--accent);
		box-shadow: none;
	}

	.tlabel {
		flex: 1;
		min-width: 0;
		font-size: 13px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.done .tlabel {
		color: var(--fg-3);
		text-decoration: line-through;
	}

	.pill {
		height: 18px;
		padding: 0 5px;
		border-radius: 5px;
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
		font-size: 11px;
		font-weight: 500;
	}

	.pill-dark {
		color: #3f3b33;
		background: #eae7dc;
		box-shadow: inset 0 0 0 1px #dcd8cb;
	}

	.pill-grey {
		color: var(--fg-2);
		background: #f1efe7;
		box-shadow: inset 0 0 0 1px #e3e0d5;
	}

	.due-pop {
		position: absolute;
		top: -28px;
		right: -16px;
		width: 144px;
		padding: 5px;
		background: #fff;
		border-radius: 10px;
		box-shadow: var(--shadow-pop);
		z-index: 2;
	}

	.pop-label {
		padding: 5px 7px 3px;
		font-size: 12px;
		color: var(--fg-2);
	}

	.pop-row {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 26px;
		padding: 0 7px;
		border-radius: 7px;
		font-size: 13px;
		color: var(--fg);
	}

	.pop-row svg {
		width: 13px;
		height: 13px;
		color: var(--fg-2);
	}

	.pop-row.sel {
		background: #f0eee5;
	}

	.pop-row .pcheck {
		margin-left: auto;
		color: var(--fg);
	}

	.toast {
		position: absolute;
		left: 12px;
		bottom: -12px;
		height: 28px;
		padding: 0 8px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		background: #1a1915;
		color: #fff;
		border-radius: 9px;
		font-size: 12px;
		font-weight: 500;
		box-shadow: var(--shadow-pop);
	}

	.toast-check {
		width: 13px;
		height: 13px;
	}

	.undo {
		height: 20px;
		padding: 0 6px;
		margin-left: 2px;
		display: inline-flex;
		align-items: center;
		border-radius: 5px;
		background: rgb(255 255 255 / 0.12);
		font-size: 12px;
	}

	.mock-week {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 6px;
	}

	.wk-day {
		margin-bottom: 6px;
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: var(--fg-3);
	}

	.wk-block {
		padding: 4px 7px;
		margin-bottom: 4px;
		border-radius: 7px;
		font-size: 12px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.wk-block:last-child {
		margin-bottom: 0;
	}

	.b-ink {
		color: #faf9f5;
		background: #1a1915;
	}

	.b-mid {
		color: #3f3b33;
		background: #eae7dc;
		box-shadow: inset 0 0 0 1px #dcd8cb;
	}

	.b-soft {
		color: #6e6b62;
		background: #f1efe7;
		box-shadow: inset 0 0 0 1px #e3e0d5;
	}

	.mock-focus .pop-label {
		padding: 0;
	}

	.timer {
		margin-top: 4px;
		font-family: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 28px;
		font-weight: 600;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}

	.track {
		height: 6px;
		margin-top: 8px;
		border-radius: 9999px;
		background: #ecebe2;
		overflow: hidden;
	}

	.fill {
		width: 58%;
		height: 100%;
		border-radius: inherit;
		background: var(--accent);
	}

	/* ── Footer ──────────────────────────────────────────── */
	.page-foot {
		padding: 16px 24px 20px;
		text-align: center;
		font-size: 12.5px;
		color: var(--fg-2);
		flex-shrink: 0;
	}

	.page-foot a {
		color: var(--fg);
	}

	.page-foot a:hover {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	/* ── Entrance choreography ───────────────────────────── */
	.reveal {
		animation: rise 450ms var(--ease-out) both;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
	}

	.r1 { animation-delay: 0ms; }
	.r2 { animation-delay: 30ms; }
	.r3 { animation-delay: 60ms; }
	.r4 { animation-delay: 90ms; }
	.r5 { animation-delay: 120ms; }
	.r6 { animation-delay: 150ms; }
	.r7 { animation-delay: 180ms; }
	.r8 { animation-delay: 210ms; }
	.r9 { animation-delay: 240ms; }

	/* ── Responsive ──────────────────────────────────────── */
	@media (max-width: 960px) {
		.preview-side {
			display: none;
		}

		.auth-card {
			width: 100%;
			max-width: 460px;
			min-height: 0;
		}

		.form-side {
			width: 100%;
			border-radius: 16px;
		}
	}

	@media (max-width: 480px) {
		.stage {
			padding: 24px 16px;
		}

		.topbar {
			padding: 0 20px;
		}

		.topbar-help span {
			display: none;
		}

		.form-side {
			padding: 32px 20px;
		}
	}

	/* ── Reduced motion ──────────────────────────────────── */
	@media (prefers-reduced-motion: reduce) {
		.reveal,
		.preview-side {
			animation: none;
			opacity: 1;
			transform: none;
		}

		.slide,
		.dot,
		.btn,
		.field input {
			transition: none;
		}

		.btn-primary .check path {
			animation-duration: 1ms;
		}
	}
</style>
