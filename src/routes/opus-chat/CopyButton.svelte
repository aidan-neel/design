<script lang="ts">
	import Icon from './Icon.svelte';
	import Tip from './Tip.svelte';
	import { popIcon } from './motion';

	type Props = { text: string; label?: string };
	let { text, label = 'Copy' }: Props = $props();

	type CopyState = 'idle' | 'copied' | 'failed';
	const RESET_MS = 1600;

	let copyState = $state<CopyState>('idle');
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	const tooltip = $derived(copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : label);

	async function copy() {
		clearTimeout(resetTimer);
		try {
			await navigator.clipboard.writeText(text);
			copyState = 'copied';
		} catch (error) {
			console.error('Clipboard write failed', error);
			copyState = 'failed';
		}
		resetTimer = setTimeout(() => (copyState = 'idle'), RESET_MS);
	}
</script>

<Tip label={tooltip} staysOpenOnClick onclick={copy}>
	{#snippet children(props)}
		<button {...props} type="button" class="icon-btn size-7!" aria-label={label}>
			{#key copyState}
				<span class="grid" in:popIcon>
					<Icon name={copyState === 'copied' ? 'check' : copyState === 'failed' ? 'x' : 'copy'} size={15} />
				</span>
			{/key}
		</button>
	{/snippet}
</Tip>
<span role="status" class="sr-only">{copyState === 'copied' ? 'Copied to clipboard' : copyState === 'failed' ? 'Copy failed' : ''}</span>
