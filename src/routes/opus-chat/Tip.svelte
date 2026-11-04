<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		label: string;
		shortcut?: string;
		side?: 'top' | 'right' | 'bottom' | 'left';
		disabled?: boolean;
		/** Keep the tooltip up after a click, so a label like "Copied" can replace it. */
		staysOpenOnClick?: boolean;
		/** Passed through Tooltip.Trigger so it chains with the tooltip's own click handling. */
		onclick?: (event: MouseEvent) => void;
		/** Renders the trigger; spread the props onto the focusable element. */
		children: Snippet<[Record<string, unknown>]>;
	};

	let { label, shortcut, side = 'top', disabled = false, staysOpenOnClick = false, onclick, children }: Props = $props();
</script>

<Tooltip.Root {disabled} disableCloseOnTriggerClick={staysOpenOnClick}>
	<Tooltip.Trigger {onclick}>
		{#snippet child({ props })}
			{@render children(props)}
		{/snippet}
	</Tooltip.Trigger>
	<Tooltip.Portal to=".hd-app">
		<Tooltip.Content {side} sideOffset={6} class="tip">
			{label}
			{#if shortcut}<span class="tip-shortcut">{shortcut}</span>{/if}
		</Tooltip.Content>
	</Tooltip.Portal>
</Tooltip.Root>
