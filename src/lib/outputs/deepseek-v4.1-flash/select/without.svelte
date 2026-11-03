<script>
	const models = [
		{ id: 'gpt-5', name: 'GPT-5', note: 'OpenAI' },
		{ id: 'claude-opus', name: 'Claude Opus', note: 'Anthropic' },
		{ id: 'gemini-ultra', name: 'Gemini Ultra', note: 'Google' },
		{ id: 'llama-4', name: 'Llama 4', note: 'Meta' },
		{ id: 'mistral-large', name: 'Mistral Large', note: 'Mistral' }
	];

	let selected = $state(models[0]);
	let open = $state(false);
</script>

<div class="wrap">
	<button class="trigger" onclick={() => (open = !open)} aria-haspopup="listbox" aria-expanded={open}>
		<span class="label">
			<span class="name">{selected.name}</span>
			<span class="note">{selected.note}</span>
		</span>
		<svg class="chevron" class:rotated={open} viewBox="0 0 20 20" fill="none" aria-hidden="true">
			<path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</button>

	{#if open}
		<ul class="menu" role="listbox">
			{#each models as model (model.id)}
				<li>
					<button
						class="option"
						class:active={model.id === selected.id}
						role="option"
						aria-selected={model.id === selected.id}
						onclick={() => {
							selected = model;
							open = false;
						}}
					>
						<span class="label">
							<span class="name">{model.name}</span>
							<span class="note">{model.note}</span>
						</span>
						{#if model.id === selected.id}
							<svg class="check" viewBox="0 0 20 20" fill="none" aria-hidden="true">
								<path d="M5 10.5l3.2 3.2L15 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
							</svg>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.wrap {
		position: relative;
		width: 260px;
		font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
	}

	.trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
		padding: 10px 14px;
		background: #ffffff;
		border: 1px solid #d4d4d8;
		border-radius: 10px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
		cursor: default;
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}

	.trigger:hover {
		border-color: #a1a1aa;
	}

	.trigger:focus-visible {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
	}

	.label {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		line-height: 1.3;
	}

	.name {
		font-size: 14px;
		font-weight: 500;
		color: #18181b;
	}

	.note {
		font-size: 12px;
		color: #71717a;
	}

	.chevron {
		width: 18px;
		height: 18px;
		color: #71717a;
		flex-shrink: 0;
		transition: transform 0.15s ease;
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	.menu {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		z-index: 20;
		margin: 0;
		padding: 6px;
		list-style: none;
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 10px;
		box-shadow:
			0 10px 25px -5px rgba(0, 0, 0, 0.12),
			0 8px 10px -6px rgba(0, 0, 0, 0.08);
	}

	.option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
		padding: 8px 10px;
		background: transparent;
		border: none;
		border-radius: 7px;
		text-align: left;
		cursor: default;
	}

	.option:hover {
		background: #f4f4f5;
	}

	.option.active {
		background: #eef2ff;
	}

	.option.active .name {
		color: #4338ca;
	}

	.check {
		width: 18px;
		height: 18px;
		color: #4f46e5;
		flex-shrink: 0;
	}
</style>
