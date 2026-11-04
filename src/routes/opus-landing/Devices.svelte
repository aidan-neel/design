<script lang="ts">
	import { fade } from 'svelte/transition';
	import { DEVICE_CATEGORIES, DEVICES, type DeviceCategory, type DeviceStatus } from './data';
	import Icon from './Icon.svelte';

	let { onAsk }: { onAsk: (device: string) => void } = $props();

	const STATUS: Record<DeviceStatus, { label: string; tone: string }> = {
		supported: { label: 'Supported', tone: 'tag-accent' },
		beta: { label: 'Beta', tone: 'tag-warning' },
		planned: { label: 'Planned 2027', tone: 'tag-neutral' }
	};

	let query = $state('');
	let searchInput = $state<HTMLInputElement>();
	let category = $state<DeviceCategory | 'All'>('All');

	const normalizedQuery = $derived(query.trim().toLowerCase());
	const inCategory = $derived(
		DEVICES.filter((device) => category === 'All' || device.category === category)
	);
	const results = $derived(
		inCategory.filter(
			(device) =>
				normalizedQuery === '' ||
				device.name.toLowerCase().includes(normalizedQuery) ||
				device.protocol.toLowerCase().includes(normalizedQuery)
		)
	);

	function countFor(option: DeviceCategory | 'All'): number {
		return DEVICES.filter((device) => option === 'All' || device.category === option).length;
	}

	function clearSearch() {
		query = '';
		searchInput?.focus();
	}
</script>

<section class="section" id="ebb-devices" tabindex="-1" aria-labelledby="devices-title">
	<div class="container">
		<div class="head">
			<div>
				<h2 class="h2" id="devices-title">Check what it can run</h2>
				<p class="lede">
					Ebb works through open standards, so it supports kinds of devices rather than a list of
					brands. Search for your charger, heat pump or plug.
				</p>
			</div>
			<label class="search">
				<Icon name="search" size={16} />
				<span class="sr-only">Search devices</span>
				<input
					bind:this={searchInput}
					bind:value={query}
					type="search"
					placeholder="OCPP, heat pump, Matter…"
					autocomplete="off"
					spellcheck="false"
				/>
				{#if query}
					<button type="button" class="clear" aria-label="Clear search" onclick={clearSearch}>
						<Icon name="x" size={14} />
					</button>
				{/if}
			</label>
		</div>

		<div class="filters" role="group" aria-label="Filter by category">
			{#each ['All' as const, ...DEVICE_CATEGORIES] as option (option)}
				<button
					type="button"
					class="filter"
					aria-pressed={category === option}
					onclick={() => (category = option)}
				>
					{option}
					<span class="num count">{countFor(option)}</span>
				</button>
			{/each}
		</div>

		<div class="panel">
			<p class="result-count" aria-live="polite">
				{results.length} of {inCategory.length} device types{category === 'All' ? '' : ` in ${category.toLowerCase()}`}
			</p>
			{#if results.length > 0}
				<ul class="list">
					{#each results as device (device.name)}
						<li in:fade={{ duration: 150 }}>
							<span class="name">{device.name}</span>
							<span class="protocol num">{device.protocol}</span>
							<span class="tag {STATUS[device.status].tone}">{STATUS[device.status].label}</span>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="empty">
					<p class="empty-title">No match for “{query.trim()}”.</p>
					<p class="empty-body">
						Tell us what you have when you reserve a hub, and we’ll email you when it works.
					</p>
					<button type="button" class="btn btn-secondary btn-sm" onclick={() => onAsk(query.trim())}>
						Ask about this device
						<Icon name="arrow-right" size={14} />
					</button>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 24px;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		max-width: 360px;
		height: 44px;
		padding: 0 6px 0 14px;
		border-radius: 12px;
		background: var(--bg);
		box-shadow: var(--shadow-btn);
		color: var(--fg-3);
		transition: box-shadow 150ms var(--ease-out);
	}
	.search:focus-within {
		box-shadow:
			0 0 0 1px var(--accent),
			0 0 0 4px var(--ring);
	}
	.search input {
		flex: 1;
		min-width: 0;
		height: 100%;
		border: 0;
		background: transparent;
		color: var(--fg);
		font: 400 16px var(--font);
		outline: none;
	}
	@media (min-width: 768px) {
		.search input {
			font-size: 15px;
		}
	}
	.search input::placeholder {
		color: var(--fg-3);
	}
	.search input::-webkit-search-cancel-button {
		display: none;
	}
	.clear {
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: var(--fg-2);
	}
	@media (hover: hover) {
		.clear:hover {
			background: rgb(0 0 0 / 0.05);
		}
	}
	.clear:focus-visible {
		outline-offset: -2px;
	}

	.filters {
		display: flex;
		gap: 8px;
		margin-top: 32px;
		overflow-x: auto;
		margin-inline: calc(var(--gutter) * -1);
		padding: 2px var(--gutter);
	}
	.filter {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: 8px;
		height: 36px;
		padding: 0 12px;
		border: 0;
		border-radius: 999px;
		background: transparent;
		box-shadow: inset 0 0 0 1px #e2e2e2;
		color: var(--fg-2);
		font: 500 14px/1 var(--font);
		transition:
			background-color 150ms var(--ease-out),
			color 150ms var(--ease-out),
			transform 150ms var(--ease-out);
	}
	.filter:active {
		transform: scale(0.97);
	}
	.filter[aria-pressed='true'] {
		background: var(--ink);
		box-shadow: none;
		color: #fff;
	}
	@media (hover: hover) {
		.filter[aria-pressed='false']:hover {
			color: var(--fg);
		}
	}
	.count {
		color: var(--fg-3);
		font-size: 12px;
	}
	.filter[aria-pressed='true'] .count {
		color: rgb(255 255 255 / 0.55);
	}

	.panel {
		margin-top: 16px;
		padding: 8px 20px 12px;
		border-radius: 24px;
		background: var(--bg);
		box-shadow: var(--shadow-card);
	}
	@media (min-width: 768px) {
		.panel {
			padding: 12px 28px 16px;
		}
	}
	.result-count {
		margin: 0;
		padding: 12px 0;
		color: var(--fg-2);
		font-size: 13px;
	}
	.list {
		display: grid;
		margin: 0;
		padding: 0;
		list-style: none;
		column-gap: 48px;
	}
	@media (min-width: 900px) {
		.list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	.list li {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-areas: 'name tag' 'protocol tag';
		align-items: center;
		column-gap: 16px;
		min-height: 60px;
		padding: 10px 0;
		border-top: 1px solid var(--border);
	}
	.name {
		grid-area: name;
		font-size: 14px;
		font-weight: 500;
	}
	.protocol {
		grid-area: protocol;
		color: var(--fg-2);
		font-size: 12px;
	}
	.list .tag {
		grid-area: tag;
	}

	.empty {
		display: grid;
		justify-items: start;
		gap: 4px;
		padding: 24px 0 16px;
		border-top: 1px solid var(--border);
	}
	.empty-title {
		margin: 0;
		font-weight: 500;
	}
	.empty-body {
		margin: 0 0 12px;
		color: var(--fg-2);
		font-size: 14px;
	}
</style>
