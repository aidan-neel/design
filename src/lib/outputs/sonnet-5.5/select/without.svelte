<script>
	const models = [
		{ value: 'sonnet-5.5', name: 'Sonnet 5.5', note: 'Balanced speed and intelligence' },
		{ value: 'opus-5.5', name: 'Opus 5.5', note: 'Most capable for complex work' },
		{ value: 'haiku-4.5', name: 'Haiku 4.5', note: 'Fastest and most affordable' },
		{ value: 'fable-5.1', name: 'Fable 5.1', note: 'Long-form writing and storytelling' }
	];

	let open = $state(false);
	let selected = $state(models[0]);
	let active = $state(0);
	let root = $state();
	let trigger = $state();
	let options = $state([]);

	function openMenu(index) {
		active = index ?? Math.max(0, models.indexOf(selected));
		open = true;
		queueMicrotask(() => options[active]?.focus());
	}

	function close(refocus = true) {
		open = false;
		if (refocus) trigger?.focus();
	}

	function choose(model) {
		selected = model;
		close();
	}

	function focusOption(index) {
		active = (index + models.length) % models.length;
		options[active]?.focus();
	}

	function onTriggerKeydown(e) {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			openMenu();
		}
	}

	function onListKeydown(e) {
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				focusOption(active + 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				focusOption(active - 1);
				break;
			case 'Home':
				e.preventDefault();
				focusOption(0);
				break;
			case 'End':
				e.preventDefault();
				focusOption(models.length - 1);
				break;
			case 'Escape':
				e.preventDefault();
				close();
				break;
			case 'Tab':
				close(false);
				break;
		}
	}

	function onFocusOut(e) {
		if (open && !root?.contains(e.relatedTarget)) open = false;
	}
</script>

<div class="select" bind:this={root} onfocusout={onFocusOut}>
	<button
		type="button"
		class="trigger"
		class:is-open={open}
		bind:this={trigger}
		aria-haspopup="listbox"
		aria-expanded={open}
		onclick={() => (open ? close(false) : openMenu())}
		onkeydown={onTriggerKeydown}
	>
		<span class="dot"></span>
		<span class="value">{selected.name}</span>
		<svg class="chevron" viewBox="0 0 16 16" fill="none" aria-hidden="true">
			<path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</button>

	{#if open}
		<div class="menu" role="listbox" aria-label="Model" tabindex="-1" onkeydown={onListKeydown}>
			{#each models as model, i (model.value)}
				<button
					type="button"
					role="option"
					class="option"
					class:is-selected={model.value === selected.value}
					aria-selected={model.value === selected.value}
					tabindex={i === active ? 0 : -1}
					bind:this={options[i]}
					onclick={() => choose(model)}
					onmouseenter={() => (active = i)}
				>
					<span class="text">
						<span class="name">{model.name}</span>
						<span class="note">{model.note}</span>
					</span>
					{#if model.value === selected.value}
						<svg class="check" viewBox="0 0 16 16" fill="none" aria-hidden="true">
							<path d="M3.5 8.5l3 3 6-7" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.select {
		position: relative;
		display: inline-block;
		font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
		color: #171717;
	}

	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		min-width: 220px;
		padding: 9px 12px;
		background: #fff;
		border: 1px solid #e0e0e0;
		border-radius: 10px;
		font: inherit;
		font-size: 14px;
		font-weight: 500;
		color: inherit;
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
	}

	.trigger:hover {
		border-color: #c8c8c8;
	}

	.trigger:focus-visible,
	.trigger.is-open {
		outline: none;
		border-color: #8a8a8a;
		box-shadow: 0 0 0 3px rgb(23 23 23 / 0.08);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #d97757;
		flex: none;
	}

	.value {
		flex: 1;
		text-align: left;
	}

	.chevron {
		width: 16px;
		height: 16px;
		color: #8a8a8a;
		flex: none;
		transition: transform 0.2s ease;
	}

	.is-open .chevron {
		transform: rotate(180deg);
	}

	.menu {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		z-index: 50;
		min-width: 100%;
		width: max-content;
		max-width: 320px;
		padding: 4px;
		background: #fff;
		border: 1px solid #e5e5e5;
		border-radius: 12px;
		box-shadow:
			0 10px 30px -6px rgb(0 0 0 / 0.15),
			0 2px 6px rgb(0 0 0 / 0.05);
		transform-origin: top left;
		animation: pop 0.14s ease-out;
	}

	.option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		width: 100%;
		padding: 8px 10px;
		background: transparent;
		border: 0;
		border-radius: 8px;
		font: inherit;
		color: inherit;
		text-align: left;
	}

	.option:hover,
	.option:focus-visible {
		outline: none;
		background: #f4f4f4;
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.name {
		font-size: 14px;
		font-weight: 500;
	}

	.note {
		font-size: 12px;
		color: #737373;
	}

	.check {
		width: 16px;
		height: 16px;
		color: #171717;
		flex: none;
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.menu {
			animation: none;
		}
		.chevron,
		.trigger {
			transition: none;
		}
	}
</style>
