<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { onMount, tick } from 'svelte';
	import Icon from './Icon.svelte';
	import Logo from './Logo.svelte';
	import { SECTIONS, scrollToSection, type SectionId } from './sections';

	const SCROLLED_AFTER_PX = 8;
	const ACTIVE_LINE_PX = 140;
	/** The nav's vertical centre; it switches to dark while this line is over the night section. */
	const DARK_PROBE_PX = 38;

	let isScrolled = $state(false);
	let isOverDark = $state(false);
	let progress = $state(0);
	let activeId = $state<SectionId | null>(null);
	let isMenuOpen = $state(false);
	/** Where to scroll once the menu sheet has finished closing and released its scroll lock. */
	let pendingSection: SectionId | null = null;

	let linkList = $state<HTMLElement>();
	let pill = $state({ x: 0, width: 0, visible: false, animate: false });

	onMount(() => {
		let frame = 0;
		const update = () => {
			frame = 0;
			const scrollable = document.documentElement.scrollHeight - window.innerHeight;
			isScrolled = window.scrollY > SCROLLED_AFTER_PX;
			progress = scrollable > 0 ? window.scrollY / scrollable : 0;
			activeId = findActiveSection();
			isOverDark = isOverDarkSection();
		};
		const schedule = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		update();
		window.addEventListener('scroll', schedule, { passive: true });
		window.addEventListener('resize', schedule);
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('scroll', schedule);
			window.removeEventListener('resize', schedule);
		};
	});

	$effect(() => {
		movePill(activeId);
	});

	function findActiveSection(): SectionId | null {
		let current: SectionId | null = null;
		for (const section of SECTIONS) {
			const element = document.getElementById(`ebb-${section.id}`);
			if (element && element.getBoundingClientRect().top <= ACTIVE_LINE_PX) current = section.id;
		}
		return current;
	}

	function isOverDarkSection(): boolean {
		const box = document.getElementById('ebb-night')?.getBoundingClientRect();
		return box !== undefined && box.top < DARK_PROBE_PX && box.bottom > DARK_PROBE_PX;
	}

	async function movePill(id: SectionId | null) {
		await tick();
		const link = id ? linkList?.querySelector<HTMLElement>(`[data-section="${id}"]`) : null;
		if (!link) {
			pill = { ...pill, visible: false };
			return;
		}
		// Skip the transition the first time so the pill doesn't fly in from the left edge.
		const animate = pill.visible;
		pill = { x: link.offsetLeft, width: link.offsetWidth, visible: true, animate };
	}

	function go(event: MouseEvent, id: SectionId) {
		event.preventDefault();
		scrollToSection(id);
	}

	function goFromMenu(event: MouseEvent, id: SectionId) {
		event.preventDefault();
		pendingSection = id;
		isMenuOpen = false;
	}

	function onMenuSettled(isOpen: boolean) {
		if (isOpen || pendingSection === null) return;
		scrollToSection(pendingSection);
		pendingSection = null;
	}
</script>

<div class="progress" style:transform="scaleX({progress})" aria-hidden="true"></div>

