<script>
	let models = [
		{ value: 'spark-1.3', label: 'Muse Spark 1.3' },
		{ value: 'spark-1.3-flash', label: 'Muse Spark 1.3 Flash' },
		{ value: 'glm-5.3', label: 'GLM 5.3' },
		{ value: 'gpt-6-luna', label: 'GPT 6 Luna' },
		{ value: 'qwen-3.8-max', label: 'Qwen 3.8 Max' }
	];

	let selectedValue = $state('spark-1.3');
	let open = $state(false);

	let selected = $derived(models.find((m) => m.value === selectedValue) ?? models[0]);

	function toggle() {
		open = !open;
	}

	function choose(value) {
		selectedValue = value;
		open = false;
	}
</script>

<div class="dropdown">
	<button type="button" class="trigger" onclick={toggle} aria-haspopup="listbox" aria-expanded={open}>
		<span class="trigger-label">{selected.label}</span>
		<svg
			class="chevron"
			class:chevron-open={open}
			width="16"
			height="16"
			viewBox="0 0 16 16"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="m4 6 4 4 4-4" />
		</svg>
	</button>
	{#if open}
		<ul class="menu" role="listbox">
			{#each models as m (m.value)}
				<li role="option" aria-selected={m.value === selectedValue}>
					<button
						type="button"
						class="option"
						class:option-selected={m.value === selectedValue}
						onclick={() => choose(m.value)}
					>
						<span>{m.label}</span>
						{#if m.value === selectedValue}
							<svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								stroke-width="1.75"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="m3.5 8.5 3 3 6-7" />
							</svg>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.dropdown {
		position: relative;
		display: inline-block;
		width: 220px;
		font-family: inherit;
	}

	.trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		width: 100%;
		height: 36px;
		padding: 0 10px 0 12px;
		background: #ffffff;
		border: 1px solid #d9d9d9;
		border-radius: 8px;
		font-size: 14px;
		color: #222;
		cursor: default;
	}

	.trigger:hover {
		border-color: #bfbfbf;
		background: #fafafa;
	}

	.trigger-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chevron {
		flex-shrink: 0;
		color: #888;
		transition: transform 0.15s ease;
	}

	.chevron-open {
		transform: rotate(180deg);
	}

	.menu {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		width: 100%;
		margin: 0;
		padding: 4px;
		list-style: none;
		background: #ffffff;
		border: 1px solid #d9d9d9;
		border-radius: 8px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
		z-index: 50;
	}

	.option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		width: 100%;
		padding: 8px 10px;
		background: transparent;
		border: 0;
		border-radius: 5px;
		font-size: 14px;
		color: #222;
		text-align: left;
		white-space: nowrap;
		cursor: default;
	}

	.option:hover {
		background: #f2f2f2;
	}

	.option-selected {
		font-weight: 600;
	}
</style>
