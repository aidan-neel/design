<!-- Icon-only button: its label is both the accessible name and the tooltip. -->
<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import TipContent from './TipContent.svelte';

	type Props = Omit<Tooltip.TriggerProps, 'children' | 'child' | 'type'> & {
		label: string;
		keys?: readonly string[];
		side?: 'top' | 'right' | 'bottom' | 'left';
		children: Snippet;
	};

	let { label, keys, side, children, class: className = '', ...rest }: Props = $props();
</script>

<Tooltip.Root>
	<Tooltip.Trigger {...rest} aria-label={label} class="kit-icon-btn {className}">
		{@render children()}
	</Tooltip.Trigger>
	<TipContent {label} {keys} {side} />
</Tooltip.Root>
