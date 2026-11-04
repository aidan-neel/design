<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from './sections';

	/** Re-enters the text with a short rise and unblur whenever it changes. */
	let { text, class: className = '' }: { text: string; class?: string } = $props();

	function swapIn(_node: Element) {
		return {
			duration: prefersReducedMotion() ? 0 : 220,
			easing: cubicOut,
			css: (progress: number) => {
				const remaining = 1 - progress;
				return `opacity:${progress};transform:translateY(${remaining * 6}px);filter:blur(${remaining * 2}px)`;
			}
		};
	}
</script>

{#key text}
	<span class="swap {className}" in:swapIn>{text}</span>
{/key}

<style>
	.swap {
		display: inline-block;
	}
</style>
