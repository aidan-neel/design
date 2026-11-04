<script lang="ts">
	import { CONTACT_EMAIL } from './data';
	import Icon from './Icon.svelte';
	import { useToaster } from './toasts.svelte';

	const COPIED_MS = 1600;
	const toaster = useToaster();

	let copyState = $state<'idle' | 'copied' | 'failed'>('idle');
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		clearTimeout(resetTimer);
		try {
			await navigator.clipboard.writeText(CONTACT_EMAIL);
			copyState = 'copied';
			toaster.show(`Copied ${CONTACT_EMAIL}`, { tone: 'neutral' });
		} catch (error) {
			// The browser refused clipboard access (permissions or an unfocused page). Show the address instead.
			console.error('Clipboard write failed', error);
			copyState = 'failed';
			toaster.show(`Your browser blocked copying. The address is ${CONTACT_EMAIL}.`, { tone: 'error' });
		}
		resetTimer = setTimeout(() => (copyState = 'idle'), COPIED_MS);
	}
</script>

<button type="button" class="copy" onclick={copy}>
	<span class="label">{CONTACT_EMAIL}</span>
	<span class="icons" aria-hidden="true">
		<span class="icon" class:is-shown={copyState === 'idle'}><Icon name="copy" size={14} /></span>
		<span class="icon" class:is-shown={copyState === 'copied'}><Icon name="check" size={14} /></span>
		<span class="icon" class:is-shown={copyState === 'failed'}><Icon name="x" size={14} /></span>
	</span>
	<span class="sr-only">{copyState === 'copied' ? 'Copied' : 'Copy email address'}</span>
</button>

<style>
	.copy {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 32px;
		padding: 0 8px 0 10px;
		margin-left: -10px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: var(--fg);
		font: 500 14px/1 var(--font);
		transition:
			background-color 120ms var(--ease-out),
			transform 150ms var(--ease-out);
	}
	.copy:active {
		transform: scale(0.97);
	}
	@media (hover: hover) {
		.copy:hover {
			background: rgb(0 0 0 / 0.04);
		}
	}
	.icons {
		position: relative;
		display: grid;
		width: 14px;
		height: 14px;
		color: var(--fg-2);
	}
	.icon {
		position: absolute;
		inset: 0;
		display: grid;
		opacity: 0;
		transform: scale(0.5);
		filter: blur(2px);
		transition:
			opacity 200ms var(--ease-out),
			transform 200ms var(--ease-out),
			filter 200ms var(--ease-out);
	}
	.icon.is-shown {
		opacity: 1;
		transform: none;
		filter: none;
	}
</style>
