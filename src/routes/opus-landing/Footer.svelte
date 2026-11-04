<script lang="ts">
	import { Select } from 'bits-ui';
	import CopyEmail from './CopyEmail.svelte';
	import { CHANGELOG } from './data';
	import Icon from './Icon.svelte';
	import InfoDialog from './InfoDialog.svelte';
	import Logo from './Logo.svelte';
	import { REGIONS, useRegion, type RegionCode } from './region.svelte';
	import { SECTIONS, scrollToSection, type SectionId } from './sections';
	import Tip from './Tip.svelte';
	import { useToaster } from './toasts.svelte';

	const region = useRegion();
	const toaster = useToaster();

	const regionItems = (Object.keys(REGIONS) as RegionCode[]).map((code) => ({
		value: code,
		label: REGIONS[code].label
	}));

	function go(event: MouseEvent, id: SectionId) {
		event.preventDefault();
		scrollToSection(id);
	}

	function changeRegion(code: string) {
		const next = regionItems.find((item) => item.value === code);
		if (!next) return;
		region.code = next.value;
		toaster.show(`Prices now in ${REGIONS[next.value].currency}`, { tone: 'neutral' });
	}
</script>

<footer class="footer">
	<div class="container">
		<div class="top">
			<div class="brand">
				<Logo size="lg" />
				<p>A hub and an app that run your home on the cheapest, cleanest hours of the grid.</p>
			</div>

			<nav class="columns" aria-label="Footer">
				<div>
					<h2>Product</h2>
					<ul>
						{#each SECTIONS as section (section.id)}
							<li>
								<a class="footer-link" href="#{section.id}" onclick={(event) => go(event, section.id)}>
									{section.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
				<div>
					<h2>Company</h2>
					<ul>
						<li>
							<InfoDialog trigger="Changelog" title="Changelog" description="What changed in the Ebb app and hub firmware.">
								<ol class="changelog">
									{#each CHANGELOG as entry (entry.title)}
										<li>
											<span class="changelog-date num">{entry.date}</span>
											<span class="changelog-title">{entry.title}</span>
											<span class="changelog-body">{entry.body}</span>
										</li>
									{/each}
								</ol>
							</InfoDialog>
						</li>
						<li>
							<a class="footer-link" href="#reserve" onclick={(event) => go(event, 'reserve')}>Reserve a hub</a>
						</li>
						<li class="contact"><CopyEmail /></li>
					</ul>
				</div>
				<div>
					<h2>Legal</h2>
					<ul>
						<li>
							<InfoDialog trigger="Privacy" title="Privacy" description="Short version: your usage stays in your home.">
								<p>
									The hub stores your half-hourly usage, device states and plans locally for 13
									months. We receive only the prices and carbon forecasts it downloads, plus crash
									reports if you turn them on.
								</p>
								<p>
									Cloud backup is off by default. When you turn it on, backups are encrypted with a
									key that never leaves your hub. You can export or delete everything from the app.
								</p>
							</InfoDialog>
						</li>
						<li>
							<InfoDialog trigger="Terms" title="Reservation terms" description="What reserving a hub means.">
								<p>
									Reserving holds one hub from the first production batch. We don’t take payment
									until your hub is ready to ship, and we email you first.
								</p>
								<p>
									You can cancel at any time before it ships by replying to any of our emails. After
									it arrives you have 30 days to return it for a full refund.
								</p>
							</InfoDialog>
						</li>
					</ul>
				</div>
			</nav>
		</div>

		<div class="bottom">
			<p class="legal">© 2026 Ebb Energy, Inc. Prices and plans on this page are sample data.</p>
			<div class="bottom-actions">
				<Select.Root type="single" value={region.code} onValueChange={changeRegion} items={regionItems}>
					<Select.Trigger class="region-trigger" aria-label="Region and currency">
						<Icon name="globe" size={16} />
						{region.info.label} · {region.info.currency}
						<Icon name="chevron-down" size={14} />
					</Select.Trigger>
					<Select.Portal to=".ebb">
						<Select.Content class="ebb-pop region-content" side="top" sideOffset={8} align="end">
							<Select.Viewport>
								{#each regionItems as item (item.value)}
									<Select.Item value={item.value} label={item.label} class="region-item">
										{#snippet children({ selected })}
											<span>{item.label}</span>
											<span class="region-currency num">{REGIONS[item.value].currency}</span>
											<span class="region-check" class:is-selected={selected}>
												<Icon name="check" size={14} />
											</span>
										{/snippet}
									</Select.Item>
								{/each}
							</Select.Viewport>
						</Select.Content>
					</Select.Portal>
				</Select.Root>

				<Tip label="Back to top">
					{#snippet children(props)}
						<button
							{...props}
							type="button"
							class="icon-btn top-button"
							aria-label="Back to top"
							onclick={(event) => go(event, 'top')}
						>
							<Icon name="arrow-up" size={18} />
						</button>
					{/snippet}
				</Tip>
			</div>
		</div>
	</div>

	<div class="wordmark" aria-hidden="true">ebb</div>
</footer>

<style>
	.footer {
		overflow: hidden;
		padding-top: 80px;
		background: var(--bg);
		box-shadow: 0 -1px 0 var(--border);
	}
	.top {
		display: grid;
		gap: 48px;
	}
	@media (min-width: 900px) {
		.top {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
		}
	}
	.brand p {
		max-width: 320px;
		margin: 16px 0 0;
		color: var(--fg-2);
		font-size: 14px;
	}

	.columns {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 32px 24px;
	}
	@media (min-width: 640px) {
		.columns {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	h2 {
		margin: 0 0 12px;
		color: var(--fg-2);
		font-size: 13px;
		font-weight: 500;
	}
	ul {
		display: grid;
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	:global(.ebb .footer-link) {
		display: inline-flex;
		align-items: center;
		height: 40px;
		padding: 0;
		border: 0;
		border-radius: 6px;
		background: none;
		color: var(--fg);
		font: 400 14px/1 var(--font);
		text-decoration: none;
		transition: color 120ms var(--ease-out);
	}
	@media (min-width: 768px) {
		:global(.ebb .footer-link) {
			height: 32px;
		}
	}
	@media (hover: hover) {
		:global(.ebb .footer-link:hover) {
			color: var(--accent);
		}
	}
	.contact :global(.copy) {
		font-weight: 400;
	}

	.changelog {
		display: grid;
		gap: 20px;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.changelog li {
		display: grid;
		gap: 2px;
	}
	.changelog-date {
		color: var(--fg-2);
		font-size: 12px;
	}
	.changelog-title {
		font-weight: 500;
	}
	.changelog-body {
		color: var(--fg-2);
	}
	:global(.ebb .info-body) p {
		margin: 0 0 12px;
		color: var(--fg-2);
	}

	.bottom {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-top: 64px;
		padding-top: 24px;
		border-top: 1px solid var(--border);
	}
	.legal {
		margin: 0;
		color: var(--fg-2);
		font-size: 13px;
	}
	.bottom-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	:global(.ebb .region-trigger) {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 36px;
		padding: 0 10px 0 12px;
		border: 0;
		border-radius: 10px;
		background: linear-gradient(#fff, #f7f7f7);
		box-shadow: var(--shadow-btn);
		color: var(--fg);
		font: 500 13px/1 var(--font);
		white-space: nowrap;
		transition: transform 150ms var(--ease-out);
	}
	:global(.ebb .region-trigger:active) {
		transform: scale(0.97);
	}
	:global(.ebb .region-trigger svg) {
		color: var(--fg-2);
	}
	:global(.ebb .region-content) {
		z-index: 60;
		min-width: 220px;
		padding: 4px;
		border-radius: 12px;
		background: var(--bg);
		box-shadow: var(--shadow-pop);
		outline: none;
	}
	:global(.ebb .region-item) {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto 16px;
		align-items: center;
		gap: 12px;
		height: 36px;
		padding: 0 10px;
		border-radius: 8px;
		font-size: 14px;
		outline: none;
	}
	:global(.ebb .region-item[data-highlighted]) {
		background: #f4f4f4;
	}
	.region-currency {
		color: var(--fg-2);
		font-size: 12px;
	}
	.region-check {
		display: grid;
		color: var(--accent);
		opacity: 0;
	}
	.region-check.is-selected {
		opacity: 1;
	}
	.top-button {
		box-shadow: var(--shadow-btn);
		background: linear-gradient(#fff, #f7f7f7);
	}

	.wordmark {
		margin: 48px 0 -0.22em;
		color: #f2f2f2;
		font-size: clamp(160px, 34vw, 480px);
		font-weight: 500;
		letter-spacing: -0.07em;
		line-height: 0.8;
		text-align: center;
		user-select: none;
	}
</style>
