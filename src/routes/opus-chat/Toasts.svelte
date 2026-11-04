<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import Icon from './Icon.svelte';
	import { toaster } from './toasts.svelte';

	function runAction(id: number, run: () => void) {
		run();
		toaster.dismiss(id);
	}
</script>

<ol class="toasts" aria-label="Notifications">
	{#each toaster.items as toast (toast.id)}
		<li
			class="toast"
			class:error={toast.tone === 'error'}
			role={toast.tone === 'error' ? 'alert' : 'status'}
			in:fly={{ y: -16, duration: 300, easing: cubicOut }}
			out:fly={{ y: -8, duration: 150 }}
		>
			<span class="min-w-0 flex-1">{toast.message}</span>
			{#if toast.action}
				{@const action = toast.action}
				<button type="button" class="toast-action" onclick={() => runAction(toast.id, action.run)}>{action.label}</button>
			{/if}
			<button type="button" class="toast-close" aria-label="Dismiss" onclick={() => toaster.dismiss(toast.id)}>
				<Icon name="x" size={14} />
			</button>
		</li>
	{/each}
</ol>

<style>
	/* Top centre keeps toasts clear of the composer and the send button. */
	.toasts {
		position: fixed;
		top: 14px;
		left: 50%;
		z-index: 70;
		display: flex;
		flex-direction: column;
		align-items: center;
		translate: -50% 0;
		gap: 8px;
		pointer-events: none;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: 10px;
		max-width: min(420px, calc(100vw - 32px));
		min-height: 40px;
		padding: 8px 6px 8px 14px;
		border-radius: 12px;
		background: #171717;
		color: #ffffff;
		font-size: 13px;
		line-height: 1.4;
		box-shadow: var(--shadow-pop);
		pointer-events: auto;
	}

	.error {
		background: #ffffff;
		color: #b91c1c;
		box-shadow:
			0 0 0 1px #fde0e0,
			0 8px 24px -4px rgb(0 0 0 / 0.1);
	}

	.toast-action {
		flex-shrink: 0;
		height: 26px;
		padding: 0 10px;
		border-radius: 7px;
		background: rgb(255 255 255 / 0.12);
		font-weight: 500;
		transition:
			background-color 120ms var(--ease-out),
			transform 150ms var(--ease-out);
	}

	.toast-action:hover {
		background: rgb(255 255 255 / 0.2);
	}

	.toast-action:active {
		transform: scale(0.96);
	}

	.toast-close {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 26px;
		height: 26px;
		border-radius: 7px;
		opacity: 0.6;
		transition: opacity 120ms var(--ease-out);
	}

	.toast-close:hover {
		opacity: 1;
	}

	@media (max-width: 767px) {
		.toasts {
			top: 12px;
			right: 16px;
			left: 16px;
			align-items: stretch;
			translate: none;
		}

		.toast {
			max-width: none;
		}
	}
</style>
