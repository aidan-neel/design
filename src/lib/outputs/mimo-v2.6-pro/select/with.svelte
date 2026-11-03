<script>
	import { onMount, tick } from 'svelte';

	// Select-only listbox (WAI-ARIA listbox pattern, roving focus). The host page
	// forbids id attributes, so aria-controls / aria-activedescendant are not used:
	// focus moves into the list instead, which is the other sanctioned pattern.

	const models = [
		{ name: 'Claude Opus 4.6', context: '200k' },
		{ name: 'Claude Sonnet 5.5', context: '200k' },
		{ name: 'GPT-5.2', context: '256k' },
		{ name: 'Gemini 3 Pro', context: '1M' },
		{ name: 'Mimo V2.6 Pro', context: '1M' },
		{ name: 'DeepSeek V4.1 Flash', context: '128k' },
		{ name: 'Llama 4 Maverick', context: '1M' },
		{ name: 'Qwen 3 Max', context: '256k' }
	];

	const LIST_GAP = 6;

	let open = $state(false);
	let active = $state(0);
	let selected = $state(1);
	let place = $state('below');
	let shift = $state(0);

	let trigger = $state();
	let list = $state();
	let options = $state([]);

	let unlock = null;
	let typeBuf = '';
	let typeTimer;

	const value = $derived(models[selected].name);

	function lockScroll() {
		const root = document.documentElement;
		const gap = window.innerWidth - root.clientWidth;
		const prevOverflow = root.style.overflow;
		const prevPadding = root.style.paddingRight;
		root.style.overflow = 'hidden';
		if (gap > 0) root.style.paddingRight = `${gap}px`;
		return () => {
			root.style.overflow = prevOverflow;
			root.style.paddingRight = prevPadding;
		};
	}

	function placeList() {
		if (!trigger || !list) return;
		const t = trigger.getBoundingClientRect();
		const height = list.offsetHeight;
		const width = list.offsetWidth;
		const room = window.innerHeight - t.bottom;
		place = room < height + LIST_GAP + 8 && t.top > room ? 'above' : 'below';
		const wanted = t.left;
		const min = 8;
		const max = window.innerWidth - 8 - width;
		shift = Math.round(Math.min(Math.max(wanted, min), Math.max(min, max)) - wanted);
	}

	function openList() {
		if (open) return;
		active = selected;
		placeList();
		open = true;
		unlock = lockScroll();
		tick().then(() => {
			const el = options[active];
			el?.focus();
			el?.scrollIntoView({ block: 'nearest' });
		});
	}

	function closeList(refocus = true) {
		if (!open) return;
		open = false;
		active = selected;
		typeBuf = '';
		clearTimeout(typeTimer);
		unlock?.();
		unlock = null;
		if (refocus) trigger?.focus();
	}

	function select(index, refocus = true) {
		selected = index;
		closeList(refocus);
	}

	function setActive(index) {
		active = index;
		tick().then(() => {
			const el = options[index];
			el?.focus();
			el?.scrollIntoView({ block: 'nearest' });
		});
	}

	function typeahead(key) {
		clearTimeout(typeTimer);
		typeBuf += key.toLowerCase();
		typeTimer = setTimeout(() => (typeBuf = ''), 600);
		const repeated = typeBuf.length > 1 && typeBuf.split('').every((c) => c === typeBuf[0]);
		const query = repeated ? typeBuf[0] : typeBuf;
		const from = query.length > 1 ? active : active + 1;
		for (let n = 0; n < models.length; n++) {
			const i = (from + n) % models.length;
			if (models[i].name.toLowerCase().startsWith(query)) {
				setActive(i);
				return;
			}
		}
	}

	function onTriggerKeydown(event) {
		if (open) return;
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			event.stopPropagation();
			openList();
		}
	}

	// The open listbox owns its keys: nothing it handles reaches the page behind it.
	function onListKeydown(event) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			event.stopPropagation();
			setActive(Math.min(active + 1, models.length - 1));
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			event.stopPropagation();
			setActive(Math.max(active - 1, 0));
		} else if (event.key === 'Home') {
			event.preventDefault();
			event.stopPropagation();
			setActive(0);
		} else if (event.key === 'End') {
			event.preventDefault();
			event.stopPropagation();
			setActive(models.length - 1);
		} else if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			event.stopPropagation();
			select(active);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			closeList();
		} else if (event.key === 'Tab') {
			select(active, false);
		} else if (event.key.length === 1 && event.key !== ' ') {
			event.stopPropagation();
			typeahead(event.key);
		}
	}

	function onOutsidePointerdown(event) {
		if (!open) return;
		if (trigger?.contains(event.target) || list?.contains(event.target)) return;
		const other = event.target.closest?.(
			'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		closeList(!other);
	}

	onMount(() => {
		document.addEventListener('pointerdown', onOutsidePointerdown, true);
		window.addEventListener('resize', () => open && placeList());
		return () => {
			document.removeEventListener('pointerdown', onOutsidePointerdown, true);
			unlock?.();
		};
	});
</script>

<div class="select">
	<button
		type="button"
		class="trigger"
		role="combobox"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label="Model"
		bind:this={trigger}
		onclick={() => (open ? closeList() : openList())}
		onkeydown={onTriggerKeydown}
	>
		<span class="value">{value}</span>
		<svg
			class="chevron"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	</button>

	<div
		class="list"
		role="listbox"
		aria-label="Models"
		data-state={open ? 'open' : 'closed'}
		data-place={place}
		style:left="{shift}px"
		bind:this={list}
		onkeydown={onListKeydown}
	>
		{#each models as model, i (model.name)}
			<div
				class="row"
				role="option"
				aria-selected={i === selected}
				tabindex={i === active ? 0 : -1}
				data-active={i === active ? '' : undefined}
				bind:this={options[i]}
				onpointermove={() => (active = i)}
				onclick={() => select(i)}
			>
				<span class="check">
					{#if i === selected}
						<svg
							width="16"
							height="16"
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
				<span class="name">{model.name}</span>
				<span class="meta">{model.context}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.select {
		--w: 272px;
		--gap: 6px;
		--trigger-h: 32px;
		--row-h: 32px;
		--radius: 8px;
		--radius-row: 6px;

		--ease-out: cubic-bezier(0.23, 1, 0.32, 1);

		/* Type scale: 14px primary, 12px secondary. */
		--fs-primary: 0.875rem;
		--fs-secondary: 0.75rem;
		--fs-touch: 1rem;

		--text: oklch(0.22 0.006 255);
		--muted: oklch(0.53 0.012 255);
		--surface: oklch(1 0 0);
		--line: oklch(0.86 0.008 255);
		--line-strong: oklch(0.74 0.012 255);
		--hover-bg: oklch(0.96 0.005 255);
		--focus: oklch(0.22 0.006 255);
		--shadow: 0 8px 24px rgb(0 0 0 / 0.12);

		position: relative;
		display: inline-flex;
		cursor: default;
		font-family:
			ui-sans-serif,
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			'Helvetica Neue',
			Arial,
			sans-serif;
		font-size: var(--fs-primary);
		line-height: 1.25;
	}

	/* Trigger */

	.trigger {
		display: inline-flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		box-sizing: border-box;
		width: var(--w);
		max-width: calc(100vw - 16px);
		height: var(--trigger-h);
		padding: 0 10px 0 12px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--text);
		font: inherit;
		font-size: var(--fs-primary);
		font-weight: 500;
		white-space: nowrap;
		cursor: default;
		outline: none;
		transition:
			background-color 120ms ease,
			border-color 120ms ease;
	}

	.trigger:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}

	.value {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.chevron {
		flex: none;
		color: var(--muted);
	}

	@media (hover: hover) and (pointer: fine) {
		.trigger:hover {
			background: var(--hover-bg);
			border-color: var(--line-strong);
		}
	}

	/* Popup */

	.list {
		position: absolute;
		z-index: 10;
		top: calc(100% + var(--gap));
		left: 0;
		box-sizing: border-box;
		width: var(--w);
		max-width: calc(100vw - 16px);
		padding: 4px;
		border-radius: calc(var(--radius-row) + 4px);
		background: var(--surface);
		box-shadow: var(--shadow);

		opacity: 0;
		visibility: hidden;
		transform: translateY(-2px) scale(0.97);
		transform-origin: top center;
		transition:
			opacity 60ms ease-in,
			transform 60ms ease-in,
			visibility 0s 60ms;
	}

	.list[data-place='above'] {
		top: auto;
		bottom: calc(100% + var(--gap));
		transform: translateY(2px) scale(0.97);
		transform-origin: bottom center;
	}

	.list[data-state='open'] {
		opacity: 1;
		visibility: visible;
		transform: none;
		transition:
			opacity 170ms var(--ease-out),
			transform 170ms var(--ease-out),
			visibility 0s 0s;
	}

	/* Rows */

	.row {
		display: grid;
		grid-template-columns: 16px minmax(0, 1fr) auto;
		align-items: center;
		gap: 8px;
		box-sizing: border-box;
		height: var(--row-h);
		padding: 0 8px;
		border-radius: var(--radius-row);
		color: var(--text);
		font-size: var(--fs-primary);
		font-weight: 400;
		white-space: nowrap;
		cursor: default;
		outline: none;
		transition: background-color 60ms ease;
	}

	.row[data-active] {
		background: var(--hover-bg);
		transition: none;
	}

	.row:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: -2px;
	}

	@media (hover: hover) and (pointer: fine) {
		.row:hover {
			background: var(--hover-bg);
			transition: none;
		}
	}

	.check {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		color: var(--text);
	}

	.name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.meta {
		color: var(--muted);
		font-size: var(--fs-secondary);
		font-variant-numeric: tabular-nums;
	}

	/* Touch: 44px targets, 16px in the trigger so iOS never zooms. */

	@media (pointer: coarse) {
		.select {
			--trigger-h: 44px;
			--row-h: 44px;
		}

		.trigger {
			padding: 0 12px 0 14px;
			font-size: var(--fs-touch);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.list {
			transform: none;
			transition:
				opacity 60ms linear,
				visibility 0s 60ms;
		}

		.list[data-place='above'] {
			transform: none;
		}

		.list[data-state='open'] {
			transform: none;
			transition:
				opacity 100ms linear,
				visibility 0s 0s;
		}
	}
</style>
