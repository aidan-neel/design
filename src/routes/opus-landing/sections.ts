import { goto } from '$app/navigation';

export const SECTIONS = [
	{ id: 'night', label: 'How it works' },
	{ id: 'planner', label: 'Planner' },
	{ id: 'hub', label: 'The hub' },
	{ id: 'devices', label: 'Devices' },
	{ id: 'pricing', label: 'Pricing' },
	{ id: 'faq', label: 'FAQ' }
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'] | 'reserve' | 'top';

export function prefersReducedMotion(): boolean {
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Scrolls to a section and moves keyboard focus there so the next Tab continues from it. */
export function scrollToSection(id: SectionId): void {
	const target = id === 'top' ? document.body : document.getElementById(`ebb-${id}`);
	if (!target) throw new Error(`No section with id "ebb-${id}"`);

	const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
	if (id === 'top') {
		window.scrollTo({ top: 0, behavior });
		return;
	}
	target.scrollIntoView({ behavior, block: 'start' });
	target.focus({ preventScroll: true });
	// Shallow: only the hash changes, so SvelteKit neither reloads nor moves scroll or focus.
	goto(`#${id}`, { shallow: true, replace: true }).catch((error: unknown) => {
		console.error(`Couldn't update the URL hash to #${id}`, error);
	});
}
