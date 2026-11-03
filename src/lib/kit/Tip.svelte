<!--
	Tooltip around another bits-ui trigger (a menu or popover trigger).
	Spread `props` onto that trigger; bits-ui merges them with its own handlers.
	For a plain icon button use IconButton instead.
-->
<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import TipContent from './TipContent.svelte';

	type Props = {
		label: string;
		keys?: readonly string[];
		side?: 'top' | 'right' | 'bottom' | 'left';
		/** Turn the tooltip off while the label is already visible (an expanded sidebar row). */
		disabled?: boolean;
		trigger: Snippet<[{ props: Record<string, unknown> }]>;
	};

	let { label, keys, side, disabled = false, trigger }: Props = $props();
</script>

<Tooltip.Root {disabled}>
	<Tooltip.Trigger>
		{#snippet child({ props })}
			{@render trigger({ props })}
		{/snippet}
	</Tooltip.Trigger>
	<TipContent {label} {keys} {side} />
</Tooltip.Root>
