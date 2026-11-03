<script lang="ts">
	import { Select } from 'bits-ui';

	type Model = { value: string; label: string };

	const models: Model[] = [
		{ value: 'spark-1.3', label: 'Muse Spark 1.3' },
		{ value: 'spark-1.3-flash', label: 'Muse Spark 1.3 Flash' },
		{ value: 'glm-5.3', label: 'GLM 5.3' },
		{ value: 'gpt-6-luna', label: 'GPT 6 Luna' },
		{ value: 'qwen-3.8-max', label: 'Qwen 3.8 Max' },
		{ value: 'deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash' }
	];

	let value = $state('spark-1.3');
	let selected = $derived(models.find((m) => m.value === value) ?? models[0]);
</script>

<Select.Root type="single" bind:value items={models}>
	<Select.Trigger
		aria-label="Model"
		class="inline-flex h-8 min-w-52 cursor-default items-center gap-2 rounded-lg border border-[#e0e0e0] bg-white pr-2 pl-3 text-[13.5px] font-medium whitespace-nowrap text-[#1a1a1a] outline-none select-none transition-colors duration-120 ease-out hover:border-[#d4d4d4] hover:bg-[#f7f7f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent data-[state=open]:border-[#d4d4d4] data-[state=open]:bg-[#f7f7f7] pointer-coarse:h-11 pointer-coarse:text-base"
	>
		<span class="overflow-hidden text-ellipsis">{selected.label}</span>
		<svg
			class="ml-auto size-4 flex-none text-muted"
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
			align="start"
			sideOffset={6}
			class="select-content z-50 max-h-[200px] w-max min-w-52 max-w-80 origin-(--bits-select-content-transform-origin) overflow-y-auto rounded-[10px] bg-white p-1 overscroll-contain outline-none shadow-[0_8px_24px_rgb(0_0_0/0.08),0_0_0_1px_rgb(0_0_0/0.07)] pointer-coarse:max-h-[272px]"
		>
			<Select.Viewport class="block">
				{#each models as m (m.value)}
					<Select.Item
						value={m.value}
						label={m.label}
						class="flex h-8 cursor-default items-center justify-between gap-6 rounded-md pr-2 pl-2.5 text-[13.5px] whitespace-nowrap text-[#1a1a1a] outline-none select-none data-highlighted:bg-[#f3f3f3] data-[selected]:font-medium focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent pointer-coarse:h-11 pointer-coarse:text-[15px]"
					>
						{#snippet children({ selected: isSelected })}
							<span class="overflow-hidden text-ellipsis tabular-nums">{m.label}</span>
							<span class="grid size-4 flex-none place-items-center text-[#1a1a1a]">
								{#if isSelected}
									<svg
										class="size-4"
										viewBox="0 0 16 16"
										fill="none"
										stroke="currentColor"
										stroke-width="1.75"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg
									>
								{/if}
							</span>
						{/snippet}
					</Select.Item>
				{/each}
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>
