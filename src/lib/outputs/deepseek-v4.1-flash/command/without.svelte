<script>
	let open = $state(false);
	let query = $state('');
	let activeIndex = $state(0);
	let inputEl = $state(null);

	const actions = [
		{ label: 'New file' },
		{ label: 'New folder' },
		{ label: 'Open file' },
		{ label: 'Save' },
		{ label: 'Save all' },
		{ label: 'Find in files' },
		{ label: 'Go to line' },
		{ label: 'Toggle sidebar' },
		{ label: 'Toggle terminal' },
		{ label: 'Toggle word wrap' },
		{ label: 'Command palette' },
		{ label: 'Keyboard shortcuts' },
		{ label: 'Reload window' },
		{ label: 'Copy file path' },
		{ label: 'Git: commit' },
		{ label: 'Git: push' },
		{ label: 'Git: pull' },
		{ label: 'Sign out' }
	];

	const filtered = $derived(
		actions.filter((action) => action.label.toLowerCase().includes(query.trim().toLowerCase()))
	);

	$effect(() => {
		if (activeIndex >= filtered.length) {
			activeIndex = Math.max(0, filtered.length - 1);
		}
	});

	$effect(() => {
		if (open) {
			inputEl?.focus();
		}
	});

	function close() {
		open = false;
		query = '';
		activeIndex = 0;
	}

	function run(action) {
		if (!action) return;
		close();
	}

	function handleKeydown(event) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			if (open) {
				close();
			} else {
				open = true;
			}
			return;
		}

		if (!open) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			close();
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (filtered.length) activeIndex = (activeIndex + 1) % filtered.length;
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (filtered.length) activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
		} else if (event.key === 'Enter') {
			event.preventDefault();
			run(filtered[activeIndex]);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="backdrop" onclick={close} role="presentation"></div>

	<div class="palette" role="dialog" aria-label="Command palette">
		<div class="search">
			<input
				bind:this={inputEl}
				bind:value={query}
				oninput={() => (activeIndex = 0)}
				type="text"
				placeholder="Type a command..."
				autocomplete="off"
				spellcheck="false"
			/>
		</div>

		<ul class="list">
			{#each filtered as action, i}
				<li>
					<button
						type="button"
						class:active={i === activeIndex}
						onclick={() => run(action)}
						onmouseenter={() => (activeIndex = i)}
					>
						{action.label}
					</button>
				</li>
			{:else}
				<li class="empty">No matching commands</li>
			{/each}
		</ul>
	</div>
{:else}
	<button type="button" class="trigger" onclick={() => (open = true)}>
		Search actions
		<kbd>⌘K</kbd>
	</button>
{/if}

<style>
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		border: 1px solid #d4d4d8;
		border-radius: 8px;
		background: #ffffff;
		color: #3f3f46;
		font-size: 14px;
		cursor: default;
	}

	.trigger:hover {
		background: #fafafa;
	}

	.trigger kbd {
		font-family: inherit;
		font-size: 12px;
		color: #71717a;
		border: 1px solid #e4e4e7;
		border-bottom-width: 2px;
		border-radius: 5px;
		padding: 1px 6px;
	}

	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(24, 24, 27, 0.35);
		z-index: 40;
	}

	.palette {
		position: fixed;
		top: 12vh;
		left: 50%;
		transform: translateX(-50%);
		width: min(520px, 90vw);
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 12px;
		box-shadow: 0 16px 40px rgba(24, 24, 27, 0.18);
		overflow: hidden;
		z-index: 41;
	}

	.search {
		border-bottom: 1px solid #ececef;
	}

	.search input {
		width: 100%;
		border: 0;
		outline: none;
		background: transparent;
		padding: 14px 16px;
		font-size: 15px;
		color: #18181b;
	}

	.search input::placeholder {
		color: #a1a1aa;
	}

	.list {
		list-style: none;
		margin: 0;
		padding: 6px;
		max-height: 320px;
		overflow-y: auto;
	}

	.list button {
		display: block;
		width: 100%;
		text-align: left;
		border: 0;
		background: transparent;
		border-radius: 7px;
		padding: 9px 10px;
		font-size: 14px;
		color: #3f3f46;
		cursor: default;
	}

	.list button.active {
		background: #f4f4f5;
		color: #18181b;
	}

	.empty {
		padding: 16px 10px;
		text-align: center;
		font-size: 14px;
		color: #a1a1aa;
	}
</style>
