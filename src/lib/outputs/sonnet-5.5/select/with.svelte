<script>
	import { Select } from 'bits-ui';

	const models = [
		{ value: 'claude-opus-5-5', label: 'Claude Opus 5.5', provider: 'Anthropic' },
		{ value: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', provider: 'Anthropic' },
		{ value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', provider: 'Anthropic' },
		{ value: 'gpt-6-1-sol', label: 'GPT 6.1 Sol', provider: 'OpenAI' },
		{ value: 'gemini-3-pro', label: 'Gemini 3 Pro', provider: 'Google' },
		{ value: 'qwen-3-8-max', label: 'Qwen 3.8 Max', provider: 'Alibaba' },
		{ value: 'deepseek-v4-1-flash', label: 'DeepSeek V4.1 Flash', provider: 'DeepSeek' }
	];

	let value = $state('claude-sonnet-5-5');
	let trigger = $state(null);

	const selected = $derived(models.find((m) => m.value === value));
</script>

<Select.Root
	type="single"
	bind:value
	items={models}
	onOpenChangeComplete={(open) => {
		// An outside click on empty space leaves focus on <body>; hand it back to the trigger.
		if (!open && (!document.activeElement || document.activeElement === document.body)) trigger?.focus();
	}}
>
	<Select.Trigger
		bind:ref={trigger}
		aria-label="Model"
		class="inline-flex h-8 w-72 items-center justify-between gap-2 rounded-lg bg-white pr-2 pl-3 text-[13px] font-medium whitespace-nowrap text-[#1a1a1a] shadow-ring transition-shadow duration-120 ease-out select-none hover:shadow-[0_1px_2px_rgb(0_0_0/0.05),0_0_0_1px_rgb(0_0_0/0.14)] data-[state=open]:shadow-[0_1px_2px_rgb(0_0_0/0.05),0_0_0_1px_rgb(0_0_0/0.14)] pointer-coarse:h-11 pointer-coarse:text-sm"
	>
		<span class="min-w-0 truncate">{selected?.label}</span>
		<svg
			class="size-4 shrink-0 text-muted"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="m7 15 5 5 5-5" />
			<path d="m7 9 5-5 5 5" />
		</svg>
	</Select.Trigger>
	<Select.Portal>
		<Select.Content
			side="bottom"
			align="start"
			sideOffset={6}
			collisionPadding={8}
			preventScroll={true}
			class="select-content z-50 min-w-(--bits-select-anchor-width) origin-(--bits-select-content-transform-origin) rounded-[10px] bg-white p-1 text-[#1a1a1a] shadow-[0_8px_24px_rgb(0_0_0/0.08),0_0_0_1px_rgb(0_0_0/0.07)] outline-none"
		>
			<Select.Viewport
				class="max-h-(--bits-select-content-available-height) overscroll-contain [scrollbar-width:none]"
			>
				{#each models as model (model.value)}
					<Select.Item
						value={model.value}
						label={model.label}
						class="flex h-8 items-center gap-2 rounded-md pr-2.5 pl-2 text-[13px] font-medium whitespace-nowrap outline-none transition-colors duration-60 select-none data-highlighted:bg-[#f3f3f3] data-highlighted:duration-0 pointer-coarse:h-11 pointer-coarse:text-sm"
					>
						{#snippet children({ selected: isSelected })}
							<span class="grid size-4 shrink-0 place-items-center">
								{#if isSelected}
									<svg
										class="size-4"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										aria-hidden="true"
									>
										<path d="M20 6 9 17l-5-5" />
									</svg>
								{/if}
							</span>
							<span class="min-w-0 truncate">{model.label}</span>
							<span class="ml-auto pl-3 text-xs font-normal text-neutral-500">{model.provider}</span>
						{/snippet}
					</Select.Item>
				{/each}
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>
