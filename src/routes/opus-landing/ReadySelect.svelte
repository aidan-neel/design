<script lang="ts">
	import { Select } from 'bits-ui';
	import { READY_BY_OPTIONS, slotLabel } from './data';
	import Icon from './Icon.svelte';

	let {
		value,
		onChange,
		label
	}: { value: number; onChange: (slot: number) => void; label: string } = $props();

	const items = READY_BY_OPTIONS.map((slot) => ({ value: String(slot), label: slotLabel(slot) }));
</script>

<Select.Root
	type="single"
	value={String(value)}
	onValueChange={(next) => onChange(Number(next))}
	{items}
>
	<Select.Trigger class="ready-trigger" aria-label={label}>
		<Icon name="clock" size={14} />
		<span class="ready-value">
			<span class="ready-prefix">Ready by</span>
			<span class="num">{slotLabel(value)}</span>
		</span>
		<Icon name="chevron-down" size={14} class="ready-chevron" />
	</Select.Trigger>
	<Select.Portal to=".ebb">
		<Select.Content class="ebb-pop ready-content" sideOffset={6} align="start">
			<Select.Viewport>
				{#each items as item (item.value)}
					<Select.Item value={item.value} label={item.label} class="ready-item">
						{#snippet children({ selected })}
							<span class="num">{item.label}</span>
							{#if selected}
								<Icon name="check" size={14} class="ready-check" />
							{/if}
						{/snippet}
					</Select.Item>
				{/each}
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>

<style>
	:global(.ebb .ready-trigger) {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 28px;
		padding: 0 8px;
		border: 0;
		border-radius: 8px;
		background: linear-gradient(#fff, #f7f7f7);
		box-shadow: var(--shadow-btn);
		color: var(--fg-2);
		font: 500 12px/1 var(--font);
		white-space: nowrap;
		transition:
			transform 150ms var(--ease-out),
			color 120ms var(--ease-out);
	}
	:global(.ebb .ready-trigger:active) {
		transform: scale(0.97);
	}
	:global(.ebb .ready-trigger[data-state='open']),
	:global(.ebb .ready-trigger:hover) {
		color: var(--fg);
	}
	.ready-value {
		display: inline-flex;
		gap: 4px;
	}
	.ready-value .num {
		color: var(--fg);
	}
	:global(.ebb .ready-chevron) {
		color: var(--fg-3);
	}
	:global(.ebb .ready-content) {
		z-index: 60;
		min-width: max(var(--bits-select-anchor-width, 0px), 132px);
		padding: 4px;
		border-radius: 12px;
		background: var(--bg);
		box-shadow: var(--shadow-pop);
		outline: none;
	}
	:global(.ebb .ready-item) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 32px;
		padding: 0 8px 0 10px;
		border-radius: 8px;
		color: var(--fg);
		font-size: 13px;
		outline: none;
	}
	:global(.ebb .ready-item[data-highlighted]) {
		background: #f4f4f4;
	}
	:global(.ebb .ready-check) {
		color: var(--accent);
	}
	@media (max-width: 479px) {
		.ready-prefix {
			display: none;
		}
	}
</style>
