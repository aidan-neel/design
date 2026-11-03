<script lang="ts">
	import '@fontsource-variable/inter';
	import IconButton from '#lib/kit/IconButton.svelte';
	import KitRoot from '#lib/kit/KitRoot.svelte';
	import MenuContent from '#lib/kit/MenuContent.svelte';
	import MenuItem from '#lib/kit/MenuItem.svelte';
	import MenuRadioItem from '#lib/kit/MenuRadioItem.svelte';
	import { navPill } from '#lib/kit/nav-pill.js';
	import Sidebar from '#lib/kit/Sidebar.svelte';
	import Tip from '#lib/kit/Tip.svelte';
	import { DropdownMenu, Switch } from 'bits-ui';
	import { onDestroy } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';

	let compare = $state(true);
	let range = $state(2);
	let segment = $state('all');
	let source = $state('all');
	let query = $state('');
	let activeView = $state('Overview');
	let railed = $state(false);
	let workspace = $state('northwind');
	let toast = $state<{ id: number; text: string } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	let toastSeq = 0;
	let searchEl: HTMLInputElement | undefined = $state();

	const ranges = ['24h', '7d', '30d', '90d'];
	const RANGE_LABELS = ['Last 24 hours', 'Last 7 days', 'Last 30 days', 'Last 90 days'];
	/** Share of the 30-day totals each range covers; the demo scales its numbers by these. */
	const RANGE_SCALE = [0.034, 0.24, 1, 2.86];
	const SEGMENTS = [
		{ value: 'all', label: 'All users', scale: 1 },
		{ value: 'new', label: 'New users', scale: 0.38 },
		{ value: 'returning', label: 'Returning', scale: 0.62 }
	];
	const SOURCES = [
		{ value: 'all', label: 'All channels', scale: 1 },
		{ value: 'direct', label: 'Direct', scale: 0.38 },
		{ value: 'organic', label: 'Organic search', scale: 0.29 },
		{ value: 'referral', label: 'Referral', scale: 0.14 }
	];
	const WORKSPACES = [
		{ value: 'northwind', label: 'Northwind Labs', initial: 'N' },
		{ value: 'tailspin', label: 'Tailspin Toys', initial: 'T' }
	];

	let notifications = $state([
		{ id: 1, text: 'Conversion rate passed 4.8%', time: '12m', unread: true },
		{ id: 2, text: 'Weekly report is ready', time: '2h', unread: true },
		{ id: 3, text: 'Paid social spend alert resolved', time: '1d', unread: false }
	]);
	const unreadCount = $derived(notifications.filter((n) => n.unread).length);

	const segmentLabel = $derived(SEGMENTS.find((x) => x.value === segment)?.label ?? 'All users');
	const sourceLabel = $derived(SOURCES.find((x) => x.value === source)?.label ?? 'All channels');
	const workspaceInfo = $derived(WORKSPACES.find((w) => w.value === workspace) ?? WORKSPACES[0]);
	const scale = $derived(
		RANGE_SCALE[range] *
			(SEGMENTS.find((x) => x.value === segment)?.scale ?? 1) *
			(SOURCES.find((x) => x.value === source)?.scale ?? 1)
	);
	const rangeValue = $derived(String(range));

	function setRange(value: string) {
		const next = Number(value);
		if (Number.isInteger(next) && next >= 0 && next < ranges.length) range = next;
	}

	function showToast(text: string) {
		clearTimeout(toastTimer);
		toast = { id: toastSeq++, text };
		toastTimer = setTimeout(() => (toast = null), 3200);
	}

	onDestroy(() => clearTimeout(toastTimer));

	async function copyUrl(path: string) {
		const url = `https://northwind.dev${path}`;
		try {
			await navigator.clipboard.writeText(url);
			showToast(`Copied ${url}`);
		} catch (error) {
			console.error('Clipboard write was refused', error);
			showToast('Couldn’t copy. Check clipboard permissions.');
		}
	}

	function exportCsv() {
		const rows = [['page', 'views', 'change', 'share'], ...visiblePages.map((p) => [p.path, p.views.replace(/,/g, ''), p.delta, `${p.share}%`])];
		const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = `top-pages-${ranges[range]}.csv`;
		link.click();
		URL.revokeObjectURL(url);
		showToast(`Exported top-pages-${ranges[range]}.csv`);
	}

	function onWindowKeydown(event: KeyboardEvent) {
		const target = event.target;
		const isTyping = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
		if (event.key === '/' && !isTyping) {
			event.preventDefault();
			searchEl?.focus();
		} else if (event.key === 'Escape' && target === searchEl) {
			query = '';
			searchEl?.blur();
		}
	}

	function markAllRead() {
		for (const n of notifications) n.unread = false;
	}

	function formatScaled(base: number): string {
		return Math.round(base * scale).toLocaleString('en-US');
	}

	/* ---- chart data: daily sessions, last 30 days vs previous period ---- */
	const W = 720;
	const H = 210;
	const MAX = 6000;

	const cur = [
		3120, 3340, 3210, 2890, 3460, 3620, 3380, 3150, 3490, 3710, 3580, 3320, 3640, 3920, 4210,
		4030, 3870, 4160, 4380, 4210, 4020, 4340, 4620, 4480, 4710, 4930, 5214, 4870, 4620, 4890
	];
	const prev = [
		2410, 2520, 2380, 2290, 2610, 2740, 2580, 2430, 2660, 2810, 2690, 2520, 2730, 2940, 3080,
		2960, 2840, 3050, 3180, 3090, 2980, 3160, 3310, 3240, 3380, 3510, 3640, 3480, 3360, 3520
	];

	function smoothPath(vals: number[], w: number, h: number, max: number): string {
		const n = vals.length;
		const pts = vals.map((v, i) => [(i / (n - 1)) * w, h - (v / max) * h] as const);
		let d = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
		for (let i = 0; i < n - 1; i++) {
			const p0 = pts[Math.max(0, i - 1)];
			const p1 = pts[i];
			const p2 = pts[i + 1];
			const p3 = pts[Math.min(n - 1, i + 2)];
			const c1x = p1[0] + (p2[0] - p0[0]) / 6;
			const c1y = p1[1] + (p2[1] - p0[1]) / 6;
			const c2x = p2[0] - (p3[0] - p1[0]) / 6;
			const c2y = p2[1] - (p3[1] - p1[1]) / 6;
			d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
		}
		return d;
	}

	const curPath = smoothPath(cur, W, H, MAX);
	const prevPath = smoothPath(prev, W, H, MAX);
	const areaPath = `${curPath} L ${W},${H} L 0,${H} Z`;

	const tipI = 26; // Oct 31
	const tipX = (tipI / (cur.length - 1)) * 100;
	const tipY = ((H - (cur[tipI] / MAX) * H) / H) * 100;

	const yTicks = [
		{ v: 6000, l: '6k' },
		{ v: 4500, l: '4.5k' },
		{ v: 3000, l: '3k' },
		{ v: 1500, l: '1.5k' },
		{ v: 0, l: '0' }
	];
	const xTicks = [
		{ i: 0, l: 'Oct 5' },
		{ i: 7, l: 'Oct 12' },
		{ i: 14, l: 'Oct 19' },
		{ i: 21, l: 'Oct 26' },
		{ i: 29, l: 'Nov 3' }
	];

	const kpis = $derived([
		{ label: 'Sessions', value: formatScaled(128947), delta: '▲ +12.4%', up: true, note: `vs prev ${ranges[range]}` },
		{ label: 'Active users', value: formatScaled(41203), delta: '▲ +8.1%', up: true, note: `vs prev ${ranges[range]}` },
		{ label: 'Conversion rate', value: '4.87%', delta: '▲ +0.4pp', up: true, note: `vs prev ${ranges[range]}` },
		{ label: 'Avg. session', value: '3m 42s', delta: '▼ −2.3%', up: false, note: `vs prev ${ranges[range]}` }
	]);

	const nav: { group: string; items: { icon: string; label: string; active?: boolean; count?: number; live?: boolean }[] }[] = [
		{
			group: 'Overview',
			items: [
				{ icon: 'grid', label: 'Overview', active: true },
				{ icon: 'file', label: 'Reports', count: 12 },
				{ icon: 'pulse', label: 'Live', live: true }
			]
		},
		{
			group: 'Analytics',
			items: [
				{ icon: 'chart', label: 'Sessions' },
				{ icon: 'users', label: 'Audiences' },
				{ icon: 'globe', label: 'Acquisition' },
				{ icon: 'refresh', label: 'Retention' }
			]
		},
		{
			group: 'Workspace',
			items: [
				{ icon: 'flask', label: 'Experiments', count: 3 },
				{ icon: 'bell', label: 'Alerts', count: 2 },
				{ icon: 'sliders', label: 'Settings' }
			]
		}
	];

	const sources = [
		{ name: 'Direct', pct: 38 },
		{ name: 'Organic search', pct: 29 },
		{ name: 'Referral', pct: 14 },
		{ name: 'Social', pct: 11 },
		{ name: 'Email', pct: 8 }
	];

	const pages = [
		{ path: '/', views: '46,210', delta: '+3.8%', up: true, share: 24.3 },
		{ path: '/pricing', views: '18,429', delta: '+9.2%', up: true, share: 9.7 },
		{ path: '/docs/quickstart', views: '14,802', delta: '+22.8%', up: true, share: 7.8 },
		{ path: '/blog/design-tokens', views: '11,357', delta: '−4.1%', up: false, share: 6.0 },
		{ path: '/changelog', views: '8,914', delta: '+2.6%', up: true, share: 4.7 },
		{ path: '/docs/api', views: '7,412', delta: '+11.4%', up: true, share: 3.9 }
	];

	const visiblePages = $derived(pages.filter((p) => p.path.includes(query.trim().toLowerCase())));

	const convs = [
		{ init: 'SW', name: 'Sophia Williams', hue: 'blue', plan: 'Pro', src: 'Direct', amt: '$29', time: '2m' },
		{ init: 'AK', name: 'Andrej Kovac', hue: 'green', plan: 'Business', src: 'Organic', amt: '$79', time: '14m' },
		{ init: 'MP', name: 'Maya Patel', hue: 'amber', plan: 'Pro', src: 'Referral', amt: '$29', time: '31m' },
		{ init: 'JW', name: 'Jonas Weber', hue: 'rose', plan: 'Team', src: 'Social', amt: '$149', time: '48m' },
		{ init: 'ER', name: 'Elena Rossi', hue: 'violet', plan: 'Pro', src: 'Email', amt: '$29', time: '1h' }
	];

	const icons: Record<string, string> = {
		grid: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
		file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h6M9 17h4"/>',
		pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
		chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
		users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
		globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
		refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
		flask: '<path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/>',
		bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
		sliders: '<path d="M21 4h-6M11 4H3M21 12h-4M13 12H3M21 20h-8M9 20H3"/><circle cx="13" cy="4" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="11" cy="20" r="2"/>',
		search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
		calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
		download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
		chev: '<path d="m6 9 6 6 6-6"/>',
		help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
		more: '<circle cx="5" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.1" fill="currentColor" stroke="none"/>'
	};
