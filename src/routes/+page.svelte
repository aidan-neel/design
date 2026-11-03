<script lang="ts">
	import '@fontsource-variable/inter';
	import { cubicIn, cubicOut } from 'svelte/easing';

	type Demo = { href: string; name: string; product: string; desc: string; shot: string };

	const demos: Demo[] = [
		{
			href: '/dashboard',
			name: 'Analytics',
			product: 'Sift · Acme Labs',
			desc: 'Dark KPI dashboard: revenue chart, sessions donut, funnel and live conversions.',
			shot: '/shots/dashboard.png'
		},
		{
			href: '/dashboard-3',
			name: 'Analytics II',
			product: 'Northwind Labs',
			desc: 'Segmented ranges, compare toggle, mono KPI numbers and hover tooltips.',
			shot: '/shots/dashboard-3.png'
		},
		{
			href: '/crm',
			name: 'CRM',
			product: 'Folio · Hale Provisions',
			desc: 'Deal pipeline with stage pills, owners, filters and a detail pane.',
			shot: '/shots/crm.png'
		},
		{
			href: '/assistant',
			name: 'Assistant',
			product: 'Halo · Northwind',
			desc: 'Churn review thread: tables, drafted posts, per-message actions.',
			shot: '/shots/assistant.png'
		},
		{
			href: '/login',
			name: 'Auth',
			product: 'Relay',
			desc: 'Split sign-in card with product preview, popover and undo toast.',
			shot: '/shots/login.png'
		},
		{
			href: '/evals',
			name: 'Evals',
			product: 'aidan-neel/design',
			desc: 'The same prompt with and without the skill, rendered side by side.',
			shot: '/shots/evals.png'
		}
	];

	const traits = [
		{
			title: 'Tokens, not vibes',
			desc: 'One token sheet: quiet neutrals, a single accent, radii tiers, layered shadows and easing curves.'
		},
		{
			title: 'Component recipes',
			desc: 'Exact button and input builds, tinted tags, popovers, toasts — and the full sidebar recipe.'
		},
		{
			title: 'Motion with a cause',
			desc: '150–300ms, ease-out and springs. Sliding indicators, origin-aware popovers, press scale.'
		},
		{
			title: 'Anti-slop rules',
			desc: 'Eighteen hard don’ts, each with a do: no default purple, no emoji icons, no invented logos.'
		},
		{
			title: 'Verify in pixels',
			desc: 'Screenshot → check → fix, up to two rounds, before any UI is allowed to ship.'
		}
	];

	const INSTALL = 'npx skills add aidan-neel/design --skill giga-ui';

	const paths = {
		check: 'M20 6 9 17l-5-5',
		copy: 'M9 9h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
		arrow: 'M5 12h14M13 6l6 6-6 6'
	};
	type IconName = keyof typeof paths;

	let copied = $state(false);

	// ---------- first-paint reveal (class removed on end so no stacking context lingers) ----------
	function reveal(node: HTMLElement, delay = 0) {
		node.classList.add('reveal');
		if (delay) node.style.animationDelay = `${delay}ms`;
		node.addEventListener(
			'animationend',
			() => {
				node.classList.remove('reveal');
				node.style.animationDelay = '';
			},
			{ once: true }
		);
	}

	async function copyInstall() {
		try {
			await navigator.clipboard.writeText(INSTALL);
		} catch {
			// clipboard unavailable — still show feedback
		}
		copied = true;
		setTimeout(() => (copied = false), 1600);
	}

	function popIn(node: HTMLElement) {
		return {
			duration: 180,
			easing: cubicOut,
			css: (t: number) => `opacity:${t}; transform: scale(${0.96 + 0.04 * t}) translateY(${(1 - t) * -4}px);`
		};
	}
	function popOut(node: HTMLElement) {
		return {
			duration: 120,
			easing: cubicIn,
			css: (t: number) => `opacity:${t}; transform: scale(${0.98 + 0.02 * t});`
		};
	}
</script>

<svelte:head>
	<title>giga-ui — a design skill for coding agents</title>
	<style>
		html {
			scroll-behavior: smooth;
		}
		@media (prefers-reduced-motion: reduce) {
			html {
				scroll-behavior: auto;
			}
		}
	</style>
</svelte:head>

