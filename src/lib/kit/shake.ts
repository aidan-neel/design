const SHAKE_FRAMES: Keyframe[] = [
	{ transform: 'translateX(0)' },
	{ transform: 'translateX(-5px)' },
	{ transform: 'translateX(4px)' },
	{ transform: 'translateX(-2px)' },
	{ transform: 'translateX(0)' }
];

/** A short horizontal nudge for a rejected submit (wrong password). Skipped under reduced motion. */
export function shake(element: HTMLElement): void {
	if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	element.animate(SHAKE_FRAMES, { duration: 320, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
}
