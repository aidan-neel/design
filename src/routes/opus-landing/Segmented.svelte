<script lang="ts" generics="T extends string">
	import { tick } from 'svelte';

	let {
		options,
		value = $bindable(),
		label
	}: { options: readonly { value: T; label: string }[]; value: T; label: string } = $props();

	let list = $state<HTMLElement>();
	let thumb = $state({ x: 0, width: 0, isPlaced: false, animate: false });

	$effect(() => {
		placeThumb(value);
	});

	$effect(() => {
		if (!list) return;
		const observer = new ResizeObserver(() => placeThumb(value));
		observer.observe(list);
		return () => observer.disconnect();
	});

	async function placeThumb(current: T) {
		await tick();
		const button = list?.querySelector<HTMLElement>(`[data-value="${current}"]`);
		if (!button) return;
		// The first placement is instant so the thumb doesn't slide in from 0.
		thumb = { x: button.offsetLeft, width: button.offsetWidth, isPlaced: true, animate: thumb.isPlaced };
	}

	function onKeydown(event: KeyboardEvent) {
		const index = options.findIndex((option) => option.value === value);
		const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
		if (delta === 0) return;
		event.preventDefault();
		const next = options[(index + delta + options.length) % options.length];
		value = next.value;
		list?.querySelector<HTMLElement>(`[data-value="${next.value}"]`)?.focus();
	}
</script>

<div class="segmented" role="radiogroup" aria-label={label} bind:this={list}>
	<span
		class="thumb"
		class:is-placed={thumb.isPlaced}
		class:is-animated={thumb.animate}
		style:transform="translateX({thumb.x}px)"
		style:width="{thumb.width}px"
		aria-hidden="true"
	></span>
	{#each options as option (option.value)}
		<button
			type="button"
			role="radio"
			aria-checked={value === option.value}
			tabindex={value === option.value ? 0 : -1}
			data-value={option.value}
			onclick={() => (value = option.value)}
			onkeydown={onKeydown}
		>
			{option.label}
		</button>
	{/each}
</div>

<style>
	.segmented {
		position: relative;
		display: inline-flex;
		padding: 4px;
		border-radius: 12px;
		background: #f0f0f0;
		box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.03);
	}
	.thumb {
		position: absolute;
		top: 4px;
		bottom: 4px;
		left: 0;
		border-radius: 8px;
		background: #fff;
		box-shadow: var(--shadow-btn);
		opacity: 0;
	}
	.thumb.is-placed {
		opacity: 1;
	}
	.thumb.is-animated {
		transition:
			transform 250ms var(--ease-out),
			width 250ms var(--ease-out);
	}
	button {
		position: relative;
		height: 32px;
		padding: 0 14px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: var(--fg-2);
		font: 500 13px/1 var(--font);
		white-space: nowrap;
		transition: color 150ms var(--ease-out);
	}
	button[aria-checked='true'] {
		color: var(--fg);
	}
	@media (hover: hover) {
		button:hover {
			color: var(--fg);
		}
	}
</style>