{#snippet icon(name: IconName, cls = 'size-4')}
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={cls}
		aria-hidden="true"
	>
		<path d={paths[name]} />
	</svg>
{/snippet}

<div class="gp flex min-h-dvh flex-col bg-white">
	<!-- ================= nav ================= -->
	<header class="sticky top-0 z-40 border-b border-[#ececec] bg-white/85 backdrop-blur-md">
		<div class="mx-auto flex h-14 max-w-[1200px] items-center gap-6 px-6">
			<a href="/" class="text-[15px] font-semibold tracking-[-0.01em] text-[#171717]">giga-ui</a>
			<nav aria-label="Main" class="ml-auto flex items-center gap-1">
				<a href="#demos" class="navlink">Demos</a>
				<a href="#skill" class="navlink">Skill</a>
				<a
					href="https://github.com/aidan-neel/design"
					target="_blank"
					rel="noopener noreferrer"
					class="navlink gap-1.5"
				>
					<svg viewBox="0 0 16 16" fill="currentColor" class="size-3.5" aria-hidden="true">
						<path
							d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.5 7.5 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A7.99 7.99 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
						/>
					</svg>
					GitHub
				</a>
			</nav>
			<span class="max-sm:hidden">
				<button onclick={copyInstall} class="press btn-primary">
					{#if copied}
						<span class="flex items-center gap-1.5 text-[#ffd9c4]">
							{@render icon('check', 'size-3.5')}
							Copied
						</span>
					{:else}
						Copy install
					{/if}
				</button>
			</span>
		</div>
	</header>

	<!-- ================= hero ================= -->
	<section class="relative overflow-hidden max-lg:overflow-visible">
		<div class="relative mx-auto max-w-[1200px] px-6 max-lg:pt-14 lg:h-[560px]">
			<!-- copy -->
			<div class="relative z-10 max-w-[440px] max-lg:mx-auto max-lg:text-center lg:absolute lg:left-6 lg:top-[150px]">
				<h1
					class="reveal m-0 text-[38px] font-semibold leading-[1.05] tracking-[-0.03em] text-[#171717] text-balance"
					use:reveal
				>
					Artificial taste for artificial intelligence.
				</h1>
				<p class="reveal mt-4 text-[15px] leading-[1.6] text-[#737373]" use:reveal={60}>
					giga-ui is an installable design skill for coding agents — one visual language of tokens,
					component recipes and motion rules that turns a one-line prompt into calm,
					production-quality UI. This page is built with it. So is every demo below.
				</p>
				<div class="reveal mt-6 flex flex-wrap items-center gap-2.5 max-lg:justify-center" use:reveal={120}>
					<button onclick={copyInstall} class="press btn-primary h-[36px] px-4">
						{#if copied}
							<span class="flex items-center gap-1.5">
								{@render icon('check', 'size-4')}
								Copied to clipboard
							</span>
						{:else}
							Copy install command
						{/if}
					</button>
					<a href="#demos" class="press btn-secondary h-[36px] px-4">Browse demos</a>
				</div>
			</div>

			<!-- hero window: corner bleed off the right and bottom (stageshow framing) -->
			<a
				href="/chatapp"
				aria-label="Open the Cove chat demo"
				class="reveal absolute left-[calc(50%+40px)] top-[64px] hidden w-[820px] lg:block"
				use:reveal={140}
			>
				<!-- corner chip satellite: straddles the window's top-left corner, over chrome only -->
				<span
					class="absolute -top-4 left-[-120px] z-10 inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-md bg-white px-3 font-mono text-[11px] text-[#737373] shadow-[0_0_0_1px_rgb(0_0_0/.06),0_2px_8px_rgb(0_0_0/.08)]"
				>
					<span class="size-1.5 rounded-full bg-[#16a34a]"></span>
					{INSTALL}
				</span>

				<span class="block overflow-hidden rounded-xl shadow-[0_0_0_1px_rgb(0_0_0/.06),0_24px_64px_-12px_rgb(0_0_0/.18)]">
					<!-- browser chrome -->
					<span class="flex h-[38px] items-center gap-3 border-b border-[#ececec] bg-white px-4">
						<span class="flex gap-1.5">
							<span class="size-2.5 rounded-full bg-[#ff5f57]"></span>
							<span class="size-2.5 rounded-full bg-[#febc2e]"></span>
							<span class="size-2.5 rounded-full bg-[#28c840]"></span>
						</span>
						<span class="mx-auto rounded-md bg-[#f4f4f4] px-3 py-1 font-mono text-[11px] leading-none text-[#737373]">
							design.dev/chatapp
						</span>
						<span class="w-[54px]"></span>
					</span>
					<!-- screenshot: fades out at its foot (fade-crop) -->
					<span class="block h-[470px] bg-white [mask-image:linear-gradient(to_bottom,black_72%,transparent_99%)]">
						<img src="/shots/chatapp.png" alt="Cove chat demo built with giga-ui" class="w-full" loading="eager" />
					</span>
				</span>
			</a>

			<!-- compact hero window for small formats -->
			<div class="reveal mt-8 lg:hidden" use:reveal={140}>
				<div class="overflow-hidden rounded-xl shadow-[0_0_0_1px_rgb(0_0_0/.06),0_12px_32px_-8px_rgb(0_0_0/.12)]">
					<div class="flex h-[38px] items-center gap-3 border-b border-[#ececec] bg-white px-4">
						<span class="flex gap-1.5">
							<span class="size-2.5 rounded-full bg-[#ff5f57]"></span>
							<span class="size-2.5 rounded-full bg-[#febc2e]"></span>
							<span class="size-2.5 rounded-full bg-[#28c840]"></span>
						</span>
						<span class="mx-auto rounded-md bg-[#f4f4f4] px-3 py-1 font-mono text-[11px] leading-none text-[#737373]">
							design.dev/chatapp
						</span>
						<span class="w-[54px]"></span>
					</div>
					<div class="h-[300px] bg-white [mask-image:linear-gradient(to_bottom,black_70%,transparent_99%)]">
						<img
							src="/shots/chatapp.png"
							alt="Cove chat demo built with giga-ui"
							class="h-[300px] w-full object-cover object-left-top"
							loading="eager"
						/>
					</div>
				</div>
				<div class="mt-4 flex items-center gap-2 overflow-x-auto rounded-lg bg-[#f7f7f7] px-3 py-2 font-mono text-[11px] text-[#737373] max-lg:text-left">
					<span class="whitespace-nowrap">$ {INSTALL}</span>
				</div>
			</div>
		</div>
	</section>

	<!-- ================= demos ================= -->
	<section id="demos" class="scroll-mt-20">
		<div class="mx-auto max-w-[1200px] px-6 pt-20 pb-4">
			<div class="reveal flex items-baseline justify-between gap-4" use:reveal>
				<h2 class="m-0 text-[22px] font-semibold tracking-[-0.02em] text-[#171717]">Built with the skill</h2>
				<p class="m-0 text-[13px] text-[#a3a3a3]">Six demo screens · one visual language</p>
			</div>

			<div class="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
				{#each demos as d, i (d.href)}
					<a
						href={d.href}
						class="reveal group block focus-visible:outline-none"
						use:reveal={Math.min(i * 70, 350)}
					>
						<!-- stage: the card is the ground; window pinned, bleeding past the bottom -->
						<span class="relative block h-[220px] overflow-hidden rounded-xl bg-[#f4f4f4] transition-shadow duration-200 group-hover:shadow-[0_0_0_1px_rgb(0_0_0/.08),0_8px_24px_-8px_rgb(0_0_0/.12)] group-focus-visible:shadow-[0_0_0_2px_#171717,0_8px_24px_-8px_rgb(0_0_0/.12)]">
							<span class="absolute inset-x-[20px] top-[20px] bottom-[-44px] block overflow-hidden rounded-t-lg bg-white shadow-[0_0_0_1px_rgb(0_0_0/.06),0_10px_30px_-10px_rgb(0_0_0/.16)]">
								<!-- browser chrome -->
								<span class="flex h-[30px] items-center border-b border-[#ececec] bg-white px-3">
									<span class="flex gap-1">
										<span class="size-[7px] rounded-full bg-[#e0e0e0]"></span>
										<span class="size-[7px] rounded-full bg-[#e0e0e0]"></span>
										<span class="size-[7px] rounded-full bg-[#e0e0e0]"></span>
									</span>
									<span class="mx-auto rounded bg-[#f4f4f4] px-2 py-0.5 font-mono text-[9px] leading-none text-[#a3a3a3]">
										design.dev{d.href}
									</span>
									<span class="w-[30px]"></span>
								</span>
								<!-- screenshot, fading at the foot -->
								<span class="block bg-white [mask-image:linear-gradient(to_bottom,black_70%,transparent_99%)]">
									<img src={d.shot} alt="{d.name} demo built with giga-ui" class="w-full" loading="lazy" />
								</span>
							</span>
						</span>
						<span class="mt-4 flex items-baseline justify-between gap-3">
							<span class="text-[14px] font-medium tracking-[-0.01em] text-[#171717]">{d.name}</span>
							<span class="font-mono text-[11px] text-[#a3a3a3]">{d.product}</span>
						</span>
						<span class="mt-1 block text-[13px] leading-[1.5] text-[#737373]">{d.desc}</span>
						<span class="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#171717] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
							Open demo
							{@render icon('arrow', 'size-3.5')}
						</span>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- ================= the skill ================= -->
	<section id="skill" class="scroll-mt-20">
		<div class="mx-auto max-w-[1200px] px-6 pt-20 pb-24">
			<div class="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
				<div class="reveal" use:reveal>
					<h2 class="m-0 text-[22px] font-semibold tracking-[-0.02em] text-[#171717]">The skill</h2>
					<p class="mt-3 text-[14px] leading-[1.6] text-[#737373]">
						giga-ui lives in this repo at
						<code class="rounded bg-[#f4f4f4] px-1.5 py-0.5 font-mono text-[12px] text-[#171717]">skills/giga-ui</code>
						and loads like any agent skill: one SKILL.md with the full style, tokens, recipes and QA
						loop, plus reference images to compare against.
					</p>
					<div class="mt-5 flex items-center gap-2">
						<button
							onclick={copyInstall}
							class="press flex h-[36px] min-w-0 flex-1 items-center gap-3 rounded-[10px] bg-[#f7f7f7] px-3 text-left font-mono text-[12px] text-[#171717] shadow-[0_1px_2px_rgb(40_40_40/.08),0_0_0_1px_#ececec] transition-shadow duration-150 hover:to-[#f2f2f2] focus-visible:shadow-[0_0_0_1px_#171717,0_0_0_4px_rgb(0_0_0/.08)] sm:flex-none sm:pr-3"
						>
							<span class="truncate">{INSTALL}</span>
							<span class="ml-auto shrink-0 text-[#a3a3a3]">
								{#if copied}
									{@render icon('check', 'size-3.5 text-[#171717]')}
								{:else}
									{@render icon('copy', 'size-3.5')}
								{/if}
							</span>
						</button>
					</div>
					<a
						href="https://github.com/aidan-neel/design/blob/main/skills/giga-ui/SKILL.md"
						target="_blank"
						rel="noopener noreferrer"
						class="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#171717] hover:opacity-70"
					>
						Read the SKILL.md
						{@render icon('arrow', 'size-3.5')}
					</a>
				</div>

				<dl class="reveal m-0" use:reveal={80}>
					{#each traits as t, i (t.title)}
						<div class="flex gap-5 border-b border-[#ececec] py-4 {i === 0 ? 'pt-0' : ''} {i === traits.length - 1 ? 'border-b-0' : ''}">
							<dt class="w-[150px] shrink-0 text-[14px] font-medium tracking-[-0.01em] text-[#171717]">{t.title}</dt>
							<dd class="m-0 text-[13px] leading-[1.55] text-[#737373]">{t.desc}</dd>
						</div>
					{/each}
				</dl>
			</div>
		</div>
	</section>

	<!-- ================= footer ================= -->
	<footer class="mt-auto border-t border-[#ececec]">
		<div class="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6 font-mono text-[11px] text-[#a3a3a3]">
			<span>MIT</span>
			<span class="max-sm:hidden">light mode · Inter · one accent</span>
			<a href="https://github.com/aidan-neel/design" class="hover:text-[#171717]">aidan-neel/design</a>
		</div>
	</footer>
</div>

<style>
	.gp {
		font-family: 'Inter Variable', 'Inter', ui-sans-serif, system-ui, sans-serif;
		font-feature-settings: 'cv11', 'ss01';
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
	}

	.gp :global(:focus-visible) {
		outline: 2px solid rgb(0 0 0 / 0.35);
		outline-offset: 2px;
	}

	.navlink {
		display: inline-flex;
		align-items: center;
		height: 30px;
		padding: 0 10px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		color: #737373;
		text-decoration: none;
		transition:
			color 120ms cubic-bezier(0.23, 1, 0.32, 1),
			background 120ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.navlink:hover {
		color: #171717;
		background: rgb(0 0 0 / 0.04);
	}

	.press {
		transition:
			transform 150ms cubic-bezier(0.23, 1, 0.32, 1),
			background 150ms cubic-bezier(0.23, 1, 0.32, 1),
			box-shadow 150ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.press:active {
		transform: scale(0.97);
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 0;
		border-radius: 10px;
		background: #0a0a0a;
		color: #fff;
		font-size: 14px;
		font-weight: 500;
		text-decoration: none;
		user-select: none;
		cursor: default;
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.18),
			0 1px 2px rgb(0 0 0 / 0.16),
			0 0 0 1px rgb(0 0 0 / 0.9);
	}
	.btn-primary:hover {
		background: #1f1f1f;
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 0;
		border-radius: 10px;
		background: linear-gradient(#fff, #f7f7f7);
		color: #171717;
		font-size: 14px;
		font-weight: 500;
		text-decoration: none;
		user-select: none;
		cursor: default;
		box-shadow: 0 1px 2px rgb(40 40 40 / 0.08), 0 0 0 1px #ececec;
	}
	.btn-secondary:hover {
		background: linear-gradient(#fff, #f2f2f2);
	}

	.reveal {
		opacity: 0;
		animation: rise 400ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.reveal {
			animation: none;
			opacity: 1;
		}
		.press,
		.navlink {
			transition-duration: 0.01ms !important;
		}
	}
</style>
