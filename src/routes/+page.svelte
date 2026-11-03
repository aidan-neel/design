<script lang="ts">
	import '@fontsource-variable/inter';

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

<div class="gp min-h-dvh bg-white">
	<!-- ================= narrow column: header, tagline, facts, window ================= -->
	<div class="mx-auto max-w-[760px] px-6 pt-12 pb-4 sm:pt-16">
		<header class="reveal" use:reveal>
			<div class="flex items-center justify-between gap-3">
				<h1 class="m-0 text-[18px] font-semibold tracking-tight text-[#171717]">
					giga-ui
					<span class="ml-1 font-mono text-[12px] font-normal text-[#8a8a8a]">v0.1.0</span>
				</h1>
				<a
					href="https://github.com/aidan-neel/design"
					target="_blank"
					rel="noopener noreferrer"
					class="rounded-lg bg-white px-2.5 py-0.75 font-mono text-[11.5px] text-[#737373] no-underline shadow-ring transition-colors duration-150 hover:text-[#171717]"
				>
					aidan-neel/design
				</a>
			</div>
			<p class="mt-2.5 text-[15px] text-[#555]">Artificial taste for artificial intelligence</p>
			<p class="mt-1 text-[13px] text-[#a3a3a3]">
				An installable design skill for coding agents. Every demo below is built with it.
			</p>
		</header>

		<!-- quiet facts, in place of buttons -->
		<dl class="reveal m-0 mt-8" use:reveal={80}>
			<div class="flex h-13 items-center justify-between gap-3 border-t border-line">
				<dt class="font-mono text-[12px] text-[#8a8a8a]">Install</dt>
				<dd class="m-0 flex min-w-0 items-center gap-1.5">
					<code class="truncate font-mono text-[11.5px] text-[#1a1a1a]">{INSTALL}</code>
					<button onclick={copyInstall} aria-label="Copy install command" class="ibtn shrink-0">
						{#if copied}
							{@render icon('check', 'size-3.5')}
						{:else}
							{@render icon('copy', 'size-3.5')}
						{/if}
					</button>
				</dd>
			</div>
			<div class="flex h-13 items-center justify-between gap-3 border-t border-line">
				<dt class="font-mono text-[12px] text-[#8a8a8a]">Skill</dt>
				<dd class="m-0">
					<a
						href="https://github.com/aidan-neel/design/blob/main/skills/giga-ui/SKILL.md"
						target="_blank"
						rel="noopener noreferrer"
						class="text-[13px] text-[#737373] no-underline transition-colors duration-150 hover:text-[#1a1a1a]"
					>
						skills/giga-ui/SKILL.md
					</a>
				</dd>
			</div>
			<div class="flex h-13 items-center justify-between gap-3 border-y border-line">
				<dt class="font-mono text-[12px] text-[#8a8a8a]">Demos</dt>
				<dd class="m-0">
					<a href="#demos" class="text-[13px] text-[#737373] no-underline transition-colors duration-150 hover:text-[#1a1a1a]">
						Five screens ↓
					</a>
				</dd>
			</div>
		</dl>

		<!-- hero window: contained, fades out at its foot -->
		<a
			href="/chatapp"
			aria-label="Open the Cove chat demo"
			class="reveal mt-10 block focus-visible:outline-none"
			use:reveal={140}
		>
			<span class="block overflow-hidden rounded-xl bg-white shadow-[0_0_0_1px_rgb(0_0_0/.06),0_12px_40px_-12px_rgb(0_0_0/.14)] transition-shadow duration-200 hover:shadow-[0_0_0_1px_rgb(0_0_0/.08),0_16px_48px_-12px_rgb(0_0_0/.18)] group-focus-visible:shadow-[0_0_0_2px_#171717]">
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
				<span class="block h-[380px] bg-white [mask-image:linear-gradient(to_bottom,black_72%,transparent_99%)]">
					<img src="/shots/chatapp.png" alt="Cove chat demo built with giga-ui" class="w-full" loading="eager" />
				</span>
			</span>
		</a>
	</div>

	<!-- ================= demos: extra width, out of the column ================= -->
	<section id="demos" class="scroll-mt-16">
		<div class="mx-auto max-w-[1600px] px-6 pt-16 pb-4">
			<div class="reveal mb-8 flex items-baseline justify-between gap-4" use:reveal>
				<h2 class="m-0 text-[13px] font-medium text-[#444]">Built with the skill</h2>
				<p class="m-0 font-mono text-[11px] text-[#a3a3a3]">five screens · one visual language</p>
			</div>

			<div class="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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

	<!-- ================= the skill: back in the narrow column ================= -->
	<section id="skill" class="scroll-mt-16">
		<div class="mx-auto max-w-[760px] px-6 pt-16 pb-16">
			<div class="reveal" use:reveal>
				<h2 class="m-0 text-[13px] font-medium text-[#444]">The skill</h2>
				<p class="mt-3 text-[14px] leading-[1.6] text-[#737373]">
					giga-ui lives in this repo at
					<code class="rounded bg-[#f4f4f4] px-1.5 py-0.5 font-mono text-[12px] text-[#1a1a1a]">skills/giga-ui</code>
					and loads like any agent skill: one SKILL.md with the full style, tokens, recipes and QA
					loop, plus reference images to compare against.
				</p>
				<a
					href="https://github.com/aidan-neel/design/blob/main/skills/giga-ui/SKILL.md"
					target="_blank"
					rel="noopener noreferrer"
					class="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1a1a1a] hover:opacity-70"
				>
					Read the SKILL.md
					{@render icon('arrow', 'size-3.5')}
				</a>
			</div>

			<dl class="reveal m-0 mt-8" use:reveal={80}>
				{#each traits as t, i (t.title)}
					<div class="flex gap-5 border-b border-line py-4 {i === 0 ? 'border-t border-line' : ''} {i === traits.length - 1 ? 'border-b-0' : ''}">
						<dt class="w-[150px] shrink-0 text-[14px] font-medium tracking-[-0.01em] text-[#1a1a1a]">{t.title}</dt>
						<dd class="m-0 text-[13px] leading-[1.55] text-[#737373]">{t.desc}</dd>
					</div>
				{/each}
			</dl>
		</div>
	</section>

	<!-- ================= footer ================= -->
	<footer class="mx-auto max-w-[760px] px-6 pb-16">
		<div class="flex h-13 items-center justify-between border-t border-line font-mono text-[11px] text-[#8a8a8a]">
			<span>MIT</span>
			<a href="https://github.com/aidan-neel/design" class="text-[#8a8a8a] no-underline transition-colors duration-150 hover:text-[#1a1a1a]">
				aidan-neel/design
			</a>
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

	.ibtn {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: #a3a3a3;
		cursor: default;
		transition:
			background 120ms cubic-bezier(0.23, 1, 0.32, 1),
			color 120ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.ibtn:hover {
		background: rgb(0 0 0 / 0.04);
		color: #1a1a1a;
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
	}
</style>
