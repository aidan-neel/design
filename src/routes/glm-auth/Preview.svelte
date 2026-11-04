<script lang="ts">
	import Icons from './Icons.svelte';

	type Tone = 'good' | 'info' | 'bad' | 'neutral';
	type Row = { client: string; amount: string; status: string; tone: Tone };

	const invoices: Row[] = [
		{ client: 'Harper & Co', amount: '£3,200', status: 'Paid', tone: 'good' },
		{ client: 'Musgrave Studio', amount: '£1,850', status: 'Due Nov 7', tone: 'info' },
		{ client: 'Brill Photo', amount: '£940', status: 'Overdue 12d', tone: 'bad' }
	];

	const queue: Row[] = [
		{ client: 'Harper & Co — INV-2041', amount: '£3,200', status: 'Paid', tone: 'good' },
		{ client: 'Musgrave Studio — INV-2042', amount: '£1,850', status: 'Due Nov 7', tone: 'info' },
		{ client: 'Brill Photo — INV-2039', amount: '£940', status: 'Overdue 12d', tone: 'bad' },
		{ client: 'Kessler Architects — INV-2043', amount: '£2,700', status: 'Sent', tone: 'neutral' }
	];

	const taxes = [
		{ label: 'VAT (20%)', value: '£4,120.40' },
		{ label: 'Corporation tax', value: '£6,730.00' },
		{ label: 'Rainy-day fund', value: '£8,950.00' }
	];

	const bars = [12, 18, 14, 24, 19, 30, 25];

	const captions = [
		'Live totals from your connected bank feeds',
		'Chase late payers without lifting a finger',
		'Set money aside for tax to the penny'
	];

	let slide = $state(0);
	let reminders = $state(true);
	let exported = $state(false);

	function exportCsv() {
		const rows = [
			['Category', 'Set aside (GBP)'],
			...taxes.map((t) => [t.label, t.value.replace('£', '')])
		];
		const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'ledgerline-set-asides-oct-2026.csv';
		a.click();
		setTimeout(() => URL.revokeObjectURL(url), 2000);
		exported = true;
		setTimeout(() => (exported = false), 1600);
	}
</script>