</script>

<svelte:head>
	<title>Overview · Northwind Analytics</title>
</svelte:head>

<svelte:window onkeydown={onWindowKeydown} />

<KitRoot class="dash-kit">
<div class="dash">
	<!-- ===================== sidebar ===================== -->
	<Sidebar bind:collapsed={railed} defaultWidth={212} minWidth={188} maxWidth={320} collapsedWidth={60} class="side-col">
		{#snippet children({ collapsed })}
			<aside class="side" class:rail={collapsed} use:navPill={activeView}>
				<span class="nav-pill" aria-hidden="true"></span>
				<div class="side-top">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<button {...props} class="ws" type="button">
								<span class="tile">{workspaceInfo.initial}</span>
								<span class="ws-name fades">{workspaceInfo.label}</span>
								<svg class="fades" viewBox="0 0 24 24" aria-hidden="true">{@html icons.chev}</svg>
							</button>
						{/snippet}
					</DropdownMenu.Trigger>
					<MenuContent minWidth={220}>
						<DropdownMenu.Group>
							<DropdownMenu.GroupHeading class="kit-menu-label">Workspaces</DropdownMenu.GroupHeading>
							<DropdownMenu.RadioGroup bind:value={workspace}>
								{#each WORKSPACES as w (w.value)}
									<MenuRadioItem value={w.value}>{w.label}</MenuRadioItem>
								{/each}
							</DropdownMenu.RadioGroup>
						</DropdownMenu.Group>
						<DropdownMenu.Separator class="kit-menu-sep" />
						<MenuItem onSelect={() => showToast('Invite link copied')}>Invite teammates</MenuItem>
					</MenuContent>
				</DropdownMenu.Root>
				{#if !collapsed}
					<span class="side-toggle" transition:fade={{ duration: 120 }}>
						<IconButton label="Collapse sidebar" keys={['⌘', 'B']} side="bottom" onclick={() => (railed = true)}>
							{@render panelIcon()}
						</IconButton>
					</span>
				{/if}
				</div>

				{#each nav as group (group.group)}
					<span class="nav-label">{group.group}</span>
					<nav class="nav" aria-label={group.group}>
						{#each group.items as item (item.label)}
							<Tip label={item.label} side="right" disabled={!collapsed}>
								{#snippet trigger({ props })}
									<button
										{...props}
										class="nav-item"
										aria-current={activeView === item.label ? 'page' : undefined}
										aria-label={collapsed ? item.label : undefined}
										type="button"
										onclick={() => (activeView = item.label)}
									>
										<svg viewBox="0 0 24 24" aria-hidden="true">{@html icons[item.icon]}</svg>
										<span class="fades">{item.label}</span>
										{#if item.live}
											<span class="nav-live fades"><i class="live-dot"></i>42</span>
										{:else if item.count != null}
											<span class="nav-count fades">{item.count}</span>
										{/if}
									</button>
								{/snippet}
							</Tip>
						{/each}
					</nav>
				{/each}

				<div class="usage fades">
					<div class="usage-top">
						<span class="usage-label">Events</span>
						<span class="usage-val">8.2M / 10M</span>
					</div>
					<div class="usage-bar"><i style="width:82%"></i></div>
					<span class="usage-note">Resets Nov 1</span>
				</div>

				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<button {...props} class="me" type="button">
								<span class="av av-blue">AK</span>
								<span class="me-txt fades">
									<span class="me-name">Aidan Kowalski</span>
									<span class="me-sub">Pro plan</span>
								</span>
								<svg class="me-more fades" viewBox="0 0 24 24" aria-hidden="true">{@html icons.more}</svg>
							</button>
						{/snippet}
					</DropdownMenu.Trigger>
					<MenuContent side="top" minWidth={216}>
						<MenuItem onSelect={() => showToast('Profile is read-only in this demo')}>Profile</MenuItem>
						<MenuItem onSelect={() => (railed = !railed)} keys={['⌘', 'B']}>{railed ? 'Expand sidebar' : 'Collapse sidebar'}</MenuItem>
						<DropdownMenu.Separator class="kit-menu-sep" />
						<MenuItem onSelect={() => showToast('Signed out (not really, it’s a demo)')}>Sign out</MenuItem>
					</MenuContent>
				</DropdownMenu.Root>
			</aside>
		{/snippet}
	</Sidebar>

	<!-- ===================== main ===================== -->
	<div class="main">
		<header class="topbar">
			{#if railed}
				<span class="rail-open" transition:fade={{ duration: 120 }}>
					<IconButton label="Expand sidebar" keys={['⌘', 'B']} side="bottom" onclick={() => (railed = false)}>
						{@render panelIcon()}
					</IconButton>
				</span>
			{/if}
			<div class="crumbs">
				<span>Analytics</span>
				<span class="crumb-sep">/</span>
				<span class="crumb-cur">{activeView}</span>
			</div>

			<label class="search">
				<svg viewBox="0 0 24 24" aria-hidden="true">{@html icons.search}</svg>
				<input type="text" placeholder="Filter pages…" aria-label="Filter top pages" bind:value={query} bind:this={searchEl} />
				<kbd class="key">/</kbd>
			</label>

			<div class="top-right">
				<div class="seg" role="tablist" aria-label="Date range">
					<span
						class="seg-thumb"
						style="transform: translateX({range * 100}%)"
						aria-hidden="true"
					></span>
					{#each ranges as r, i (r)}
						<button role="tab" aria-selected={range === i} class:on={range === i} onclick={() => (range = i)} type="button">{r}</button>
					{/each}
				</div>

				<span class="sep"></span>

				<DropdownMenu.Root>
					<Tip label="Date range" side="bottom">
						{#snippet trigger({ props: tipProps })}
							<DropdownMenu.Trigger {...tipProps}>
								{#snippet child({ props })}
									<button {...props} class="iconbtn" type="button" aria-label="Date range">
										<svg viewBox="0 0 24 24" aria-hidden="true">{@html icons.calendar}</svg>
									</button>
								{/snippet}
							</DropdownMenu.Trigger>
						{/snippet}
					</Tip>
					<MenuContent align="end" minWidth={200}>
						<DropdownMenu.RadioGroup value={rangeValue} onValueChange={setRange}>
							{#each RANGE_LABELS as label, i (label)}
								<MenuRadioItem value={String(i)} meta={ranges[i]}>{label}</MenuRadioItem>
							{/each}
						</DropdownMenu.RadioGroup>
					</MenuContent>
				</DropdownMenu.Root>
				<DropdownMenu.Root>
					<Tip label="Notifications" side="bottom">
						{#snippet trigger({ props: tipProps })}
							<DropdownMenu.Trigger {...tipProps}>
								{#snippet child({ props })}
									<button {...props} class="iconbtn bell" type="button" aria-label="Notifications, {unreadCount} unread">
										<svg viewBox="0 0 24 24" aria-hidden="true">{@html icons.bell}</svg>
										{#if unreadCount}<i class="bell-dot" out:fade={{ duration: 150 }}></i>{/if}
									</button>
								{/snippet}
							</DropdownMenu.Trigger>
						{/snippet}
					</Tip>
					<MenuContent align="end" minWidth={280}>
						<DropdownMenu.Group>
							<DropdownMenu.GroupHeading class="kit-menu-label">Notifications</DropdownMenu.GroupHeading>
							{#each notifications as n (n.id)}
								<MenuItem onSelect={() => (n.unread = false)} closeOnSelect={false} meta={n.time}>
									<span class="note-dot" class:unread={n.unread}></span>
									<span class="note-text">{n.text}</span>
								</MenuItem>
							{/each}
						</DropdownMenu.Group>
						<DropdownMenu.Separator class="kit-menu-sep" />
						<MenuItem onSelect={markAllRead} disabled={unreadCount === 0}>Mark all as read</MenuItem>
					</MenuContent>
				</DropdownMenu.Root>
				<DropdownMenu.Root>
					<Tip label="Help" side="bottom">
						{#snippet trigger({ props: tipProps })}
							<DropdownMenu.Trigger {...tipProps}>
								{#snippet child({ props })}
									<button {...props} class="iconbtn" type="button" aria-label="Help">
										<svg viewBox="0 0 24 24" aria-hidden="true">{@html icons.help}</svg>
									</button>
								{/snippet}
							</DropdownMenu.Trigger>
						{/snippet}
					</Tip>
					<MenuContent align="end" minWidth={208}>
						<MenuItem onSelect={() => showToast('Docs open in a new tab in the real app')}>Documentation</MenuItem>
						<MenuItem onSelect={() => showToast('⌘B sidebar · / filter pages')} keys={['?']}>Keyboard shortcuts</MenuItem>
						<MenuItem onSelect={() => showToast('Support replies within a day')}>Contact support</MenuItem>
					</MenuContent>
				</DropdownMenu.Root>

				<span class="sep"></span>

				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<button {...props} class="btn btn-primary" type="button">
								<svg viewBox="0 0 24 24" aria-hidden="true">{@html icons.download}</svg>
								Export
							</button>
						{/snippet}
					</DropdownMenu.Trigger>
					<MenuContent align="end" minWidth={196}>
						<MenuItem onSelect={exportCsv} meta=".csv">Top pages</MenuItem>
						<MenuItem onSelect={() => showToast('PNG export is not part of this demo')} meta=".png">Sessions chart</MenuItem>
					</MenuContent>
				</DropdownMenu.Root>
			</div>
		</header>

		<div class="content">
			<!-- header row -->
			<div class="head enter" style="--i:0">
				<div>
					<h1>{activeView}</h1>
					<p class="sub">{RANGE_LABELS[range]} · {segmentLabel} · {sourceLabel}</p>
				</div>
				<div class="filters">
					{@render chipMenu('Range', RANGE_LABELS[range], rangeValue, setRange, RANGE_LABELS.map((label, i) => ({ value: String(i), label })))}
					{@render chipMenu('Segment', segmentLabel, segment, (v) => (segment = v), SEGMENTS)}
					{@render chipMenu('Source', sourceLabel, source, (v) => (source = v), SOURCES)}
					<span class="sep"></span>
					<span class="cmp">
						<span class="cmp-k">Compare</span>
						<Switch.Root
							class="switch"
							bind:checked={compare}
							aria-label="Compare to previous period"
						>
							<Switch.Thumb class="thumb" />
						</Switch.Root>
					</span>
				</div>
			</div>

			<!-- KPI row -->
			<section class="kpis enter" style="--i:1">
				{#each kpis as k (k.label)}
					<div class="card kpi">
						<span class="kpi-label">{k.label}</span>
						<span class="kpi-value">{k.value}</span>
						<span class="kpi-row">
							<span class="pill" class:pill-up={k.up} class:pill-dn={!k.up}>{k.delta}</span>
							<span class="kpi-note">{k.note}</span>
						</span>
					</div>
				{/each}
			</section>

			<!-- chart + sources -->
			<section class="row enter" style="--i:2">
				<div class="card span8">
					<div class="chead">
						<div>
							<h2>Sessions</h2>
							<p class="csub">Daily · Oct 5 – Nov 3</p>
						</div>
						<div class="legend">
							<span><i class="lg-dot lg-accent"></i>Current period</span>
							<span class:dim={!compare}><i class="lg-dot lg-prev"></i>Previous period</span>
						</div>
					</div>
					<div class="plotwrap">
						<div class="yl">
							{#each yTicks as t (t.v)}
								<span class="ylab" style="top:{((H - (t.v / MAX) * H) / H) * 100}%">{t.l}</span>
							{/each}
						</div>
						<div>
							<div class="plot">
								<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
									<defs>
										<linearGradient id="g-sessions" x1="0" y1="0" x2="0" y2="1">
											<stop offset="0%" stop-color="#8ecaff" stop-opacity="0.15" />
											<stop offset="100%" stop-color="#8ecaff" stop-opacity="0" />
										</linearGradient>
									</defs>
									{#each yTicks as t (t.v)}
										<line
											x1="0"
											x2={W}
											y1={(H - (t.v / MAX) * H).toFixed(1)}
											y2={(H - (t.v / MAX) * H).toFixed(1)}
											class="gridline"
											vector-effect="non-scaling-stroke"
										/>
									{/each}
									<path d={areaPath} fill="url(#g-sessions)" />
									<path
										d={prevPath}
										class="prevline"
										vector-effect="non-scaling-stroke"
										style="opacity: {compare ? 1 : 0}"
									/>
									<path d={curPath} class="curline" vector-effect="non-scaling-stroke" />
								</svg>
								<i class="dot" style="left:{tipX}%; top:{tipY}%"></i>
								<div class="tip" style="left:{tipX}%; top:{tipY}%">
									<span class="tip-date">Oct 31, 2026</span>
									<span class="tip-val"><i class="lg-dot lg-accent"></i>5,214 sessions</span>
									<span class="tip-delta">▲ +43.2% vs prev period</span>
								</div>
							</div>
							<div class="xlab">
								{#each xTicks as t (t.i)}
									<span
										style="left:{(t.i / 29) * 100}%; transform: translateX({t.i === 0
											? '0%'
											: t.i === 29
												? '-100%'
												: '-50%'})"
									>{t.l}</span>
								{/each}
							</div>
						</div>
					</div>
				</div>

				<div class="card span4">
					<div class="chead">
						<div>
							<h2>Traffic sources</h2>
							<p class="csub">Share of sessions</p>
						</div>
					</div>
					<div class="src-list">
						{#each sources as s (s.name)}
							<div class="src">
								<span class="src-name">{s.name}</span>
								<span class="src-track"><i style="width:{s.pct * 2.4}%"></i></span>
								<span class="src-pct">{s.pct}%</span>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<!-- pages + conversions -->
			<section class="row enter" style="--i:3">
				<div class="card span8">
					<div class="chead">
						<div>
							<h2>Top pages</h2>
							<p class="csub">By views</p>
						</div>
						<button class="linkbtn" type="button" onclick={() => (activeView = 'Reports')}>
							Full report
							<svg viewBox="0 0 24 24" aria-hidden="true">
								<path d="M7 17 17 7" /><path d="M7 7h10v10" />
							</svg>
						</button>
					</div>
					<div class="pages-table">
						<div class="thead">
							<span>Page</span>
							<span class="num">Views</span>
							<span class="ctr">Change</span>
							<span>Share</span>
							<span></span>
						</div>
						{#each visiblePages as p (p.path)}
							<div class="trow">
								<span class="tpath">{p.path}</span>
								<span class="num tviews">{p.views}</span>
								<span class="ctr">
									<span class="pill" class:pill-up={p.up} class:pill-dn={!p.up}>{p.delta}</span>
								</span>
								<span class="tshare">
									<i class="share-bar"><i style="width:{(p.share / 24.3) * 100}%"></i></i>
									<span class="share-num">{p.share.toFixed(1)}%</span>
								</span>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger>
										{#snippet child({ props })}
											<button {...props} class="rowbtn" type="button" aria-label="Actions for {p.path}">
												<svg viewBox="0 0 24 24" aria-hidden="true">{@html icons.more}</svg>
											</button>
										{/snippet}
									</DropdownMenu.Trigger>
									<MenuContent align="end" minWidth={180}>
										<MenuItem onSelect={() => copyUrl(p.path)}>Copy URL</MenuItem>
										<MenuItem onSelect={() => (query = p.path)}>Filter to this page</MenuItem>
									</MenuContent>
								</DropdownMenu.Root>
							</div>
						{:else}
							<div class="tempty" in:fade={{ duration: 150 }}>
								No pages match “{query.trim()}”.
								<button class="linkbtn" type="button" onclick={() => (query = '')}>Clear filter</button>
							</div>
						{/each}
					</div>
				</div>

				<div class="card span4">
					<div class="chead">
						<div>
							<h2>Recent conversions</h2>
							<p class="csub">Last 24 hours</p>
						</div>
						<span class="liveflag"><i class="live-dot"></i>Live</span>
					</div>
					<div class="conv-list">
						{#each convs as c (c.name)}
							<div class="crow">
								<span class="av av-{c.hue}">{c.init}</span>
								<span class="cwho">
									<span class="cname">{c.name}</span>
									<span class="tag tag-{c.hue === 'blue' ? 'blue' : c.plan === 'Business' ? 'green' : 'amber'}">{c.plan}</span>
								</span>
								<span class="csrc">{c.src}</span>
								<span class="camt">{c.amt}</span>
								<span class="ctime">{c.time}</span>
							</div>
						{/each}
					</div>
				</div>
			</section>

			<footer class="foot enter" style="--i:4">
				<span>Updated 2 min ago · All times UTC−05</span>
				<span>{workspaceInfo.label} · Analytics v2.4.1</span>
			</footer>
		</div>
	</div>

	{#if toast}
		{#key toast.id}
			<div class="toast" role="status" in:fly={{ y: 12, duration: 240, easing: cubicOut }} out:fade={{ duration: 140 }}>{toast.text}</div>
		{/key}
	{/if}
</div>
</KitRoot>

{#snippet panelIcon()}
	<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16" /></svg>
{/snippet}

{#snippet chipMenu(key: string, current: string, value: string, onChange: (value: string) => void, options: readonly { value: string; label: string }[])}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<button {...props} class="chip" type="button">
					<span class="chip-k">{key}</span>
					<span class="chip-v">{current}</span>
					<svg viewBox="0 0 24 24" aria-hidden="true">{@html icons.chev}</svg>
				</button>
			{/snippet}
		</DropdownMenu.Trigger>
		<MenuContent minWidth={180}>
			<DropdownMenu.RadioGroup {value} onValueChange={onChange}>
				{#each options as o (o.value)}
					<MenuRadioItem value={o.value}>{o.label}</MenuRadioItem>
				{/each}
			</DropdownMenu.RadioGroup>
		</MenuContent>
	</DropdownMenu.Root>
{/snippet}

<style>
	/* ---------- tokens (giga-ui dark set, light-blue accent) ---------- */
	.dash {
		--bg: #0d0d0d;
		--surface: #141414;
		--raised: #1c1c1c;
		--elev: #242424;
		--line: rgb(255 255 255 / 0.08);
		--line2: rgb(255 255 255 / 0.14);
		--fg: #fafafa;
		--fg2: #a1a1a1;
		--fg3: #6b6b6b;
		--accent: #8ecaff;
		--accent-hover: #a7d6ff;
		--accent-fg: #0a1626;
		--ring: rgb(142 202 255 / 0.3);
		--up: #4ade80;
		--up-bg: rgb(74 222 128 / 0.1);
		--up-ring: rgb(74 222 128 / 0.24);
		--dn: #f87171;
		--dn-bg: rgb(248 113 113 / 0.1);
		--dn-ring: rgb(248 113 113 / 0.24);
		--ease: cubic-bezier(0.23, 1, 0.32, 1);

		display: flex;
		min-height: 100dvh;
		background: var(--bg);
		color: var(--fg);
		font-family: 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif;
		font-size: 13px;
		line-height: 1.4;
		font-feature-settings: 'cv11', 'ss01';
		-webkit-font-smoothing: antialiased;
	}

	.dash svg {
		width: 15px;
		height: 15px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
		flex-shrink: 0;
	}

	/* KitRoot wrapper: no box of its own, it only themes the portalled menus and tooltips */
	:global(.dash-kit) {
		display: contents;
		font-family: 'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif;
		--kit-pop-bg: #1c1c1c;
		--kit-pop-text: #fafafa;
		--kit-pop-muted: #a1a1a1;
		--kit-pop-line: rgb(255 255 255 / 0.08);
		--kit-pop-shadow: 0 0 0 1px rgb(255 255 255 / 0.1), 0 12px 32px -8px rgb(0 0 0 / 0.6), 0 4px 8px -4px rgb(0 0 0 / 0.4);
		--kit-pop-radius: 10px;
		--kit-item-radius: 6px;
		--kit-item-height: 28px;
		--kit-item-hover: rgb(255 255 255 / 0.06);
		--kit-accent: #8ecaff;
		--kit-danger: #f87171;
		--kit-danger-bg: rgb(248 113 113 / 0.1);
		--kit-success: #4ade80;
		--kit-tip-bg: #2a2a2a;
		--kit-tip-text: #fafafa;
		--kit-key-bg: rgb(255 255 255 / 0.08);
		--kit-icon-btn-size: 28px;
		--kit-icon-btn-radius: 7px;
		--kit-icon-btn-color: #a1a1a1;
		--kit-icon-btn-hover-bg: rgb(255 255 255 / 0.06);
		--kit-icon-btn-hover-color: #fafafa;
		--kit-handle: rgb(255 255 255 / 0.14);
		--kit-handle-active: #8ecaff;
	}

	.dash :where(button, input, [role='tab']):focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	/* ---------- shared primitives ---------- */
	.card {
		background: var(--surface);
		border-radius: 12px;
		box-shadow: 0 0 0 1px var(--line);
		padding: 12px 14px;
		min-width: 0;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 28px;
		padding: 0 10px;
		border: 0;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		user-select: none;
		transition:
			background 150ms var(--ease),
			box-shadow 150ms var(--ease),
			color 150ms var(--ease),
			transform 150ms var(--ease);
	}
	.btn:active {
		transform: scale(0.97);
	}
	.btn-primary {
		background: var(--accent);
		color: var(--accent-fg);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.35),
			0 1px 2px rgb(0 0 0 / 0.4),
			0 0 0 1px rgb(142 202 255 / 0.5);
	}
	.btn-primary:hover {
		background: var(--accent-hover);
	}

	.iconbtn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border: 0;
		border-radius: 8px;
		background: none;
		color: var(--fg2);
		transition:
			background 150ms var(--ease),
			color 150ms var(--ease),
			transform 150ms var(--ease);
	}
	.iconbtn:hover,
	.iconbtn[data-state='open'] {
		background: rgb(255 255 255 / 0.06);
		color: var(--fg);
	}
	.iconbtn:active {
		transform: scale(0.94);
	}

	.pill {
		display: inline-flex;
		align-items: center;
		height: 18px;
		padding: 0 6px;
		border-radius: 6px;
		font-size: 11px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.pill-up {
		color: var(--up);
		background: var(--up-bg);
		box-shadow: inset 0 0 0 1px var(--up-ring);
	}
	.pill-dn {
		color: var(--dn);
		background: var(--dn-bg);
		box-shadow: inset 0 0 0 1px var(--dn-ring);
	}

	.key {
		display: inline-flex;
		align-items: center;
		height: 17px;
		padding: 0 5px;
		border-radius: 5px;
		background: var(--raised);
		box-shadow: 0 0 0 1px var(--line);
		font-size: 11px;
		color: var(--fg3);
	}

	.sep {
		width: 1px;
		height: 16px;
		background: var(--line);
		flex-shrink: 0;
	}

	/* ---------- sidebar ---------- */
	/*
	 * Flush shell: the sidebar is its own surface with a hairline, flush to the viewport edge.
	 * Rows share one icon column (centred 30px from the edge) and one text column (48px),
	 * so the tile, nav icons and avatar stay put when the sidebar folds to a rail.
	 */
	:global(.dash .side-col) {
		position: sticky;
		top: 0;
		height: 100dvh;
	}
	.side {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
		padding: 10px;
		background: var(--surface);
		border-right: 1px solid var(--line);
		overflow: hidden auto;
		white-space: nowrap;
	}
	.fades {
		transition: opacity 150ms var(--ease);
	}
	.rail .fades,
	.rail .nav-label {
		opacity: 0;
		pointer-events: none;
	}

	/* one highlight that slides between items (positioned by the navPill action) */
	.nav-pill {
		position: absolute;
		top: 0;
		left: 10px;
		right: 10px;
		height: var(--pill-h, 32px);
		border-radius: 8px;
		background: #1f1f1f;
		box-shadow:
			inset 0 0 0 1px var(--line),
			inset 0 1px 0 rgb(255 255 255 / 0.04);
		transform: translateY(var(--pill-y, 0));
		pointer-events: none;
	}
	.side:global([data-pill-ready]) .nav-pill {
		transition:
			transform 260ms cubic-bezier(0.2, 0.9, 0.25, 1.05),
			opacity 150ms var(--ease);
	}
	.side:global([data-pill='none']) .nav-pill {
		opacity: 0;
	}

	.side-top {
		display: flex;
		align-items: center;
		gap: 2px;
		margin-bottom: 4px;
	}
	.side-toggle,
	.rail-open {
		display: flex;
	}
	.ws {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 6px;
		height: 40px;
		min-width: 0;
		padding: 0 6px 0 8px;
		overflow: hidden;
		border: 0;
		border-radius: 8px;
		background: none;
		text-align: left;
		transition: background 150ms var(--ease);
	}
	.ws:hover,
	.ws[data-state='open'] {
		background: rgb(255 255 255 / 0.04);
	}
	.ws svg {
		width: 13px;
		height: 13px;
		color: var(--fg3);
	}
	.tile {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 24px;
		height: 24px;
		border-radius: 7px;
		background: linear-gradient(135deg, #a7d6ff, #5aa9f7);
		color: var(--accent-fg);
		font-size: 12px;
		font-weight: 700;
		box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.4);
	}
	.ws-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 13px;
		font-weight: 500;
		color: var(--fg);
	}

	.nav-label {
		padding: 0 12px;
		transition: opacity 150ms var(--ease);
		margin: 18px 0 4px;
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--fg3);
	}
	.nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.nav-item {
		position: relative;
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		height: 32px;
		padding: 0 10px 0 12px;
		border: 0;
		border-radius: 8px;
		background: none;
		color: var(--fg2);
		font-size: 13px;
		text-align: left;
		transition:
			background 150ms var(--ease),
			color 150ms var(--ease);
	}
	.nav-item svg {
		width: 16px;
		height: 16px;
		color: var(--fg3);
		transition: color 150ms var(--ease);
	}
	.nav-item:hover {
		background: rgb(255 255 255 / 0.035);
		color: var(--fg);
	}
	.nav-item[aria-current='page'] {
		color: var(--fg);
	}
	/* the sliding pill already paints the current item */
	.nav-item[aria-current='page']:hover {
		background: transparent;
	}
	.nav-item:hover svg,
	.nav-item[aria-current='page'] svg {
		color: var(--fg);
	}
	.nav-count {
		margin-left: auto;
		font-size: 11px;
		color: var(--fg3);
		font-variant-numeric: tabular-nums;
	}
	.nav-live {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		margin-left: auto;
		font-size: 11px;
		color: var(--up);
		font-variant-numeric: tabular-nums;
	}
	.live-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		background: var(--up);
		animation: pulse 2s ease-in-out infinite;
	}
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.35;
		}
	}

	.usage {
		margin-top: auto;
		padding: 10px;
		border-radius: 10px;
		background: var(--raised);
		box-shadow: inset 0 0 0 1px var(--line);
	}
	.usage-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}
	.usage-label {
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--fg3);
	}
	.usage-val {
		font-size: 12px;
		color: var(--fg2);
		font-variant-numeric: tabular-nums;
	}
	.usage-bar {
		height: 3px;
		margin-top: 8px;
		border-radius: 9999px;
		background: rgb(255 255 255 / 0.08);
		overflow: hidden;
	}
	.usage-bar i {
		display: block;
		height: 100%;
		border-radius: 9999px;
		background: var(--accent);
	}
	.usage-note {
		display: block;
		margin-top: 6px;
		font-size: 11px;
		color: var(--fg3);
	}

	.me {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		height: 44px;
		margin-top: 8px;
		padding: 0 8px;
		overflow: hidden;
		border: 0;
		border-radius: 8px;
		background: none;
		text-align: left;
		transition: background 150ms var(--ease);
	}
	.me:hover,
	.me[data-state='open'] {
		background: rgb(255 255 255 / 0.04);
	}
	.me-txt {
		flex: 1;
		min-width: 0;
		overflow: hidden;
	}
	.me-name {
		display: block;
		font-size: 12px;
		font-weight: 500;
		color: var(--fg);
	}
	.me-sub {
		display: block;
		font-size: 11px;
		color: var(--fg3);
	}
	.me-more {
		flex-shrink: 0;
		color: var(--fg3);
	}
	.me .av {
		width: 24px;
		height: 24px;
	}

	/* ---------- avatars & tags ---------- */
	.av {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 22px;
		height: 22px;
		border-radius: 9999px;
		font-size: 10px;
		font-weight: 600;
	}
	.av-blue {
		color: #8ecaff;
		background: rgb(142 202 255 / 0.15);
		box-shadow: inset 0 0 0 1px rgb(142 202 255 / 0.25);
	}
	.av-green {
		color: #4ade80;
		background: rgb(74 222 128 / 0.14);
		box-shadow: inset 0 0 0 1px rgb(74 222 128 / 0.24);
	}
	.av-amber {
		color: #fbbf24;
		background: rgb(251 191 36 / 0.14);
		box-shadow: inset 0 0 0 1px rgb(251 191 36 / 0.24);
	}
	.av-rose {
		color: #fb7185;
		background: rgb(251 113 133 / 0.14);
		box-shadow: inset 0 0 0 1px rgb(251 113 133 / 0.24);
	}
	.av-violet {
		color: #a78bfa;
		background: rgb(167 139 250 / 0.14);
		box-shadow: inset 0 0 0 1px rgb(167 139 250 / 0.24);
	}

	.tag {
		display: inline-flex;
		align-items: center;
		height: 16px;
		padding: 0 5px;
		border-radius: 5px;
		font-size: 10.5px;
		font-weight: 500;
		white-space: nowrap;
	}
	.tag-blue {
		color: #8ecaff;
		background: rgb(142 202 255 / 0.1);
		box-shadow: inset 0 0 0 1px rgb(142 202 255 / 0.22);
	}
	.tag-green {
		color: #4ade80;
		background: rgb(74 222 128 / 0.1);
		box-shadow: inset 0 0 0 1px rgb(74 222 128 / 0.22);
	}
	.tag-amber {
		color: #fbbf24;
		background: rgb(251 191 36 / 0.1);
		box-shadow: inset 0 0 0 1px rgb(251 191 36 / 0.22);
	}

	/* ---------- main column ---------- */
	.main {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
		height: 100dvh;
	}

	.topbar {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-shrink: 0;
		height: 48px;
		padding: 0 16px;
		border-bottom: 1px solid var(--line);
	}
	.crumbs {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 12.5px;
		color: var(--fg3);
		white-space: nowrap;
	}
	.crumb-sep {
		color: var(--fg3);
		opacity: 0.6;
	}
	.crumb-cur {
		color: var(--fg);
		font-weight: 500;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 260px;
		height: 28px;
		padding: 0 6px 0 9px;
		border-radius: 8px;
		background: var(--surface);
		box-shadow: inset 0 0 0 1px var(--line);
		color: var(--fg3);
		cursor: text;
		transition: box-shadow 150ms var(--ease);
	}
	.search:focus-within {
		box-shadow:
			inset 0 0 0 1px rgb(142 202 255 / 0.55),
			0 0 0 3px var(--ring);
	}
	.search svg {
		width: 13px;
		height: 13px;
	}
	.search input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: none;
		outline: none;
		color: var(--fg);
		font: inherit;
		font-size: 12.5px;
	}
	.search input::placeholder {
		color: var(--fg3);
	}
	.search input:focus-visible {
		outline: none;
	}

	.top-right {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: auto;
	}
	.bell {
		position: relative;
	}
	.note-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		background: transparent;
		flex-shrink: 0;
		transition: background 150ms var(--kit-ease-out);
	}
	.note-dot.unread {
		background: var(--kit-accent);
	}
	.note-text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.rail-open {
		margin-left: -6px;
	}
	.toast {
		position: fixed;
		right: 20px;
		bottom: 20px;
		z-index: 60;
		padding: 9px 14px;
		border-radius: 10px;
		background: var(--elev);
		color: var(--fg);
		font-size: 12.5px;
		box-shadow:
			0 0 0 1px var(--line2),
			0 12px 32px -8px rgb(0 0 0 / 0.6);
	}
	.bell-dot {
		position: absolute;
		top: 6px;
		right: 7px;
		width: 5px;
		height: 5px;
		border-radius: 9999px;
		background: var(--accent);
		box-shadow: 0 0 0 2px var(--bg);
	}

	/* segmented control */
	.seg {
		position: relative;
		display: flex;
		height: 28px;
		padding: 2px;
		border-radius: 8px;
		background: var(--raised);
		box-shadow: inset 0 0 0 1px var(--line);
	}
	.seg-thumb {
		position: absolute;
		top: 2px;
		bottom: 2px;
		left: 2px;
		width: calc((100% - 4px) / 4);
		border-radius: 6px;
		background: #2e2e2e;
		box-shadow:
			0 1px 2px rgb(0 0 0 / 0.4),
			0 0 0 1px rgb(255 255 255 / 0.1);
		transition: transform 200ms var(--ease);
	}
	.seg button {
		position: relative;
		z-index: 1;
		width: 44px;
		border: 0;
		background: none;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
		color: var(--fg2);
		transition: color 150ms var(--ease);
	}
	.seg button:hover {
		color: var(--fg);
	}
	.seg button.on {
		color: var(--fg);
	}

	/* ---------- content ---------- */
	.content {
		display: flex;
		flex-direction: column;
		gap: 12px;
		flex: 1;
		min-height: 0;
		padding: 14px 16px 12px;
		overflow-y: auto;
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}
	h1 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.1;
	}
	.sub {
		margin: 3px 0 0;
		font-size: 12px;
		color: var(--fg3);
	}

	.filters {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 28px;
		padding: 0 8px 0 10px;
		border: 0;
		border-radius: 8px;
		background: linear-gradient(#1c1c1c, #171717);
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.06),
			0 0 0 1px var(--line);
		font-size: 12px;
		transition: box-shadow 150ms var(--ease);
	}
	.chip:hover,
	.chip[data-state='open'] {
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.06),
			0 0 0 1px var(--line2);
	}
	.chip svg {
		width: 12px;
		height: 12px;
		color: var(--fg3);
	}
	.chip-k {
		color: var(--fg3);
	}
	.chip-v {
		color: var(--fg);
		font-weight: 500;
	}

	.cmp {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 28px;
		padding: 0 4px 0 10px;
	}
	.cmp-k {
		font-size: 12px;
		color: var(--fg2);
	}
	.cmp :global(.switch) {
		display: inline-flex;
		align-items: center;
		width: 32px;
		height: 18px;
		padding: 2px;
		border: 0;
		border-radius: 9999px;
		background: var(--raised);
		box-shadow: inset 0 0 0 1px var(--line);
		transition: background 150ms var(--ease), box-shadow 150ms var(--ease);
	}
	.cmp :global(.switch[data-state='checked']) {
		background: var(--accent);
		box-shadow: inset 0 0 0 1px rgb(142 202 255 / 0.5);
	}
	.cmp :global(.thumb) {
		display: block;
		width: 14px;
		height: 14px;
		border-radius: 9999px;
		background: var(--fg2);
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.4);
		transition:
			transform 200ms var(--ease),
			background 150ms var(--ease);
		transform: translateX(0);
	}
	.cmp :global(.switch[data-state='checked'] .thumb) {
		transform: translateX(14px);
		background: var(--accent-fg);
	}

	/* KPI row */
	.kpis {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
	}
	.kpi {
		display: flex;
		flex-direction: column;
	}
	.kpi-label {
		font-size: 12px;
		color: var(--fg2);
	}
	.kpi-value {
		margin-top: 6px;
		font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
		font-size: 21px;
		font-weight: 500;
		letter-spacing: -0.01em;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	.kpi-row {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 9px;
	}
	.kpi-note {
		font-size: 11px;
		color: var(--fg3);
	}

	/* rows */
	.row {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		gap: 12px;
	}
	.span8 {
		grid-column: span 8;
	}
	.span4 {
		grid-column: span 4;
	}

	.chead {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}
	h2 {
		margin: 0;
		font-size: 13px;
		font-weight: 500;
		line-height: 1.2;
	}
	.csub {
		margin: 2px 0 0;
		font-size: 11px;
		color: var(--fg3);
	}

	.linkbtn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		height: 24px;
		padding: 0 6px;
		border: 0;
		border-radius: 6px;
		background: none;
		font-size: 12px;
		font-weight: 500;
		color: var(--accent);
		transition: background 150ms var(--ease);
	}
	.linkbtn:hover {
		background: rgb(142 202 255 / 0.08);
	}
	.linkbtn svg {
		width: 12px;
		height: 12px;
	}

	.liveflag {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 20px;
		padding: 0 8px;
		border-radius: 9999px;
		font-size: 11px;
		font-weight: 500;
		color: var(--up);
		background: var(--up-bg);
		box-shadow: inset 0 0 0 1px var(--up-ring);
	}

	/* ---------- chart ---------- */
	.plotwrap {
		display: grid;
		grid-template-columns: 34px 1fr;
		gap: 8px;
		margin-top: 14px;
	}
	.yl {
		position: relative;
	}
	.ylab {
		position: absolute;
		right: 0;
		transform: translateY(-50%);
		font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
		font-size: 10.5px;
		color: var(--fg3);
		font-variant-numeric: tabular-nums;
	}
	.ylab:last-child {
		transform: translateY(-100%);
	}
	.plot {
		position: relative;
		height: 210px;
	}
	.plot svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.gridline {
		stroke: rgb(255 255 255 / 0.06);
		stroke-width: 1;
	}
	.curline {
		fill: none;
		stroke: var(--accent);
		stroke-width: 1.5;
	}
	.prevline {
		fill: none;
		stroke: rgb(255 255 255 / 0.32);
		stroke-width: 1.5;
		stroke-dasharray: 4 4;
		transition: opacity 200ms var(--ease);
	}

	.dot {
		position: absolute;
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		background: var(--accent);
		box-shadow:
			0 0 0 3px rgb(142 202 255 / 0.18),
			0 0 0 1px rgb(142 202 255 / 0.8);
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	.tip {
		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 7px 10px;
		border-radius: 10px;
		background: var(--elev);
		box-shadow:
			0 0 0 1px rgb(255 255 255 / 0.1),
			0 12px 32px -8px rgb(0 0 0 / 0.65),
			0 2px 6px rgb(0 0 0 / 0.3);
		transform: translate(calc(-100% - 16px), -50%);
		pointer-events: none;
		white-space: nowrap;
	}
	.tip-date {
		font-size: 10.5px;
		color: var(--fg3);
	}
	.tip-val {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
		font-size: 12px;
		color: var(--fg);
		font-variant-numeric: tabular-nums;
	}
	.tip-delta {
		font-size: 10.5px;
		color: var(--up);
	}

	.lg-dot {
		display: inline-block;
		width: 7px;
		height: 7px;
		border-radius: 9999px;
	}
	.lg-accent {
		background: var(--accent);
	}
	.lg-prev {
		background: rgb(255 255 255 / 0.35);
	}
	.legend {
		display: flex;
		align-items: center;
		gap: 14px;
		padding-top: 2px;
		font-size: 11.5px;
		color: var(--fg2);
	}
	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		transition: opacity 200ms var(--ease);
	}
	.legend .dim {
		opacity: 0.4;
	}

	.xlab {
		position: relative;
		height: 16px;
		margin-top: 6px;
		font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
		font-size: 10.5px;
		color: var(--fg3);
		font-variant-numeric: tabular-nums;
	}
	.xlab span {
		position: absolute;
		top: 0;
		white-space: nowrap;
	}

	/* ---------- sources ---------- */
	.src-list {
		display: flex;
		flex-direction: column;
		margin-top: 10px;
	}
	.src {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 32px;
	}
	.src-name {
		width: 96px;
		font-size: 12px;
		color: var(--fg2);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.src-track {
		position: relative;
		flex: 1;
		height: 3px;
		border-radius: 9999px;
		background: rgb(255 255 255 / 0.08);
		overflow: hidden;
	}
	.src-track i {
		position: absolute;
		inset: 0 auto 0 0;
		border-radius: 9999px;
		background: var(--accent);
	}
	.src-pct {
		width: 30px;
		text-align: right;
		font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
		font-size: 12px;
		color: var(--fg);
		font-variant-numeric: tabular-nums;
	}

	/* ---------- table ---------- */
	.pages-table {
		margin-top: 10px;
	}
	.thead,
	.trow {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 64px 62px 108px 22px;
		gap: 10px;
		align-items: center;
	}
	.thead {
		height: 28px;
		border-bottom: 1px solid var(--line);
		font-size: 10.5px;
		font-weight: 500;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--fg3);
	}
	.trow {
		height: 36px;
		border-bottom: 1px solid var(--line);
		transition: background 150ms var(--ease);
	}
	.trow:last-child {
		border-bottom: 0;
	}
	.trow:hover {
		background: rgb(255 255 255 / 0.03);
	}
	.tpath {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 12.5px;
		font-weight: 500;
		color: var(--fg);
		font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
	}
	.num {
		text-align: right;
		font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
		font-size: 12px;
		color: var(--fg);
		font-variant-numeric: tabular-nums;
	}
	.ctr {
		text-align: right;
	}
	.tshare {
		display: flex;
		align-items: center;
		gap: 8px;
		justify-content: flex-end;
	}
	.share-bar {
		position: relative;
		display: block;
		width: 40px;
		height: 3px;
		border-radius: 9999px;
		background: rgb(255 255 255 / 0.08);
		overflow: hidden;
	}
	.share-bar i {
		position: absolute;
		inset: 0 auto 0 0;
		border-radius: 9999px;
		background: rgb(255 255 255 / 0.35);
	}
	.share-num {
		width: 40px;
		font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
		font-size: 11px;
		color: var(--fg2);
		font-variant-numeric: tabular-nums;
	}
	.rowbtn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border: 0;
		border-radius: 6px;
		background: none;
		color: var(--fg3);
		opacity: 0;
		transition:
			opacity 150ms var(--ease),
			background 150ms var(--ease),
			color 150ms var(--ease);
	}
	.rowbtn svg {
		width: 13px;
		height: 13px;
	}
	.trow:hover .rowbtn,
	.rowbtn:focus-visible,
	.rowbtn[data-state='open'] {
		opacity: 1;
	}
	.tempty {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 14px 4px;
		color: var(--fg2);
	}
	.rowbtn:hover,
	.rowbtn[data-state='open'] {
		background: rgb(255 255 255 / 0.07);
		color: var(--fg);
	}

	/* ---------- conversions ---------- */
	.conv-list {
		display: flex;
		flex-direction: column;
		margin-top: 8px;
	}
	.crow {
		display: flex;
		align-items: center;
		gap: 9px;
		height: 42px;
		border-bottom: 1px solid var(--line);
		transition: background 150ms var(--ease);
	}
	.crow:last-child {
		border-bottom: 0;
	}
	.crow:hover {
		background: rgb(255 255 255 / 0.03);
	}
	.cwho {
		display: flex;
		align-items: center;
		gap: 6px;
		flex: 1;
		min-width: 0;
	}
	.cname {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 12.5px;
		font-weight: 500;
		color: var(--fg);
	}
	.csrc {
		width: 62px;
		font-size: 11.5px;
		color: var(--fg3);
	}
	.camt {
		width: 38px;
		text-align: right;
		font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
		font-size: 12.5px;
		color: var(--fg);
		font-variant-numeric: tabular-nums;
	}
	.ctime {
		width: 28px;
		text-align: right;
		font-size: 11px;
		color: var(--fg3);
	}

	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		font-size: 11px;
		color: var(--fg3);
	}

	/* ---------- motion: single orchestrated reveal ---------- */
	.enter {
		animation: rise 450ms var(--ease) backwards;
		animation-delay: calc(var(--i, 0) * 40ms + 60ms);
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.enter {
			animation: none;
		}
		.live-dot {
			animation: none;
		}
	}

	/* ---------- responsive ---------- */
	@media (max-width: 1180px) {
		.kpis {
			grid-template-columns: repeat(2, 1fr);
		}
		.row {
			grid-template-columns: 1fr;
		}
		.span8,
		.span4 {
			grid-column: auto;
		}
	}
	@media (max-width: 880px) {
		:global(.dash .side-col),
		.rail-open {
			display: none;
		}
		.search {
			display: none;
		}
	}
</style>
