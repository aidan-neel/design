<script lang="ts">
	import { tick } from 'svelte';
	import { loadOutput } from './outputs.ts';

	let {
		label,
		src,
		tokens
	}: { label: string; src: string | null; tokens: number | null } = $props();

	const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
	const radius = '10px';

	let loader = $derived(loadOutput(src));
	let fullscreen = $state(false);
	let busy = false;
	let slot = $state<HTMLDivElement>();
	let surface = $state<HTMLDivElement>();
	let trigger = $state<HTMLButtonElement>();
	let closer = $state<HTMLButtonElement>();
	let slotHeight = $state<number>();

	function timing(dir: 'open' | 'close') {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		return { duration: reduced ? 0 : dir === 'open' ? 460 : 360, easing: EASE };
	}

	function toFrame(r: DOMRect, borderRadius: string) {
		return {
			top: `${r.top}px`,
			left: `${r.left}px`,
			width: `${r.width}px`,
			height: `${r.height}px`,
			borderRadius
		};
	}

	function viewportFrame() {
		return {
			top: '0px',
			left: '0px',
			width: `${document.documentElement.clientWidth}px`,
			height: `${window.innerHeight}px`,
			borderRadius: '0px'
		};
	}

	async function open() {
		if (!surface || busy) return;
		busy = true;
		const from = surface.getBoundingClientRect();
		const { duration, easing } = timing('open');

		slotHeight = from.height;
		fullscreen = true;
		document.body.style.overflow = 'hidden';
		await tick();

		closer?.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: duration * 0.5,
			delay: duration * 0.5,
			easing: 'ease-out',
			fill: 'backwards'
		});
		await surface
			.animate([toFrame(from, radius), viewportFrame()], { duration, easing })
			.finished.catch(() => undefined);
		closer?.focus();
		busy = false;
	}

	async function close() {
		if (!surface || !slot || busy) return;
		busy = true;
		const to = slot.getBoundingClientRect();
		const { duration, easing } = timing('close');

		closer?.animate([{ opacity: 1 }, { opacity: 0 }], {
			duration: duration * 0.35,
			easing: 'ease-in',
			fill: 'forwards'
		});
		const anim = surface.animate([viewportFrame(), toFrame(to, radius)], {
			duration,
			easing,
			fill: 'forwards'
		});
		await anim.finished.catch(() => undefined);
		fullscreen = false;
		await tick();
		anim.cancel();
		slotHeight = undefined;
		document.body.style.overflow = '';
		trigger?.focus();
		busy = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (fullscreen && e.key === 'Escape') {
			e.preventDefault();
			close();
		}
	}
</script>

<svelte:window {onkeydown} />

<figure class="m-0">
	<figcaption class="mb-2 font-mono text-[11.5px] text-muted">{label}</figcaption>
	<div bind:this={slot} style:height={slotHeight === undefined ? undefined : `${slotHeight}px`}>
		<div
			bind:this={surface}
			role={fullscreen ? 'dialog' : undefined}
			aria-label={fullscreen ? `${label} full screen` : undefined}
			aria-modal={fullscreen ? 'true' : undefined}
			class="grid place-items-center bg-white shadow-ring {fullscreen
				? 'fixed top-0 left-0 z-50 h-dvh w-screen overflow-hidden'
				: 'relative min-h-80 rounded-[10px] p-8'}"
		>
			{#if loader}
				{#await loader() then m}
					{@const Output = m.default}
					<Output />
				{/await}
			{:else}
				<span class="text-[13px] text-muted">No output yet</span>
			{/if}

			{#if fullscreen}
				<button
					bind:this={closer}
					onclick={close}
					aria-label="Close full screen"
					class="absolute top-3 right-3 grid size-8 place-items-center rounded-md bg-white text-[#555] shadow-ring transition-colors duration-50 hover:bg-[#f3f3f3] hover:text-[#1a1a1a]"
				>
					<svg
						class="size-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg
					>
				</button>
			{:else}
				<button
					bind:this={trigger}
					onclick={open}
					aria-label="Open {label} full screen"
					class="absolute top-2 right-2 grid size-7 place-items-center rounded-md bg-white/90 text-muted shadow-ring transition-colors duration-50 hover:bg-[#f3f3f3] hover:text-[#1a1a1a]"
				>
					<svg
						class="size-3.5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
						><path d="M15 3h6v6" /><path d="m21 3-7 7" /><path d="m3 21 7-7" /><path
							d="M9 21H3v-6"
						/></svg
					>
				</button>
			{/if}
		</div>
	</div>
	<p class="mt-2 flex justify-between font-mono text-[11.5px] text-muted">
		<span>Tokens</span>
		<span class="text-[#444] tabular-nums">{tokens === null ? '—' : tokens.toLocaleString('en-US')}</span>
	</p>
</figure>
