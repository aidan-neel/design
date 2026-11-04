<script lang="ts">
	import '@fontsource-variable/inter';
	import CopyButton from '#lib/kit/CopyButton.svelte';
	import KitRoot from '#lib/kit/KitRoot.svelte';

	type Demo = {
		href: string;
		name: string;
		product: string;
		model: string;
		desc: string;
		shot: string;
	};

	const demos: Demo[] = [
		{
			href: '/glm-auth',
			name: 'Auth',
			product: 'Ledgerline',
			model: 'GLM 5.3 Flash',
			desc: 'Split sign-in with sign up, OTP verify, password reset and enterprise SSO lookup.',
			shot: '/shots/glm-auth.png'
		},
		{
			href: '/opus-chat',
			name: 'Assistant',
			product: 'Halden',
			model: 'Claude Opus 5.5',
			desc: 'Streaming chat with workspaces, attachments, model picker and per-message actions.',
			shot: '/shots/opus-chat.png'
		},
		{
			href: '/deepseek-free-dashboard',
			name: 'Price dashboard',
			product: 'Sundial',
			model: 'DeepSeek V4.1 Flash Free',
			desc: 'Revenue, prices, coupons and invoices with a live chart, drawer editing and ⌘K.',
			shot: '/shots/deepseek-free-dashboard.png'
		},
		{
			href: '/opus-landing',
			name: 'Landing page',
			product: 'Ebb',
			model: 'Claude Opus 5.5',
			desc: 'Scroll-driven night dial, a draggable scheduler and pricing that reacts to your bill.',
			shot: '/shots/opus-landing.png'
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
		arrow: 'M5 12h14M13 6l6 6-6 6'
	};
	type IconName = keyof typeof paths;

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

<KitRoot class="gp min-h-dvh bg-white">
	<!-- ================= narrow column: header, tagline, facts ================= -->
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
				An installable design skill for coding agents. Every demo below was built by one of three models, each given only the skill.
			</p>
		</header>

		<!-- quiet facts, in place of buttons -->
		<dl class="reveal m-0 mt-8" use:reveal={80}>
			<div class="flex h-13 items-center justify-between gap-3 border-t border-line">
				<dt class="font-mono text-[12px] text-[#8a8a8a]">Install</dt>
				<dd class="m-0 flex min-w-0 items-center gap-1.5">
					<code class="truncate font-mono text-[11.5px] text-[#1a1a1a]">{INSTALL}</code>
					<CopyButton text={INSTALL} label="Copy install command" />
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
			<div class="flex h-13 items-center justify-between gap-3 border-t border-line">
				<dt class="font-mono text-[12px] text-[#8a8a8a]">Model</dt>
				<dd class="m-0 text-[13px] text-[#737373]">GLM 5.3 Flash, DeepSeek V4.1 Flash, Claude Opus 5.5</dd>
			</div>
			<div class="flex h-13 items-center justify-between gap-3 border-y border-line">
				<dt class="font-mono text-[12px] text-[#8a8a8a]">Demos</dt>
				<dd class="m-0">
					<a href="#demos" class="text-[13px] text-[#737373] no-underline transition-colors duration-150 hover:text-[#1a1a1a]">
						Four screens ↓
					</a>
				</dd>
			</div>
		</dl>
	</div>

	<!-- ================= demos: extra width, out of the column ================= -->
	<section id="demos" class="scroll-mt-16">
		<div class="mx-auto max-w-[1160px] px-6 pt-16 pb-4">
			<div class="reveal mb-8 flex items-baseline justify-between gap-4" use:reveal>
				<h2 class="m-0 text-[13px] font-medium text-[#444]">Built with the skill</h2>
				<p class="m-0 font-mono text-[11px] text-[#a3a3a3]">three models, one skill</p>
			</div>

			<div class="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
				{#each demos as d, i (d.href)}
					<a
						href={d.href}
						class="reveal group block rounded-xl"
						use:reveal={Math.min(i * 70, 350)}
					>
						<!-- the screenshot itself, boxed at its own 16:10 shape -->
						<span class="block aspect-[16/10] overflow-hidden rounded-xl bg-[#f4f4f4] shadow-[0_0_0_1px_rgb(0_0_0/.06)] transition-shadow duration-200 group-hover:shadow-[0_0_0_1px_rgb(0_0_0/.1),0_8px_24px_-8px_rgb(0_0_0/.14)]">
							<img src={d.shot} alt="{d.name} demo built with giga-ui" class="block w-full transition-transform duration-500 ease-[cubic-bezier(.23,1,.32,1)] group-hover:scale-[1.015]" loading="lazy" />
						</span>
						<span class="mt-4 flex items-baseline justify-between gap-3">
							<span class="text-[14px] font-medium tracking-[-0.01em] text-[#171717]">{d.name}</span>
							<span class="font-mono text-[11px] text-[#a3a3a3]">{d.product} · {d.model}</span>
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
</KitRoot>

<style>
	:global(.gp) {
		--kit-icon-size: 14px;
		--kit-icon-btn-color: #a3a3a3;
		--kit-icon-btn-hover-color: #1a1a1a;
		--kit-icon-btn-radius: 8px;
		font-family: 'Inter Variable', 'Inter', ui-sans-serif, system-ui, sans-serif;
		font-feature-settings: 'cv11', 'ss01';
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
	}

	:global(.gp :focus-visible) {
		outline: 2px solid rgb(0 0 0 / 0.35);
		outline-offset: 2px;
	}

	:global(.gp .reveal) {
		opacity: 0;
		animation: rise 400ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
	}
	@keyframes -global-rise {
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
		:global(.gp .reveal) {
			animation: none;
			opacity: 1;
		}
	}
</style>
