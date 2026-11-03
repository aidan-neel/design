<!--
	Copy to clipboard with a confirmed result. The icon cross-fades to a check (or a cross when the
	clipboard refuses), the tooltip stays open and reads "Copied", and a live region announces it.
-->
<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import { onDestroy } from 'svelte';
	import TipContent from './TipContent.svelte';

	type Status = 'idle' | 'done' | 'failed';

	type Props = Omit<Tooltip.TriggerProps, 'children' | 'child' | 'type' | 'onclick'> & {
		/** Text to copy, or a function that builds it at click time. */
		text: string | (() => string);
		label?: string;
		/** `icon` is a square icon button with a tooltip; `text` shows the label next to the icon. */
		variant?: 'icon' | 'text';
		side?: 'top' | 'right' | 'bottom' | 'left';
	};

	let { text, label = 'Copy', variant = 'icon', side, class: className = '', ...rest }: Props = $props();

	const RESET_AFTER_MS = 1600;
	const statusLabels: Record<Status, string> = $derived({ idle: label, done: 'Copied', failed: 'Copy failed' });
	/** Shorter words for the visible label, which reserves the width of the longest one. */
	const textLabels: Record<Status, string> = $derived({ idle: label, done: 'Copied', failed: 'Failed' });

	let status = $state<Status>('idle');
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	async function copy(): Promise<void> {
		const value = typeof text === 'function' ? text() : text;
		try {
			await navigator.clipboard.writeText(value);
			status = 'done';
		} catch (error) {
			console.error('Clipboard write was refused', error);
			status = 'failed';
		}
		clearTimeout(resetTimer);
		resetTimer = setTimeout(() => (status = 'idle'), RESET_AFTER_MS);
	}

	onDestroy(() => clearTimeout(resetTimer));
</script>

{#snippet icons()}
	<span class="kit-copy-icons" aria-hidden="true">
		<svg data-icon="idle" data-active={status === 'idle' ? '' : undefined} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
			<rect x="9" y="9" width="12" height="12" rx="2" />
			<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
		</svg>
		<svg data-icon="done" data-active={status === 'done' ? '' : undefined} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M20 6 9 17l-5-5" />
		</svg>
		<svg data-icon="failed" data-active={status === 'failed' ? '' : undefined} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M18 6 6 18M6 6l12 12" />
		</svg>
	</span>
{/snippet}

{#if variant === 'icon'}
	<Tooltip.Root disableCloseOnTriggerClick>
		<Tooltip.Trigger {...rest} aria-label={label} onclick={copy} class="kit-icon-btn {className}">
			{@render icons()}
		</Tooltip.Trigger>
		<TipContent label={statusLabels[status]} {side} />
	</Tooltip.Root>
{:else}
	<button {...rest} type="button" onclick={copy} class="kit-text-btn {className}">
		{@render icons()}
		<span class="kit-copy-text">
			{#each Object.entries(textLabels) as [key, value] (key)}
				<span data-active={status === key ? '' : undefined}>{value}</span>
			{/each}
		</span>
	</button>
{/if}

<span class="kit-sr-only" role="status">{status === 'idle' ? '' : statusLabels[status]}</span>
