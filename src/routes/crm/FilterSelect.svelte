<script lang="ts">
	import { Select } from 'bits-ui';

	type Option = { value: string; label: string };

	let {
		value = $bindable(),
		options,
		label
	}: { value: string; options: Option[]; label: string } = $props();

	const selected = $derived(options.find((o) => o.value === value));
</script>

<Select.Root type="single" bind:value items={options}>
	<Select.Trigger class="folio-filter" aria-label={label}>
		<span class="k">{label}</span>
		<span class="v">{selected?.label}</span>
		<svg
			class="chev"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg
		>
	</Select.Trigger>
	<Select.Portal>
		<Select.Content
			class="folio-pop folio-select"
			side="bottom"
			align="start"
			sideOffset={4}
			preventScroll={true}
		>
			<Select.Viewport>
				{#each options as o (o.value)}
					<Select.Item value={o.value} label={o.label} class="folio-item">
						{#snippet children({ selected: on })}
							{o.label}
							{#if on}
								<svg
									class="tick"
									viewBox="0 0 16 16"
									fill="none"
									stroke="currentColor"
									stroke-width="1.75"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg
								>
							{/if}
						{/snippet}
					</Select.Item>
				{/each}
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>
