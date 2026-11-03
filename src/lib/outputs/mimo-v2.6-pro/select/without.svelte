<script>
	const models = [
		{ value: 'glm-5.3', label: 'GLM 5.3' },
		{ value: 'glm-5.3-flash', label: 'GLM 5.3 Flash' },
		{ value: 'muse-spark-1.3', label: 'Muse Spark 1.3' },
		{ value: 'gpt-6-luna', label: 'GPT 6 Luna' },
		{ value: 'gpt-6.1-sol', label: 'GPT 6.1 Sol' },
		{ value: 'deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash' },
		{ value: 'qwen-3.8-max', label: 'Qwen 3.8 Max' },
		{ value: 'mimo-v2.6-flash', label: 'Mimo V2.6 Flash' },
		{ value: 'sonnet-5.5', label: 'Sonnet 5.5' },
		{ value: 'haiku-4.5', label: 'Haiku 4.5' }
	];

	let open = $state(false);
	let selected = $state(models[0]);
	let wrapper;

	function toggle() {
		open = !open;
	}

	function choose(model) {
		selected = model;
		open = false;
	}

	function onWindowClick(event) {
		if (open && wrapper && !wrapper.contains(event.target)) {
			open = false;
		}
	}

	function onWindowKeydown(event) {
		if (event.key === 'Escape' && open) {
			open = false;
		}
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onWindowKeydown} />

<div class="select" bind:this={wrapper}>
	<button type="button" class="trigger" aria-haspopup="listbox" aria-expanded={open} onclick={toggle}>
		<span class="value">{selected.label}</span>
		<svg class="chevron" viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true">
			<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</button>

	{#if open}
		<ul class="menu" role="listbox" aria-label="Models">
			{#each models as model (model.value)}
				<li role="option" aria-selected={model.value === selected.value}>
					<button
						type="button"
						class="option"
						class:active={model.value === selected.value}
						onclick={() => choose(model)}
					>
						{model.label}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.select {
		position: relative;
		display: inline-block;
		width: 260px;
		font-family: system-ui, -apple-system, sans-serif;
	}

	.trigger {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 8px 12px;
		background: #ffffff;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		color: #111827;
	}

	.trigger:hover {
		background: #f9fafb;
	}

	.trigger:focus-visible {
		outline: 2px solid #2563eb;
		outline-offset: 1px;
	}

	.value {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.chevron {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		color: #6b7280;
	}

	.menu {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		margin: 0;
		padding: 4px;
		list-style: none;
		background: #ffffff;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		max-height: 260px;
		overflow-y: auto;
		z-index: 10;
	}

	.menu li {
		margin: 0;
		padding: 0;
	}

	.option {
		display: block;
		width: 100%;
		padding: 8px 10px;
		background: none;
		border: none;
		border-radius: 4px;
		font-size: 14px;
		text-align: left;
		color: #111827;
	}

	.option:hover {
		background: #f3f4f6;
	}

	.option.active {
		background: #eff6ff;
		color: #1d4ed8;
	}
</style>
