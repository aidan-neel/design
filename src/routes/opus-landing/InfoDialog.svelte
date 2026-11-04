<script lang="ts">
	import { Dialog } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	let {
		trigger,
		title,
		description,
		children
	}: { trigger: string; title: string; description: string; children: Snippet } = $props();
</script>

<Dialog.Root>
	<Dialog.Trigger class="footer-link">{trigger}</Dialog.Trigger>
	<Dialog.Portal to=".ebb">
		<Dialog.Overlay class="ebb-overlay" />
		<Dialog.Content class="info-dialog">
			<header class="info-head">
				<div>
					<Dialog.Title class="info-title">{title}</Dialog.Title>
					<Dialog.Description class="info-description">{description}</Dialog.Description>
				</div>
				<Dialog.Close class="icon-btn" aria-label="Close">
					<Icon name="x" size={18} />
				</Dialog.Close>
			</header>
			<div class="info-body">
				{@render children()}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	:global(.ebb .info-dialog) {
		position: fixed;
		top: 50%;
		left: 50%;
		z-index: 71;
		width: min(calc(100% - 32px), 520px);
		max-height: min(80dvh, 640px);
		overflow-y: auto;
		padding: 24px;
		border-radius: 24px;
		background: var(--bg);
		box-shadow: var(--shadow-modal);
		transform: translate(-50%, -50%);
		outline: none;
	}
	:global(.ebb .info-dialog[data-state='open']) {
		animation: ebb-modal-in 300ms var(--ease-out);
	}
	:global(.ebb .info-dialog[data-state='closed']) {
		animation: ebb-modal-out 150ms ease-in forwards;
	}
	.info-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		margin: -4px -8px 0 0;
	}
	:global(.ebb .info-title) {
		margin: 0;
		font-size: 20px;
		font-weight: 500;
		letter-spacing: -0.02em;
	}
	:global(.ebb .info-description) {
		margin: 4px 0 0;
		color: var(--fg-2);
		font-size: 14px;
	}
	.info-body {
		margin-top: 20px;
		font-size: 14px;
		line-height: 1.6;
	}
</style>
