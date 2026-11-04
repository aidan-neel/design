import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

function prefersReducedMotion(): boolean {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Icon swaps (copy → check): scale up from half size and unblur. */
export function popIcon(_node: Element, { duration = 200 } = {}): TransitionConfig {
	if (prefersReducedMotion()) return { duration: 0 };
	return {
		duration,
		easing: cubicOut,
		css: (t) => `opacity: ${t}; transform: scale(${0.5 + 0.5 * t}); filter: blur(${(1 - t) * 2}px);`
	};
}

/** New messages, chips and rows: a short rise with a fade. */
export function rise(_node: Element, { duration = 260, distance = 6, delay = 0 } = {}): TransitionConfig {
	if (prefersReducedMotion()) return { duration: 0 };
	return {
		duration,
		delay,
		easing: cubicOut,
		css: (t) => `opacity: ${t}; transform: translateY(${(1 - t) * distance}px);`
	};
}

/** Removed items shrink slightly and fade, faster than they came in. */
export function shrinkOut(_node: Element, { duration = 150 } = {}): TransitionConfig {
	if (prefersReducedMotion()) return { duration: 0 };
	return {
		duration,
		css: (t) => `opacity: ${t}; transform: scale(${0.96 + 0.04 * t});`
	};
}
