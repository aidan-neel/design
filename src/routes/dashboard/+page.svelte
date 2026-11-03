<script lang="ts">
	import '@fontsource-variable/inter';
	import IconButton from '#lib/kit/IconButton.svelte';
	import KitRoot from '#lib/kit/KitRoot.svelte';
	import MenuContent from '#lib/kit/MenuContent.svelte';
	import MenuItem from '#lib/kit/MenuItem.svelte';
	import MenuRadioItem from '#lib/kit/MenuRadioItem.svelte';
	import Sidebar from '#lib/kit/Sidebar.svelte';
	import Tip from '#lib/kit/Tip.svelte';
	import { DropdownMenu } from 'bits-ui';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';

	const ICONS = {
		grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
		pulse: '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
		funnel: '<path d="M3 4h18l-7 8v6l-4 2v-8L3 4z"/>',
		users:
			'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>',
		retention: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
		segments: '<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.4 6.4"/>',
		revenue: '<path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
		reports:
			'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
		alerts:
			'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
		sources:
			'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
		settings:
			'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
		search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
		plus: '<path d="M12 5v14M5 12h14"/>',
		download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
		chevron: '<path d="m6 9 6 6 6-6"/>',
		chevrons: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
		help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4"/><path d="M12 17h.01"/>',
		check: '<path d="m5 12 5 5L20 7"/>',
		filter: '<path d="M3 6h18M7 12h10M11 18h2"/>',
		calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
		globe:
			'<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18"/>',
		arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
		refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
		more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
		share: '<path d="M4 12v8h16v-8"/><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/>',
		bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
		spark: '<path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z"/>',
		bookmark: '<path d="M6 3h12v18l-6-4.2L6 21V3z"/>',
		menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
		close: '<path d="M18 6 6 18M6 6l12 12"/>'
	} as const;

	type IconName = keyof typeof ICONS;
	type Range = '24h' | '7d' | '30d' | '90d';
	type Metric = 'revenue' | 'orders' | 'aov';
	type SortKey = 'views' | 'visitors' | 'conv';

	const RANGES: Range[] = ['24h', '7d', '30d', '90d'];

	const RANGE_META: Record<
		Range,
		{
			label: string;
			short: string;
			factor: number;
			n: number;
			base: number;
			phase: number;
			seed: number;
			ticks: number[];
			xLabels: string[];
			kpis: {
				users: number;
				usersDelta: number;
				conv: number;
				convDelta: number;
				aov: number;
				aovDelta: number;
				churn: number;
				churnDelta: number;
			};
		}
	> = {
		'24h': {
			label: 'Last 24 hours',
			short: '24h',
			factor: 0.05,
			n: 24,
			base: 256,
			phase: 0.4,
			seed: 11,
			ticks: [0, 6, 12, 18, 23],
			xLabels: ['00:00', '06:00', '12:00', '18:00', '23:00'],
			kpis: {
				users: 6482,
				usersDelta: 4.8,
				conv: 4.61,
				convDelta: 0.08,
				aov: 37.2,
				aovDelta: -1.4,
				churn: 1.21,
				churnDelta: -0.05
			}
		},
		'7d': {
			label: 'Last 7 days',
			short: '7d',
			factor: 0.24,
			n: 7,
			base: 26340,
			phase: 1.2,
			seed: 29,
			ticks: [0, 2, 4, 6],
			xLabels: ['Oct 28', 'Oct 30', 'Nov 1', 'Nov 3'],
			kpis: {
				users: 14902,
				usersDelta: 5.1,
				conv: 4.74,
				convDelta: 0.19,
				aov: 38.1,
				aovDelta: 0.6,
				churn: 1.18,
				churnDelta: -0.03
			}
		},
		'30d': {
			label: 'Last 30 days',
			short: '30d',
			factor: 1,
			n: 30,
			base: 6146,
			phase: 2.1,
			seed: 47,
			ticks: [0, 7, 14, 21, 28],
			xLabels: ['Oct 5', 'Oct 12', 'Oct 19', 'Oct 26', 'Nov 2'],
			kpis: {
				users: 48210,
				usersDelta: 12.4,
				conv: 4.82,
				convDelta: 0.31,
				aov: 38.4,
				aovDelta: -2.1,
				churn: 1.14,
				churnDelta: -0.18
			}
		},
		'90d': {
			label: 'Last 90 days',
			short: '90d',
			factor: 2.9,
			n: 13,
			base: 42480,
			phase: 0.8,
			seed: 83,
			ticks: [0, 3, 6, 9, 12],
			xLabels: ['Aug 6', 'Aug 27', 'Sep 17', 'Oct 8', 'Oct 29'],
			kpis: {
				users: 128640,
				usersDelta: 21.7,
				conv: 4.52,
				convDelta: 0.44,
				aov: 39.2,
				aovDelta: 1.2,
				churn: 1.32,
				churnDelta: -0.24
			}
		}
	};

	function makeRng(seed: number) {
		let a = seed;
		return () => {
			a = (a * 1664525 + 1013904223) % 4294967296;
			return a / 4294967296;
		};
	}

	const BASE_SERIES = (() => {
		const out = {} as Record<Range, { v: number; p: number }[]>;
		for (const r of RANGES) {
			const c = RANGE_META[r];
			const rand = makeRng(c.seed);
			out[r] = Array.from({ length: c.n }, (_, i) => {
				const wave = Math.sin((i / c.n) * Math.PI * 2.2 + c.phase) * 0.13;
				const v = c.base * (1 + wave + (rand() - 0.5) * 0.17);
				const p = v * (0.8 + Math.sin(i * 0.7 + c.phase) * 0.05 + (rand() - 0.5) * 0.05);
				return { v: Math.round(v), p: Math.round(p) };
			});
		}
		return out;
	})();

	const NAV: {
		group: string;
		items: { label: string; icon: IconName; live?: boolean; count?: number }[];
	}[] = [
		{
			group: 'Overview',
			items: [
				{ label: 'Overview', icon: 'grid' as IconName },
				{ label: 'Real-time', icon: 'pulse' as IconName, live: true }
			]
		},
		{
			group: 'Analytics',
			items: [
				{ label: 'Funnels', icon: 'funnel' as IconName },
				{ label: 'Retention', icon: 'retention' as IconName },
				{ label: 'Segments', icon: 'segments' as IconName },
				{ label: 'Revenue', icon: 'revenue' as IconName }
			]
		},
		{
			group: 'Workspace',
			items: [
				{ label: 'Reports', icon: 'reports' as IconName },
				{ label: 'Alerts', icon: 'alerts' as IconName, count: 3 },
				{ label: 'Sources', icon: 'sources' as IconName }
			]
		},
		{
			group: 'Saved views',
			items: [
				{ label: 'Growth weekly', icon: 'pulse' as IconName },
				{ label: 'Activation · Q4', icon: 'funnel' as IconName },
				{ label: 'Churn watch', icon: 'retention' as IconName }
			]
		}
	];

	const WORKSPACES = [
		{ value: 'acme', label: 'Acme Labs' },
		{ value: 'globex', label: 'Globex Retail' }
	];
	/** Share of all traffic each filter keeps; the demo scales its counts by these. */
	const SEGMENTS = [
		{ value: 'all', label: 'All users', scale: 1 },
		{ value: 'new', label: 'New users', scale: 0.41 },
		{ value: 'returning', label: 'Returning', scale: 0.59 }
	];
	const PLATFORMS = [
		{ value: 'all', label: 'Web + iOS', scale: 1 },
		{ value: 'web', label: 'Web', scale: 0.68 },
		{ value: 'ios', label: 'iOS', scale: 0.32 }
	];

	const SOURCES = [
		{ name: 'Organic search', share: 0.42, color: '#a5d8ff' },
		{ name: 'Direct', share: 0.27, color: '#79bfe8' },
		{ name: 'Paid social', share: 0.19, color: '#4f93bb' },
		{ name: 'Referral', share: 0.08, color: '#356a8c' },
		{ name: 'Email', share: 0.04, color: '#294a60' }
	];

	const SOURCE_CVR = [
		{ name: 'Referral', rate: 7.9 },
		{ name: 'Organic search', rate: 5.84 },
		{ name: 'Paid social', rate: 3.12 }
	];

	const PAGES = [
		{
			path: '/blog/scaling-product-teams',
			views: 18204,
			visitors: 12884,
			conv: 7.1,
			trend: [8, 10, 9, 13, 12, 15, 14, 17, 16, 19, 18, 21]
		},
		{
			path: '/pricing',
			views: 14880,
			visitors: 11206,
			conv: 12.8,
			trend: [11, 12, 11, 14, 13, 15, 16, 15, 17, 18, 18, 20]
		},
		{
			path: '/docs/quickstart',
			views: 11342,
			visitors: 8942,
			conv: 4.2,
			trend: [15, 14, 16, 15, 14, 13, 15, 14, 13, 14, 13, 12]
		},
		{
			path: '/changelog',
			views: 8761,
			visitors: 7104,
			conv: 2.8,
			trend: [9, 10, 10, 11, 10, 12, 11, 13, 12, 13, 14, 13]
		},
		{
			path: '/customers',
			views: 7338,
			visitors: 5982,
			conv: 9.4,
			trend: [7, 8, 10, 9, 11, 10, 12, 13, 12, 14, 15, 14]
		},
		{
			path: '/integrations',
			views: 5902,
			visitors: 4411,
			conv: 3.1,
			trend: [10, 11, 10, 10, 9, 10, 9, 8, 9, 8, 8, 7]
		}
	];

	const FUNNEL = [
		{ label: 'Landing page view', value: 48210 },
		{ label: 'Signup started', value: 12884 },
		{ label: 'Email verified', value: 9412 },
		{ label: 'Workspace activated', value: 5208 },
		{ label: 'Paid plan', value: 1164 }
	];

	const CHART = { h: 206, l: 46, r: 6, t: 10, b: 24 };
	const CH = CHART.h;
	const PADL = CHART.l;
	const PADR = CHART.r;
	const PADT = CHART.t;
	const PADB = CHART.b;
	const INNER_H = CH - PADT - PADB;

	let plotWidth = $state(760);
	const CW = $derived(Math.max(320, plotWidth));
	const INNER_W = $derived(CW - PADL - PADR);

	let activeNav = $state('Overview');
	let range = $state<Range>('30d');
	let metric = $state<Metric>('revenue');
	let compare = $state(true);
	let hover = $state<number | null>(null);
	let sortKey = $state<SortKey>('views');
	let sortDir = $state<1 | -1>(-1);
	let activeSource = $state<number | null>(null);
	let searchEl = $state<HTMLInputElement | null>(null);
	let menuOpen = $state(false);
	let railed = $state(false);
	let query = $state('');
	let workspace = $state('acme');
	let segment = $state('all');
	let platform = $state('all');
	let refreshing = $state(false);
	let toast = $state<{ id: number; text: string; undo?: () => void } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	let toastSeq = 0;

	let notifications = $state([
		{ id: 1, text: 'Checkout conversion dropped 0.4pp', time: '8m', unread: true },
		{ id: 2, text: 'Stripe source finished syncing', time: '1h', unread: true },
		{ id: 3, text: 'Weekly growth report is ready', time: '1d', unread: false }
	]);
	const unreadCount = $derived(notifications.filter((n) => n.unread).length);

	const meta = $derived(RANGE_META[range]);
	const workspaceLabel = $derived(WORKSPACES.find((w) => w.value === workspace)?.label ?? WORKSPACES[0].label);
	const segmentOption = $derived(SEGMENTS.find((x) => x.value === segment) ?? SEGMENTS[0]);
	const platformOption = $derived(PLATFORMS.find((x) => x.value === platform) ?? PLATFORMS[0]);
	/** Range, segment and platform together scale every traffic count on the page. */
	const factor = $derived(meta.factor * segmentOption.scale * platformOption.scale);

	$effect(() => {
		return () => clearTimeout(toastTimer);
	});

	function notify(text: string, undo?: () => void) {
		clearTimeout(toastTimer);
		toast = { id: toastSeq++, text, undo };
		toastTimer = setTimeout(() => (toast = null), undo ? 5000 : 3200);
	}

	function undoToast() {
		toast?.undo?.();
		clearTimeout(toastTimer);
		toast = null;
	}

	function setRange(value: string) {
		if ((RANGES as string[]).includes(value)) range = value as Range;
	}

	function refresh() {
		refreshing = true;
		setTimeout(() => {
			refreshing = false;
			notify('Data refreshed · 0.31s');
		}, 700);
	}

	async function copyText(text: string, confirmation: string) {
		try {
			await navigator.clipboard.writeText(text);
			notify(confirmation);
		} catch (error) {
			console.error('Clipboard write was refused', error);
			notify('Couldn’t copy. Check clipboard permissions.');
		}
	}

	function downloadCsv(filename: string, rows: (string | number)[][]) {
		const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
		notify(`Exported ${filename}`);
	}

	function exportPages() {
		downloadCsv(`top-pages-${range}.csv`, [
			['page', 'views', 'visitors', 'conversion'],
			...visiblePages.map((p) => [p.path, p.views, p.visitors, `${p.conv}%`])
		]);
	}

	function markAllRead() {
		const before = notifications.map((n) => n.unread);
		for (const n of notifications) n.unread = false;
		notify('Marked all as read', () => notifications.forEach((n, i) => (n.unread = before[i])));
	}

	function onKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		const typing = target?.closest('input, textarea, select, [contenteditable="true"]');
		if (event.key === '/' && !typing) {
			event.preventDefault();
			searchEl?.focus();
		}
		if (event.key === 'Escape' && document.activeElement === searchEl) {
			query = '';
			searchEl?.blur();
		}
		if (event.key === 'Escape' && menuOpen) {
			menuOpen = false;
		}
	}

	const money = (v: number, digits = 2) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: digits,
			maximumFractionDigits: digits
		}).format(v);

	const int = (v: number) => new Intl.NumberFormat('en-US').format(Math.round(v));
	const pct = (v: number, digits = 1) => `${v.toFixed(digits)}%`;

	function compact(v: number) {
		if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
		if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}k`;
		return `${Math.round(v)}`;
	}

	const base = $derived(BASE_SERIES[range]);

	const values = $derived.by(() => {
		if (metric === 'revenue') return base.map((d) => d.v);
		if (metric === 'orders') return base.map((d) => Math.max(1, Math.round(d.v / 38.4)));
		return base.map((d) => {
			const orders = Math.max(1, Math.round(d.v / 38.4));
			return Number((d.v / orders).toFixed(2));
		});
	});

	const previous = $derived.by(() => {
		if (metric === 'revenue') return base.map((d) => d.p);
		if (metric === 'orders') return base.map((d) => Math.max(1, Math.round(d.p / 38.4)));
		return base.map((d) => {
			const orders = Math.max(1, Math.round(d.p / 38.4));
			return Number((d.p / orders).toFixed(2));
		});
	});

	const total = $derived.by(() => {
		if (metric === 'aov') return values.reduce((a, b) => a + b, 0) / values.length;
		return values.reduce((a, b) => a + b, 0);
	});

	const totalPrev = $derived.by(() => {
		if (metric === 'aov') return previous.reduce((a, b) => a + b, 0) / previous.length;
		return previous.reduce((a, b) => a + b, 0);
	});

	const delta = $derived(totalPrev === 0 ? 0 : ((total - totalPrev) / totalPrev) * 100);

	const revenueTotal = $derived(base.reduce((sum, d) => sum + d.v, 0));
	const revenuePrevTotal = $derived(base.reduce((sum, d) => sum + d.p, 0));
	const revenueDelta = $derived(((revenueTotal - revenuePrevTotal) / revenuePrevTotal) * 100);

	const metricConfig: Record<Metric, { label: string; sub: string; digits: number; currency: boolean }> = {
		revenue: { label: 'Revenue', sub: 'Net of refunds', digits: 2, currency: true },
		orders: { label: 'Orders', sub: 'Paid transactions', digits: 0, currency: false },
		aov: { label: 'Average order value', sub: 'Revenue per order', digits: 2, currency: true }
	};

	function formatValue(v: number, m: Metric = metric) {
		if (m === 'orders') return int(v);
		return money(v, 2);
	}

	function niceMax(v: number) {
		if (v <= 0) return 1;
		const mag = 10 ** Math.floor(Math.log10(v));
		const n = v / mag;
		const step = n <= 1 ? 1 : n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 3 ? 3 : n <= 4 ? 4 : n <= 5 ? 5 : n <= 6 ? 6 : n <= 8 ? 8 : 10;
		return step * mag;
	}

	const chartMax = $derived(
		metric === 'aov'
			? Math.ceil((Math.max(...values, ...previous) * 1.02) / 10) * 10
			: niceMax(Math.max(...values, ...previous) * 1.02)
	);

	function axisLabel(v: number, m: Metric = metric) {
		if (m === 'orders') return v >= 1000 ? `${(v / 1000).toFixed(v >= 10_000 || v % 1000 === 0 ? 0 : 1)}k` : `${Math.round(v)}`;
		if (m === 'aov') return `$${Math.round(v)}`;
		return v >= 1000 ? `$${(v / 1000).toFixed(v >= 10_000 || v % 1000 === 0 ? 0 : 1)}k` : `$${Math.round(v)}`;
	}

	const points = $derived.by(() =>
		values.map((v, i) => ({
			x: PADL + (i * INNER_W) / (values.length - 1),
			y: PADT + INNER_H - (v / chartMax) * INNER_H
		}))
	);

	const prevPoints = $derived.by(() =>
		previous.map((v, i) => ({
			x: PADL + (i * INNER_W) / (previous.length - 1),
			y: PADT + INNER_H - (v / chartMax) * INNER_H
		}))
	);

	const linePath = $derived(points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '));

	const areaPath = $derived(
		`${linePath} L${points[points.length - 1].x.toFixed(2)},${(PADT + INNER_H).toFixed(2)} L${PADL},${(PADT + INNER_H).toFixed(2)} Z`
	);

	const prevPath = $derived(prevPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '));

	const yTicks = $derived(
		(metric === 'aov' ? [0, 0.2, 0.4, 0.6, 0.8, 1] : [0, 0.25, 0.5, 0.75, 1]).map((f) => ({
			value: chartMax * f,
			y: PADT + INNER_H - f * INNER_H
		}))
	);

	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	const pointLabels = $derived.by(() => {
		if (range === '24h') {
			return Array.from({ length: meta.n }, (_, i) => `${String(i).padStart(2, '0')}:00 – ${String((i + 1) % 24).padStart(2, '0')}:00`);
		}
		if (range === '7d') {
			return Array.from({ length: meta.n }, (_, i) => {
				const d = new Date(2026, 9, 28 + i);
				return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
			});
		}
		if (range === '30d') {
			return Array.from({ length: meta.n }, (_, i) => {
				const d = new Date(2026, 9, 5 + i);
				return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
			});
		}
		return Array.from({ length: meta.n }, (_, i) => {
			const d = new Date(2026, 7, 6 + i * 7);
			return `Week of ${MONTHS[d.getMonth()]} ${d.getDate()}`;
		});
	});

	const hoveredPoint = $derived(hover !== null ? points[hover] : null);
	const hoveredPrev = $derived(hover !== null ? prevPoints[hover] : null);
	const TOOLTIP_W = 146;

	// Keep the tooltip inside the plot: clamp horizontally, flip below the point near the top edge.
	const tipX = $derived.by(() => {
		if (!hoveredPoint) return 0;
		const x = (hoveredPoint.x / CW) * plotWidth;
		return Math.min(Math.max(x, TOOLTIP_W / 2 + 2), Math.max(TOOLTIP_W / 2 + 2, plotWidth - TOOLTIP_W / 2 - 2));
	});
	const tipY = $derived(hoveredPoint ? hoveredPoint.y : 0);
	const tipBelow = $derived(tipY < 84);

	function onChartMove(event: PointerEvent) {
		const rect = (event.currentTarget as SVGRectElement).ownerSVGElement?.getBoundingClientRect();
		if (!rect) return;
		const x = ((event.clientX - rect.left) / rect.width) * CW;
		const ratio = (x - PADL) / INNER_W;
		const index = Math.round(ratio * (values.length - 1));
		hover = Math.max(0, Math.min(values.length - 1, index));
	}

	const sessions = $derived(Math.round(128412 * factor));

	const sources = $derived(
		SOURCES.map((s) => ({ ...s, value: Math.round(sessions * s.share) }))
	);

	const donutSegments = $derived.by(() => {
		const radius = 48;
		const circumference = 2 * Math.PI * radius;
		let offset = 0;
		return sources.map((s) => {
			const length = s.share * circumference;
			const segment = { ...s, radius, circumference, length, offset };
			offset += length;
			return segment;
		});
	});

	const activeSourceData = $derived(activeSource !== null ? sources[activeSource] : null);

	const funnel = $derived(
		FUNNEL.map((s, i) => {
			const value = Math.round(s.value * factor);
			const top = Math.round(FUNNEL[0].value * factor);
			const prevValue = i === 0 ? value : Math.round(FUNNEL[i - 1].value * factor);
			return {
				...s,
				value,
				width: (value / top) * 100,
				stepRate: (value / prevValue) * 100,
				ofFirst: (value / top) * 100
			};
		})
	);

	const pages = $derived(
		PAGES.map((p) => ({
			...p,
			views: Math.round(p.views * factor),
			visitors: Math.round(p.visitors * factor)
		})).sort((a, b) => (a[sortKey] - b[sortKey]) * sortDir)
	);
	const visiblePages = $derived(pages.filter((p) => p.path.includes(query.trim().toLowerCase())));

	function sortBy(key: SortKey) {
		if (sortKey === key) {
			sortDir = sortDir === 1 ? -1 : 1;
		} else {
			sortKey = key;
			sortDir = -1;
		}
	}

	function sparkline(valuesIn: number[], width = 64, height = 20) {
		const min = Math.min(...valuesIn);
		const max = Math.max(...valuesIn);
		const span = max - min || 1;
		return valuesIn
			.map((v, i) => {
				const x = (i / (valuesIn.length - 1)) * width;
				const y = height - ((v - min) / span) * (height - 2) - 1;
				return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
			})
			.join(' ');
	}

	const kpis = $derived([
		{
			label: 'Net revenue',
			value: money(revenueTotal, 0),
			icon: 'revenue' as IconName,
			delta: revenueDelta,
			good: revenueDelta >= 0,
			suffix: '%',
			note: 'vs previous period',
			series: base.map((d) => d.v)
		},
		{
			label: 'Active users',
			value: int(meta.kpis.users),
			icon: 'users' as IconName,
			delta: meta.kpis.usersDelta,
			good: meta.kpis.usersDelta >= 0,
			suffix: '%',
			note: 'vs previous period',
			series: [6, 7, 6.4, 8, 7.8, 9, 8.6, 10, 9.4, 11, 10.6, 12]
		},
		{
			label: 'Conversion rate',
			value: pct(meta.kpis.conv, 2),
			icon: 'funnel' as IconName,
			delta: meta.kpis.convDelta,
			good: meta.kpis.convDelta >= 0,
			suffix: 'pp',
			note: 'visitor → signup',
			series: [4.2, 4.35, 4.3, 4.5, 4.46, 4.62, 4.58, 4.7, 4.66, 4.8, 4.76, 4.86]
		},
		{
			label: 'Avg. order value',
			value: money(meta.kpis.aov, 2),
			icon: 'bolt' as IconName,
			delta: meta.kpis.aovDelta,
			good: meta.kpis.aovDelta >= 0,
			suffix: '%',
			note: 'vs previous period',
			series: [42, 41, 41.6, 40.4, 40.8, 39.8, 40.1, 39.2, 39.6, 38.8, 38.6, 38.4]
		},
		{
			label: 'Monthly churn',
			value: pct(meta.kpis.churn, 2),
			icon: 'retention' as IconName,
			delta: meta.kpis.churnDelta,
			good: meta.kpis.churnDelta <= 0,
			suffix: 'pp',
			note: 'lower is better',
			series: [1.6, 1.55, 1.58, 1.46, 1.5, 1.4, 1.44, 1.32, 1.28, 1.3, 1.2, 1.14]
		}
	]);

	const rangeIndex = $derived(RANGES.indexOf(range));

	const sourceTotalLabel = $derived(compact(sessions));
</script>

<svelte:head>
	<title>Overview · Sift Analytics</title>
	<style>
		html,
		body {
			background: #0b0b0b !important;
			color-scheme: dark;
		}
		::selection {
			background: rgba(165, 216, 255, 0.28);
			color: #fff;
		}
	</style>
</svelte:head>

<svelte:window onkeydown={onKeydown} />

{#snippet glyph(name: IconName, size = 15)}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		{@html ICONS[name]}
	</svg>
{/snippet}

{#snippet navList()}
	<nav aria-label="Main">
		{#each NAV as section (section.group)}
			<p class="group">{section.group}</p>
			{#each section.items as item (item.label)}
				<button
					class="nav-item"
					title={item.label}
					class:active={activeNav === item.label}
					aria-current={activeNav === item.label ? 'page' : undefined}
					onclick={() => {
						activeNav = item.label;
						menuOpen = false;
					}}
				>
					{@render glyph(item.icon, 15)}
					<span class="nav-label">{item.label}</span>
					{#if item.live}
						<span class="live-dot" aria-label="Live"></span>
					{:else if item.count}
						<span class="nav-count">{item.count}</span>
					{/if}
				</button>
			{/each}
		{/each}
	</nav>
{/snippet}

<div class="dash">
	<aside class="side">
		<div class="brand">
			<span class="logo" aria-hidden="true">
				<svg width="15" height="15" viewBox="0 0 16 16" fill="none">
					<path d="M3 11.5V8.2M8 11.5V4.5M13 11.5V6.8" stroke="#08131d" stroke-width="2" stroke-linecap="round" />
				</svg>
			</span>
			<span class="brand-text">
				<span class="brand-name">Sift</span>
				<span class="brand-workspace">Acme Labs</span>
			</span>
			<button class="ws-switch" aria-label="Switch workspace">{@render glyph('chevrons', 13)}</button>
		</div>

		{@render navList()}

		<div class="side-foot">
			<div class="health">
				<div class="health-top">
					<span>Data health</span>
					<span class="health-value">99.98%</span>
				</div>
				<div class="health-bar"><span></span></div>
				<p class="health-note">2 sources synced · 0 errors</p>
			</div>

			<button
				class="nav-item"
				title="Settings"
				onclick={() => (activeNav = 'Settings')}
				class:active={activeNav === 'Settings'}
			>
				{@render glyph('settings', 15)}
				<span class="nav-label">Settings</span>
			</button>

			<div class="user">
				<span class="avatar">AC</span>
				<span class="user-text">
					<span class="user-name">Ada Chen</span>
					<span class="user-mail">ada@acme.co</span>
				</span>
				<button class="icon-btn small" aria-label="Account menu">{@render glyph('more', 14)}</button>
			</div>
		</div>
	</aside>

	{#if menuOpen}
		<div class="scrim" role="presentation" onclick={() => (menuOpen = false)}></div>
		<aside class="drawer" aria-label="Navigation">
			<div class="drawer-head">
				<div class="brand">
					<span class="logo" aria-hidden="true">
						<svg width="15" height="15" viewBox="0 0 16 16" fill="none">
							<path d="M3 11.5V8.2M8 11.5V4.5M13 11.5V6.8" stroke="#08131d" stroke-width="2" stroke-linecap="round" />
						</svg>
					</span>
					<span class="brand-text">
						<span class="brand-name">Sift</span>
						<span class="brand-workspace">Acme Labs</span>
					</span>
					<button class="ws-switch" aria-label="Close menu" onclick={() => (menuOpen = false)}>
						{@render glyph('close', 14)}
					</button>
				</div>
			</div>
			{@render navList()}
			<div class="side-foot">
				<button
					class="nav-item"
					onclick={() => {
						activeNav = 'Settings';
						menuOpen = false;
					}}
					class:active={activeNav === 'Settings'}
				>
					{@render glyph('settings', 15)}
					<span class="nav-label">Settings</span>
				</button>
				<div class="user">
					<span class="avatar">AC</span>
					<span class="user-text">
						<span class="user-name">Ada Chen</span>
						<span class="user-mail">ada@acme.co</span>
					</span>
				</div>
			</div>
		</aside>
	{/if}

	<div class="main">
		<header class="topbar">
			<button class="icon-btn menu-btn" aria-label="Open menu" aria-expanded={menuOpen} onclick={() => (menuOpen = true)}>
				{@render glyph('menu', 16)}
			</button>

			<div class="breadcrumb">
				<span>Acme Labs</span>
				<span class="sep">/</span>
				<span>Analytics</span>
				<span class="sep">/</span>
				<span class="current">Overview</span>
			</div>

			<div class="search">
				{@render glyph('search', 14)}
				<input bind:this={searchEl} type="search" placeholder="Search metrics, reports…" aria-label="Search" />
				<kbd>/</kbd>
			</div>

			<span class="live-chip"><span class="live-dot"></span>Live</span>

			<div class="top-actions">
				<button class="icon-btn" aria-label="Refresh data" onclick={() => notify('Data refreshed · 0.31s')}>
					{@render glyph('refresh', 15)}
				</button>
				<button class="icon-btn" aria-label="Notifications">
					{@render glyph('alerts', 15)}
					<span class="notif-dot"></span>
				</button>
				<button class="icon-btn" aria-label="Help">{@render glyph('help', 15)}</button>
			</div>
		</header>

		<main class="page">
			<div class="page-head">
				<div>
					<h1>Overview</h1>
					<p class="sub">Product analytics · Web + iOS · Updated 2m ago</p>
				</div>

				<div class="head-actions">
					<div class="seg" role="group" aria-label="Date range">
						<span class="seg-thumb" style="transform: translateX({rangeIndex * 34}px)"></span>
						{#each RANGES as r (r)}
							<button class:active={range === r} aria-pressed={range === r} onclick={() => (range = r)}>
								{RANGE_META[r].short}
							</button>
						{/each}
					</div>
					<button class="btn-ghost" onclick={() => notify('Snapshot copied to clipboard')}>
						{@render glyph('share', 13)}
						Share
					</button>
					<button class="btn-primary" onclick={() => notify('Report draft created')}>
						{@render glyph('plus', 13)}
						New report
					</button>
				</div>
			</div>

			<div class="filters">
				<button class="chip">
					{@render glyph('calendar', 12)}
					<span class="chip-label">Range</span>
					<span class="chip-value">{meta.label}</span>
					{@render glyph('chevron', 11)}
				</button>
				<button class="chip">
					{@render glyph('users', 12)}
					<span class="chip-label">Segment</span>
					<span class="chip-value">All users</span>
					{@render glyph('chevron', 11)}
				</button>
				<button class="chip">
					{@render glyph('globe', 12)}
					<span class="chip-label">Platform</span>
					<span class="chip-value">Web + iOS</span>
					{@render glyph('chevron', 11)}
				</button>
				<button class="chip dashed" onclick={() => notify('Filter added · Segment: Power users')}>
					{@render glyph('plus', 11)}
					Add filter
				</button>

				<button class="chip toggle" class:on={compare} aria-pressed={compare} onclick={() => (compare = !compare)}>
					<span class="checkbox">{#if compare}{@render glyph('check', 10)}{/if}</span>
					Compare period
				</button>

				<span class="sync">Synced 2m ago · UTC</span>
			</div>

			<section class="kpis" aria-label="Key metrics">
				{#each kpis as kpi, i (kpi.label)}
					<article class="card kpi">
						<div class="kpi-top">
							<span class="kpi-label">{kpi.label}</span>
							<span class="kpi-icon">{@render glyph(kpi.icon, 13)}</span>
						</div>
						<div class="kpi-value">{kpi.value}</div>
						<div class="kpi-foot">
							<span class="delta" class:up={kpi.good} class:down={!kpi.good}>
								{kpi.delta >= 0 ? '▲' : '▼'}
								{Math.abs(kpi.delta).toFixed(2).replace(/\.00$/, '')}{kpi.suffix}
							</span>
							<span class="kpi-note">{kpi.note}</span>
							<svg class="spark" viewBox="0 0 64 20" preserveAspectRatio="none" aria-hidden="true">
								<path d={sparkline(kpi.series, 64, 20)} fill="none" stroke="#a5d8ff" stroke-width="1.2" stroke-opacity="0.55" />
							</svg>
						</div>
					</article>
				{/each}
			</section>

			<div class="grid-a">
				<article class="card chart-card">
					<div class="card-head">
						<div>
							<h2>{metricConfig[metric].label}</h2>
							<p class="card-sub">{metricConfig[metric].sub} · {meta.label.toLowerCase()}</p>
						</div>
						<div class="mini-tabs" role="tablist" aria-label="Revenue metric">
							{#each ['revenue', 'orders', 'aov'] as m (m)}
								<button
									role="tab"
									aria-selected={metric === m}
									class:active={metric === m}
									onclick={() => {
										metric = m as Metric;
										hover = null;
									}}>{metricConfig[m as Metric].label === 'Average order value' ? 'AOV' : metricConfig[m as Metric].label}</button
								>
							{/each}
						</div>
					</div>

					<div class="summary">
						<span class="summary-value">{metric === 'orders' ? int(total) : money(total, 2)}</span>
						<span class="delta" class:up={delta >= 0} class:down={delta < 0}>
							{delta >= 0 ? '▲' : '▼'}
							{Math.abs(delta).toFixed(1)}%
						</span>
						<span class="summary-note">vs previous period</span>

						<div class="legend">
							<span><i class="swatch solid"></i>This period</span>
							{#if compare}<span><i class="swatch dashed"></i>Previous</span>{/if}
						</div>
					</div>

					<div class="plot" bind:clientWidth={plotWidth}>
						<svg
							class="chart"
							viewBox="0 0 {CW} {CH}"
							role="img"
							aria-label="Line chart of {metricConfig[metric].label} for {meta.label.toLowerCase()}"
						>
							<defs>
								<linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stop-color="#a5d8ff" stop-opacity="0.2" />
									<stop offset="60%" stop-color="#a5d8ff" stop-opacity="0.05" />
									<stop offset="100%" stop-color="#a5d8ff" stop-opacity="0" />
								</linearGradient>
							</defs>

							{#each yTicks as tick (tick.value)}
								<line class="grid-line" x1={PADL} x2={CW - PADR} y1={tick.y} y2={tick.y} />
								<text class="axis" x={PADL - 8} y={tick.y + 3} text-anchor="end">{axisLabel(tick.value)}</text>
							{/each}

							{#each meta.ticks as tickIndex, i (tickIndex)}
								<text
									class="axis"
									x={PADL + (tickIndex * INNER_W) / (meta.n - 1)}
									y={CH - 5}
									text-anchor={i === 0 ? 'start' : i === meta.ticks.length - 1 ? 'end' : 'middle'}
								>
									{meta.xLabels[i]}
								</text>
							{/each}

							<path d={areaPath} fill="url(#revFill)" />
							{#if compare}
								<path class="prev-line" d={prevPath} />
							{/if}
							<path class="main-line" d={linePath} />

							{#if hoveredPoint}
								<line class="hover-line" x1={hoveredPoint.x} x2={hoveredPoint.x} y1={PADT} y2={PADT + INNER_H} />
								{#if hoveredPrev}
									<circle cx={hoveredPrev.x} cy={hoveredPrev.y} r="2.6" fill="#0b0b0b" stroke="#6f6f76" stroke-width="1.4" />
								{/if}
								<circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="4" fill="#a5d8ff" stroke="#0b0b0b" stroke-width="2" />
							{/if}

							<rect
								x={PADL}
								y={PADT}
								width={INNER_W}
								height={INNER_H}
								fill="transparent"
								role="presentation"
								onpointermove={onChartMove}
								onpointerleave={() => (hover = null)}
							/>
						</svg>

						{#if hoveredPoint && hover !== null}
							<div
								class="tip"
								class:below={tipBelow}
								style="left: {tipX}px; top: {tipY}px"
								aria-hidden="true"
							>
								<p class="tip-label">{pointLabels[hover]}</p>
								<p class="tip-value">{formatValue(values[hover])}</p>
								{#if compare}
									<div class="tip-row">
										<span>Previous</span>
										<span>{formatValue(previous[hover])}</span>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				</article>

				<article class="card sources-card">
					<div class="card-head">
						<div>
							<h2>Sessions by source</h2>
							<p class="card-sub">{meta.label.toLowerCase()}</p>
						</div>
						<button class="icon-btn small" aria-label="Source options">{@render glyph('more', 14)}</button>
					</div>

					<div class="donut-wrap">
						<div class="donut">
							<svg viewBox="0 0 128 128" role="img" aria-label="Sessions by acquisition source">
								<circle cx="64" cy="64" r="48" fill="none" stroke="#1c1c1c" stroke-width="13" />
								{#each donutSegments as s, i (s.name)}
									<circle
										cx="64"
										cy="64"
										r={s.radius}
										fill="none"
										stroke={s.color}
										stroke-width={activeSource === i ? 15 : 13}
										stroke-dasharray="{Math.max(0, s.length - 3)} {s.circumference}"
										stroke-dashoffset={-s.offset}
										transform="rotate(-90 64 64)"
										stroke-linecap="butt"
										role="presentation"
										class="donut-seg"
										class:dim={activeSource !== null && activeSource !== i}
										onpointerenter={() => (activeSource = i)}
										onpointerleave={() => (activeSource = null)}
									/>
								{/each}
							</svg>
							<div class="donut-center">
								{#if activeSourceData}
									<span class="donut-value">{compact(activeSourceData.value)}</span>
									<span class="donut-label">{activeSourceData.name}</span>
								{:else}
									<span class="donut-value">{sourceTotalLabel}</span>
									<span class="donut-label">Sessions</span>
								{/if}
							</div>
						</div>

						<ul class="source-list">
							{#each sources as s, i (s.name)}
								<li
									class="source"
									class:active={activeSource === i}
									onpointerenter={() => (activeSource = i)}
									onpointerleave={() => (activeSource = null)}
								>
									<i class="dot" style="background: {s.color}"></i>
									<span class="source-name">{s.name}</span>
									<span class="source-value">{compact(s.value)}</span>
									<span class="source-pct">{(s.share * 100).toFixed(0)}%</span>
								</li>
							{/each}
						</ul>
					</div>

					<div class="conv-block">
						<div class="conv-head">
							<span>Conversion by source</span>
							<span class="conv-total">CVR</span>
						</div>
						{#each SOURCE_CVR as source (source.name)}
							<div class="conv-row">
								<span class="conv-name">{source.name}</span>
								<span class="conv-bar"><span style="width: {(source.rate / 8) * 100}%"></span></span>
								<span class="conv-rate">{source.rate.toFixed(2)}%</span>
							</div>
						{/each}
					</div>

					<div class="sources-foot">
						<span>Paid social <strong>+18.4%</strong> week over week</span>
						<button class="link" onclick={() => notify('Opening acquisition report')}>
							Details {@render glyph('arrow', 11)}
						</button>
					</div>
				</article>
			</div>

			<div class="grid-b">
				<article class="card table-card">
					<div class="card-head table-head">
						<div>
							<h2>Top pages</h2>
							<p class="card-sub">By views · {meta.label.toLowerCase()}</p>
						</div>
						<div class="table-actions">
							<span class="mini-chip">{@render glyph('filter', 11)} 3 filters</span>
							<button class="link" onclick={() => notify('Opening all pages')}>
								View all {@render glyph('arrow', 11)}
							</button>
						</div>
					</div>

					<table>
						<thead>
							<tr>
								<th scope="col" class="page-col">Page</th>
								<th scope="col" aria-sort={sortKey === 'views' ? (sortDir === -1 ? 'descending' : 'ascending') : 'none'}>
									<button onclick={() => sortBy('views')}>
										Views
										{#if sortKey === 'views'}<span class="sort">{sortDir === -1 ? '↓' : '↑'}</span>{/if}
									</button>
								</th>
								<th scope="col" aria-sort={sortKey === 'visitors' ? (sortDir === -1 ? 'descending' : 'ascending') : 'none'}>
									<button onclick={() => sortBy('visitors')}>
										Visitors
										{#if sortKey === 'visitors'}<span class="sort">{sortDir === -1 ? '↓' : '↑'}</span>{/if}
									</button>
								</th>
								<th scope="col" aria-sort={sortKey === 'conv' ? (sortDir === -1 ? 'descending' : 'ascending') : 'none'}>
									<button onclick={() => sortBy('conv')}>
										Conv.
										{#if sortKey === 'conv'}<span class="sort">{sortDir === -1 ? '↓' : '↑'}</span>{/if}
									</button>
								</th>
								<th scope="col" class="trend-col">14-day trend</th>
							</tr>
						</thead>
						<tbody>
							{#each pages as page (page.path)}
								<tr>
									<td class="page-cell">
										<span class="page-icon">/</span>
										<span class="page-path" title={page.path}>{page.path}</span>
									</td>
									<td>{int(page.views)}</td>
									<td>{int(page.visitors)}</td>
									<td class="conv">{page.conv.toFixed(1)}%</td>
									<td class="trend-cell">
										<svg viewBox="0 0 60 16" preserveAspectRatio="none" aria-hidden="true">
											<path
												d={sparkline(page.trend, 60, 16)}
												fill="none"
												stroke={page.trend[11] >= page.trend[0] ? '#5ee2a0' : '#ff8f8f'}
												stroke-width="1.2"
												stroke-opacity="0.75"
											/>
										</svg>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</article>

				<article class="card funnel-card">
					<div class="card-head">
						<div>
							<h2>Signup funnel</h2>
							<p class="card-sub">Visitor → paid · {meta.label.toLowerCase()}</p>
						</div>
						<button class="mini-chip" onclick={() => notify('Filtered to all users')}>{@render glyph('segments', 11)} All users</button>
					</div>

					<div class="funnel">
						{#each funnel as step, i (step.label)}
							<div class="step" style="--i: {i}">
								<div class="step-top">
									<span class="step-label">{step.label}</span>
									<span class="step-meta">
										<span class="step-value">{int(step.value)}</span>
										<span class="step-rate">{i === 0 ? '100%' : pct(step.stepRate)}</span>
									</span>
								</div>
								<div class="bar">
									<span style="width: {step.width}%; opacity: {1 - i * 0.14}"></span>
								</div>
							</div>
						{/each}
					</div>

					<div class="funnel-foot">
						<span><strong>{int(funnel[4].value)}</strong> paid · {pct(funnel[4].ofFirst)} of visitors</span>
						<button class="link" onclick={() => notify('Opening signup funnel')}>
							Open funnel {@render glyph('arrow', 11)}
						</button>
					</div>
				</article>
			</div>

			<footer class="page-foot">
				<span>Warehouse: Snowflake · US East</span>
				<span class="dot-sep">·</span>
				<span>Query 0.38s</span>
				<span class="dot-sep">·</span>
				<span>{int(128_402 * factor)} events in range</span>
				<span class="foot-right">All times in UTC</span>
			</footer>
		</main>
	</div>

	{#if toast}
		<div class="toast" role="status">
			<span class="toast-icon">{@render glyph('check', 12)}</span>
			<span>{toast}</span>
			<button class="toast-action" onclick={() => (toast = null)}>Undo</button>
		</div>
	{/if}
</div>

<style>
	.dash {
		--bg: #0b0b0b;
		--bg-side: #0e0e0e;
		--panel: #121212;
		--panel-2: #161616;
		--panel-3: #1c1c1c;
		--line: rgba(255, 255, 255, 0.07);
		--line-2: rgba(255, 255, 255, 0.11);
		--fg: #f3f3f4;
		--fg-2: #a3a3aa;
		--fg-3: #83838d;
		--accent: #a5d8ff;
		--accent-2: #c9e9ff;
		--accent-ink: #07131d;
		--accent-soft: rgba(165, 216, 255, 0.1);
		--good: #6ee7b0;
		--good-soft: rgba(110, 231, 176, 0.1);
		--bad: #ff9c9c;
		--bad-soft: rgba(255, 156, 156, 0.09);
		--sans: 'Inter Variable', 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
		--mono: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
		--ease: cubic-bezier(0.23, 1, 0.32, 1);
		--spring: cubic-bezier(0.2, 0.9, 0.25, 1.05);

		display: flex;
		min-height: 100vh;
		background: var(--bg);
		color: var(--fg);
		font-family: var(--sans);
		font-size: 13px;
		line-height: 1.4;
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
		font-feature-settings:
			'cv11' 1,
			'ss01' 1;
		letter-spacing: 0;
	}

	.dash button {
		font-family: inherit;
		color: inherit;
		border: 0;
		background: none;
		padding: 0;
		transition:
			background 150ms var(--ease),
			color 150ms var(--ease),
			box-shadow 150ms var(--ease),
			transform 150ms var(--ease),
			filter 150ms var(--ease);
	}

	.dash :focus-visible {
		outline: none;
		box-shadow:
			0 0 0 2px var(--bg),
			0 0 0 4px rgba(165, 216, 255, 0.6);
	}

	.dash :global(input) {
		font-family: inherit;
	}

	.side {
		width: 216px;
		flex: none;
		height: 100vh;
		position: sticky;
		top: 0;
		display: flex;
		flex-direction: column;
		background: var(--bg-side);
		border-right: 1px solid var(--line);
		padding: 12px 10px 10px;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 2px 4px 10px;
	}

	.logo {
		width: 26px;
		height: 26px;
		border-radius: 8px;
		display: grid;
		place-items: center;
		background: linear-gradient(160deg, #d6efff, #93cdf2);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.75),
			0 1px 2px rgba(0, 0, 0, 0.5);
	}

	.brand-text {
		display: flex;
		flex-direction: column;
		line-height: 1.15;
		min-width: 0;
	}

	.brand-name {
		font-size: 13px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}

	.brand-workspace {
		font-size: 10px;
		color: var(--fg-3);
		letter-spacing: 0.02em;
	}

	.ws-switch {
		margin-left: auto;
		width: 22px;
		height: 22px;
		display: grid;
		place-items: center;
		border-radius: 6px;
		color: var(--fg-3);
	}

	.ws-switch:hover {
		background: rgba(255, 255, 255, 0.05);
		color: var(--fg);
	}

	.group {
		margin: 0;
		padding: 14px 8px 5px;
		font-size: 9.5px;
		font-weight: 500;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: var(--fg-3);
	}

	.nav-item {
		position: relative;
		width: 100%;
		height: 30px;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 8px;
		border-radius: 7px;
		color: var(--fg-2);
		font-size: 12.5px;
	}

	.nav-item:hover {
		background: rgba(255, 255, 255, 0.04);
		color: var(--fg);
	}

	.nav-item.active {
		background: #1a1a1a;
		color: var(--fg);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.08),
			0 1px 2px rgba(0, 0, 0, 0.45);
	}

	.nav-item.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 9px;
		bottom: 9px;
		width: 2px;
		border-radius: 2px;
		background: var(--accent);
	}

	.nav-label {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nav-count {
		margin-left: auto;
		font-size: 10px;
		height: 17px;
		min-width: 17px;
		padding: 0 5px;
		display: grid;
		place-items: center;
		border-radius: 5px;
		color: var(--accent);
		background: var(--accent-soft);
		box-shadow: inset 0 0 0 1px rgba(165, 216, 255, 0.16);
		font-variant-numeric: tabular-nums;
	}

	.live-dot {
		margin-left: auto;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--good);
		position: relative;
		flex: none;
	}

	.live-dot::after {
		content: '';
		position: absolute;
		inset: -3px;
		border-radius: 50%;
		border: 1px solid rgba(110, 231, 176, 0.5);
		animation: ping 2.4s var(--ease) infinite;
	}

	@keyframes ping {
		0% {
			transform: scale(0.7);
			opacity: 0.9;
		}
		70%,
		100% {
			transform: scale(1.5);
			opacity: 0;
		}
	}

	.side-foot {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-top: 10px;
	}

	.health {
		padding: 8px 9px;
		border-radius: 8px;
		background: #141414;
		box-shadow: inset 0 0 0 1px var(--line);
	}

	.health-top {
		display: flex;
		justify-content: space-between;
		font-size: 10.5px;
		color: var(--fg-2);
	}

	.health-value {
		color: var(--fg);
		font-variant-numeric: tabular-nums;
	}

	.health-bar {
		height: 3px;
		margin: 6px 0 5px;
		border-radius: 2px;
		background: #242424;
		overflow: hidden;
	}

	.health-bar span {
		display: block;
		height: 100%;
		width: 99%;
		border-radius: 2px;
		background: linear-gradient(90deg, #57a9d6, var(--accent));
	}

	.health-note {
		margin: 0;
		font-size: 9.5px;
		color: var(--fg-3);
	}

	.user {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 6px 2px;
		border-top: 1px solid var(--line);
		margin-top: 4px;
	}

	.avatar {
		width: 26px;
		height: 26px;
		flex: none;
		border-radius: 50%;
		display: grid;
		place-items: center;
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.01em;
		color: #bfe3fb;
		background: #21384a;
		box-shadow: inset 0 0 0 1px rgba(165, 216, 255, 0.18);
	}

	.user-text {
		display: flex;
		flex-direction: column;
		line-height: 1.25;
		min-width: 0;
	}

	.user-name {
		font-size: 11.5px;
		font-weight: 500;
	}

	.user-mail {
		font-size: 9.5px;
		color: var(--fg-3);
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user .icon-btn {
		margin-left: auto;
	}

	.main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.topbar {
		position: sticky;
		top: 0;
		z-index: 20;
		height: 46px;
		flex: none;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 20px;
		background: rgba(11, 11, 11, 0.84);
		border-bottom: 1px solid var(--line);
		backdrop-filter: blur(12px);
	}

	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11.5px;
		color: var(--fg-3);
		white-space: nowrap;
	}

	.breadcrumb .sep {
		color: #4c4c53;
	}

	.breadcrumb .current {
		color: var(--fg);
	}

	.search {
		margin-left: auto;
		width: 268px;
		height: 28px;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 0 7px 0 8px;
		border-radius: 7px;
		background: #141414;
		color: var(--fg-3);
		box-shadow: inset 0 0 0 1px var(--line);
		transition: box-shadow 150ms var(--ease);
	}

	.search:focus-within {
		color: var(--fg-2);
		box-shadow:
			inset 0 0 0 1px rgba(165, 216, 255, 0.42),
			0 0 0 3px rgba(165, 216, 255, 0.1);
	}

	.search input {
		flex: 1;
		min-width: 0;
		background: none;
		border: 0;
		outline: none;
		color: var(--fg);
		font-size: 11.5px;
	}

	.search input::placeholder {
		color: var(--fg-3);
	}

	.search input::-webkit-search-cancel-button {
		display: none;
	}

	kbd {
		flex: none;
		min-width: 17px;
		height: 17px;
		padding: 0 4px;
		display: grid;
		place-items: center;
		border-radius: 4px;
		background: #1e1e1e;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.09);
		font-family: var(--sans);
		font-size: 10px;
		color: var(--fg-2);
	}

	.live-chip {
		height: 24px;
		padding: 0 8px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border-radius: 6px;
		font-size: 10.5px;
		color: var(--fg-2);
		box-shadow: inset 0 0 0 1px var(--line);
	}

	.live-chip .live-dot {
		margin-left: 0;
	}

	.top-actions {
		display: flex;
		align-items: center;
		gap: 2px;
	}

	.topbar .icon-btn.menu-btn {
		display: none;
	}

	.scrim {
		position: fixed;
		inset: 0;
		z-index: 60;
		background: rgba(0, 0, 0, 0.55);
		backdrop-filter: blur(2px);
		animation: fade 160ms var(--ease);
	}

	.drawer {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		z-index: 61;
		width: 252px;
		display: flex;
		flex-direction: column;
		padding: 12px 10px 10px;
		background: var(--bg-side);
		border-right: 1px solid var(--line);
		box-shadow: 20px 0 60px rgba(0, 0, 0, 0.55);
		animation: drawer-in 220ms var(--ease);
		overflow-y: auto;
	}

	.drawer .nav-label,
	.drawer .group,
	.drawer .nav-count {
		display: block;
	}

	.drawer .brand-text {
		display: flex;
	}

	.drawer .ws-switch {
		display: grid;
		width: 28px;
		height: 28px;
	}

	.drawer .nav-count {
		display: grid;
	}

	.drawer .nav-item {
		justify-content: flex-start;
		padding: 0 8px;
		height: 32px;
	}

	.drawer .nav-item .live-dot {
		position: relative;
		margin-left: auto;
	}

	.drawer .nav-item.active::before {
		left: 0;
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
	}

	@keyframes drawer-in {
		from {
			transform: translateX(-16px);
			opacity: 0;
		}
	}

	.icon-btn {
		position: relative;
		width: 28px;
		height: 28px;
		display: grid;
		place-items: center;
		border-radius: 7px;
		color: var(--fg-2);
	}

	.icon-btn:hover {
		background: rgba(255, 255, 255, 0.055);
		color: var(--fg);
	}

	.icon-btn:active {
		transform: scale(0.94);
	}

	.icon-btn.small {
		width: 22px;
		height: 22px;
		color: var(--fg-3);
	}

	.notif-dot {
		position: absolute;
		top: 5px;
		right: 5px;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--accent);
		box-shadow: 0 0 0 2px #0b0b0b;
	}

	.page {
		width: 100%;
		max-width: 1560px;
		padding: 16px 20px 18px;
	}

	.page-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
	}

	h1 {
		margin: 0;
		font-size: 20px;
		font-weight: 500;
		line-height: 1.1;
		letter-spacing: -0.025em;
	}

	.sub {
		margin: 4px 0 0;
		font-size: 11px;
		color: var(--fg-3);
	}

	.head-actions {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.seg {
		position: relative;
		height: 30px;
		display: flex;
		align-items: center;
		padding: 2px;
		border-radius: 8px;
		background: #141414;
		box-shadow: inset 0 0 0 1px var(--line);
	}

	.seg-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 34px;
		height: 24px;
		border-radius: 6px;
		background: #262626;
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.1),
			0 1px 2px rgba(0, 0, 0, 0.4);
		transition: transform 220ms var(--spring);
	}

	.seg button {
		position: relative;
		z-index: 1;
		width: 34px;
		height: 24px;
		border-radius: 6px;
		font-size: 10.5px;
		font-weight: 500;
		color: var(--fg-3);
		font-variant-numeric: tabular-nums;
	}

	.seg button:hover {
		color: var(--fg);
	}

	.seg button.active {
		color: #fff;
	}

	.btn-primary {
		height: 30px;
		padding: 0 11px 0 9px;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		border-radius: 8px;
		background: linear-gradient(180deg, #c8eaff, #a5d8ff);
		color: var(--accent-ink);
		font-size: 12px;
		font-weight: 500;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.8),
			0 0 0 1px rgba(139, 200, 240, 0.55),
			0 1px 2px rgba(0, 0, 0, 0.45);
	}

	.btn-primary:hover {
		background: linear-gradient(180deg, #d8f1ff, #b6e0ff);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.9),
			0 0 0 1px rgba(165, 216, 255, 0.7),
			0 2px 8px rgba(165, 216, 255, 0.16);
	}

	.btn-primary:active {
		transform: scale(0.97);
	}

	.btn-ghost {
		height: 30px;
		padding: 0 10px;
		display: inline-flex;
		align-items: center;
		gap: 5px;
		border-radius: 8px;
		background: rgba(165, 216, 255, 0.09);
		color: #c4e7ff;
		font-size: 12px;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.05),
			0 0 0 1px rgba(165, 216, 255, 0.16);
	}

	.btn-ghost:hover {
		background: rgba(165, 216, 255, 0.15);
		color: #e3f4ff;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 0 0 1px rgba(165, 216, 255, 0.26);
	}

	.btn-ghost:active {
		transform: scale(0.97);
	}

	.filters {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 12px 0 10px;
		min-width: 0;
	}

	.chip {
		height: 26px;
		padding: 0 7px 0 8px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border-radius: 7px;
		background: #131313;
		box-shadow: inset 0 0 0 1px var(--line);
		font-size: 11px;
		color: var(--fg-2);
		white-space: nowrap;
	}

	.chip:hover {
		background: #181818;
		color: var(--fg);
	}

	.chip-label {
		color: var(--fg-3);
	}

	.chip-value {
		color: var(--fg);
		font-weight: 500;
	}

	.chip.dashed {
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
		border-radius: 7px;
		color: var(--fg-2);
		background: transparent;
	}

	.chip.dashed:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	.chip.toggle {
		margin-left: 4px;
		gap: 7px;
	}

	.chip.toggle.on {
		color: var(--fg);
	}

	.checkbox {
		width: 13px;
		height: 13px;
		border-radius: 4px;
		display: grid;
		place-items: center;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
		color: var(--accent-ink);
	}

	.chip.toggle.on .checkbox {
		background: var(--accent);
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.4),
			0 1px 2px rgba(0, 0, 0, 0.3);
	}

	.sync {
		margin-left: auto;
		font-size: 10.5px;
		color: var(--fg-3);
		white-space: nowrap;
	}

	.kpis {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 8px;
		margin-bottom: 10px;
	}

	.card {
		position: relative;
		border-radius: 10px;
		background: linear-gradient(180deg, #131313, #101010);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.065),
			inset 0 1px 0 rgba(255, 255, 255, 0.02);
	}

	.kpi {
		padding: 10px 12px 11px;
		min-width: 0;
		overflow: hidden;
	}

	.kpi-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.kpi-label {
		font-size: 10.5px;
		color: var(--fg-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.kpi-icon {
		color: var(--fg-3);
		flex: none;
	}

	.kpi-value {
		margin-top: 5px;
		font-family: var(--mono);
		font-size: 21px;
		font-weight: 500;
		line-height: 1.1;
		letter-spacing: -0.025em;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.kpi-foot {
		margin-top: 6px;
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
	}

	.delta {
		height: 17px;
		padding: 0 4px;
		display: inline-flex;
		align-items: center;
		gap: 1px;
		border-radius: 4px;
		font-size: 10px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
		flex: none;
	}

	.delta.up {
		color: var(--good);
		background: var(--good-soft);
		box-shadow: inset 0 0 0 1px rgba(110, 231, 176, 0.15);
	}

	.delta.down {
		color: var(--bad);
		background: var(--bad-soft);
		box-shadow: inset 0 0 0 1px rgba(255, 156, 156, 0.14);
	}

	.kpi-note {
		flex: 1 1 auto;
		min-width: 0;
		font-size: 9.5px;
		color: var(--fg-3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.spark {
		flex: none;
		margin-left: auto;
		width: 54px;
		height: 17px;
		opacity: 0.6;
		pointer-events: none;
	}

	.grid-a {
		display: grid;
		grid-template-columns: minmax(0, 2.08fr) minmax(0, 1fr);
		gap: 10px;
		margin-bottom: 10px;
	}

	.grid-b {
		display: grid;
		grid-template-columns: minmax(0, 1.72fr) minmax(0, 1fr);
		gap: 10px;
		align-items: stretch;
	}

	.card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 14px 0;
	}

	h2 {
		margin: 0;
		font-size: 12.5px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}

	.card-sub {
		margin: 2px 0 0;
		font-size: 10px;
		color: var(--fg-3);
	}

	.mini-tabs {
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 2px;
		border-radius: 7px;
		background: #171717;
		box-shadow: inset 0 0 0 1px var(--line);
	}

	.mini-tabs button {
		height: 21px;
		padding: 0 7px;
		border-radius: 5px;
		font-size: 10.5px;
		color: var(--fg-3);
		white-space: nowrap;
	}

	.mini-tabs button:hover {
		color: var(--fg);
	}

	.mini-tabs button.active {
		color: #fff;
		background: #2a2a2a;
		box-shadow:
			inset 0 0 0 1px rgba(255, 255, 255, 0.1),
			0 1px 2px rgba(0, 0, 0, 0.35);
	}

	.summary {
		display: flex;
		align-items: center;
		gap: 7px;
		padding: 8px 14px 2px;
		min-width: 0;
	}

	.summary-value {
		font-family: var(--mono);
		font-size: 23px;
		font-weight: 500;
		letter-spacing: -0.03em;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.summary-note {
		font-size: 10px;
		color: var(--fg-3);
		white-space: nowrap;
	}

	.legend {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 10px;
		color: var(--fg-3);
		white-space: nowrap;
	}

	.legend span {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}

	.swatch {
		width: 12px;
		height: 2px;
		border-radius: 1px;
		display: inline-block;
	}

	.swatch.solid {
		background: var(--accent);
	}

	.swatch.dashed {
		background: repeating-linear-gradient(90deg, #6a6a72 0 3px, transparent 3px 5px);
	}

	.plot {
		position: relative;
		margin: 0 12px 8px;
	}

	.chart {
		display: block;
		width: 100%;
		height: 206px;
		overflow: visible;
		touch-action: none;
	}

	.grid-line {
		stroke: rgba(255, 255, 255, 0.055);
		stroke-dasharray: 2 4;
	}

	.axis {
		fill: #8a8a93;
		font-family: var(--sans);
		font-size: 9.5px;
		font-variant-numeric: tabular-nums;
	}

	.main-line {
		fill: none;
		stroke: var(--accent);
		stroke-width: 1.6;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.prev-line {
		fill: none;
		stroke: #5b5b63;
		stroke-width: 1.1;
		stroke-dasharray: 3 4;
		stroke-linecap: round;
	}

	.hover-line {
		stroke: rgba(255, 255, 255, 0.22);
		stroke-width: 1;
		stroke-dasharray: 2 3;
	}

	.tip {
		position: absolute;
		transform: translate(-50%, calc(-100% - 12px));
		min-width: 124px;
		padding: 7px 9px 8px;
		border-radius: 8px;
		background: #1d1d1d;
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.1),
			0 12px 28px rgba(0, 0, 0, 0.58);
		pointer-events: none;
		z-index: 4;
		white-space: nowrap;
	}

	.tip.below {
		transform: translate(-50%, 14px);
	}

	.tip-label {
		margin: 0;
		font-size: 9.5px;
		color: var(--fg-3);
	}

	.tip-value {
		margin: 2px 0 0;
		font-family: var(--mono);
		font-size: 13px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.tip-row {
		margin-top: 4px;
		padding-top: 4px;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		display: flex;
		justify-content: space-between;
		gap: 16px;
		font-size: 9.5px;
		color: var(--fg-3);
		font-variant-numeric: tabular-nums;
	}

	.sources-card {
		display: flex;
		flex-direction: column;
	}

	.donut-wrap {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px 4px 14px;
	}

	.donut {
		position: relative;
		width: 116px;
		height: 116px;
		flex: none;
	}

	.donut svg {
		width: 100%;
		height: 100%;
		display: block;
	}

	.donut-seg {
		transition:
			stroke-width 180ms var(--ease),
			opacity 180ms var(--ease);
	}

	.donut-seg.dim {
		opacity: 0.32;
	}

	.donut-center {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		gap: 1px;
	}

	.donut-value {
		font-family: var(--mono);
		font-size: 17px;
		font-weight: 500;
		letter-spacing: -0.03em;
		font-variant-numeric: tabular-nums;
	}

	.donut-label {
		font-size: 9px;
		color: var(--fg-3);
		max-width: 78px;
		text-align: center;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.source-list {
		list-style: none;
		margin: 0;
		padding: 0;
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.source {
		display: grid;
		grid-template-columns: 7px minmax(0, 1fr) auto 26px;
		align-items: center;
		gap: 6px;
		height: 21px;
		padding: 0 5px;
		border-radius: 5px;
		font-size: 10.5px;
		color: var(--fg-2);
		transition: background 150ms var(--ease);
	}

	.source.active {
		background: rgba(255, 255, 255, 0.045);
		color: var(--fg);
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}

	.source-name {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.source-value {
		color: var(--fg-3);
		font-variant-numeric: tabular-nums;
		font-size: 10px;
	}

	.source-pct {
		text-align: right;
		color: var(--fg);
		font-variant-numeric: tabular-nums;
		font-size: 10.5px;
	}

	.conv-block {
		margin: 8px 14px 0;
		padding-top: 8px;
		border-top: 1px solid var(--line);
	}

	.conv-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		padding: 0 4px 6px;
		font-size: 9.5px;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--fg-3);
	}

	.conv-total {
		letter-spacing: 0.02em;
		color: #5f5f68;
		flex: none;
	}

	.conv-head > span:first-child {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.conv-row {
		display: grid;
		grid-template-columns: 82px minmax(0, 1fr) 38px;
		align-items: center;
		gap: 8px;
		height: 19px;
		padding: 0 4px;
		border-radius: 4px;
	}

	.conv-row:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	.conv-name {
		font-size: 10px;
		color: var(--fg-2);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.conv-bar {
		height: 3px;
		border-radius: 2px;
		background: #1d1d1d;
		overflow: hidden;
	}

	.conv-bar span {
		display: block;
		height: 100%;
		border-radius: 2px;
		background: linear-gradient(90deg, #4f93bb, var(--accent));
		opacity: 0.85;
	}

	.conv-rate {
		text-align: right;
		font-size: 10px;
		font-variant-numeric: tabular-nums;
		color: var(--fg);
	}

	.sources-foot {
		margin-top: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 7px 14px;
		border-top: 1px solid var(--line);
		font-size: 10px;
		color: var(--fg-3);
	}

	.sources-foot strong {
		color: var(--good);
		font-weight: 500;
	}

	.link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 10.5px;
		color: var(--accent);
		white-space: nowrap;
	}

	.link:hover {
		color: var(--accent-2);
	}

	.table-card {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.table-head {
		padding-bottom: 8px;
		align-items: center;
	}

	.table-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.mini-chip {
		height: 22px;
		padding: 0 6px;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		border-radius: 5px;
		background: #171717;
		box-shadow: inset 0 0 0 1px var(--line);
		font-size: 10px;
		color: var(--fg-2);
		white-space: nowrap;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed;
	}

	.page-col {
		width: auto;
		text-align: left;
	}

	th {
		padding: 0 10px 6px;
		font-size: 9.5px;
		font-weight: 500;
		letter-spacing: 0.02em;
		color: var(--fg-3);
		text-align: right;
		border-bottom: 1px solid var(--line);
	}

	th:nth-child(2) {
		width: 74px;
	}

	th:nth-child(3) {
		width: 78px;
	}

	th:nth-child(4) {
		width: 62px;
	}

	th:last-child {
		width: 92px;
	}

	th button {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: inherit;
		font-weight: 500;
		color: inherit;
		letter-spacing: inherit;
	}

	th button:hover {
		color: var(--fg);
	}

	.sort {
		color: var(--accent);
		font-size: 9px;
	}

	td {
		height: 33px;
		padding: 0 10px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.042);
		text-align: right;
		font-size: 11px;
		color: var(--fg-2);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	tbody tr:last-child td {
		border-bottom: 0;
	}

	tbody tr:hover td {
		background: rgba(255, 255, 255, 0.026);
		color: var(--fg);
	}

	.page-cell {
		text-align: left;
		display: flex;
		align-items: center;
		gap: 7px;
		color: var(--fg);
	}

	.page-icon {
		width: 18px;
		height: 18px;
		flex: none;
		display: grid;
		place-items: center;
		border-radius: 5px;
		background: #191919;
		box-shadow: inset 0 0 0 1px var(--line);
		font-size: 10px;
		color: var(--fg-3);
		font-family: var(--mono);
	}

	.page-path {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 11px;
	}

	.conv {
		color: var(--fg);
	}

	.trend-col {
		text-align: right;
	}

	.trend-cell {
		padding-top: 2px;
		padding-bottom: 2px;
	}

	.trend-cell svg {
		width: 60px;
		height: 16px;
		display: inline-block;
		vertical-align: middle;
	}

	.funnel-card {
		display: flex;
		flex-direction: column;
	}

	.funnel {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px 14px 10px;
	}

	.step {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.step-top {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
	}

	.step-label {
		font-size: 10.5px;
		color: var(--fg-2);
	}

	.step-meta {
		display: inline-flex;
		align-items: baseline;
		gap: 7px;
	}

	.step-value {
		font-family: var(--mono);
		font-size: 10.5px;
		color: var(--fg);
		font-variant-numeric: tabular-nums;
	}

	.step-rate {
		font-size: 9.5px;
		color: var(--fg-3);
		font-variant-numeric: tabular-nums;
		min-width: 30px;
		text-align: right;
	}

	.bar {
		height: 7px;
		border-radius: 4px;
		background: #1a1a1a;
		overflow: hidden;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
	}

	.bar span {
		display: block;
		height: 100%;
		border-radius: 3px;
		background: linear-gradient(90deg, #6fb8e4, #a5d8ff);
		transition: filter 150ms var(--ease);
	}

	.step:hover .bar span {
		filter: brightness(1.16);
	}

	.step:hover .step-label {
		color: var(--fg);
	}

	.funnel-foot {
		margin-top: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 7px 14px;
		border-top: 1px solid var(--line);
		font-size: 10px;
		color: var(--fg-3);
	}

	.funnel-foot strong {
		color: var(--fg);
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.page-foot {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 2px 0;
		font-size: 9.5px;
		color: var(--fg-3);
	}

	.dot-sep {
		color: #4a4a51;
	}

	.foot-right {
		margin-left: auto;
	}

	.toast {
		position: fixed;
		left: 50%;
		bottom: 20px;
		z-index: 50;
		height: 34px;
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 0 6px 0 10px;
		border-radius: 8px;
		background: #1d1d1d;
		color: var(--fg);
		font-size: 11.5px;
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.1),
			0 16px 36px rgba(0, 0, 0, 0.6);
		animation: toast-in 300ms var(--ease);
	}

	.toast-icon {
		width: 18px;
		height: 18px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--good-soft);
		color: var(--good);
		box-shadow: inset 0 0 0 1px rgba(110, 231, 176, 0.2);
	}

	.toast-action {
		height: 24px;
		padding: 0 8px;
		display: inline-flex;
		align-items: center;
		border-radius: 5px;
		background: rgba(255, 255, 255, 0.08);
		color: var(--fg);
		font-size: 10.5px;
	}

	.toast-action:hover {
		background: rgba(255, 255, 255, 0.13);
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			transform: translate(-50%, 10px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0) scale(1);
		}
	}

	@media (max-width: 1320px) {
		.spark {
			display: none;
		}
	}

	@media (max-width: 1180px) {
		.side {
			width: 60px;
			padding: 12px 8px;
			align-items: center;
		}

		.brand-text,
		.nav-label,
		.nav-count,
		.group,
		.health,
		.user-text {
			display: none;
		}

		.brand {
			padding-bottom: 14px;
		}

		.ws-switch {
			display: none;
		}

		.nav-item {
			justify-content: center;
			padding: 0;
			height: 34px;
		}

		.nav-item .live-dot {
			position: absolute;
			top: 7px;
			right: 9px;
		}

		.nav-item.active::before {
			left: -8px;
		}

		.user {
			border-top: 0;
			padding: 8px 0 2px;
		}

		.user .icon-btn {
			display: none;
		}

		.kpis {
			grid-template-columns: repeat(5, minmax(0, 1fr));
		}

		.grid-a,
		.grid-b {
			grid-template-columns: minmax(0, 1fr);
		}

		/* Full-width cards: use the extra width instead of stretching one long list. */
		.sources-card {
			display: grid;
			grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
			grid-template-rows: auto 1fr auto;
			align-items: center;
		}

		.sources-card > .card-head {
			grid-column: 1 / -1;
			grid-row: 1;
			align-self: start;
		}

		.donut-wrap {
			grid-column: 1;
			grid-row: 2;
		}

		.conv-block {
			grid-column: 2;
			grid-row: 2;
			align-self: center;
			margin: 6px 16px 6px 0;
			padding: 4px 0 4px 18px;
			border-top: 0;
			border-left: 1px solid var(--line);
		}

		.sources-foot {
			grid-column: 1 / -1;
			grid-row: 3;
			margin-top: 0;
		}
	}

	@media (max-width: 960px) {
		.kpi-note {
			display: none;
		}
	}

	@media (max-width: 860px) {
		.side {
			display: none;
		}

		.topbar .icon-btn.menu-btn {
			display: grid;
		}

		.topbar {
			padding: 0 14px;
		}

		.page {
			padding: 14px;
		}

		.page-head {
			flex-direction: column;
			align-items: flex-start;
		}

		.head-actions {
			flex-wrap: wrap;
		}

		.search {
			width: 180px;
		}

		.filters {
			flex-wrap: wrap;
		}

		.sync {
			display: none;
		}

		.kpis {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.kpi:first-child {
			grid-column: span 2;
		}

		.kpi-note {
			display: block;
		}

		.breadcrumb span:not(.current):not(.sep) {
			display: none;
		}

		.breadcrumb .sep {
			display: none;
		}

		th:nth-child(3) {
			display: none;
		}

		td:nth-child(3) {
			display: none;
		}

		.live-chip {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.sources-card {
			display: flex;
			align-items: stretch;
		}

		.conv-block {
			margin: 8px 14px 0;
			padding: 8px 0 0;
			border-top: 1px solid var(--line);
			border-left: 0;
			align-self: stretch;
		}

		.sources-foot {
			margin-top: auto;
		}
	}

	@media (max-width: 560px) {
		.search {
			width: 140px;
		}

		.spark {
			display: none;
		}

		.summary-value {
			font-size: 20px;
		}

		.legend {
			display: none;
		}

		.donut-wrap {
			gap: 6px;
		}

		th:last-child,
		td.trend-cell {
			display: none;
		}

		.page-foot {
			flex-wrap: wrap;
			row-gap: 2px;
		}

		.foot-right {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dash *,
		.dash *::before,
		.dash *::after {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
