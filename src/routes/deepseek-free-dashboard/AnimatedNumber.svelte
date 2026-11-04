<script lang="ts">
	import { untrack } from 'svelte';

	type Props = {
		value: number;
		format?: (n: number) => string;
		duration?: number;
	};
	let { value, format = (n: number) => String(Math.round(n)), duration = 340 }: Props = $props();

	let display = $state(value);
	let current = untrack(() => value);

	$effect(() => {
		const target = value;
		if (typeof window === 'undefined') {
			display = target;
			return;
		}
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			current = target;
			display = target;
			return;
		}
		const from = current;
		const started = performance.now();
		let frame = 0;
		const tick = (now: number) => {
			const p = Math.min(1, (now - started) / duration);
			const eased = 1 - Math.pow(1 - p, 3);
			const next = from + (target - from) * eased;
			current = next;
			display = next;
			if (p < 1) frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	});
</script>

<span class="num">{format(display)}</span>

<style>
	.num {
		font-variant-numeric: tabular-nums;
		font-feature-settings: 'tnum';
	}
</style>
