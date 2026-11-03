<script>
	import { cubicIn } from 'svelte/easing';
	import { tick } from 'svelte';

	const models = [
		{ name: 'GPT-5', context: '400K' },
		{ name: 'Claude Sonnet 4.5', context: '200K' },
		{ name: 'Gemini 2.5 Pro', context: '1M' },
		{ name: 'Llama 4 Maverick', context: '1M' },
		{ name: 'DeepSeek V3.2', context: '128K' },
		{ name: 'Mistral Large 3', context: '256K' }
	];

	let open = $state(false);
	let above = $state(false);
	let selected = $state(0);
	let highlighted = $state(0);

	let wrap;
	let trigger;
	let listEl;

	let restoreScroll = null;
	let query = '';
	let queryTimer;

	function cubicBezier(x1, y1, x2, y2) {
		const cx = 3 * x1;
		const bx = 3 * (x2 - x1) - cx;
		const ax = 1 - cx - bx;
		const cy = 3 * y1;
		const by = 3 * (y2 - y1) - cy;
		const ay = 1 - cy - by;
		const X = (t) => ((ax * t + bx) * t + cx) * t;
		const Y = (t) => ((ay * t + by) * t + cy) * t;
		return (t) => {
			let x = t;
			for (let i = 0; i < 6; i++) {
				const e = X(x) - t;
				if (Math.abs(e) < 1e-4) break;
				x -= e / ((3 * ax * x + 2 * bx) * x + cx);
			}
			return Y(x);
		};
	}
	const easeOutStrong = cubicBezier(0.23, 1, 0.32, 1);

	const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

	function enter(node, { dir = 1 } = {}) {
		if (reducedMotion()) return { duration: 100, css: (t) => `opacity: ${t}` };
		return {
			duration: 160,
			easing: easeOutStrong,
			css: (t, u) => `opacity: ${t}; transform: translateY(${u * 2 * dir}px) scale(${0.97 + t * 0.03})`
		};
	}

	function exit() {
		if (reducedMotion()) return { duration: 50, css: (t) => `opacity: ${t}` };
		return {
			duration: 70,
			easing: cubicIn,
			css: (t) => `opacity: ${t}; transform: scale(${0.98 + t * 0.02})`
		};
	}

	function lockScroll() {
		const root = document.documentElement;
		const prev = root.style.overflow;
		root.style.overflow = 'hidden';
		restoreScroll = () => {
			root.style.overflow = prev;
			restoreScroll = null;
		};
	}

	async function openList() {
		if (open) return;
		const r = wrap.getBoundingClientRect();
		const needed = models.length * (matchMedia('(pointer: coarse)').matches ? 44 : 30) + 12;
		above = innerHeight - r.bottom < needed && r.top > needed;
		highlighted = selected;
		open = true;
		lockScroll();
		await tick();
		focusRow(highlighted);
	}

	function closeList(refocus = true) {
		if (!open) return;
		open = false;
		restoreScroll?.();
		if (refocus && wrap.contains(document.activeElement)) trigger.focus();
	}

	function choose(i) {
		selected = i;
		closeList();
	}

	function focusRow(i) {
		listEl?.children[i]?.focus();
	}

	function highlight(i) {
		highlighted = i;
		focusRow(i);
	}

	function typeahead(ch) {
		clearTimeout(queryTimer);
		query += ch.toLowerCase();
		queryTimer = setTimeout(() => (query = ''), 500);
		const n = models.length;
		for (let k = 1; k <= n; k++) {
			const j = (highlighted + k) % n;
			if (models[j].name.toLowerCase().startsWith(query)) {
				highlight(j);
				return;
			}
		}
	}

	function onTriggerKeydown(e) {
		if (open) return;
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			openList();
		}
	}

	function onListKeydown(e) {
		const n = models.length;
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				highlight((highlighted + 1) % n);
				break;
			case 'ArrowUp':
				e.preventDefault();
				highlight((highlighted - 1 + n) % n);
				break;
			case 'Home':
				e.preventDefault();
				highlight(0);
				break;
			case 'End':
				e.preventDefault();
				highlight(n - 1);
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				choose(highlighted);
				break;
			case 'Escape':
				e.preventDefault();
				e.stopPropagation();
				closeList();
				break;
			case 'Tab':
				choose(highlighted);
				break;
			default:
				if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) typeahead(e.key);
		}
	}

	$effect(() => {
		if (!open) return;
		const onPointerDown = (e) => {
			if (wrap.contains(e.target)) return;
			const focusable = e.target.closest(
				'a[href], button, input, textarea, [tabindex]:not([tabindex="-1"])'
			);
			closeList(!focusable);
		};
		document.addEventListener('pointerdown', onPointerDown, true);
		return () => document.removeEventListener('pointerdown', onPointerDown, true);
	});
