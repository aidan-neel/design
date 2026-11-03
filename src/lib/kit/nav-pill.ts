import type { ActionReturn } from 'svelte/action';

/**
 * Slides one highlight between nav items instead of fading per-item backgrounds.
 * Writes `--pill-y` / `--pill-h` on the container for the `[aria-current="page"]` item inside it;
 * the page draws the pill from those. Pass the active key so it re-measures when it changes.
 * `data-pill-ready` is set after the first placement, so the pill only animates on later moves.
 */
export function navPill(node: HTMLElement, activeKey: unknown): ActionReturn<unknown> {
	function place(): void {
		const active = node.querySelector<HTMLElement>('[aria-current="page"]');
		if (!active) {
			node.dataset.pill = 'none';
			return;
		}
		const top = active.getBoundingClientRect().top - node.getBoundingClientRect().top + node.scrollTop;
		node.style.setProperty('--pill-y', `${top}px`);
		node.style.setProperty('--pill-h', `${active.offsetHeight}px`);
		node.dataset.pill = 'shown';
	}

	place();
	const ready = requestAnimationFrame(() => (node.dataset.pillReady = ''));
	const observer = new ResizeObserver(place);
	observer.observe(node);

	return {
		// the new aria-current lands in the same flush as this update, so measure on the next frame
		update: () => requestAnimationFrame(place),
		destroy: () => {
			cancelAnimationFrame(ready);
			observer.disconnect();
		}
	};
}
