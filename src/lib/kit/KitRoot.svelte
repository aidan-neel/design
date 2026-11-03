<!--
	Root of a demo screen. Hosts portalled menus and tooltips (so they pick up the demo's
	--kit-* variables and font) and shares one tooltip delay across the screen.
-->
<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import './kit.css';
	import { providePortalTarget } from './portal';

	type Props = HTMLAttributes<HTMLDivElement> & { children: Snippet };

	let { children, class: className = '', ...rest }: Props = $props();

	let root: HTMLDivElement | undefined = $state();
	providePortalTarget(() => root);
</script>

<Tooltip.Provider delayDuration={500} skipDelayDuration={400} disableHoverableContent ignoreNonKeyboardFocus>
	<div bind:this={root} class="kit-root {className}" {...rest}>
		{@render children()}
	</div>
</Tooltip.Provider>
