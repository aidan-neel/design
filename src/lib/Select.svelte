<script lang="ts">
	import { Select } from 'bits-ui';

	type Option = { value: string; label: string };

	let {
		value = $bindable(),
		options,
		label
	}: { value: string; options: Option[]; label: string } = $props();

	let selected = $derived(options.find((o) => o.value === value));
</script>

<Select.Root type="single" bind:value items={options}>
	<Select.Trigger
		aria-label={label}
		class="group inline-flex cursor-default items-center gap-2 rounded-lg bg-white py-1 pr-2 pl-3 text-[14px] font-medium shadow-ring transition-shadow duration-50 outline-none select-none hover:shadow-[0_1px_2px_rgb(0_0_0/0.05),0_0_0_1px_rgb(0_0_0/0.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent data-[state=open]:shadow-[0_1px_2px_rgb(0_0_0/0.05),0_0_0_1px_rgb(0_0_0/0.14)]"
	>
		{selected?.label}
		<svg
			class="size-3.5 text-muted transition-transform duration-50 group-data-[state=open]:rotate-180 group-data-[state=open]:duration-170"
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
			side="bottom"
			align="end"
			sideOffset={6}
			class="select-content z-50 min-w-48 origin-(--bits-select-content-transform-origin) rounded-[10px] bg-white p-1 shadow-[0_8px_24px_rgb(0_0_0/0.08),0_0_0_1px_rgb(0_0_0/0.07)] outline-none"
		>
			<Select.Viewport>
				{#each options as o (o.value)}
					<Select.Item
						value={o.value}
						label={o.label}
						class="flex cursor-default items-center justify-between gap-6 rounded-md px-2.5 py-1.5 text-[13px] outline-none select-none data-highlighted:bg-[#f3f3f3] data-selected:font-medium"
					>
						{#snippet children({ selected })}
							{o.label}
							{#if selected}
								<svg
									class="size-3.5 text-[#1a1a1a]"
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
