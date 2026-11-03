<!-- Menu row. Put an optional leading <svg> first in the children; `meta` or `keys` sit on the right. -->
<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		onSelect?: (event: Event) => void;
		tone?: 'default' | 'danger';
		meta?: string;
		keys?: readonly string[];
		disabled?: boolean;
		closeOnSelect?: boolean;
		textValue?: string;
		children: Snippet;
	};

	let { onSelect, tone = 'default', meta, keys, disabled, closeOnSelect, textValue, children }: Props = $props();
</script>

<DropdownMenu.Item class="kit-menu-item" data-tone={tone} {onSelect} {disabled} {closeOnSelect} {textValue}>
	{@render children()}
	{#if meta}<span class="kit-menu-meta">{meta}</span>{/if}
	{#if keys}
		<span class="kit-keys">
			{#each keys as key, i (i)}
				<kbd class="kit-key">{key}</kbd>
			{/each}
		</span>
	{/if}
</DropdownMenu.Item>
