<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { tick } from 'svelte';
	import Icon from './Icon.svelte';

	export type Command = {
		id: string;
		label: string;
		group: 'Pages' | 'Actions';
		hint?: string;
		icon: string;
		keywords?: string;
		run: () => void;
	};

	type Props = {
		open: boolean;
		commands: Command[];
		onclose: () => void;
	};

	let { open, commands, onclose }: Props = $props();

	let query = $state('');
	let active = $state(0);
	let inputEl = $state<HTMLInputElement | null>(null);
	let listEl = $state<HTMLDivElement | null>(null);

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return commands;
		return commands.filter((c) =>
			`${c.label} ${c.group} ${c.keywords ?? ''}`.toLowerCase().includes(q)
		);
	});

	const groups = $derived.by(() => {
		const map = new Map<string, Command[]>();
		for (const command of filtered) {
			const list = map.get(command.group) ?? [];
			list.push(command);
			map.set(command.group, list);
		}
		return [...map.entries()];
	});

	const flat = $derived(groups.flatMap(([, items]) => items));

	$effect(() => {
		if (open) {
			query = '';
			active = 0;
			tick().then(() => inputEl?.focus());
		}
	});

	$effect(() => {
		if (active >= filtered.length) active = Math.max(0, filtered.length - 1);
		tick().then(() => {
			listEl
				?.querySelector('[data-active="true"]')
				?.scrollIntoView({ block: 'nearest' });
		});
	});

	function move(delta: number) {
		if (!flat.length) return;
		active = (active + delta + flat.length) % flat.length;
	}

	function run(command: Command) {
		onclose();
		command.run();
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			move(1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			move(-1);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			const command = flat[active];
			if (command) run(command);
		} else if (event.key === 'Escape') {
			event.preventDefault();
			onclose();
		}
	}
</script>

<Dialog.Root {open} onOpenChange={(next) => !next && onclose()}>
	<Dialog.Portal>
		<Dialog.Overlay class="cp-overlay" />
		<Dialog.Content class="cp-palette" aria-describedby={undefined}>
			<Dialog.Title class="cp-sr-only">Search Sundial</Dialog.Title>
			<div class="search-row">
				<Icon name="search" size={17} cls="search-icon" />
				<input
					bind:this={inputEl}
					bind:value={query}
					oninput={() => (active = 0)}
					onkeydown={onKeydown}
					placeholder="Search pages and actions…"
					aria-label="Search pages and actions"
					autocomplete="off"
					spellcheck="false"
				/>
				<button type="button" class="esc" onclick={onclose}>ESC</button>
			</div>

			<div class="results" bind:this={listEl}>
				{#if flat.length === 0}
					<div class="empty">
						<Icon name="search" size={20} />
						<p>No results for “{query}”</p>
						<span>Try “prices”, “coupon” or “export”.</span>
					</div>
				{:else}
					{#each groups as [group, items]}
						<div class="group">
							<p class="group-label">{group}</p>
							{#each items as command}
								{@const index = flat.indexOf(command)}
								<button
									type="button"
									class="result"
									class:active={index === active}
									data-active={index === active ? 'true' : undefined}
									onclick={() => run(command)}
									onpointermove={() => (active = index)}
								>
									<span class="result-icon"><Icon name={command.icon} size={16} /></span>
									<span class="result-label">{command.label}</span>
									{#if command.hint}<span class="result-hint">{command.hint}</span>{/if}
								</button>
							{/each}
						</div>
					{/each}
				{/if}
			</div>

			<div class="legend">
				<span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
				<span><kbd>↵</kbd> Open</span>
				<span><kbd>esc</kbd> Close</span>
				<span class="brand">Sundial <span class="dot">·</span> Billing</span>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	:global(.cp-overlay) {
		position: fixed;
		inset: 0;
		background: rgb(15 15 15 / 0.24);
		z-index: 90;
		animation: fade-in 160ms ease-out;
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}
	@keyframes palette-in {
		from {
			opacity: 0;
			transform: translate(-50%, -8px) scale(0.98);
		}
	}
	:global(.cp-palette) {
		position: fixed;
		left: 50%;
		top: 16vh;
		transform: translateX(-50%);
		z-index: 91;
		width: min(560px, calc(100vw - 32px));
		max-height: min(540px, 72dvh);
		display: flex;
		flex-direction: column;
		background: #fff;
		border-radius: 20px;
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.06),
			0 24px 64px -12px rgb(0 0 0 / 0.22);
		overflow: hidden;
		outline: none;
		animation: palette-in 160ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.search-row {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 54px;
		padding: 0 14px;
		border-bottom: 1px solid var(--line);
	}
	.search-row :global(.search-icon) {
		color: var(--fg3);
	}
	.search-row input {
		flex: 1;
		min-width: 0;
		height: 100%;
		border: 0;
		outline: none;
		background: transparent;
		font-family: inherit;
		font-size: 14.5px;
		color: var(--fg);
	}
	.search-row input::placeholder {
		color: var(--fg3);
	}
	.esc {
		height: 24px;
		padding: 0 7px;
		border-radius: 6px;
		border: 0;
		background: #f7f7f7;
		box-shadow: 0 0 0 1px var(--line);
		font-family: inherit;
		font-size: 10.5px;
		font-weight: 500;
		letter-spacing: 0.03em;
		color: var(--fg2);
	}
	.results {
		overflow-y: auto;
		padding: 8px;
		flex: 1;
	}
	.group + .group {
		margin-top: 6px;
		border-top: 1px solid #f2f2f2;
		padding-top: 8px;
	}
	.group-label {
		margin: 0;
		padding: 6px 8px 4px;
		font-size: 10.5px;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--fg3);
	}
	.result {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		height: 38px;
		padding: 0 9px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		font-family: inherit;
		font-size: 13px;
		color: var(--fg);
		text-align: left;
	}
	.result.active {
		background: #f4f4f4;
	}
	.result-icon {
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border-radius: 6px;
		color: var(--fg2);
		background: #fafafa;
		box-shadow: 0 0 0 1px #efefef;
	}
	.result.active .result-icon {
		background: #fff;
		color: var(--fg);
	}
	.result-label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.result-hint {
		font-size: 11.5px;
		color: var(--fg3);
		font-variant-numeric: tabular-nums;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 36px 16px 40px;
		color: var(--fg3);
	}
	.empty p {
		margin: 8px 0 0;
		font-size: 13.5px;
		color: var(--fg);
		font-weight: 500;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.empty span {
		font-size: 12px;
	}
	.legend {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 10px 14px;
		border-top: 1px solid var(--line);
		background: #fafafa;
		font-size: 11px;
		color: var(--fg2);
	}
	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	kbd {
		font-family: inherit;
		font-size: 10px;
		line-height: 1;
		min-width: 17px;
		height: 17px;
		padding: 0 4px;
		display: inline-grid;
		place-items: center;
		border-radius: 4px;
		background: #fff;
		box-shadow: 0 0 0 1px var(--line);
		color: var(--fg2);
	}
	.brand {
		margin-left: auto;
		color: var(--fg3);
	}
	.dot {
		margin: 0 2px;
	}
	:global(.cp-sr-only) {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	@media (max-width: 520px) {
		:global(.cp-palette) {
			top: 10vh;
			max-height: 78dvh;
		}
		.legend .brand {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.cp-overlay),
		:global(.cp-palette) {
			animation: none !important;
		}
	}
</style>
