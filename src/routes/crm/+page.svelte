<script lang="ts">
	import '@fontsource-variable/inter';
	import CopyButton from '#lib/kit/CopyButton.svelte';
	import FieldError from '#lib/kit/FieldError.svelte';
	import IconButton from '#lib/kit/IconButton.svelte';
	import KitRoot from '#lib/kit/KitRoot.svelte';
	import MenuContent from '#lib/kit/MenuContent.svelte';
	import MenuItem from '#lib/kit/MenuItem.svelte';
	import MenuRadioItem from '#lib/kit/MenuRadioItem.svelte';
	import Sidebar from '#lib/kit/Sidebar.svelte';
	import Tip from '#lib/kit/Tip.svelte';
	import { Dialog, DropdownMenu } from 'bits-ui';
	import { onDestroy, tick } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import FilterSelect from './FilterSelect.svelte';
	import {
		STAGE_META,
		PIPELINE_STAGES,
		WEIGHT,
		STAGE_OPTIONS,
		OWNER_OPTIONS,
		RANGE_OPTIONS,
		seedDeals,
		money,
		shortDate,
		noteWhen,
		inRange,
		isOpen,
		type Deal,
		type Stage,
		type View
	} from './data';

	let deals = $state<Deal[]>(seedDeals.map((d) => ({ ...d, notes: [...d.notes] })));
	let view = $state<View>('deals');
	let query = $state('');
	let stageFilter = $state('open');
	let ownerFilter = $state('all');
	let rangeFilter = $state('all');
	let selectedId = $state<string>('d1');
	let navOpen = $state(false);
	let sheetOpen = $state(false);
	let newOpen = $state(false);
	let toast = $state<{ id: number; text: string; undo?: () => void } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	let toastSeq = 0;
	let railed = $state(false);
	let workspace = $state('hale');
	let submitted = $state(false);
	let noteDraft = $state('');
	let searchEl: HTMLInputElement | undefined = $state();
	let navList: HTMLElement | undefined = $state();
	let pillY = $state(30);

	let draftName = $state('');
	let draftCompany = $state('');
	let draftAmount = $state('');
	let draftStage = $state<string>('lead');
	let draftClose = $state('2026-11-28');
	let creating = $state(false);

	const WORKSPACES = [
		{ id: 'hale', name: 'Hale Provisions', meta: '4 seats' },
		{ id: 'pike', name: 'Pike Street Pantry', meta: '2 seats' }
	];
	const workspaceName = $derived(WORKSPACES.find((w) => w.id === workspace)?.name ?? WORKSPACES[0].name);

	const draftErrors = $derived.by(() => {
		if (!submitted) return { name: null, company: null, amount: null };
		const amount = Number(draftAmount.replace(/[^0-9.]/g, ''));
		return {
			name: draftName.trim() ? null : 'Give the deal a name.',
			company: draftCompany.trim() ? null : 'Add the company it’s with.',
			amount: Number.isFinite(amount) && amount > 0 ? null : 'Enter an amount above $0.'
		};
	});
	const draftValid = $derived(!draftErrors.name && !draftErrors.company && !draftErrors.amount);

	const STAGE_ORDER: Stage[] = [...PIPELINE_STAGES, 'won', 'lost'];

	function toStage(value: string): Stage | undefined {
		return STAGE_ORDER.find((stage) => stage === value);
	}

	const NAV: { id: View; label: string }[] = [
		{ id: 'pipeline', label: 'Pipeline' },
		{ id: 'deals', label: 'Deals' },
		{ id: 'people', label: 'People' },
		{ id: 'companies', label: 'Companies' }
	];

	const titles: Record<View, string> = {
		pipeline: 'Pipeline',
		deals: 'Deals',
		people: 'People',
		companies: 'Companies'
	};

	const openDeals = $derived(deals.filter((d) => isOpen(d.stage)));
	const filtered = $derived(
		deals.filter((d) => {
			const q = query.trim().toLowerCase();
			if (q) {
				const blob = `${d.name} ${d.company} ${d.contact} ${d.owner}`.toLowerCase();
				if (!blob.includes(q)) return false;
			}
			if (stageFilter === 'open' && !isOpen(d.stage)) return false;
			if (stageFilter !== 'open' && stageFilter !== 'all' && d.stage !== stageFilter) return false;
			if (ownerFilter !== 'all' && d.owner !== ownerFilter) return false;
			if (!inRange(d.close, rangeFilter)) return false;
			return true;
		})
	);

	const activeId = $derived(
		filtered.some((d) => d.id === selectedId) ? selectedId : (filtered[0]?.id ?? '')
	);
	const selected = $derived(deals.find((d) => d.id === activeId) ?? null);

	const kpis = $derived.by(() => {
		const open = deals.filter((d) => isOpen(d.stage));
		const openSum = open.reduce((s, d) => s + d.amount, 0);
		const weighted = open.reduce((s, d) => s + d.amount * WEIGHT[d.stage], 0);
		const closingNov = open.filter((d) => d.close.startsWith('2026-11')).length;
		const won = deals.filter((d) => d.stage === 'won');
		const lost = deals.filter((d) => d.stage === 'lost');
		const decided = won.length + lost.length;
		const rate = decided === 0 ? 0 : Math.round((won.length / decided) * 100);
		return { openSum, openCount: open.length, weighted, closingNov, rate, won: won.length };
	});

	const people = $derived.by(() => {
		const map = new Map<
			string,
			{ name: string; email: string; phone: string; company: string; open: number; value: number }
		>();
		for (const d of deals) {
			const cur = map.get(d.email) ?? {
				name: d.contact,
				email: d.email,
				phone: d.phone,
				company: d.company,
				open: 0,
				value: 0
			};
			if (isOpen(d.stage)) {
				cur.open += 1;
				cur.value += d.amount;
			}
			map.set(d.email, cur);
		}
		return [...map.values()]
			.filter((p) => {
				const q = query.trim().toLowerCase();
				if (!q) return true;
				return `${p.name} ${p.company} ${p.email}`.toLowerCase().includes(q);
			})
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	const companies = $derived.by(() => {
		const map = new Map<string, { name: string; contact: string; open: number; value: number }>();
		for (const d of deals) {
			const cur = map.get(d.company) ?? { name: d.company, contact: d.contact, open: 0, value: 0 };
			if (isOpen(d.stage)) {
				cur.open += 1;
				cur.value += d.amount;
			}
			map.set(d.company, cur);
		}
		return [...map.values()]
			.filter((c) => {
				const q = query.trim().toLowerCase();
				if (!q) return true;
				return `${c.name} ${c.contact}`.toLowerCase().includes(q);
			})
			.sort((a, b) => b.value - a.value);
	});

	const columnDeals = $derived(
		PIPELINE_STAGES.map((stage) => ({
			stage,
			items: deals.filter((d) => d.stage === stage && (ownerFilter === 'all' || d.owner === ownerFilter))
		}))
	);

	$effect(() => {
		view;
		navList;
		void tick().then(() => {
			const el = navList?.querySelector<HTMLElement>(`[data-view="${view}"]`);
			if (el) pillY = el.offsetTop;
		});
	});

	$effect(() => {
		function onKey(e: KeyboardEvent) {
			const t = e.target as HTMLElement | null;
			const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
			if (e.key === '/' && !typing) {
				e.preventDefault();
				searchEl?.focus();
			}
			if (e.key === 'Escape' && navOpen) navOpen = false;
			if (!typing && view === 'deals' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
				onGridKey(e);
			}
		}
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	});

	function showToast(text: string, undo?: () => void) {
		clearTimeout(toastTimer);
		toast = { id: toastSeq++, text, undo };
		toastTimer = setTimeout(() => (toast = null), undo ? 5000 : 3200);
	}

	onDestroy(() => clearTimeout(toastTimer));

	function setView(next: View) {
		view = next;
		navOpen = false;
		sheetOpen = false;
	}

	function pickDeal(id: string) {
		selectedId = id;
		sheetOpen = true;
		if (view !== 'deals' && view !== 'pipeline') view = 'deals';
	}

	function setStage(id: string, stage: Stage) {
		const previous = deals.find((d) => d.id === id)?.stage;
		if (!previous || previous === stage) return;
		deals = deals.map((d) => (d.id === id ? { ...d, stage } : d));
		showToast(`Moved to ${STAGE_META[stage].label}`, () => {
			deals = deals.map((d) => (d.id === id ? { ...d, stage: previous } : d));
		});
	}

	function deleteDeal(id: string) {
		const index = deals.findIndex((d) => d.id === id);
		if (index === -1) return;
		const removed = deals[index];
		deals = deals.filter((d) => d.id !== id);
		showToast(`Deleted “${removed.name}”`, () => {
			deals = [...deals.slice(0, index), removed, ...deals.slice(index)];
			selectedId = removed.id;
		});
	}

	function logNote() {
		const text = noteDraft.trim();
		if (!text || !selected) return;
		const note = {
			id: `n-${Date.now()}`,
			at: new Date().toISOString(),
			who: 'Maya Chen',
			text
		};
		deals = deals.map((d) => (d.id === selected.id ? { ...d, notes: [note, ...d.notes] } : d));
		noteDraft = '';
		showToast('Note added');
	}

	function createDeal(e: SubmitEvent) {
		e.preventDefault();
		submitted = true;
		if (!draftValid) {
			const firstInvalid = (e.currentTarget as HTMLFormElement).querySelector<HTMLInputElement>('[aria-invalid="true"]');
			firstInvalid?.focus();
			return;
		}
		const name = draftName.trim();
		const company = draftCompany.trim();
		const amount = Number(draftAmount.replace(/[^0-9.]/g, ''));
		creating = true;
		const id = `d-${Date.now()}`;
		const deal: Deal = {
			id,
			name,
			company,
			contact: 'New contact',
			email: 'hello@' + company.toLowerCase().replace(/[^a-z0-9]+/g, '') + '.com',
			phone: '206-555-0100',
			stage: (draftStage as Stage) || 'lead',
			amount,
			close: draftClose || '2026-11-28',
			owner: 'Maya Chen',
			ownerInitials: 'MC',
			next: 'Set a next step',
			notes: []
		};
		setTimeout(() => {
			deals = [deal, ...deals];
			selectedId = id;
			view = 'deals';
			stageFilter = 'open';
			newOpen = false;
			creating = false;
			submitted = false;
			draftName = '';
			draftCompany = '';
			draftAmount = '';
			draftStage = 'lead';
			showToast('Deal added', () => {
				deals = deals.filter((d) => d.id !== id);
			});
		}, 420);
	}

	function undoToast() {
		toast?.undo?.();
		clearTimeout(toastTimer);
		toast = null;
	}

	function onGridKey(e: KeyboardEvent) {
		if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
		e.preventDefault();
		const i = filtered.findIndex((d) => d.id === activeId);
		const next = e.key === 'ArrowDown' ? Math.min(filtered.length - 1, i + 1) : Math.max(0, i - 1);
		const row = filtered[next];
		if (row) selectedId = row.id;
	}

	async function copyEmail(email: string) {
		try {
			await navigator.clipboard.writeText(email);
			showToast(`Copied ${email}`);
		} catch (error) {
			console.error('Clipboard write was refused', error);
			showToast('Couldn’t copy. Check clipboard permissions.');
		}
	}

	function clearSearch() {
		query = '';
		searchEl?.focus();
	}
</script>

<svelte:head>
	<title>{titles[view]} · Folio</title>
	<meta name="description" content="Folio CRM for Hale Provisions." />
</svelte:head>

<KitRoot class="folio-kit">
	<div class="folio">
		<a class="skip" href="#main">Skip to deals</a>

		<Sidebar bind:collapsed={railed} defaultWidth={212} minWidth={184} maxWidth={320} collapsedWidth={56} class="side-col">
			{#snippet children({ collapsed })}
				<aside class="sidebar" class:open={navOpen} class:rail={collapsed} id="nav">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="brand">
							<span class="mark" aria-hidden="true">
								<svg viewBox="0 0 24 24" fill="none">
									<path d="M6 5.5h9.5A3.5 3.5 0 0 1 19 9v10.5H8.5A2.5 2.5 0 0 1 6 17V5.5Z" stroke="#10344f" stroke-width="1.7" />
									<path d="M6 5.5A2.5 2.5 0 0 1 8.5 3H16" stroke="#10344f" stroke-width="1.7" stroke-linecap="round" />
									<path d="M9 10h6M9 13.5h4" stroke="#10344f" stroke-width="1.7" stroke-linecap="round" />
								</svg>
							</span>
							<span class="brand-copy fades">
								<span class="product">Folio</span>
								<span class="ws">{workspaceName}</span>
							</span>
							<svg class="brand-chev fades" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 15 5 5 5-5M7 9l5-5 5 5" /></svg>
						</DropdownMenu.Trigger>
						<MenuContent minWidth={220}>
							<DropdownMenu.Group>
								<DropdownMenu.GroupHeading class="kit-menu-label">Workspaces</DropdownMenu.GroupHeading>
								<DropdownMenu.RadioGroup bind:value={workspace}>
									{#each WORKSPACES as w (w.id)}
										<MenuRadioItem value={w.id} meta={w.meta}>{w.name}</MenuRadioItem>
									{/each}
								</DropdownMenu.RadioGroup>
							</DropdownMenu.Group>
							<DropdownMenu.Separator class="kit-menu-sep" />
							<MenuItem onSelect={() => showToast('Invite link copied')}>Invite teammates</MenuItem>
							<MenuItem onSelect={() => showToast('Settings are read-only in this demo')}>Workspace settings</MenuItem>
						</MenuContent>
					</DropdownMenu.Root>

					<nav class="nav" bind:this={navList} aria-label="Workspace">
						<span class="pill" style="transform: translateY({pillY}px)" aria-hidden="true"></span>
						{#each NAV as item (item.id)}
							<Tip label={item.label} side="right" disabled={!collapsed}>
								{#snippet trigger({ props })}
									<button
										{...props}
										type="button"
										class="nav-btn"
										class:on={view === item.id}
										data-view={item.id}
										aria-current={view === item.id ? 'page' : undefined}
										aria-label={collapsed ? item.label : undefined}
										onclick={() => setView(item.id)}
									>
										{#if item.id === 'pipeline'}
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
												<rect x="3.5" y="4.5" width="5" height="15" rx="1.4" />
												<rect x="9.5" y="8.5" width="5" height="11" rx="1.4" />
												<rect x="15.5" y="6.5" width="5" height="13" rx="1.4" />
											</svg>
										{:else if item.id === 'deals'}
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
												<path d="M8 6h11M8 12h11M8 18h11" />
												<circle cx="4.5" cy="6" r="1" fill="currentColor" stroke="none" />
												<circle cx="4.5" cy="12" r="1" fill="currentColor" stroke="none" />
												<circle cx="4.5" cy="18" r="1" fill="currentColor" stroke="none" />
											</svg>
										{:else if item.id === 'people'}
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
												<circle cx="12" cy="8" r="3" />
												<path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
											</svg>
										{:else}
											<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
												<path d="M4.5 19.5V9.2L12 4.5l7.5 4.7v10.3" />
												<path d="M9.5 19.5v-6h5v6" />
											</svg>
										{/if}
										<span class="fades">{item.label}</span>
										{#if item.id === 'deals'}
											<span class="count fades">{openDeals.length}</span>
										{/if}
									</button>
								{/snippet}
							</Tip>
						{/each}
					</nav>

					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="who">
							<span class="ava">MC</span>
							<span class="who-copy fades">
								<span class="who-name">Maya Chen</span>
								<span class="who-mail">maya@haleprovisions.com</span>
							</span>
						</DropdownMenu.Trigger>
						<MenuContent side="top" minWidth={220}>
							<MenuItem onSelect={() => showToast('Profile is read-only in this demo')}>Profile</MenuItem>
							<MenuItem onSelect={() => (railed = !railed)} keys={['⌘', 'B']}>{railed ? 'Expand sidebar' : 'Collapse sidebar'}</MenuItem>
							<DropdownMenu.Separator class="kit-menu-sep" />
							<MenuItem onSelect={() => showToast('Signed out (not really, it’s a demo)')}>Sign out</MenuItem>
						</MenuContent>
					</DropdownMenu.Root>
				</aside>
			{/snippet}
		</Sidebar>

		{#if navOpen}
			<button type="button" class="scrim" aria-label="Close menu" onclick={() => (navOpen = false)}></button>
		{/if}

		<div class="desk">
			<header class="top">
				<button type="button" class="icon-btn menu-btn" aria-label="Open menu" aria-controls="nav" aria-expanded={navOpen} onclick={() => (navOpen = true)}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
						<path d="M5 7h14M5 12h14M5 17h14" />
					</svg>
				</button>
				<IconButton label={railed ? 'Expand sidebar' : 'Collapse sidebar'} keys={['⌘', 'B']} side="bottom" class="rail-toggle" onclick={() => (railed = !railed)}>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<rect x="3" y="3" width="18" height="18" rx="3" />
						<path d="M9 3v18" />
					</svg>
				</IconButton>
				<div class="title-block">
					<h1 id="main">{titles[view]}</h1>
					<p class="lede">
						{kpis.openCount} open · {money(kpis.openSum)}
					</p>
				</div>
				<label class="search">
					<span class="sr">Search</span>
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<circle cx="11" cy="11" r="6.5" />
						<path d="m16 16 4 4" stroke-linecap="round" />
					</svg>
					<input
						bind:this={searchEl}
						bind:value={query}
						type="search"
						placeholder={view === 'people' ? 'Find a person' : view === 'companies' ? 'Find a company' : 'Find a deal'}
						autocomplete="off"
					/>
					<kbd>/</kbd>
				</label>
				<button type="button" class="btn btn-primary new-deal" aria-label="New deal" onclick={() => (newOpen = true)}>
					<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
						<path d="M8 3.2v9.6M3.2 8h9.6" />
					</svg>
					<span class="new-label">New deal</span>
				</button>
			</header>

			<section class="kpis" aria-label="Pipeline snapshot">
				<div class="kpi">
					<p class="kpi-l">Open</p>
					<p class="kpi-n">{money(kpis.openSum)}</p>
					<p class="kpi-m">{kpis.openCount} deals</p>
				</div>
				<div class="kpi">
					<p class="kpi-l">Weighted</p>
					<p class="kpi-n">{money(kpis.weighted)}</p>
					<p class="kpi-m">by stage chance</p>
				</div>
				<div class="kpi">
					<p class="kpi-l">Closing Nov</p>
					<p class="kpi-n">{kpis.closingNov}</p>
					<p class="kpi-m">this month</p>
				</div>
				<div class="kpi">
					<p class="kpi-l">Win rate</p>
					<p class="kpi-n">{kpis.rate}%</p>
					<p class="kpi-m">{kpis.won} won this season</p>
				</div>
			</section>

			{#if view === 'deals'}
				<div class="tools">
					<FilterSelect bind:value={stageFilter} options={STAGE_OPTIONS} label="Stage" />
					<FilterSelect bind:value={ownerFilter} options={OWNER_OPTIONS} label="Owner" />
					<FilterSelect bind:value={rangeFilter} options={RANGE_OPTIONS} label="Close" />
					<p class="shown" role="status">{filtered.length} shown</p>
				</div>

				<div class="split">
					<div class="table-wrap">
						{#if filtered.length === 0}
							<div class="empty">
								<p>No deals match{query ? ` “${query}”` : ''}.</p>
								<button type="button" class="btn btn-secondary" onclick={clearSearch}>Clear search</button>
							</div>
						{:else}
							<table class="ledger deals-ledger">
								<colgroup>
									<col class="c-deal" />
									<col class="c-stage" />
									<col class="c-owner" />
									<col class="c-close" />
									<col class="c-amount" />
									<col class="c-act" />
								</colgroup>
								<thead>
									<tr>
										<th>Deal</th>
										<th>Stage</th>
										<th>Owner</th>
										<th>Close</th>
										<th class="num">Amount</th>
										<th><span class="sr">Actions</span></th>
									</tr>
								</thead>
								<tbody>
									{#each filtered as d (d.id)}
										<tr
											class:sel={d.id === activeId}
											aria-selected={d.id === activeId}
											onclick={() => pickDeal(d.id)}
										>
											<td>
												<p class="deal-name" title={d.name}>{d.name}</p>
												<p class="deal-sub">{d.company} · {d.contact}</p>
											</td>
											<td><span class="tag {STAGE_META[d.stage].tone}">{STAGE_META[d.stage].label}</span></td>
											<td>
												<span class="owner">
													<span class="dot">{d.ownerInitials}</span>
													{d.owner.split(' ')[0]}
												</span>
											</td>
											<td class="tab">{shortDate(d.close)}</td>
											<td class="num tab">{money(d.amount)}</td>
											<td class="act">
												<DropdownMenu.Root>
													<DropdownMenu.Trigger class="icon-btn row-act" aria-label="Actions for {d.name}" onclick={(e) => e.stopPropagation()}>
														<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
															<circle cx="3.5" cy="8" r="1.15" />
															<circle cx="8" cy="8" r="1.15" />
															<circle cx="12.5" cy="8" r="1.15" />
														</svg>
													</DropdownMenu.Trigger>
													<MenuContent align="end" sideOffset={4} minWidth={184}>
														<MenuItem onSelect={() => pickDeal(d.id)} keys={['↵']}>Open</MenuItem>
														<MenuItem onSelect={() => copyEmail(d.email)}>Copy email</MenuItem>
														<DropdownMenu.Separator class="kit-menu-sep" />
														<DropdownMenu.Group>
															<DropdownMenu.GroupHeading class="kit-menu-label">Stage</DropdownMenu.GroupHeading>
															<DropdownMenu.RadioGroup value={d.stage} onValueChange={(v) => { const stage = toStage(v); if (stage) setStage(d.id, stage); }}>
																{#each STAGE_ORDER as st (st)}
																	<MenuRadioItem value={st}>{STAGE_META[st].label}</MenuRadioItem>
																{/each}
															</DropdownMenu.RadioGroup>
														</DropdownMenu.Group>
														<DropdownMenu.Separator class="kit-menu-sep" />
														<MenuItem tone="danger" onSelect={() => deleteDeal(d.id)}>Delete deal</MenuItem>
													</MenuContent>
												</DropdownMenu.Root>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						{/if}
					</div>

					<aside class="inspector" class:sheet={sheetOpen} aria-label="Deal details">
						{#if selected}
							<div class="insp-head">
								<IconButton label="Close details" class="sheet-close" onclick={() => (sheetOpen = false)}>
									<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
										<path d="m4 4 8 8M12 4 4 12" />
									</svg>
								</IconButton>
								<h2>{selected.name}</h2>
								<p class="insp-co">{selected.company}</p>
								<p class="insp-amt tab">{money(selected.amount)}</p>
								<span class="tag {STAGE_META[selected.stage].tone}">{STAGE_META[selected.stage].label}</span>
							</div>
							<dl class="meta">
								<div><dt>Contact</dt><dd>{selected.contact}</dd></div>
								<div>
									<dt>Email</dt>
									<dd class="email-dd">
										<a href="mailto:{selected.email}">{selected.email}</a>
										<CopyButton text={selected.email} label="Copy email" class="copy-mini" />
									</dd>
								</div>
								<div><dt>Owner</dt><dd>{selected.owner}</dd></div>
								<div><dt>Close</dt><dd>{shortDate(selected.close)}</dd></div>
							</dl>
							<div class="next">
								<p class="sec">Next step</p>
								<p>{selected.next}</p>
							</div>
							<form class="log" onsubmit={(e) => { e.preventDefault(); logNote(); }}>
								<label for="note">Log a note</label>
								<div class="log-row">
									<input id="note" bind:value={noteDraft} placeholder="Called Elena, sent the SKU list…" />
									<button type="submit" class="btn btn-primary" disabled={noteDraft.trim().length === 0}>Log</button>
								</div>
							</form>
							<div class="activity">
								<p class="sec">Activity</p>
								{#if selected.notes.length === 0}
									<p class="quiet">No activity yet. Log a note to start a trail.</p>
								{:else}
									<ol>
										{#each selected.notes as n (n.id)}
											<li>
												<p class="act-who">{n.who} · {noteWhen(n.at)}</p>
												<p>{n.text}</p>
											</li>
										{/each}
									</ol>
								{/if}
							</div>
						{:else}
							<div class="empty insp-empty">
								<p>Select a deal to see the trail.</p>
							</div>
						{/if}
					</aside>
				</div>
			{:else if view === 'pipeline'}
				<div class="board" aria-label="Open pipeline">
					{#each columnDeals as col (col.stage)}
						<section class="col">
							<header>
								<span class="tag {STAGE_META[col.stage].tone}">{STAGE_META[col.stage].label}</span>
								<span class="col-n">{col.items.length}</span>
								<span class="col-sum tab">{money(col.items.reduce((s, d) => s + d.amount, 0))}</span>
							</header>
							<ul>
								{#each col.items as d (d.id)}
									<li>
										<button type="button" class="card" class:sel={d.id === activeId} onclick={() => pickDeal(d.id)}>
											<p class="deal-name">{d.name}</p>
											<p class="deal-sub">{d.company}</p>
											<div class="card-foot">
												<span class="owner"><span class="dot">{d.ownerInitials}</span>{d.owner.split(' ')[0]}</span>
												<span class="tab">{money(d.amount)}</span>
											</div>
										</button>
									</li>
								{/each}
							</ul>
						</section>
					{/each}
				</div>
			{:else if view === 'people'}
				<div class="table-wrap pad">
					{#if people.length === 0}
						<div class="empty">
							<p>No people match “{query}”.</p>
							<button type="button" class="btn btn-secondary" onclick={clearSearch}>Clear search</button>
						</div>
					{:else}
						<table class="ledger people-ledger">
							<thead>
								<tr>
									<th>Person</th>
									<th>Company</th>
									<th>Email</th>
									<th class="num">Open</th>
									<th class="num">Pipeline</th>
								</tr>
							</thead>
							<tbody>
								{#each people as p (p.email)}
									<tr>
										<td>
											<p class="deal-name">{p.name}</p>
											<p class="deal-sub">{p.phone}</p>
										</td>
										<td>{p.company}</td>
										<td><a href="mailto:{p.email}">{p.email}</a></td>
										<td class="num tab">{p.open}</td>
										<td class="num tab">{money(p.value)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}
				</div>
			{:else}
				<div class="table-wrap pad">
					{#if companies.length === 0}
						<div class="empty">
							<p>No companies match “{query}”.</p>
							<button type="button" class="btn btn-secondary" onclick={clearSearch}>Clear search</button>
						</div>
					{:else}
						<table class="ledger companies-ledger">
							<thead>
								<tr>
									<th>Company</th>
									<th>Contact</th>
									<th class="num">Open</th>
									<th class="num">Pipeline</th>
								</tr>
							</thead>
							<tbody>
								{#each companies as c (c.name)}
									<tr>
										<td class="deal-name">{c.name}</td>
										<td>{c.contact}</td>
										<td class="num tab">{c.open}</td>
										<td class="num tab">{money(c.value)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					{/if}
				</div>
			{/if}
		</div>

		<nav class="dock" aria-label="Primary">
			{#each NAV as item (item.id)}
				<button type="button" class="dock-btn" class:on={view === item.id} onclick={() => setView(item.id)}>
					{item.label}
				</button>
			{/each}
		</nav>

		{#if toast}
			{#key toast.id}
				<div class="toast" role="status" in:fly={{ y: 12, duration: 240, easing: cubicOut }} out:fade={{ duration: 140 }}>
					{toast.text}
					{#if toast.undo}
						<button type="button" class="undo" onclick={undoToast}>Undo</button>
					{/if}
				</div>
			{/key}
		{/if}
	</div>

</KitRoot>

<Dialog.Root bind:open={newOpen} onOpenChange={(open) => { if (!open) submitted = false; }}>
	<Dialog.Portal>
		<Dialog.Overlay class="folio-overlay" />
		<Dialog.Content class="folio-dialog">
			<Dialog.Title>New deal</Dialog.Title>
			<Dialog.Description class="dlg-desc">Add a deal to the {workspaceName} book.</Dialog.Description>
			<form class="dlg-form" onsubmit={createDeal} novalidate>
				<div class="field">
					<label for="dn">Deal name</label>
					<input id="dn" bind:value={draftName} placeholder="Winter pantry restock" aria-invalid={!!draftErrors.name} aria-describedby="dn-err" />
					<FieldError id="dn-err" message={draftErrors.name} />
				</div>
				<div class="field">
					<label for="dc">Company</label>
					<input id="dc" bind:value={draftCompany} placeholder="Canlis" aria-invalid={!!draftErrors.company} aria-describedby="dc-err" />
					<FieldError id="dc-err" message={draftErrors.company} />
				</div>
				<div class="dlg-row">
					<div class="field">
						<label for="da">Amount</label>
						<input id="da" bind:value={draftAmount} inputmode="decimal" placeholder="18400" aria-invalid={!!draftErrors.amount} aria-describedby="da-err" />
						<FieldError id="da-err" message={draftErrors.amount} />
					</div>
					<div class="field">
						<label for="dd">Close date</label>
						<input id="dd" type="date" bind:value={draftClose} required />
					</div>
				</div>
				<div class="field">
					<FilterSelect bind:value={draftStage} options={STAGE_OPTIONS.filter((s) => s.value !== 'open' && s.value !== 'all')} label="Stage" />
				</div>
				<div class="dlg-actions">
					<Dialog.Close class="btn btn-secondary">Cancel</Dialog.Close>
					<button type="submit" class="btn btn-primary" disabled={creating}>
						{#if creating}
							<span class="spin" aria-hidden="true"></span>
							Adding
						{:else}
							Add deal
						{/if}
					</button>
				</div>
			</form>
			<Dialog.Close class="icon-btn dlg-x" aria-label="Close">
				<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
					<path d="m4 4 8 8M12 4 4 12" />
				</svg>
			</Dialog.Close>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	.folio,
	:global(.folio-pop),
	:global(.folio-dialog),
	:global(.folio-overlay) {
		--paper: #f5f5f5;
		--sidebar: #f5f5f5;
		--sheet: #ffffff;
		--ink: #171717;
		--ink-2: #737373;
		--ink-3: #a3a3a3;
		--line: #ececec;
		--accent: #7eb6dc;
		--accent-2: #6aa8d0;
		--accent-ink: #10344f;
		--accent-soft: #e8f3fa;
		--ok: #15803d;
		--ok-soft: #ecfdf3;
		--warn: #b45309;
		--warn-soft: #fff7e6;
		--no: #b91c1c;
		--no-soft: #fef2f2;
		--deal: #1d4d6e;
		--lead-ink: #525252;
		--lead-soft: #f4f4f4;
		--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
		--shadow-btn: 0 1px 2px rgb(40 40 40 / 0.08), 0 0 0 1px var(--line);
		--shadow-primary: inset 0 1px 0 rgb(255 255 255 / 0.35), 0 1px 2px rgb(16 52 79 / 0.16), 0 0 0 1px #5a9cc4;
		--shadow-card: 0 1px 2px rgb(0 0 0 / 0.04), 0 0 0 1px var(--line);
		--shadow-pop: 0 0 0 1px rgb(0 0 0 / 0.06), 0 8px 24px -4px rgb(0 0 0 / 0.10), 0 2px 6px rgb(0 0 0 / 0.04);
		--shadow-focus: 0 0 0 3px color-mix(in oklab, var(--accent), transparent 55%);
		--kit-danger: var(--no);
		--font: 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif;
		font-family: var(--font);
		color: var(--ink);
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
		font-feature-settings: 'cv11', 'ss01';
	}

	/* KitRoot wrapper: no box of its own, it only themes the portalled menus and tooltips */
	:global(.folio-kit) {
		display: contents;
		font-family: 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif;
		--kit-pop-radius: 12px;
		--kit-item-radius: 8px;
		--kit-item-height: 28px;
		--kit-item-hover: #e4eef6;
		--kit-accent: #10344f;
		--kit-success: #15803d;
		--kit-danger: #b91c1c;
		--kit-danger-bg: #fef2f2;
		--kit-icon-btn-radius: 8px;
		--kit-icon-btn-color: #737373;
		--kit-icon-btn-hover-bg: rgb(0 0 0 / 0.05);
		--kit-handle-active: #6aa8d0;
	}

	.folio {
		min-height: 100dvh;
		background: var(--paper);
		color: var(--ink);
		font-size: 13px;
		line-height: 1.35;
		display: grid;
		grid-template-columns: auto 1fr;
		font-family: var(--font);
	}
	:global(.folio .side-col) {
		position: sticky;
		top: 0;
		height: 100dvh;
	}

	.folio :focus-visible {
		outline: none;
		box-shadow: var(--shadow-focus);
	}

	.skip {
		position: absolute;
		inset-inline-start: 8px;
		top: -40px;
		z-index: 80;
		background: var(--sheet);
		color: var(--ink);
		padding: 8px 12px;
		border-radius: 8px;
		font-weight: 500;
	}
	.skip:focus {
		top: 8px;
	}

	.sr {
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

	/* Sidebar */
	/*
	 * Every row shares one icon column (centred 28px from the edge) and one text column (48px),
	 * so the mark, nav icons and avatar line up and stay put when the sidebar collapses to a rail.
	 */
	.sidebar {
		display: flex;
		flex-direction: column;
		padding: 12px 10px 12px;
		gap: 16px;
		height: 100%;
		background: var(--sidebar);
	}
	:global(.folio .brand) {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		height: 36px;
		padding: 0 4px;
		border: 0;
		border-radius: 10px;
		background: transparent;
		color: var(--ink);
		text-align: start;
		transition: background 150ms var(--ease-out);
	}
	:global(.folio .brand:hover),
	:global(.folio .brand[data-state='open']) {
		background: rgb(0 0 0 / 0.04);
	}
	.brand-copy {
		display: block;
		min-width: 0;
		flex: 1;
	}
	.brand-chev {
		width: 14px;
		height: 14px;
		margin-inline-end: 4px;
		color: var(--ink-3);
		flex-shrink: 0;
	}
	.fades {
		transition: opacity 150ms var(--ease-out);
	}
	.rail .fades {
		opacity: 0;
		pointer-events: none;
	}
	.mark {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		background: linear-gradient(#c5e0f2, #9ecce8);
		display: grid;
		place-items: center;
		box-shadow: var(--shadow-primary);
		flex-shrink: 0;
	}
	.mark svg {
		width: 16px;
		height: 16px;
	}
	.product {
		display: block;
		font-size: 14px;
		font-weight: 500;
		letter-spacing: -0.01em;
		line-height: 1.2;
	}
	.ws {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 12px;
		color: var(--ink-2);
	}

	.nav {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}
	.pill {
		position: absolute;
		inset-inline: 0;
		top: 0;
		height: 28px;
		border-radius: 8px;
		background: var(--sheet);
		box-shadow: var(--shadow-btn);
		transition: transform 250ms var(--ease-out);
		pointer-events: none;
	}
	.nav-btn {
		position: relative;
		z-index: 1;
		height: 28px;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 10px;
		border: 0;
		background: transparent;
		color: var(--ink-2);
		white-space: nowrap;
		font: 500 13px/1 var(--font);
		transition: color 150ms var(--ease-out);
		border-radius: 8px;
		width: 100%;
		text-align: start;
	}
	.nav-btn svg {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}
	.nav-btn.on {
		color: var(--accent-ink);
	}
	.nav-btn .count {
		margin-inline-start: auto;
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		color: var(--ink-3);
	}
	.nav-btn.on .count {
		color: var(--accent-ink);
	}

	:global(.folio .who) {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 6px;
		border: 0;
		border-radius: 10px;
		background: var(--sheet);
		box-shadow: var(--shadow-card);
		color: var(--ink);
		text-align: start;
		white-space: nowrap;
		transition: box-shadow 150ms var(--ease-out);
	}
	:global(.folio .who:hover),
	:global(.folio .who[data-state='open']) {
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.06), 0 0 0 1px #dcdcdc;
	}
	.ava,
	.dot {
		width: 24px;
		height: 24px;
		border-radius: 999px;
		display: grid;
		place-items: center;
		font-size: 10px;
		font-weight: 500;
		background: var(--accent-soft);
		color: var(--accent-ink);
		flex-shrink: 0;
	}
	.who-copy {
		display: block;
		min-width: 0;
	}
	.who-name {
		display: block;
		font-weight: 500;
		font-size: 13px;
	}
	.who-mail {
		display: block;
		font-size: 12px;
		color: var(--ink-2);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Desk / sheet */
	.desk {
		margin: 8px 8px 8px 0;
		background: var(--sheet);
		border-radius: 12px;
		box-shadow: var(--shadow-card);
		min-width: 0;
		min-height: calc(100dvh - 16px);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.top {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 14px;
		border-bottom: 1px solid var(--line);
		min-height: 48px;
	}
	.title-block {
		min-width: 0;
	}
	h1 {
		font-size: 16px;
		font-weight: 500;
		letter-spacing: -0.01em;
		line-height: 1.2;
		text-wrap: balance;
	}
	.lede {
		font-size: 12px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}
	.search {
		margin-inline-start: auto;
		display: flex;
		align-items: center;
		gap: 6px;
		height: 30px;
		padding: 0 8px 0 10px;
		background: var(--sheet);
		border-radius: 10px;
		box-shadow: var(--shadow-btn);
		min-width: 200px;
		flex: 1;
		max-width: 280px;
	}
	.search svg {
		width: 14px;
		height: 14px;
		color: var(--ink-3);
		flex-shrink: 0;
	}
	.search input {
		flex: 1;
		border: 0;
		background: transparent;
		font: 400 13px/1 var(--font);
		color: var(--ink);
		min-width: 0;
		outline: none;
		box-shadow: none;
	}
	.search input::placeholder {
		color: var(--ink-3);
	}
	.search kbd {
		height: 18px;
		min-width: 18px;
		padding: 0 5px;
		border-radius: 5px;
		background: var(--paper);
		box-shadow: 0 0 0 1px var(--line);
		font: 500 11px/18px var(--font);
		color: var(--ink-3);
	}

	/* Buttons */
	.btn {
		height: 30px;
		padding: 0 12px;
		border-radius: 10px;
		font: 500 14px/1 var(--font);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		border: 0;
		user-select: none;
		white-space: nowrap;
		transition:
			transform 150ms var(--ease-out),
			background 150ms var(--ease-out),
			box-shadow 150ms var(--ease-out);
	}
	.btn svg {
		width: 14px;
		height: 14px;
	}
	.btn:disabled {
		opacity: 0.5;
	}
	.btn-primary {
		background: linear-gradient(#93c6e6, #6fafd6);
		color: var(--accent-ink);
		box-shadow: var(--shadow-primary);
	}
	.btn-secondary {
		background: linear-gradient(#ffffff, #f7f7f7);
		color: var(--ink);
		box-shadow: var(--shadow-btn);
	}
	:global(.folio .icon-btn),
	:global(.folio-dialog .icon-btn),
	.icon-btn {
		width: 28px;
		height: 28px;
		padding: 0;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: var(--ink-2);
		display: inline-grid;
		place-items: center;
		flex-shrink: 0;
		transition: background 150ms var(--ease-out), color 150ms var(--ease-out);
	}
	:global(.folio .icon-btn svg),
	:global(.folio-dialog .icon-btn svg),
	.icon-btn svg {
		width: 16px;
		height: 16px;
	}
	:global(.folio .menu-btn) {
		display: none;
	}

	@media (hover: hover) and (pointer: fine) {
		.btn-primary:hover {
			background: linear-gradient(#86bddf, #64a4cc);
		}
		.btn-secondary:hover {
			background: linear-gradient(#ffffff, #f2f2f2);
		}
		.nav-btn:hover {
			color: var(--ink);
		}
		:global(.folio .icon-btn:hover),
		.icon-btn:hover {
			background: color-mix(in oklab, var(--ink), transparent 94%);
			color: var(--ink);
		}
		.ledger tbody tr:hover {
			background: color-mix(in oklab, var(--accent-soft), transparent 55%);
		}
		.card:hover {
			background: #fafafa;
		}
	}
	.btn:active {
		transform: scale(0.97);
	}

	:global(.folio-dialog .btn) {
		height: 30px;
		padding: 0 12px;
		border-radius: 10px;
		font: 500 14px/1 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		border: 0;
		user-select: none;
		white-space: nowrap;
		transition:
			transform 150ms cubic-bezier(0.23, 1, 0.32, 1),
			background 150ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	:global(.folio-dialog .btn-primary) {
		background: linear-gradient(#93c6e6, #6fafd6);
		color: #10344f;
		box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.35), 0 1px 2px rgb(16 52 79 / 0.16), 0 0 0 1px #5a9cc4;
	}
	:global(.folio-dialog .btn-secondary) {
		background: linear-gradient(#ffffff, #f7f7f7);
		color: #171717;
		box-shadow: 0 1px 2px rgb(40 40 40 / 0.08), 0 0 0 1px #ececec;
	}
	:global(.folio-dialog .btn:disabled) {
		opacity: 0.5;
	}
	:global(.folio-dialog .icon-btn) {
		width: 28px;
		height: 28px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: #737373;
		display: inline-grid;
		place-items: center;
	}
	:global(.folio-dialog .icon-btn svg) {
		width: 16px;
		height: 16px;
	}
	:global(.folio-dialog .dlg-x) {
		position: absolute;
		top: 12px;
		inset-inline-end: 12px;
	}

	/* KPIs */
	.kpis {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border-bottom: 1px solid var(--line);
	}
	.kpi {
		padding: 8px 14px 10px;
		min-width: 0;
	}
	.kpi + .kpi {
		box-shadow: inset 1px 0 0 var(--line);
	}
	.kpi-l {
		font-size: 12px;
		color: var(--ink-2);
	}
	.kpi-n {
		margin-top: 2px;
		font-size: 18px;
		font-weight: 500;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
		line-height: 1.15;
	}
	.kpi-m {
		margin-top: 2px;
		font-size: 12px;
		color: var(--ink-3);
	}

	.tools {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		border-bottom: 1px solid var(--line);
		flex-wrap: wrap;
	}
	.shown {
		margin-inline-start: auto;
		font-size: 12px;
		color: var(--ink-2);
		font-variant-numeric: tabular-nums;
	}

	.split {
		flex: 1;
		display: grid;
		grid-template-columns: minmax(0, 1fr) 300px;
		min-height: 0;
	}
	.table-wrap {
		overflow: auto;
		min-width: 0;
	}
	.table-wrap.pad {
		flex: 1;
	}

	.ledger {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}
	.deals-ledger {
		table-layout: fixed;
	}
	.deals-ledger .c-deal {
		width: auto;
	}
	.deals-ledger .c-stage {
		width: 112px;
	}
	.deals-ledger .c-owner {
		width: 92px;
	}
	.deals-ledger .c-close {
		width: 76px;
	}
	.deals-ledger .c-amount {
		width: 88px;
	}
	.deals-ledger .c-act {
		width: 44px;
	}
	.ledger th {
		text-align: start;
		font-size: 12px;
		font-weight: 500;
		color: var(--ink-2);
		padding: 6px 10px;
		border-bottom: 1px solid var(--line);
		background: #fafafa;
		position: sticky;
		top: 0;
		z-index: 1;
	}
	.ledger td {
		padding: 6px 10px;
		border-bottom: 1px solid color-mix(in oklab, var(--line), transparent 35%);
		vertical-align: middle;
	}
	.ledger tbody tr {
		cursor: default;
		transition: background 120ms var(--ease-out);
	}
	.ledger tbody tr.sel {
		background: var(--accent-soft);
	}

	.num {
		text-align: end;
	}
	.tab {
		font-variant-numeric: tabular-nums;
	}
	.deal-name {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.deal-sub {
		font-size: 12px;
		color: var(--ink-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.owner {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.dot {
		width: 18px;
		height: 18px;
		font-size: 9px;
	}
	.act {
		width: 44px;
		text-align: end;
	}
	@media (hover: hover) and (pointer: fine) {
		:global(.folio .row-act) {
			opacity: 0;
			transition: opacity 120ms var(--ease-out), background 150ms var(--ease-out), color 150ms var(--ease-out);
		}
		.ledger tbody tr:hover :global(.row-act),
		.ledger tbody tr.sel :global(.row-act),
		:global(.folio .row-act:focus-visible) {
			opacity: 1;
		}
	}

	.tag {
		display: inline-flex;
		align-items: center;
		height: 20px;
		padding: 0 7px;
		border-radius: 6px;
		font: 500 12px/1 var(--font);
		white-space: nowrap;
	}
	.tag.lead {
		color: var(--lead-ink);
		background: var(--lead-soft);
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--lead-ink), transparent 82%);
	}
	.tag.info {
		color: var(--deal);
		background: var(--accent-soft);
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--deal), transparent 78%);
	}
	.tag.warn {
		color: var(--warn);
		background: var(--warn-soft);
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--warn), transparent 78%);
	}
	.tag.deal {
		color: var(--deal);
		background: #cfe0ee;
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--deal), transparent 72%);
	}
	.tag.ok {
		color: var(--ok);
		background: var(--ok-soft);
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ok), transparent 78%);
	}
	.tag.no {
		color: var(--no);
		background: var(--no-soft);
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--no), transparent 78%);
	}

	a {
		color: var(--accent-ink);
		text-decoration: none;
	}
	a:hover {
		text-decoration: underline;
		text-underline-offset: 2px;
		text-decoration-thickness: from-font;
	}

	/* Inspector */
	.inspector {
		border-inline-start: 1px solid var(--line);
		overflow: auto;
		padding: 12px 14px 16px;
		background: var(--sheet);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.insp-head h2 {
		font-size: 16px;
		font-weight: 500;
		letter-spacing: -0.01em;
		line-height: 1.2;
		text-wrap: balance;
	}
	.insp-co {
		margin-top: 2px;
		font-size: 12px;
		color: var(--ink-2);
	}
	.insp-amt {
		margin: 8px 0 6px;
		font-size: 22px;
		font-weight: 500;
		letter-spacing: -0.03em;
		line-height: 1.1;
	}
	:global(.folio .sheet-close) {
		display: none;
		margin-inline-start: auto;
	}
	.email-dd {
		display: flex;
		align-items: center;
		gap: 2px;
		min-width: 0;
	}
	.email-dd a {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:global(.folio .copy-mini) {
		--kit-icon-btn-size: 22px;
		--kit-icon-size: 13px;
		--kit-icon-btn-radius: 6px;
		--kit-icon-btn-color: var(--ink-3);
	}
	.insp-head {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0;
	}
	.meta {
		display: grid;
		gap: 6px;
		font-size: 13px;
	}
	.meta div {
		display: grid;
		grid-template-columns: 72px 1fr;
		gap: 8px;
	}
	.meta dt {
		color: var(--ink-2);
		font-size: 12px;
	}
	.meta dd {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.sec {
		font-size: 12px;
		font-weight: 500;
		color: var(--ink-2);
		margin-bottom: 4px;
	}
	.next p:last-child {
		font-size: 13px;
	}
	.log label,
	.field label,
	.lbl {
		display: block;
		font-size: 12px;
		font-weight: 500;
		color: var(--ink-2);
		margin-bottom: 4px;
	}
	.log-row {
		display: flex;
		gap: 6px;
	}
	.log input,
	.field input,
	:global(.folio-dialog input) {
		height: 30px;
		width: 100%;
		border: 0;
		border-radius: 10px;
		padding: 0 10px;
		font: 400 13px/1 var(--font);
		background: var(--sheet);
		color: var(--ink);
		box-shadow: var(--shadow-btn);
		transition: box-shadow 150ms var(--ease-out);
	}
	.log input::placeholder,
	.field input::placeholder,
	:global(.folio-dialog input::placeholder) {
		color: var(--ink-3);
	}
	.log input:focus,
	.field input:focus,
	:global(.folio-dialog input:focus) {
		outline: none;
		box-shadow: 0 0 0 1px var(--accent-2), var(--shadow-focus);
	}
	.activity ol {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.act-who {
		font-size: 12px;
		color: var(--ink-2);
		margin-bottom: 2px;
	}
	.quiet {
		font-size: 13px;
		color: var(--ink-2);
	}

	.empty {
		display: grid;
		place-items: center;
		gap: 12px;
		min-height: 100%;
		color: var(--ink-2);
		padding: 24px;
		text-align: center;
	}

	/* Pipeline board */
	.board {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(4, minmax(180px, 1fr));
		gap: 8px;
		padding: 8px;
		overflow: auto;
		align-items: start;
	}
	.col {
		background: var(--paper);
		border-radius: 10px;
		padding: 8px;
		min-height: 120px;
		box-shadow: var(--shadow-card);
	}
	.col header {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 8px;
	}
	.col-n {
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		color: var(--ink-2);
	}
	.col-sum {
		margin-inline-start: auto;
		font-size: 12px;
		color: var(--ink-2);
	}
	.col ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.card {
		width: 100%;
		text-align: start;
		background: var(--sheet);
		border: 0;
		border-radius: 8px;
		padding: 8px;
		box-shadow: var(--shadow-card);
		display: flex;
		flex-direction: column;
		gap: 4px;
		transition: background 150ms var(--ease-out);
	}
	.card.sel {
		box-shadow: 0 0 0 1px var(--accent-2), var(--shadow-card);
		background: var(--accent-soft);
	}
	.card-foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 12px;
		color: var(--ink-2);
		margin-top: 4px;
	}

	.dock {
		display: none;
	}
	.scrim {
		display: none;
	}

	.toast {
		position: fixed;
		bottom: 16px;
		inset-inline-start: 50%;
		transform: translateX(-50%);
		z-index: 70;
		display: flex;
		align-items: center;
		gap: 10px;
		height: 36px;
		padding: 0 12px;
		border-radius: 10px;
		background: #171717;
		color: #fafafa;
		font: 500 13px/1 var(--font);
		box-shadow: var(--shadow-pop);
	}
	.undo {
		border: 0;
		background: rgb(255 255 255 / 0.12);
		color: #fff;
		height: 22px;
		padding: 0 8px;
		border-radius: 6px;
		font: 500 12px/1 var(--font);
	}

	.spin {
		width: 12px;
		height: 12px;
		border: 1.5px solid rgb(16 52 79 / 0.25);
		border-top-color: var(--accent-ink);
		border-radius: 99px;
		animation: spin 700ms linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Portals */
	:global(.folio-filter) {
		height: 28px;
		padding: 0 8px;
		border: 0;
		border-radius: 8px;
		background: #ffffff;
		box-shadow: 0 1px 2px rgb(40 40 40 / 0.08), 0 0 0 1px #ececec;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font: 500 13px/1 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif;
		color: #171717;
		transition: box-shadow 150ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	:global(.folio-filter .k) {
		color: #737373;
		font-weight: 400;
		font-size: 12px;
	}
	:global(.folio-filter .chev) {
		width: 12px;
		height: 12px;
		color: #a3a3a3;
		transition: transform 170ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	:global(.folio-filter[data-state='open'] .chev) {
		transform: rotate(180deg);
		transition-duration: 50ms;
	}
	:global(.folio-filter:hover),
	:global(.folio-filter[data-state='open']) {
		box-shadow: 0 1px 2px rgb(40 40 40 / 0.08), 0 0 0 1px #d4d4d4;
	}
	:global(.folio-filter:focus-visible) {
		outline: none;
		box-shadow: 0 0 0 3px rgb(126 182 220 / 0.45);
	}

	:global(.folio-pop) {
		z-index: 60;
		min-width: 160px;
		background: #ffffff;
		border-radius: 12px;
		padding: 4px;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.06), 0 8px 24px -4px rgb(0 0 0 / 0.10);
		transform-origin: var(--bits-select-content-transform-origin, var(--bits-dropdown-menu-content-transform-origin, top));
		font: 400 13px/1.3 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif;
		color: #171717;
	}
	:global(.folio-pop[data-state='open']) {
		animation: pop-in 200ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	:global(.folio-pop[data-state='closed']) {
		animation: pop-out 120ms ease-in forwards;
	}
	@keyframes pop-in {
		from {
			opacity: 0;
			transform: scale(0.96) translateY(-4px);
		}
	}
	@keyframes pop-out {
		to {
			opacity: 0;
			transform: scale(0.98);
		}
	}
	:global(.folio-item) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		min-height: 28px;
		padding: 0 8px;
		border-radius: 8px;
		font-size: 13px;
		outline: none;
	}
	:global(.folio-item[data-highlighted]) {
		background: #e4eef6;
	}
	:global(.folio-item .tick) {
		width: 14px;
		height: 14px;
	}

	:global(.folio-overlay) {
		position: fixed;
		inset: 0;
		z-index: 80;
		background: rgb(0 0 0 / 0.4);
	}
	:global(.folio-overlay[data-state='open']) {
		animation: ov-in 200ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	:global(.folio-overlay[data-state='closed']) {
		animation: ov-out 150ms ease-in forwards;
	}
	@keyframes ov-in {
		from {
			opacity: 0;
		}
	}
	@keyframes ov-out {
		to {
			opacity: 0;
		}
	}
	:global(.folio-dialog) {
		position: fixed;
		left: 50%;
		top: 50%;
		z-index: 81;
		width: min(420px, calc(100vw - 24px));
		transform: translate(-50%, -50%);
		background: #ffffff;
		border-radius: 20px;
		padding: 20px;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.06), 0 24px 64px -12px rgb(0 0 0 / 0.18);
	}
	:global(.folio-dialog[data-state='open']) {
		animation: dlg-in 280ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	:global(.folio-dialog[data-state='closed']) {
		animation: dlg-out 150ms ease-in forwards;
	}
	@keyframes dlg-in {
		from {
			opacity: 0;
			transform: translate(-50%, calc(-50% + 8px)) scale(0.96);
		}
	}
	@keyframes dlg-out {
		to {
			opacity: 0;
			transform: translate(-50%, calc(-50% + 4px)) scale(0.98);
		}
	}
	:global(.folio-dialog h2) {
		font: 500 16px/1.2 'Inter Variable', Inter, sans-serif;
		letter-spacing: -0.01em;
	}
	:global(.folio-dialog .dlg-desc) {
		margin-top: 4px;
		font-size: 13px;
		color: #737373;
	}

	.dlg-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 16px;
	}
	.dlg-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.dlg-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 4px;
	}
	:global(.folio-dialog .dlg-x),
	.dlg-x {
		position: absolute;
		top: 12px;
		inset-inline-end: 12px;
	}
	:global(.folio-dialog .field) {
		min-width: 0;
	}
	:global(.folio-dialog input[aria-invalid='true']),
	:global(.folio-dialog input[aria-invalid='true']:focus) {
		box-shadow:
			0 0 0 1px var(--no),
			0 0 0 3px rgb(185 28 28 / 0.14);
	}

	@media (prefers-reduced-motion: reduce) {
		.pill,
		.btn,
		.nav-btn,
		.icon-btn,
		.toast,
		.spin,
		:global(.folio-pop),
		:global(.folio-overlay),
		:global(.folio-dialog),
		:global(.folio-filter .chev) {
			animation: none !important;
			transition: none !important;
		}
	}

	@media (max-width: 1100px) {
		.split {
			grid-template-columns: 1fr;
		}
		.inspector {
			position: fixed;
			inset: auto 8px 8px;
			height: auto;
			max-height: min(72dvh, 560px);
			border: 0;
			border-radius: 16px 16px 12px 12px;
			box-shadow: var(--shadow-pop);
			z-index: 40;
			transform: translateY(110%);
			transition: transform 400ms cubic-bezier(0.32, 0.72, 0, 1);
		}
		.inspector.sheet {
			transform: none;
		}
		:global(.folio .sheet-close) {
			display: grid;
			position: absolute;
			top: 10px;
			inset-inline-end: 10px;
		}
	}

	@media (max-width: 840px) {
		.folio {
			grid-template-columns: 1fr;
			padding-bottom: 56px;
		}
		/* the resizable column gives way to the off-canvas drawer */
		:global(.folio .side-col),
		:global(.folio .side-col > .kit-sidebar-body),
		:global(.folio .side-col > .kit-sidebar-body > div) {
			display: contents;
		}
		:global(.folio .side-col .kit-sidebar-handle),
		:global(.folio .rail-toggle) {
			display: none;
		}
		.rail .fades {
			opacity: 1;
			pointer-events: auto;
		}
		.sidebar {
			position: fixed;
			inset: 0 auto 0 0;
			width: min(280px, 86vw);
			z-index: 50;
			transform: translateX(-105%);
			transition: transform 350ms cubic-bezier(0.32, 0.72, 0, 1);
			box-shadow: var(--shadow-pop);
		}
		.sidebar.open {
			transform: none;
		}
		.scrim {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 45;
			background: rgb(0 0 0 / 0.35);
			border: 0;
		}
		.desk {
			margin: 0;
			border-radius: 0;
			min-height: 100dvh;
		}
		:global(.folio .menu-btn) {
			display: inline-grid;
		}
		.search {
			max-width: none;
			min-width: 0;
		}
		.search kbd {
			display: none;
		}
		.kpis {
			grid-template-columns: 1fr 1fr;
		}
		.kpi:nth-child(3),
		.kpi:nth-child(4) {
			box-shadow: inset 0 1px 0 var(--line);
		}
		.kpi:nth-child(2),
		.kpi:nth-child(4) {
			box-shadow: inset 1px 0 0 var(--line);
		}
		.kpi:nth-child(4) {
			box-shadow: inset 1px 0 0 var(--line), inset 0 1px 0 var(--line);
		}
		.board {
			grid-template-columns: 1fr 1fr;
		}
		.btn-primary span,
		.top .btn-primary {
			padding-inline: 10px;
		}
		.dock {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			position: fixed;
			inset-inline: 0;
			bottom: 0;
			height: 52px;
			padding-bottom: env(safe-area-inset-bottom);
			background: var(--sheet);
			box-shadow: 0 -1px 0 var(--line);
			z-index: 30;
		}
		.dock-btn {
			border: 0;
			background: transparent;
			font: 500 12px/1 var(--font);
			color: var(--ink-2);
		}
		.dock-btn.on {
			color: var(--accent-ink);
		}
		.inspector {
			inset: auto 8px calc(52px + 8px + env(safe-area-inset-bottom, 0px));
			max-height: min(72dvh, calc(100dvh - 52px - 24px - env(safe-area-inset-bottom, 0px)));
		}
		.deal-name,
		.deal-sub {
			max-width: none;
		}
		.log input,
		.field input,
		:global(.folio-dialog input) {
			font-size: 16px;
		}
	}

	@media (max-width: 700px) {
		.deals-ledger {
			table-layout: auto;
		}
		.deals-ledger th:nth-child(2),
		.deals-ledger td:nth-child(2),
		.deals-ledger th:nth-child(3),
		.deals-ledger td:nth-child(3),
		.deals-ledger th:nth-child(4),
		.deals-ledger td:nth-child(4),
		.deals-ledger th:nth-child(6),
		.deals-ledger td:nth-child(6),
		.people-ledger th:nth-child(3),
		.people-ledger td:nth-child(3),
		.people-ledger th:nth-child(4),
		.people-ledger td:nth-child(4),
		.companies-ledger th:nth-child(2),
		.companies-ledger td:nth-child(2),
		.companies-ledger th:nth-child(3),
		.companies-ledger td:nth-child(3) {
			display: none;
		}
		.deals-ledger .c-amount {
			width: 96px;
		}
	}

	@media (max-width: 560px) {
		.board {
			grid-template-columns: 1fr;
		}
		.top .new-deal {
			width: 30px;
			padding: 0;
		}
		.new-label {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
		}
		.shown {
			width: 100%;
			margin-inline-start: 0;
			text-align: end;
		}
		.top {
			gap: 8px;
		}
		.search {
			min-width: 0;
		}
	}
</style>
