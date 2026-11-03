import { getContext, setContext } from 'svelte';

const KEY = Symbol('kit-portal-target');

type PortalTarget = () => HTMLElement | undefined;

/** Popovers portal into the demo root so they inherit its --kit-* theme and font. */
export function providePortalTarget(target: PortalTarget): void {
	setContext(KEY, target);
}

export function usePortalTarget(): PortalTarget {
	return getContext<PortalTarget | undefined>(KEY) ?? (() => undefined);
}