<header class="bar" class:is-scrolled={isScrolled} class:is-dark={isOverDark}>
	<div class="inner">
		<a class="brand" href="#top" onclick={(event) => go(event, 'top')} aria-label="Ebb, back to top">
			<Logo />
		</a>

		<nav class="links" aria-label="Sections" bind:this={linkList}>
			<span
				class="pill"
				class:is-visible={pill.visible}
				class:is-animated={pill.animate}
				style:transform="translateX({pill.x}px)"
				style:width="{pill.width}px"
				aria-hidden="true"
			></span>
			{#each SECTIONS as section (section.id)}
				<a
					href="#{section.id}"
					data-section={section.id}
					aria-current={activeId === section.id ? 'location' : undefined}
					onclick={(event) => go(event, section.id)}>{section.label}</a
				>
			{/each}
		</nav>

		<div class="actions">
			<a class="btn btn-ink btn-sm cta" href="#reserve" onclick={(event) => go(event, 'reserve')}>
				Reserve a hub
			</a>

			<Dialog.Root bind:open={isMenuOpen} onOpenChangeComplete={onMenuSettled}>
				<Dialog.Trigger class="icon-btn menu-trigger" aria-label="Open menu">
					<Icon name="menu" size={20} />
				</Dialog.Trigger>
				<Dialog.Portal to=".ebb">
					<Dialog.Overlay class="ebb-overlay" />
					<Dialog.Content class="sheet">
						<div class="sheet-head">
							<Logo />
							<Dialog.Title class="sr-only">Menu</Dialog.Title>
							<Dialog.Close class="icon-btn" aria-label="Close menu">
								<Icon name="x" size={20} />
							</Dialog.Close>
						</div>
						<nav aria-label="Sections" class="sheet-links">
							{#each SECTIONS as section (section.id)}
								<a href="#{section.id}" onclick={(event) => goFromMenu(event, section.id)}>
									{section.label}
									<Icon name="chevron-right" class="sheet-chevron" />
								</a>
							{/each}
						</nav>
						<a
							class="btn btn-ink btn-lg sheet-cta"
							href="#reserve"
							onclick={(event) => goFromMenu(event, 'reserve')}>Reserve a hub</a
						>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</div>
	</div>
</header>

<style>
	.progress {
		position: fixed;
		inset: 0 0 auto 0;
		z-index: 51;
		height: 2px;
		background: var(--accent);
		transform-origin: left;
		pointer-events: none;
	}

	.bar {
		position: fixed;
		inset: 0 0 auto 0;
		z-index: 50;
		padding: 12px var(--gutter) 0;
		pointer-events: none;
	}
	.inner {
		display: flex;
		align-items: center;
		gap: 16px;
		max-width: 1152px;
		height: 52px;
		margin-inline: auto;
		padding: 0 8px 0 16px;
		border-radius: 16px;
		pointer-events: auto;
		transition:
			background-color 200ms var(--ease-out),
			box-shadow 200ms var(--ease-out);
	}
	.is-scrolled .inner {
		background: rgb(255 255 255 / 0.82);
		backdrop-filter: blur(12px) saturate(1.4);
		-webkit-backdrop-filter: blur(12px) saturate(1.4);
		box-shadow: var(--shadow-pop);
	}

	.is-dark .inner {
		background: rgb(28 28 28 / 0.72);
		box-shadow:
			0 0 0 1px rgb(255 255 255 / 0.08),
			0 8px 24px -4px rgb(0 0 0 / 0.4);
	}
	.is-dark .brand,
	.is-dark .links a[aria-current],
	.is-dark :global(.menu-trigger) {
		color: #fafafa;
	}
	.is-dark .links a {
		color: #a1a1a1;
	}
	.is-dark .pill {
		background: rgb(255 255 255 / 0.1);
	}
	.is-dark .cta {
		background: #fafafa;
		color: #0a0a0a;
		box-shadow: none;
	}
	@media (hover: hover) {
		.is-dark .links a:hover {
			color: #fafafa;
		}
	}

	.brand {
		display: inline-flex;
		align-items: center;
		height: 36px;
		color: var(--fg);
		text-decoration: none;
		border-radius: 8px;
		transition: color 200ms var(--ease-out);
	}

	.links {
		position: relative;
		display: none;
		align-items: center;
		gap: 2px;
		margin-inline: auto;
	}
	.links a {
		position: relative;
		display: inline-flex;
		align-items: center;
		height: 32px;
		padding: 0 12px;
		border-radius: 8px;
		color: var(--fg-2);
		font-size: 14px;
		font-weight: 500;
		letter-spacing: -0.005em;
		text-decoration: none;
		white-space: nowrap;
		transition: color 120ms var(--ease-out);
	}
	.links a[aria-current] {
		color: var(--fg);
	}
	@media (hover: hover) {
		.links a:hover {
			color: var(--fg);
		}
	}
	.pill {
		position: absolute;
		top: 0;
		left: 0;
		height: 32px;
		border-radius: 8px;
		background: rgb(0 0 0 / 0.05);
		opacity: 0;
		transition: opacity 150ms var(--ease-out);
	}
	.pill.is-visible {
		opacity: 1;
	}
	.pill.is-animated {
		transition:
			opacity 150ms var(--ease-out),
			transform 250ms var(--ease-out),
			width 250ms var(--ease-out);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-left: auto;
	}

	:global(.ebb .menu-trigger) {
		width: 44px;
		height: 44px;
	}

	@media (min-width: 960px) {
		.links {
			display: flex;
		}
		.actions {
			margin-left: 0;
		}
		:global(.ebb .menu-trigger) {
			display: none;
		}
	}
	@media (max-width: 479px) {
		.cta {
			display: none;
		}
	}

	:global(.ebb .sheet) {
		position: fixed;
		inset: 8px 8px auto 8px;
		z-index: 71;
		padding: 8px 8px 16px;
		border-radius: 24px;
		background: var(--bg);
		box-shadow: var(--shadow-modal);
	}
	:global(.ebb .sheet[data-state='open']) {
		animation: sheet-in 400ms var(--ease-drawer);
	}
	:global(.ebb .sheet[data-state='closed']) {
		animation: sheet-out 200ms var(--ease-drawer) forwards;
	}
	@keyframes sheet-in {
		from {
			transform: translateY(calc(-100% - 16px));
		}
	}
	@keyframes sheet-out {
		to {
			transform: translateY(calc(-100% - 16px));
		}
	}
	.sheet-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 52px;
		padding: 0 4px 0 12px;
	}
	.sheet-links {
		display: flex;
		flex-direction: column;
		padding: 8px 0;
	}
	.sheet-links a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 48px;
		padding: 0 12px;
		border-radius: 12px;
		color: var(--fg);
		font-size: 17px;
		font-weight: 500;
		letter-spacing: -0.01em;
		text-decoration: none;
	}
	.sheet-links a:active {
		background: rgb(0 0 0 / 0.04);
	}
	.sheet-links :global(.sheet-chevron) {
		color: var(--fg-3);
	}
	.sheet-cta {
		width: calc(100% - 8px);
		margin: 0 4px;
	}
</style>
