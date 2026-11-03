<!-- Tooltip body shared by Tip, IconButton and CopyButton. Render inside a Tooltip.Root. -->
<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import { usePortalTarget } from './portal';

	type Props = {
		label: string;
		/** Keyboard shortcut shown as keycaps, e.g. ['⌘', 'B']. */
		keys?: readonly string[];
		side?: 'top' | 'right' | 'bottom' | 'left';
	};

	let { label, keys, side = 'top' }: Props = $props();

	const portalTarget = usePortalTarget();
</script>

<Tooltip.Portal to={portalTarget()}>
	<Tooltip.Content class="kit-tip" {side} sideOffset={6} collisionPadding={8}>
		{label}
		{#if keys}
			<span class="kit-keys">
				{#each keys as key, i (i)}
					<kbd class="kit-key">{key}</kbd>
				{/each}
			</span>
		{/if}
	</Tooltip.Content>
</Tooltip.Portal>
