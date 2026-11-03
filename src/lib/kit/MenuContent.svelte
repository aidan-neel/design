<!-- Dropdown surface: portalled into the demo root, origin-aware scale-in, quick fade-out. -->
<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { usePortalTarget } from './portal';

	type Props = {
		side?: 'top' | 'right' | 'bottom' | 'left';
		align?: 'start' | 'center' | 'end';
		sideOffset?: number;
		/** Narrowest the menu may be, in px. */
		minWidth?: number;
		class?: string;
		children: Snippet;
	};

	let { side = 'bottom', align = 'start', sideOffset = 6, minWidth = 180, class: className = '', children }: Props = $props();

	const portalTarget = usePortalTarget();
</script>

<DropdownMenu.Portal to={portalTarget()}>
	<DropdownMenu.Content
		class="kit-menu {className}"
		style="--kit-menu-min-width: {minWidth}px"
		{side}
		{align}
		{sideOffset}
		collisionPadding={8}
	>
		{@render children()}
	</DropdownMenu.Content>
</DropdownMenu.Portal>
