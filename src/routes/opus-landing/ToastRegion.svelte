<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import Icon from './Icon.svelte';
	import { prefersReducedMotion } from './sections';
	import { useToaster } from './toasts.svelte';

	const toaster = useToaster();
</script>

<div class="region" role="status" aria-live="polite">
	{#each toaster.items as toast (toast.id)}
		<div
			class="toast"
			class:is-error={toast.tone === 'error'}
			in:fly={{ y: prefersReducedMotion() ? 0 : 16, duration: 300, easing: cubicOut }}
			out:fly={{ y: prefersReducedMotion() ? 0 : 8, duration: 150 }}
		>
			{#if toast.tone === 'error'}
				<Icon name="alert" size={16} class="toast-icon" />
			{:else}
				<Icon name="check" size={16} class="toast-icon" />
			{/if}
			<span class="message">{toast.message}</span>
			{#if toast.action}
				{@const action = toast.action}
				<button
					type="button"
					class="action"
					onclick={() => {
						action.run();
						toaster.dismiss(toast.id);
					}}>{action.label}</button
				>
			{/if}
			<button type="button" class="close" aria-label="Dismiss" onclick={() => toaster.dismiss(toast.id)}>
				<Icon name="x" size={14} />
			</button>
		</div>
	{/each}
</div>

<style>
	.region {
		position: fixed;
		left: 50%;
		bottom: 16px;
		z-index: 80;
		display: grid;
		justify-items: center;
		gap: 8px;
		width: min(calc(100% - 32px), 440px);
		transform: translateX(-50%);
		pointer-events: none;
	}
	.toast {
		display: flex;
		align-items: center;
		gap: 10px;
		max-width: 100%;
		min-height: 44px;
		padding: 6px 6px 6px 14px;
		border-radius: 12px;
		background: #171717;
		color: #fff;
		font-size: 14px;
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.2),
			0 12px 32px -8px rgb(0 0 0 / 0.35);
		pointer-events: auto;
	}
	.toast :global(.toast-icon) {
		flex-shrink: 0;
		color: #5eead4;
	}
	.toast.is-error :global(.toast-icon) {
		color: #fca5a5;
	}
	.message {
		min-width: 0;
	}
	.action {
		height: 28px;
		padding: 0 10px;
		border: 0;
		border-radius: 8px;
		background: rgb(255 255 255 / 0.12);
		color: #fff;
		font: 500 13px/1 var(--font);
		white-space: nowrap;
	}
	.close {
		display: grid;
		flex-shrink: 0;
		place-items: center;
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: rgb(255 255 255 / 0.6);
	}
	@media (hover: hover) {
		.action:hover {
			background: rgb(255 255 255 / 0.18);
		}
		.close:hover {
			color: #fff;
			background: rgb(255 255 255 / 0.08);
		}
	}
</style>