</script>

<div class="select" bind:this={wrap}>
	<button
		bind:this={trigger}
		type="button"
		class="trigger"
		role="combobox"
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label="Model"
		onclick={() => (open ? closeList() : openList())}
		onkeydown={onTriggerKeydown}
	>
		<span class="value">{models[selected].name}</span>
		<svg
			class="chev"
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
	</button>

	{#if open}
		<div
			bind:this={listEl}
			class="list"
			class:above
			role="listbox"
			aria-label="Model"
			in:enter={{ dir: above ? -1 : 1 }}
			out:exit
			onkeydown={onListKeydown}
		>
			{#each models as m, i}
				<div
					role="option"
					tabindex="-1"
					aria-selected={i === selected}
					data-highlighted={i === highlighted || undefined}
					class="row"
					onpointerenter={() => highlight(i)}
					onclick={() => choose(i)}
				>
					<span class="check" aria-hidden="true">
						{#if i === selected}
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M20 6 9 17l-5-5" />
							</svg>
						{/if}
					</span>
					<span class="name">{m.name}</span>
					<span class="meta">{m.context}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.select {
		position: relative;
		display: inline-block;
		width: 264px;
		font-size: 14px;
		--hover-bg: #f5f5f5;
		--ctl-line: #d4d4d4;
		--ctl-line: oklch(from var(--color-line) calc(l - 0.05) c h);
	}

	.trigger {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		height: 32px;
		padding: 0 8px 0 12px;
		border: 1px solid var(--ctl-line);
		border-radius: 6px;
		background: #fff;
		font: inherit;
		font-weight: 500;
		color: #1a1a1a;
		white-space: nowrap;
		transition:
			background-color 120ms ease,
			border-color 120ms ease;
	}

	@media (hover: hover) and (pointer: fine) {
		.trigger:hover {
			background: var(--hover-bg);
			border-color: #c9c9c9;
		}
	}

	.trigger[aria-expanded='true'] {
		background: var(--hover-bg);
		border-color: #c9c9c9;
	}

	.value {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-align: left;
		text-overflow: ellipsis;
	}

	.chev {
		flex: none;
		width: 16px;
		height: 16px;
		color: var(--color-muted);
	}

	.list {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		z-index: 30;
		width: max-content;
		min-width: 100%;
		padding: 4px;
		background: #fff;
		border: 1px solid var(--color-line);
		border-radius: 10px;
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
		transform-origin: top left;
	}

	.list.above {
		top: auto;
		bottom: calc(100% + 4px);
		transform-origin: bottom left;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 30px;
		padding: 0 8px;
		border-radius: 6px;
		transition: background-color 60ms ease-out;
	}

	.row[data-highlighted] {
		background: var(--hover-bg);
		transition: none;
	}

	.row:focus {
		outline: none;
	}

	.check {
		display: flex;
		flex: 0 0 16px;
		align-items: center;
		height: 16px;
		color: #1a1a1a;
	}

	.check svg {
		width: 16px;
		height: 16px;
	}

	.name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		margin-left: auto;
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		color: var(--color-muted);
	}

	@media (pointer: coarse) {
		.trigger {
			height: 44px;
		}

		.row {
			height: 44px;
		}
	}
</style>