<div class="wrap">
	<div class="window">
		<div class="topbar">
			<span class="tile" aria-hidden="true">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 7.5h12M6 12h8M6 16.5h5" /></svg>
			</span>
			<span class="tname">Ledgerline</span>
			<span class="avatar" aria-hidden="true">SW</span>
		</div>

		<div class="slides">
			<!-- Slide 1: overview -->
			<div class="slide" class:on={slide === 0}>
				<p class="slidetitle">October at a glance</p>
				<div class="kpis">
					<div class="kpi">
						<p class="klbl">Collected</p>
						<div class="kvrow">
							<p class="kval">£48,210</p>
							<span class="pill good">▲ 12.4%</span>
						</div>
					</div>
					<div class="kpi">
						<p class="klbl">Outstanding</p>
						<p class="kval">£9,840</p>
					</div>
				</div>
				<div class="bars" aria-hidden="true">
					{#each bars as h, i (i)}
						<span style:height="{h}px" class:last={i === bars.length - 1}></span>
					{/each}
				</div>
				<div class="rows">
					{#each invoices as r (r.client)}
						<div class="row">
							<span class="rname">{r.client}</span>
							<span class="ramount">{r.amount}</span>
							<span class="pill {r.tone}">{r.status}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Slide 2: invoice queue -->
			<div class="slide" class:on={slide === 1}>
				<p class="slidetitle">Invoice queue</p>
				<div class="rows">
					{#each queue as r (r.client)}
						<div class="row">
							<span class="rname">{r.client}</span>
							<span class="ramount">{r.amount}</span>
							<span class="pill {r.tone}">{r.status}</span>
						</div>
					{/each}
				</div>
				<div class="trow">
					<span class="tlabel">Auto-reminders</span>
					<span class="tstate">{reminders ? 'On' : 'Off'}</span>
					<button
						type="button"
						class="tgl"
						role="switch"
						aria-checked={reminders}
						aria-label="Auto-reminders"
						onclick={() => (reminders = !reminders)}
					>
						<span class="thumb"></span>
					</button>
				</div>
			</div>

			<!-- Slide 3: tax set-asides -->
			<div class="slide" class:on={slide === 2}>
				<p class="slidetitle">Set aside for tax</p>
				<div class="rows">
					{#each taxes as t (t.label)}
						<div class="row tax">
							<span class="rname">{t.label}</span>
							<span class="ramount strong">{t.value}</span>
						</div>
					{/each}
				</div>
				<p class="tnote">Based on transactions to 31 Oct</p>
				<button type="button" class="export" onclick={exportCsv}>
					{#if exported}
						<Icons name="check" size={14} /><span>Saved</span>
					{:else}
						<Icons name="arrow-right" size={14} /><span>Export CSV</span>
					{/if}
				</button>
				<span class="sr" role="status">{exported ? 'Set-asides exported as CSV' : ''}</span>
			</div>
		</div>
	</div>

	<div class="dots" role="group" aria-label="Product preview slides">
		{#each captions as c, i (c)}
			<button type="button" class="dot" class:active={slide === i} aria-label={'Show slide ' + (i + 1) + ': ' + c} aria-current={slide === i} onclick={() => (slide = i)}>
				<span></span>
			</button>
		{/each}
	</div>
	{#key slide}
		<p class="cap">{captions[slide]}</p>
	{/key}

	<p class="trust">
		<Icons name="shield" size={14} />
		<span>SOC 2 Type II · Encrypted at rest and in transit</span>
	</p>
</div>

<style>
	.wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.window {
		width: 380px;
		background: #fff;
		border-radius: 16px;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.06), 0 24px 48px -12px rgb(0 0 0 / 0.12), 0 4px 12px rgb(0 0 0 / 0.04);
		overflow: hidden;
	}

	.topbar {
		height: 44px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 14px;
		border-bottom: 1px solid #ececec;
	}
	.tile {
		width: 22px;
		height: 22px;
		border-radius: 7px;
		background: linear-gradient(135deg, #3b6fe3, #255cd1);
		color: #fff;
		display: grid;
		place-items: center;
		flex-shrink: 0;
	}
	.tile svg {
		width: 14px;
		height: 14px;
	}
	.tname {
		font-size: 12px;
		font-weight: 600;
		letter-spacing: -0.01em;
	}
	.avatar {
		margin-left: auto;
		width: 22px;
		height: 22px;
		border-radius: 999px;
		background: #fff4e5;
		color: #b45309;
		font-size: 9px;
		font-weight: 600;
		display: grid;
		place-items: center;
		letter-spacing: 0.02em;
	}

	.slides {
		display: grid;
		padding: 14px;
		min-height: 262px;
	}
	.slide {
		grid-area: 1 / 1;
		opacity: 0;
		transform: translateY(4px);
		transition: opacity 220ms cubic-bezier(0.23, 1, 0.32, 1), transform 220ms cubic-bezier(0.23, 1, 0.32, 1);
		pointer-events: none;
	}
	.slide.on {
		opacity: 1;
		transform: none;
		pointer-events: auto;
	}

	.slidetitle {
		margin: 0 0 10px;
		font-size: 13px;
		font-weight: 500;
	}

	.kpis {
		display: flex;
		gap: 24px;
		margin-bottom: 12px;
	}
	.klbl {
		margin: 0;
		font-size: 12px;
		color: #737373;
	}
	.kvrow {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.kval {
		margin: 2px 0 0;
		font-family: var(--font-mono);
		font-size: 19px;
		font-weight: 500;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}

	.bars {
		display: flex;
		align-items: flex-end;
		gap: 4px;
		height: 30px;
		margin-bottom: 10px;
	}
	.bars span {
		flex: 1;
		border-radius: 3px 3px 1px 1px;
		background: #e9e9e9;
	}
	.bars span.last {
		background: #255cd1;
	}

	.rows {
		display: flex;
		flex-direction: column;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 36px;
	}
	.row + .row,
	.rows .row:first-child {
		border-top: 1px solid #efefef;
	}
	.rname {
		font-size: 13px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ramount {
		margin-left: auto;
		font-size: 13px;
		font-variant-numeric: tabular-nums;
		color: #525252;
		white-space: nowrap;
	}
	.ramount.strong {
		color: #171717;
		font-weight: 500;
	}

	.pill {
		flex-shrink: 0;
		display: inline-flex;
		align-items: center;
		height: 20px;
		padding: 0 7px;
		border-radius: 6px;
		font-size: 11px;
		font-weight: 500;
		white-space: nowrap;
	}
	.pill.good {
		color: #15803d;
		background: #ecfdf3;
		box-shadow: inset 0 0 0 1px #d1fadf;
	}
	.pill.info {
		color: #1d4ed8;
		background: #eef4ff;
		box-shadow: inset 0 0 0 1px #dbe6ff;
	}
	.pill.bad {
		color: #b91c1c;
		background: #fef2f2;
		box-shadow: inset 0 0 0 1px #fde0e0;
	}
	.pill.neutral {
		color: #525252;
		background: #f4f4f4;
		box-shadow: inset 0 0 0 1px #e5e5e5;
	}

	.trow {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid #efefef;
	}
	.tlabel {
		font-size: 13px;
	}
	.tstate {
		font-size: 12px;
		color: #737373;
	}
	.tgl {
		margin-left: auto;
		width: 34px;
		height: 20px;
		border: 0;
		border-radius: 999px;
		background: #d4d4d4;
		padding: 0;
		position: relative;
		transition: background 180ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.tgl[aria-checked='true'] {
		background: #255cd1;
	}
	.tgl:focus-visible {
		outline: 2px solid #255cd1;
		outline-offset: 2px;
	}
	.thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 16px;
		height: 16px;
		border-radius: 999px;
		background: #fff;
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.2);
		transform: translateX(0);
		transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.tgl[aria-checked='true'] .thumb {
		transform: translateX(14px);
	}

	.tnote {
		margin: 10px 0 0;
		font-size: 11px;
		color: #a3a3a3;
	}
	.export {
		margin-top: 12px;
		height: 32px;
		padding: 0 12px;
		min-width: 122px;
		border: 0;
		border-radius: 10px;
		background: linear-gradient(#fff, #f7f7f7);
		box-shadow: 0 1px 2px rgb(40 40 40 / 0.08), 0 0 0 1px #ececec;
		font-size: 13px;
		font-weight: 500;
		color: #171717;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		transition: box-shadow 150ms, transform 150ms cubic-bezier(0.23, 1, 0.32, 1), color 150ms;
	}
	.export:hover {
		box-shadow: 0 1px 2px rgb(40 40 40 / 0.08), 0 0 0 1px #e0e0e0;
	}
	.export:active {
		transform: scale(0.97);
	}
	.export:focus-visible {
		outline: 2px solid #255cd1;
		outline-offset: 2px;
	}
	.export :global(svg) {
		color: #737373;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	.dots {
		display: flex;
		gap: 4px;
	}
	.dot {
		width: 20px;
		height: 20px;
		border: 0;
		background: transparent;
		display: grid;
		place-items: center;
		padding: 0;
		border-radius: 999px;
	}
	.dot span {
		width: 8px;
		height: 8px;
		border-radius: 999px;
		background: #d4d4d4;
		transition: width 250ms cubic-bezier(0.23, 1, 0.32, 1), background 150ms;
	}
	.dot:hover span {
		background: #a3a3a3;
	}
	.dot.active span,
	.dot.active:hover span {
		width: 20px;
		background: #171717;
	}
	.dot:focus-visible {
		outline: 2px solid #255cd1;
		outline-offset: 1px;
	}

	.cap {
		margin: 0;
		font-size: 12px;
		color: #737373;
		animation: cap-in 220ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	@keyframes cap-in {
		from {
			opacity: 0;
			transform: translateY(3px);
		}
	}

	.trust {
		margin: 4px 0 0;
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: #737373;
	}
	.trust :global(svg) {
		color: #a3a3a3;
	}

	@media (max-width: 1200px) {
		.window {
			width: 344px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.slide,
		.thumb,
		.dot span {
			transition: none;
		}
		.cap {
			animation: none;
		}
	}
</style>
