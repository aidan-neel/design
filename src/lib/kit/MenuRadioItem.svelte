<!-- Single-choice menu row; use inside DropdownMenu.RadioGroup. Shows a check when chosen. -->
<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = { value: string; meta?: string; disabled?: boolean; children: Snippet };

	let { value, meta, disabled, children: label }: Props = $props();
</script>

<DropdownMenu.RadioItem class="kit-menu-item" {value} {disabled}>
	{#snippet children({ checked })}
		{@render label()}
		{#if meta}<span class="kit-menu-meta">{meta}</span>{/if}
		<svg class="kit-menu-check" style:visibility={checked ? 'visible' : 'hidden'} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M20 6 9 17l-5-5" />
		</svg>
	{/snippet}
</DropdownMenu.RadioItem>
