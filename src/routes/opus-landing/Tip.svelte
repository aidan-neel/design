<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type { Snippet } from 'svelte';

	/** Tooltip for icon-only controls. The trigger is rendered by the caller with the given props. */
	let {
		label,
		side = 'top',
		children
	}: {
		label: string;
		side?: 'top' | 'bottom' | 'left' | 'right';
		children: Snippet<[Record<string, unknown>]>;
	} = $props();
</script>

<Tooltip.Root>
	<Tooltip.Trigger>
		{#snippet child({ props })}
			{@render children(props)}
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Portal to=".ebb">
		<Tooltip.Content class="ebb-tooltip" {side} sideOffset={6}>{label}</Tooltip.Content>
	</Tooltip.Portal>
</Tooltip.Root>
