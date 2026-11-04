<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from './sections';

	type Part = 'shell' | 'board' | 'base';

	const SPECS: readonly { title: string; body: string; part: Part | null }[] = [
		{
			title: 'Status ring',
			body: 'Glows while a cheap window is running. Dark means nothing is scheduled.',
			part: 'shell'
		},
		{
			title: 'Radios',
			body: 'Thread, Zigbee 3.0 and Wi-Fi 6, with a Matter controller built in.',
			part: 'board'
		},
		{
			title: 'Runs locally',
			body: 'Quad-core ARM and 8 GB of storage. Plans and 13 months of history stay on the hub.',
			part: 'board'
		},
		{
			title: 'Ports',
			body: 'Ethernet, USB-C power and two CT clamp inputs for whole-home metering.',
			part: 'base'
		},
		{ title: 'Size', body: '96 × 96 × 28 mm, 140 g. Sits next to your router.', part: null }
	];

	const CX = 180;
	const RX = 124;
	const RY = 62;

	/** Each layer's top-face centre and thickness when assembled, and how far it travels when exploded. */
	const LAYERS: Record<Part, { top: number; thickness: number; rx: number; travel: number }> = {
		shell: { top: 236, thickness: 44, rx: RX, travel: -120 },
		board: { top: 270, thickness: 6, rx: RX - 12, travel: -20 },
		base: { top: 280, thickness: 24, rx: RX, travel: 60 }
	};

	let figure = $state<HTMLElement>();
	let explode = $state(0);
	let focusPart = $state<Part | null>(null);

	onMount(() => {
		if (prefersReducedMotion()) {
			explode = 1;
			return;
		}
		let frame = 0;
		const update = () => {
			frame = 0;
			if (!figure) return;
			const box = figure.getBoundingClientRect();
			const raw = (window.innerHeight * 0.92 - box.top) / (window.innerHeight * 0.55);
			const clamped = Math.min(1, Math.max(0, raw));
			explode = clamped * clamped * (3 - 2 * clamped);
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

	function sidePath(top: number, thickness: number, rx: number): string {
		const left = CX - rx;
		const right = CX + rx;
		const ry = rx / 2;
		return `M${left},${top} A${rx},${ry} 0 0 0 ${right},${top} L${right},${top + thickness} A${rx},${ry} 0 0 1 ${left},${top + thickness} Z`;
	}

	function offset(part: Part): number {
		return LAYERS[part].travel * explode;
	}

	function isDimmed(part: Part): boolean {
		return focusPart !== null && focusPart !== part;
	}
</script>

<section class="section" id="ebb-hub" tabindex="-1" aria-labelledby="hub-title">
	<div class="container grid">
		<div class="copy">
			<h2 class="h2" id="hub-title">A small box that makes the decisions</h2>
			<p class="lede">
				The hub talks to your devices directly and keeps tonight’s plan on board. If the internet
				drops at 01:00, the car still charges at 01:00.
			</p>
			<ul class="specs" onmouseleave={() => (focusPart = null)}>
				{#each SPECS as spec (spec.title)}
					<li
						class:is-active={focusPart !== null && spec.part === focusPart}
						onmouseenter={() => (focusPart = spec.part)}
					>
						<span class="spec-title">{spec.title}</span>
						<span class="spec-body">{spec.body}</span>
					</li>
				{/each}
			</ul>
		</div>

		<figure class="figure" bind:this={figure}>
			<svg viewBox="0 0 440 460" role="img" aria-label="Exploded drawing of the Ebb hub: a top shell with a status ring, a circuit board with radios, and a base with ports.">
				<g class="axis" style:opacity={explode}>
					<line x1={CX} x2={CX} y1={LAYERS.shell.top + offset('shell')} y2={LAYERS.base.top + offset('base')} />
				</g>

				<g class="layer" class:is-dimmed={isDimmed('base')} style:transform="translateY({offset('base')}px)">
					<path class="side" d={sidePath(LAYERS.base.top, LAYERS.base.thickness, RX)} />
					<ellipse class="face" cx={CX} cy={LAYERS.base.top} rx={RX} ry={RY} />
					<ellipse class="inner" cx={CX} cy={LAYERS.base.top} rx={RX - 14} ry={RY - 7} />
					<g class="ports">
						<rect x={CX - 52} y={LAYERS.base.top + 66} width="22" height="10" rx="2" />
						<rect x={CX - 20} y={LAYERS.base.top + 69} width="18" height="6" rx="3" />
						<circle cx={CX + 16} cy={LAYERS.base.top + 72} r="4" />
						<circle cx={CX + 32} cy={LAYERS.base.top + 71} r="4" />
					</g>
				</g>

				<g class="layer" class:is-dimmed={isDimmed('board')} style:transform="translateY({offset('board')}px)">
					<path class="side board-side" d={sidePath(LAYERS.board.top, LAYERS.board.thickness, LAYERS.board.rx)} />
					<ellipse class="face board-face" cx={CX} cy={LAYERS.board.top} rx={LAYERS.board.rx} ry={LAYERS.board.rx / 2} />
					<g transform="translate({CX} {LAYERS.board.top}) scale(1 0.5) rotate(45)">
						<rect class="chip" x="-22" y="-22" width="44" height="44" rx="4" />
						<rect class="chip" x="34" y="-14" width="24" height="18" rx="3" />
						<rect class="chip" x="-14" y="34" width="30" height="16" rx="3" />
						<path class="trace" d="M-56 -30 h10 v-12 h10 v12 h10 v-12 h10" />
						<path class="trace" d="M22 0 H34 M0 22 V34" />
					</g>
				</g>

				<g class="layer" class:is-dimmed={isDimmed('shell')} style:transform="translateY({offset('shell')}px)">
					<path class="side" d={sidePath(LAYERS.shell.top, LAYERS.shell.thickness, RX)} />
					<ellipse class="face" cx={CX} cy={LAYERS.shell.top} rx={RX} ry={RY} />
					<ellipse class="ring-glow" cx={CX} cy={LAYERS.shell.top} rx="78" ry="39" />
					<ellipse class="ring" cx={CX} cy={LAYERS.shell.top} rx="78" ry="39" />
					<g transform="translate({CX} {LAYERS.shell.top}) scale(1 0.5) rotate(45)">
						<path
							class="mark"
							d="M-18 -6c6 0 6-6 12-6s6 6 12 6 6-6 12-6M-18 8c6 0 6 6 12 6s6-6 12-6 6 6 12 6"
						/>
					</g>
				</g>

				<g class="labels" style:opacity={explode}>
					<g class:is-dimmed={isDimmed('shell')}>
						<line x1={CX + RX + 6} x2={CX + RX + 28} y1={LAYERS.shell.top + offset('shell')} y2={LAYERS.shell.top + offset('shell')} />
						<text x={CX + RX + 34} y={LAYERS.shell.top + offset('shell')}>Status ring</text>
					</g>
					<g class:is-dimmed={isDimmed('board')}>
						<line x1={CX + LAYERS.board.rx + 6} x2={CX + RX + 28} y1={LAYERS.board.top + offset('board')} y2={LAYERS.board.top + offset('board')} />
						<text x={CX + RX + 34} y={LAYERS.board.top + offset('board')}>Radios</text>
					</g>
					<g class:is-dimmed={isDimmed('base')}>
						<line x1={CX + RX + 6} x2={CX + RX + 28} y1={LAYERS.base.top + offset('base') + 12} y2={LAYERS.base.top + offset('base') + 12} />
						<text x={CX + RX + 34} y={LAYERS.base.top + offset('base') + 12}>Ports</text>
					</g>
				</g>
			</svg>
		</figure>
	</div>
</section>

<style>
	.grid {
		display: grid;
		gap: 48px;
		align-items: center;
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
			gap: 64px;
		}
	}

	.specs {
		margin: 40px -12px 0;
		padding: 0;
		list-style: none;
		border-top: 1px solid var(--border);
	}
	.specs li {
		display: grid;
		gap: 2px;
		padding: 14px 12px;
		border-bottom: 1px solid var(--border);
		transition: background-color 120ms var(--ease-out);
	}
	@media (min-width: 640px) {
		.specs li {
			grid-template-columns: 140px minmax(0, 1fr);
			gap: 16px;
		}
	}
	.specs li.is-active {
		background: rgb(0 0 0 / 0.025);
	}
	.spec-title {
		font-size: 14px;
		font-weight: 500;
	}
	.spec-body {
		color: var(--fg-2);
		font-size: 14px;
	}

	.figure {
		margin: 0;
		padding: 24px 8px;
		border-radius: 28px;
		background: var(--bg);
		box-shadow: var(--shadow-card);
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
		overflow: visible;
	}
	.layer {
		transition: opacity 200ms var(--ease-out);
	}
	.layer.is-dimmed,
	.labels .is-dimmed {
		opacity: 0.3;
	}
	.side,
	.face,
	.inner {
		fill: #fff;
		stroke: #171717;
		stroke-width: 1.25;
		stroke-linejoin: round;
	}
	.inner {
		fill: #fafafa;
		stroke: #d4d4d4;
		stroke-dasharray: 3 3;
	}
	.board-side,
	.board-face {
		fill: #f4f4f4;
	}
	.chip {
		fill: #fff;
		stroke: #171717;
		stroke-width: 1.25;
	}
	.trace {
		fill: none;
		stroke: var(--accent);
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.ports rect,
	.ports circle {
		fill: #f4f4f4;
		stroke: #171717;
		stroke-width: 1.1;
	}
	.ring {
		fill: none;
		stroke: var(--accent);
		stroke-width: 3;
	}
	.ring-glow {
		fill: none;
		stroke: #5eead4;
		stroke-width: 10;
		opacity: 0.35;
		filter: blur(4px);
	}
	.mark {
		fill: none;
		stroke: #171717;
		stroke-width: 2.4;
		stroke-linecap: round;
	}
	.axis line {
		stroke: #a3a3a3;
		stroke-dasharray: 3 4;
	}
	.labels line {
		stroke: #a3a3a3;
	}
	.labels text {
		fill: var(--fg);
		font: 500 13px var(--font);
		dominant-baseline: central;
	}
</style>
