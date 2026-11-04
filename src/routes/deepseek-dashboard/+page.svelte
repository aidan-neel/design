<script lang="ts">
	import '@fontsource-variable/inter/wght.css';
	import { Dialog, DropdownMenu, Popover, Switch, Tooltip } from 'bits-ui';
	import { onMount } from 'svelte';
	import AnimatedNumber from './AnimatedNumber.svelte';
	import CommandPalette from './CommandPalette.svelte';
	import CouponDialog from './CouponDialog.svelte';
	import Icon from './Icon.svelte';
	import PriceDrawer from './PriceDrawer.svelte';
	import RevenueChart from './RevenueChart.svelte';
	import Sparkline from './Sparkline.svelte';
	import {
		activeSubscriptions,
		activity,
		bucketSeries,
		getRange,
		initialCoupons,
		initials,
		intervalLabel,
		intervalShort,
		isoDate,
		money,
		planMrr,
		plans as seedPlans,
		prettyISO,
		previousRange,
		rangePresets,
		statusLabel,
		sumNet,
		TODAY,
		totalMrr,
		invoices as seedInvoices,
		type Coupon,
		type CouponStatus,
		type Granularity,
		type Interval,
		type Invoice,
		type InvoiceStatus,
		type Plan,
		type PriceDraft,
		type PriceStatus,
		type RangeId
	} from './data';

	type View = 'overview' | 'prices' | 'coupons' | 'invoices';
	type Toast = {
		id: number;
		message: string;
		detail?: string;
		tone?: 'default' | 'danger';
		undo?: () => void;
	};
	type Cmd = {
		id: string;
		label: string;
		group: 'Pages' | 'Actions';
		hint?: string;
		icon: string;
		keywords?: string;
		run: () => void;
	};

	const viewTitle: Record<View, string> = {
		overview: 'Overview',
		prices: 'Prices',
		coupons: 'Coupons',
		invoices: 'Invoices'
	};

	const navItems: { id: View; label: string; icon: string }[] = [
		{ id: 'overview', label: 'Overview', icon: 'grid' },
		{ id: 'prices', label: 'Prices', icon: 'tag' },
		{ id: 'coupons', label: 'Coupons', icon: 'ticket' },
		{ id: 'invoices', label: 'Invoices', icon: 'receipt' }
	];

	const workspaces = [
		{ id: 'sundial', name: 'Sundial Studio', plan: 'Scale plan', mark: 'SS' },
		{ id: 'paperkite', name: 'Paper Kite', plan: 'Pro plan', mark: 'PK' }
	];

	const mixColors = ['#255cd1', '#5b83dd', '#93adea', '#c6d4f4'];

	let view = $state<View>('overview');
	let mainEl = $state<HTMLElement | null>(null);
	let sidebarCollapsed = $state(false);
	let mobileNav = $state(false);
	let workspaceId = $state('sundial');
	let paletteOpen = $state(false);
	let testMode = $state(false);

	/* ---------------------------------------------------------------- */
	/* date range + chart                                                */
	/* ---------------------------------------------------------------- */

	let rangeOpen = $state(false);
	let rangeId = $state<RangeId>('30d');
	let customStart = $state('2026-10-05');
	let customEnd = $state('2026-11-03');
	let granularity = $state<Granularity>('day');
	let compare = $state(false);

	function parseISO(value: string): Date {
		const [y, m, d] = value.split('-').map(Number);
		return new Date(y, (m || 1) - 1, d || 1);
	}

	const range = $derived.by(() => {
		if (rangeId === 'custom') {
			const start = parseISO(customStart);
			const end = parseISO(customEnd);
			if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start <= end) {
				return getRange('custom', { start, end });
			}
		}
		return getRange(rangeId === 'custom' ? '30d' : rangeId);
	});

	const chartData = $derived(bucketSeries(range, granularity));
	const prevChartData = $derived(bucketSeries(previousRange(range), granularity));

	const netTotal = $derived(sumNet(chartData));
	const prevNet = $derived(sumNet(prevChartData));
	const netDelta = $derived(prevNet > 0 ? ((netTotal - prevNet) / prevNet) * 100 : 0);
	const grossTotal = $derived(chartData.reduce((sum, d) => sum + d.gross, 0));
	const refundTotal = $derived(chartData.reduce((sum, d) => sum + d.refunds, 0));
	const prevGross = $derived(prevChartData.reduce((sum, d) => sum + d.gross, 0));
	const prevRefund = $derived(prevChartData.reduce((sum, d) => sum + d.refunds, 0));
	const refundRate = $derived(grossTotal > 0 ? (refundTotal / grossTotal) * 100 : 0);
	const prevRefundRate = $derived(prevGross > 0 ? (prevRefund / prevGross) * 100 : 0);
	const refundDelta = $derived(refundRate - prevRefundRate);
	const netSpark = $derived(chartData.map((d) => d.net));
	const ordersTotal = $derived(chartData.reduce((sum, d) => sum + d.orders, 0));

	const subsSpark = [4180, 4212, 4248, 4301, 4380, 4402, 4518, 4630, 4712, 4890, 5010, 5150, 5263];
	const mrrSpark = [226400, 229100, 231800, 234500, 238200, 241700, 244900, 249100, 252300, 255000, 257600, 258900, 260225];
	const refundSpark = [3.4, 3.1, 3.2, 2.9, 3.0, 2.8, 2.7, 2.9, 2.6, 2.5, 2.6, 2.4, 2.5];

	function pickRange(id: RangeId) {
		rangeId = id;
		granularity = id === '90d' ? 'week' : 'day';
		rangeOpen = false;
	}

	function applyCustom() {
		let start = parseISO(customStart);
		let end = parseISO(customEnd);
		if (Number.isNaN(start.getTime())) start = new Date(2026, 9, 5);
		if (Number.isNaN(end.getTime())) end = new Date(TODAY);
		const oldest = new Date(2026, 0, 1);
		if (start < oldest) start = new Date(oldest);
		if (end > TODAY) end = new Date(TODAY);
		if (start > end) [start, end] = [end, start];
		customStart = isoDate(start);
		customEnd = isoDate(end);
		rangeId = 'custom';
		const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
		granularity = days > 60 ? 'week' : 'day';
		rangeOpen = false;
	}

	/* ---------------------------------------------------------------- */
	/* prices                                                            */
	/* ---------------------------------------------------------------- */

	let plans = $state<Plan[]>(seedPlans.map((plan) => ({ ...plan })));
	let priceQuery = $state('');
	let priceStatuses = $state<string[]>(['active', 'draft', 'archived']);
	let priceInterval = $state<'all' | Interval>('all');
	let priceSort = $state<{ key: PriceSortKey; dir: 'asc' | 'desc' }>({
		key: 'subs',
		dir: 'desc'
	});
	let drawerOpen = $state(false);
	let editingPlan = $state<Plan | null>(null);

	type PriceSortKey = 'name' | 'price' | 'subs' | 'mrr' | 'updated';

	const mrr = $derived(totalMrr(plans));
	const subs = $derived(activeSubscriptions(plans));
	const statusCounts = $derived({
		active: plans.filter((p) => p.status === 'active').length,
		draft: plans.filter((p) => p.status === 'draft').length,
		archived: plans.filter((p) => p.status === 'archived').length
	});
	const activePriceCount = $derived(plans.filter((p) => p.status === 'active').length);

	const visiblePlans = $derived.by(() => {
		const query = priceQuery.trim().toLowerCase();
		const list = plans.filter(
			(plan) =>
				priceStatuses.includes(plan.status) &&
				(priceInterval === 'all' || plan.interval === priceInterval) &&
				(!query ||
					`${plan.name} ${plan.desc} ${plan.id}`.toLowerCase().includes(query))
		);
		const dir = priceSort.dir === 'asc' ? 1 : -1;
		list.sort((a, b) => {
			switch (priceSort.key) {
				case 'name':
					return a.name.localeCompare(b.name) * dir;
				case 'price':
					return (a.price - b.price) * dir;
				case 'subs':
					return (a.subs - b.subs) * dir;
				case 'mrr':
					return (planMrr(a) - planMrr(b)) * dir;
				case 'updated':
					return a.updated.localeCompare(b.updated) * dir;
			}
			return 0;
		});
		return list;
	});

	const mixPlans = $derived.by(() => {
		const active = plans.filter((p) => p.status === 'active' && p.subs > 0);
		const total = active.reduce((sum, plan) => sum + planMrr(plan), 0) || 1;
		return active
			.sort((a, b) => planMrr(b) - planMrr(a))
			.slice(0, 4)
			.map((plan, i) => ({
				plan,
				share: (planMrr(plan) / total) * 100,
				color: mixColors[i]
			}));
	});

	function sortPrices(key: PriceSortKey) {
		priceSort =
			priceSort.key === key
				? { key, dir: priceSort.dir === 'asc' ? 'desc' : 'asc' }
				: { key, dir: key === 'name' ? 'asc' : 'desc' };
	}

	function openNewPrice() {
		editingPlan = null;
		drawerOpen = true;
	}

	function openEditPrice(plan: Plan) {
		editingPlan = plan;
		drawerOpen = true;
	}

	function savePrice(draft: PriceDraft, isNew: boolean) {
		if (isNew) {
			const plan: Plan = {
				...draft,
				id: 'price_' + Math.random().toString(36).slice(2, 10),
				subs: 0,
				updated: isoDate(TODAY)
			};
			plans = [plan, ...plans];
			editingPlan = null;
			drawerOpen = false;
			showToast('Price created', {
				detail: `${draft.name} · ${money(draft.price)}${intervalShort(draft.interval)}`
			});
			return;
		}
		if (!editingPlan) return;
		const target = plans.find((plan) => plan.id === editingPlan?.id);
		if (!target) return;
		const before = { ...target };
		Object.assign(target, draft, { updated: isoDate(TODAY) });
		editingPlan = null;
		drawerOpen = false;
		showToast('Price updated', {
			detail: `${draft.name} · ${money(draft.price)}${intervalShort(draft.interval)}`,
			undo: () => Object.assign(target, before)
		});
	}

	function duplicatePrice(plan: Plan) {
		const copy: Plan = {
			...plan,
			id: 'price_' + Math.random().toString(36).slice(2, 10),
			name: `${plan.name} copy`,
			status: 'draft',
			subs: 0,
			popular: false,
			updated: isoDate(TODAY)
		};
		plans = [copy, ...plans];
		showToast('Price duplicated', { detail: `${copy.name} · draft` });
	}

	function archivePrice(plan: Plan) {
		const before = { ...plan };
		plan.status = 'archived';
		plan.updated = isoDate(TODAY);
		showToast('Price archived', {
			detail: 'Existing subscriptions keep this price',
			undo: () => Object.assign(plan, before)
		});
	}

	function deletePrice(plan: Plan) {
		const index = plans.findIndex((p) => p.id === plan.id);
		const snapshot = { ...plan };
		plans = plans.filter((p) => p.id !== plan.id);
		showToast('Draft deleted', {
			detail: snapshot.name,
			tone: 'danger',
			undo: () => {
				const next = [...plans];
				next.splice(index, 0, snapshot);
				plans = next;
			}
		});
	}

	/* ---------------------------------------------------------------- */
	/* coupons                                                           */
	/* ---------------------------------------------------------------- */

	let coupons = $state<Coupon[]>(initialCoupons.map((coupon) => ({ ...coupon })));
	let couponFilter = $state<'all' | CouponStatus>('all');
	let couponQuery = $state('');
	let couponOpen = $state(false);

	const couponStatusLabel: Record<CouponStatus, string> = {
		active: 'Active',
		paused: 'Paused',
		scheduled: 'Scheduled',
		expired: 'Expired'
	};

	const couponFilters: { id: 'all' | CouponStatus; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'active', label: 'Active' },
		{ id: 'paused', label: 'Paused' },
		{ id: 'scheduled', label: 'Scheduled' },
		{ id: 'expired', label: 'Expired' }
	];

	const couponCounts = $derived.by(() => {
		const counts: Record<'all' | CouponStatus, number> = {
			all: coupons.length,
			active: 0,
			paused: 0,
			scheduled: 0,
			expired: 0
		};
		for (const coupon of coupons) counts[coupon.status] += 1;
		return counts;
	});

	const activeCoupons = $derived(coupons.filter((c) => c.status === 'active').length);
	const couponRedemptions = $derived(coupons.reduce((sum, c) => sum + c.redemptions, 0));
	const discountGiven = 18402;

	const visibleCoupons = $derived.by(() => {
		const query = couponQuery.trim().toLowerCase();
		return coupons.filter(
			(coupon) =>
				(couponFilter === 'all' || coupon.status === couponFilter) &&
				(!query || `${coupon.code} ${coupon.applies}`.toLowerCase().includes(query))
		);
	});

	function usagePct(coupon: Coupon): number {
		if (!coupon.limit) return 0;
		return Math.min(100, (coupon.redemptions / coupon.limit) * 100);
	}

	function saveCoupon(coupon: Coupon) {
		coupons = [coupon, ...coupons];
		couponOpen = false;
		showToast('Coupon created', {
			detail: `${coupon.code} · ${
				coupon.kind === 'percent' ? `${coupon.value}% off` : `${money(coupon.value)} off`
			}`
		});
	}

	async function copyCode(code: string) {
		try {
			await navigator.clipboard.writeText(code);
			showToast('Code copied', { detail: code });
		} catch {
			showToast('Could not copy code', { tone: 'danger' });
		}
	}

	function toggleCoupon(coupon: Coupon) {
		const before = coupon.status;
		coupon.status = coupon.status === 'active' ? 'paused' : 'active';
		showToast(coupon.status === 'paused' ? 'Coupon paused' : 'Coupon resumed', {
			detail: coupon.code,
			undo: () => (coupon.status = before)
		});
	}

	function deleteCoupon(coupon: Coupon) {
		const index = coupons.findIndex((c) => c.id === coupon.id);
		const snapshot = { ...coupon };
		coupons = coupons.filter((c) => c.id !== coupon.id);
		showToast('Coupon deleted', {
			detail: snapshot.code,
			tone: 'danger',
			undo: () => {
				const next = [...coupons];
				next.splice(index, 0, snapshot);
				coupons = next;
			}
		});
	}

	/* ---------------------------------------------------------------- */
	/* invoices                                                          */
	/* ---------------------------------------------------------------- */

	let invoiceRows = $state<Invoice[]>(seedInvoices.map((invoice) => ({ ...invoice })));
	let invoiceStatus = $state<'all' | InvoiceStatus>('all');
	let invoiceQuery = $state('');
	let invoiceSort = $state<{ key: 'date' | 'amount' | 'customer'; dir: 'asc' | 'desc' }>({
		key: 'date',
		dir: 'desc'
	});

	const invoiceStatusLabel: Record<InvoiceStatus, string> = {
		paid: 'Paid',
		open: 'Open',
		refunded: 'Refunded',
		failed: 'Failed'
	};

	const invoiceTabs: { id: 'all' | InvoiceStatus; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'paid', label: 'Paid' },
		{ id: 'open', label: 'Open' },
		{ id: 'refunded', label: 'Refunded' },
		{ id: 'failed', label: 'Failed' }
	];

	const openInvoices = $derived(invoiceRows.filter((i) => i.status === 'open').length);

	const visibleInvoices = $derived.by(() => {
		const query = invoiceQuery.trim().toLowerCase();
		const list = invoiceRows.filter(
			(invoice) =>
				(invoiceStatus === 'all' || invoice.status === invoiceStatus) &&
				(!query ||
					`${invoice.id} ${invoice.customer} ${invoice.company} ${invoice.plan}`
						.toLowerCase()
						.includes(query))
		);
		const dir = invoiceSort.dir === 'asc' ? 1 : -1;
		list.sort((a, b) => {
			switch (invoiceSort.key) {
				case 'amount':
					return (a.amount - b.amount) * dir;
				case 'customer':
					return a.customer.localeCompare(b.customer) * dir;
				case 'date':
					return a.date.localeCompare(b.date) * dir;
			}
			return 0;
		});
		return list;
	});

	const visibleInvoiceTotal = $derived(
		visibleInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
	);

	function sortInvoices(key: 'date' | 'amount' | 'customer') {
		invoiceSort =
			invoiceSort.key === key
				? { key, dir: invoiceSort.dir === 'asc' ? 'desc' : 'asc' }
				: { key, dir: key === 'date' ? 'desc' : 'asc' };
	}

	function markPaid(invoice: Invoice) {
		const before = invoice.status;
		invoice.status = 'paid';
		showToast('Invoice marked paid', {
			detail: `${invoice.id} · ${money(invoice.amount)}`,
			undo: () => (invoice.status = before)
		});
	}

	function refundInvoice(invoice: Invoice) {
		const before = invoice.status;
		invoice.status = 'refunded';
		showToast('Refund issued', {
			detail: `${invoice.id} · ${money(invoice.amount)} back to ${invoice.customer}`,
			tone: 'danger',
			undo: () => (invoice.status = before)
		});
	}

	/* ---------------------------------------------------------------- */
	/* notifications, workspace, toasts                                  */
	/* ---------------------------------------------------------------- */

	let notes = $state([
		{
			id: 1,
			title: 'Payout completed',
			body: '$61,204.18 is on its way to Chase •• 4821.',
			time: '2h ago',
			unread: true,
			icon: 'bank'
		},
		{
			id: 2,
			title: 'A payment failed',
			body: 'Anna Lindqvist · Scale · $249. Retry is scheduled for tomorrow.',
			time: '5h ago',
			unread: true,
			icon: 'card'
		},
		{
			id: 3,
			title: 'LAUNCH25 hit 60%',
			body: '312 of 500 redemptions used since launch.',
			time: 'Yesterday',
			unread: false,
			icon: 'ticket'
		}
	]);

	const unread = $derived(notes.filter((note) => note.unread).length);
	const workspace = $derived(workspaces.find((w) => w.id === workspaceId) ?? workspaces[0]);
	const otherWorkspace = $derived(workspaces.find((w) => w.id !== workspaceId) ?? workspaces[0]);

	function markAllRead() {
		notes = notes.map((note) => ({ ...note, unread: false }));
	}

	function chooseWorkspace(id: string) {
		workspaceId = id;
		const next = workspaces.find((w) => w.id === id);
		if (next) showToast('Workspace switched', { detail: `${next.name} · ${next.plan}` });
	}

	let toasts = $state<Toast[]>([]);
	let toastSeq = 0;

	function showToast(
		message: string,
		opts: { detail?: string; tone?: 'default' | 'danger'; undo?: () => void } = {}
	) {
		const id = ++toastSeq;
		toasts = [...toasts, { id, message, ...opts }];
		setTimeout(() => dismissToast(id), 6000);
	}

	function dismissToast(id: number) {
		toasts = toasts.filter((toast) => toast.id !== id);
	}

	function runUndo(toast: Toast) {
		toast.undo?.();
		dismissToast(toast.id);
	}

	/* ---------------------------------------------------------------- */
	/* navigation + commands                                             */
	/* ---------------------------------------------------------------- */

	function setView(next: View) {
		view = next;
		mobileNav = false;
		mainEl?.scrollTo({ top: 0, behavior: 'instant' });
	}

	function handleKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			paletteOpen = !paletteOpen;
		}
	}

	const commands = $derived<Cmd[]>([
		{
			id: 'go-overview',
			label: 'Go to Overview',
			group: 'Pages',
			icon: 'grid',
			hint: 'G O',
			run: () => setView('overview')
		},
		{
			id: 'go-prices',
			label: 'Go to Prices',
			group: 'Pages',
			icon: 'tag',
			hint: 'G P',
			run: () => setView('prices')
		},
		{
			id: 'go-coupons',
			label: 'Go to Coupons',
			group: 'Pages',
			icon: 'ticket',
			hint: 'G C',
			run: () => setView('coupons')
		},
		{
			id: 'go-invoices',
			label: 'Go to Invoices',
			group: 'Pages',
			icon: 'receipt',
			hint: 'G I',
			run: () => setView('invoices')
		},
		{
			id: 'new-price',
			label: 'Create a new price',
			group: 'Actions',
			icon: 'plus',
			keywords: 'plan product subscription',
			run: () => {
				setView('prices');
				openNewPrice();
			}
		},
		{
			id: 'new-coupon',
			label: 'Create a coupon',
			group: 'Actions',
			icon: 'percent',
			keywords: 'discount promo code',
			run: () => {
				setView('coupons');
				couponOpen = true;
			}
		},
		{
			id: 'export-revenue',
			label: 'Export revenue as CSV',
			group: 'Actions',
			icon: 'download',
			keywords: 'download report accounting',
			run: exportRevenue
		},
		{
			id: 'toggle-compare',
			label: compare ? 'Hide previous period' : 'Compare with previous period',
			group: 'Actions',
			icon: 'trend',
			keywords: 'chart baseline',
			run: () => {
				setView('overview');
				compare = !compare;
			}
		},
		{
			id: 'toggle-sidebar',
			label: sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar',
			group: 'Actions',
			icon: 'panel',
			keywords: 'navigation layout',
			run: () => (sidebarCollapsed = !sidebarCollapsed)
		}
	]);

	onMount(() => {
		if (localStorage.getItem('sundial.sidebar') === '1') sidebarCollapsed = true;
	});

	$effect(() => {
		if (typeof window !== 'undefined') {
			localStorage.setItem('sundial.sidebar', sidebarCollapsed ? '1' : '0');
		}
	});

	/* ---------------------------------------------------------------- */
	/* formatting + export                                               */
	/* ---------------------------------------------------------------- */

	function pct(value: number, digits = 1): string {
		return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
	}

	function tone(status: string): string {
		switch (status) {
			case 'paid':
			case 'active':
				return 'ok';
			case 'open':
			case 'scheduled':
				return 'info';
			case 'failed':
			case 'expired':
				return 'bad';
			case 'draft':
			case 'paused':
			case 'refunded':
				return 'warn';
			default:
				return 'neutral';
		}
	}

	function csvCell(value: string | number): string {
		const text = String(value);
		return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
	}

	function downloadFile(filename: string, content: string, type: string) {
		const blob = new Blob([content], { type });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = filename;
		anchor.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	function exportRevenue() {
		const rows = [
			['Date', 'Net revenue', 'Gross', 'Refunds', 'Orders'],
			...chartData.map((point) => [
				isoDate(point.start),
				point.net,
				point.gross,
				point.refunds,
				point.orders
			])
		];
		downloadFile(
			'sundial-revenue.csv',
			rows.map((row) => row.map(csvCell).join(',')).join('\n'),
			'text/csv'
		);
		showToast('Revenue exported', { detail: `${chartData.length} rows · CSV` });
	}

	function exportPrices() {
		const rows = [
			['Name', 'Price', 'Interval', 'Status', 'Subscriptions', 'MRR', 'Updated'],
			...visiblePlans.map((plan) => [
				plan.name,
				plan.price,
				intervalLabel(plan.interval),
				statusLabel[plan.status],
				plan.subs,
				Math.round(planMrr(plan)),
				plan.updated
			])
		];
		downloadFile(
			'sundial-prices.csv',
			rows.map((row) => row.map(csvCell).join(',')).join('\n'),
			'text/csv'
		);
		showToast('Prices exported', { detail: `${visiblePlans.length} prices · CSV` });
	}

	function exportInvoices() {
		const rows = [
			['Invoice', 'Customer', 'Company', 'Plan', 'Date', 'Amount', 'Status'],
			...visibleInvoices.map((invoice) => [
				invoice.id,
				invoice.customer,
				invoice.company,
				invoice.plan,
				invoice.date,
				invoice.amount,
				invoice.status
			])
		];
		downloadFile(
			'sundial-invoices.csv',
			rows.map((row) => row.map(csvCell).join(',')).join('\n'),
			'text/csv'
		);
		showToast('Invoices exported', { detail: `${visibleInvoices.length} invoices · CSV` });
	}

	function downloadReceipt(invoice: Invoice) {
		const doc = invoice.status === 'paid' ? 'Receipt' : 'Invoice';
		const content = [
			'SUNDIAL STUDIO',
			`${doc} ${invoice.id}`,
			'',
			`Billed to   ${invoice.customer} · ${invoice.company}`,
			`Plan        ${invoice.plan}`,
			`Date        ${invoice.date}`,
			`Amount      ${money(invoice.amount)}`,
			`Status      ${invoiceStatusLabel[invoice.status]}`,
			'',
			'Thank you for building with Sundial.'
		].join('\n');
		downloadFile(`${doc.toLowerCase()}-${invoice.id}.txt`, content, 'text/plain');
		showToast(`${doc} downloaded`, { detail: invoice.id });
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#snippet infoTip(text: string)}
	<Tooltip.Root>
		<Tooltip.Trigger class="sd-info-btn" aria-label="More information">
			<Icon name="info" size={13} />
		</Tooltip.Trigger>
		<Tooltip.Portal>
			<Tooltip.Content class="sd-tooltip" sideOffset={6}>{text}</Tooltip.Content>
		</Tooltip.Portal>
	</Tooltip.Root>
{/snippet}

<Tooltip.Provider delayDuration={280}>
	<div class="app" class:collapsed={sidebarCollapsed}>
		<aside class="sidebar" aria-label="Sidebar">
			<div class="brand-row">
				<button class="brand" type="button" onclick={() => setView('overview')} aria-label="Sundial home">
					<span class="logo" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="16" height="16">
							<circle cx="12" cy="12" r="4.4" fill="currentColor" />
							<path d="M12 1.8v3.4M12 18.8v3.4M1.8 12h3.4M18.8 12h3.4M4.8 4.8l2.4 2.4M16.8 16.8l2.4 2.4M19.2 4.8l-2.4 2.4M7.2 16.8l-2.4 2.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
						</svg>
					</span>
					<span class="brand-name">Sundial</span>
				</button>
			</div>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger class="sd-workspace" aria-label="Switch workspace">
					<span class="workspace-mark">{workspace.mark}</span>
					<span class="workspace-text">
						<span class="workspace-name">{workspace.name}</span>
						<span class="workspace-plan">{workspace.plan}</span>
					</span>
					<Icon name="chevron-down" size={14} cls="workspace-chev" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content class="sd-menu sd-workspace-menu" align="start" sideOffset={6}>
						<DropdownMenu.RadioGroup value={workspaceId} onValueChange={chooseWorkspace}>
							<DropdownMenu.GroupHeading class="sd-menu-label">Workspaces</DropdownMenu.GroupHeading>
							{#each workspaces as ws}
								<DropdownMenu.RadioItem value={ws.id} class="sd-menu-item sd-ws-item">
									<span class="ws-mark">{ws.mark}</span>
									<span class="ws-text">
										<span class="ws-name">{ws.name}</span>
										<span class="muted">{ws.plan}</span>
									</span>
									<span class="ws-check">
										{#if workspaceId === ws.id}<Icon name="check" size={14} />{/if}
									</span>
								</DropdownMenu.RadioItem>
							{/each}
						</DropdownMenu.RadioGroup>
						<DropdownMenu.Separator class="sd-menu-sep" />
						<DropdownMenu.Item
							class="sd-menu-item"
							onSelect={() => showToast('Workspace settings opened')}
						>
							<Icon name="edit" size={15} />Manage workspaces
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			<nav class="nav" aria-label="Main">
				<p class="nav-label">Workspace</p>
				{#each navItems as item}
					<button
						type="button"
						class="nav-item"
						class:active={view === item.id}
						onclick={() => setView(item.id)}
						aria-current={view === item.id ? 'page' : undefined}
						title={item.label}
					>
						<Icon name={item.icon} size={17} />
						<span class="nav-text">{item.label}</span>
						{#if item.id === 'prices'}
							<span class="nav-badge">{plans.length}</span>
						{:else if item.id === 'coupons'}
							<span class="nav-badge">{coupons.length}</span>
						{:else if item.id === 'invoices' && openInvoices > 0}
							<span class="nav-badge warn">{openInvoices}</span>
						{/if}
					</button>
				{/each}
			</nav>

			<div class="sidebar-foot">
				<div class="test-card">
					<div class="test-row">
						<span class="test-dot" class:live={!testMode}></span>
						<span class="test-label">Test mode</span>
						<Switch.Root bind:checked={testMode} class="sd-switch sd-switch-sm" aria-label="Toggle test mode">
							<Switch.Thumb class="sd-thumb" />
						</Switch.Root>
					</div>
					<p class="test-note">
						{testMode ? 'Sandbox keys. No real charges.' : 'Live keys are active.'}
					</p>
				</div>
				<div class="user-row">
					<span class="avatar">MC</span>
					<span class="user-text">
						<span class="user-name">Maya Chen</span>
						<span class="user-mail">maya@sundial.studio</span>
					</span>
					<button
						type="button"
						class="sd-icon-btn"
						aria-label="Help and support"
						onclick={() => showToast('Support is one message away', { detail: 'help@sundial.studio' })}
					>
						<Icon name="help" size={16} />
					</button>
				</div>
			</div>
		</aside>

		<div class="shell">
			<header class="topbar">
				<button
					type="button"
					class="icon-btn menu-btn"
					aria-label="Open navigation"
					onclick={() => (mobileNav = true)}
				>
					<Icon name="menu" size={18} />
				</button>
				<Tooltip.Root>
					<Tooltip.Trigger
						class="sd-icon-btn sd-collapse-btn"
						aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
						onclick={() => (sidebarCollapsed = !sidebarCollapsed)}
					>
						<Icon name="panel" size={17} />
					</Tooltip.Trigger>
					<Tooltip.Portal>
						<Tooltip.Content class="sd-tooltip" sideOffset={6}>
							{sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
						</Tooltip.Content>
					</Tooltip.Portal>
				</Tooltip.Root>

				<div class="crumbs" aria-label="Breadcrumb">
					<span class="crumb-muted">{workspace.name}</span>
					<span class="crumb-sep">/</span>
					<span class="crumb-current">{viewTitle[view]}</span>
				</div>

				<div class="top-actions">
					<button type="button" class="search-trigger" onclick={() => (paletteOpen = true)}>
						<Icon name="search" size={15} />
						<span>Search</span>
						<kbd>⌘K</kbd>
					</button>

					<Popover.Root>
						<Popover.Trigger class="sd-icon-btn sd-bell" aria-label="Notifications">
							<Icon name="bell" size={17} />
							{#if unread > 0}<span class="bell-count">{unread}</span>{/if}
						</Popover.Trigger>
						<Popover.Portal>
							<Popover.Content class="sd-popover sd-notes" align="start" sideOffset={8} collisionPadding={10}>
								<div class="notes-head">
									<span class="notes-title">Notifications</span>
									{#if unread > 0}
										<button type="button" class="link-btn" onclick={markAllRead}>Mark all read</button>
									{/if}
								</div>
								<div class="notes-list">
									{#each notes as note}
										<div class="note" class:unread={note.unread}>
											<span class="note-icon"><Icon name={note.icon} size={15} /></span>
											<div class="note-text">
												<span class="note-title">{note.title}</span>
												<span class="note-body">{note.body}</span>
												<span class="note-time">{note.time}</span>
											</div>
											{#if note.unread}<span class="unread-dot" aria-label="Unread"></span>{/if}
										</div>
									{/each}
								</div>
								<button
									type="button"
									class="notes-foot"
									onclick={() => showToast('Notification history opened')}
								>
									View all notifications
								</button>
							</Popover.Content>
						</Popover.Portal>
					</Popover.Root>

					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="sd-avatar-btn" aria-label="Account menu">MC</DropdownMenu.Trigger>
						<DropdownMenu.Portal>
							<DropdownMenu.Content class="sd-menu sd-account-menu" align="end" sideOffset={8}>
								<div class="account-head">
									<span class="avatar">MC</span>
									<span class="account-text">
										<span class="account-name">Maya Chen</span>
										<span class="muted">maya@sundial.studio</span>
									</span>
								</div>
								<DropdownMenu.Separator class="sd-menu-sep" />
								<DropdownMenu.Item class="sd-menu-item" onSelect={() => showToast('Profile opened')}>
									<Icon name="users" size={15} />Profile
								</DropdownMenu.Item>
								<DropdownMenu.Item class="sd-menu-item" onSelect={() => showToast('Preferences opened')}>
									<Icon name="edit" size={15} />Preferences
								</DropdownMenu.Item>
								<DropdownMenu.Item class="sd-menu-item" onSelect={() => showToast('Support is one message away')}>
									<Icon name="help" size={15} />Support
								</DropdownMenu.Item>
								<DropdownMenu.Separator class="sd-menu-sep" />
								<DropdownMenu.Item class="sd-menu-item" onSelect={() => showToast('Signed out of the demo')}>
									<Icon name="external" size={15} />Sign out
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				</div>
			</header>

			<main class="main-scroll" bind:this={mainEl}>
				{#if view === 'overview'}
					<section class="view" aria-labelledby="overview-title">
						<header class="page-head">
							<div class="page-head-text">
								<p class="eyebrow"><span class="live-dot"></span>Live · {range.label}</p>
								<h1 class="page-title" id="overview-title">Good morning, Maya</h1>
								<p class="page-sub">
									{money(netTotal)} net revenue this period, {netDelta >= 0 ? 'up' : 'down'}
									{Math.abs(netDelta).toFixed(1)}% on the period before.
								</p>
							</div>
							<div class="head-actions">
								<Popover.Root bind:open={rangeOpen}>
									<Popover.Trigger class="sd-range-trigger">
										<Icon name="calendar" size={15} />
										<span>{range.label}</span>
										<Icon name="chevron-down" size={14} />
									</Popover.Trigger>
									<Popover.Portal>
										<Popover.Content class="sd-popover sd-range-pop" align="start" sideOffset={8} collisionPadding={10}>
											<p class="pop-label">Date range</p>
											<div class="range-list">
												{#each rangePresets as preset}
													<button
														type="button"
														class="range-option"
														class:active={rangeId === preset.id}
														onclick={() => pickRange(preset.id)}
													>
														<span class="range-text">
															<span class="range-name">{preset.label}</span>
															<span class="range-hint">{preset.hint}</span>
														</span>
														{#if rangeId === preset.id}<Icon name="check" size={15} />{/if}
													</button>
												{/each}
											</div>
											<div class="pop-sep"></div>
											<p class="pop-label">Custom range</p>
											<div class="custom-dates">
												<label>
													<span>Start</span>
													<input type="date" bind:value={customStart} max={isoDate(TODAY)} />
												</label>
												<label>
													<span>End</span>
													<input type="date" bind:value={customEnd} max={isoDate(TODAY)} />
												</label>
											</div>
											<button type="button" class="btn btn-primary apply-btn" onclick={applyCustom}>
												Apply range
											</button>
										</Popover.Content>
									</Popover.Portal>
								</Popover.Root>
								<button type="button" class="btn btn-secondary" onclick={exportRevenue}>
									<Icon name="download" size={15} />Export
								</button>
							</div>
						</header>

						<div class="kpi-grid">
							<article class="card kpi">
								<div class="kpi-top">
									<span class="kpi-label">Net revenue {@render infoTip('Payments minus refunds and processing fees.')}</span>
									<span class="kpi-icon"><Icon name="trend" size={15} /></span>
								</div>
								<p class="kpi-value"><AnimatedNumber value={netTotal} format={money} /></p>
								<div class="kpi-foot">
									<span class="delta" class:good={netDelta >= 0} class:bad={netDelta < 0}>
										<Icon name={netDelta >= 0 ? 'arrow-up-right' : 'arrow-down-right'} size={12} />
										{pct(netDelta)}
									</span>
									<span class="kpi-note">vs prev. period</span>
									<span class="kpi-spark"><Sparkline values={netSpark} positive={netDelta >= 0} width={86} height={30} /></span>
								</div>
							</article>

							<article class="card kpi">
								<div class="kpi-top">
									<span class="kpi-label">Monthly recurring revenue {@render infoTip('Active subscriptions normalized to a monthly value.')}</span>
									<span class="kpi-icon"><Icon name="bank" size={15} /></span>
								</div>
								<p class="kpi-value"><AnimatedNumber value={mrr} format={money} /></p>
								<div class="kpi-foot">
									<span class="delta good">
										<Icon name="arrow-up-right" size={12} />+4.8%
									</span>
									<span class="kpi-note">vs last month</span>
									<span class="kpi-spark"><Sparkline values={mrrSpark} width={86} height={30} /></span>
								</div>
							</article>

							<article class="card kpi">
								<div class="kpi-top">
									<span class="kpi-label">Active subscriptions {@render infoTip('Subscriptions on active and grandfathered prices.')}</span>
									<span class="kpi-icon"><Icon name="users" size={15} /></span>
								</div>
								<p class="kpi-value">
									<AnimatedNumber value={subs} format={(n) => Math.round(n).toLocaleString('en-US')} />
								</p>
								<div class="kpi-foot">
									<span class="delta good"><Icon name="arrow-up-right" size={12} />+3.2%</span>
									<span class="kpi-note">vs last month</span>
									<span class="kpi-spark"><Sparkline values={subsSpark} width={86} height={30} /></span>
								</div>
							</article>

							<article class="card kpi">
								<div class="kpi-top">
									<span class="kpi-label">Refund rate {@render infoTip('Refunded volume as a share of gross volume.')}</span>
									<span class="kpi-icon"><Icon name="refresh" size={15} /></span>
								</div>
								<p class="kpi-value">
									<AnimatedNumber value={refundRate} format={(n) => `${n.toFixed(2)}%`} />
								</p>
								<div class="kpi-foot">
									<span class="delta" class:good={refundDelta <= 0} class:bad={refundDelta > 0}>
										<Icon name={refundDelta <= 0 ? 'arrow-down-right' : 'arrow-up-right'} size={12} />
										{Math.abs(refundDelta).toFixed(2)}pp
									</span>
									<span class="kpi-note">of gross volume</span>
									<span class="kpi-spark"><Sparkline values={refundSpark} positive={refundDelta <= 0} width={86} height={30} /></span>
								</div>
							</article>
						</div>

						<article class="card chart-card">
							<div class="card-head">
								<div>
									<h2 class="card-title">Revenue</h2>
									<p class="card-sub">Net of refunds and processing fees</p>
								</div>
								<div class="chart-controls">
									<div class="segmented" role="group" aria-label="Chart granularity">
										{#each [{ id: 'day', label: 'Daily' }, { id: 'week', label: 'Weekly' }, { id: 'month', label: 'Monthly' }] as option}
											<button
												type="button"
												class:active={granularity === option.id}
												aria-pressed={granularity === option.id}
												onclick={() => (granularity = option.id as Granularity)}
											>
												{option.label}
											</button>
										{/each}
									</div>
									<div class="compare-toggle">
										<Switch.Root bind:checked={compare} class="sd-switch sd-switch-sm" aria-label="Compare with previous period">
											<Switch.Thumb class="sd-thumb" />
										</Switch.Root>
										<span>Compare</span>
									</div>
								</div>
							</div>

							<div class="chart-summary">
								<div class="chart-total-wrap">
									<span class="chart-total"><AnimatedNumber value={netTotal} format={money} /></span>
									<span class="chart-meta">
										<span class="delta" class:good={netDelta >= 0} class:bad={netDelta < 0}>
											<Icon name={netDelta >= 0 ? 'arrow-up-right' : 'arrow-down-right'} size={12} />
											{pct(netDelta)}
										</span>
										<span class="kpi-note">vs previous period</span>
									</span>
								</div>
								<div class="chart-legend">
									<span><i class="legend-dot"></i>Net revenue</span>
									{#if compare}<span><i class="legend-dot prev"></i>Previous</span>{/if}
									<span class="legend-note">{ordersTotal.toLocaleString()} orders</span>
								</div>
							</div>

							<RevenueChart
								data={chartData}
								compareData={prevChartData}
								{compare}
								height={250}
								seriesLabel="Net revenue"
							/>
						</article>

						<div class="overview-grid">
							<div class="main-stack">
								<article class="card list-card">
									<div class="card-head">
										<div>
											<h2 class="card-title">Recent invoices</h2>
											<p class="card-sub">Latest activity across {workspace.name}</p>
										</div>
										<button type="button" class="link-btn" onclick={() => setView('invoices')}>
											View all<Icon name="chevron-right" size={13} />
										</button>
									</div>
									<div class="invoice-list">
										{#each invoiceRows.slice(0, 5) as invoice (invoice.id)}
											<div class="invoice-row">
												<span class="avatar sm">{initials(invoice.customer)}</span>
												<span class="invoice-main">
													<span class="invoice-name">{invoice.customer}</span>
													<span class="invoice-company">{invoice.company}</span>
												</span>
												<span class="invoice-plan">{invoice.plan}</span>
												<span class="invoice-amount">{money(invoice.amount)}</span>
												<span class="badge {tone(invoice.status)}">{invoiceStatusLabel[invoice.status]}</span>
											</div>
										{/each}
									</div>
								</article>

								<article class="card payout-card">
									<div class="payout-head">
										<div>
											<h2 class="card-title">Next payout</h2>
											<p class="card-sub">Fri, Nov 6 · Chase •• 4821</p>
										</div>
										<span class="badge info">Scheduled</span>
									</div>
									<div class="payout-figures">
										<div class="payout-figure">
											<span>Arriving</span>
											<strong>$18,420.55</strong>
										</div>
										<div class="payout-figure">
											<span>Pending</span>
											<strong>$4,182.09</strong>
										</div>
										<div class="payout-figure">
											<span>Available</span>
											<strong>$1,904.20</strong>
										</div>
									</div>
									<div class="payout-bar" aria-hidden="true">
										<span class="p1"></span><span class="p2"></span><span class="p3"></span>
									</div>
									<div class="payout-foot">
										<span>Daily schedule · 2 business days</span>
										<button
											type="button"
											class="link-btn"
											onclick={() => showToast('Payout settings opened')}
										>
											Manage<Icon name="chevron-right" size={13} />
										</button>
									</div>
								</article>

							</div>

							<div class="side-stack">
								<article class="card mix-card">
									<div class="card-head">
										<div>
											<h2 class="card-title">Plan mix</h2>
											<p class="card-sub">Share of recurring revenue</p>
										</div>
										<span class="mix-total">{money(mrr)}</span>
									</div>
									<div class="mix-list">
										{#each mixPlans as item}
											<div class="mix-row">
												<div class="mix-head">
													<span class="mix-name">{item.plan.name}</span>
													<span class="mix-value">{money(planMrr(item.plan))}</span>
												</div>
												<div class="mix-track">
													<span
														class="mix-bar"
														style="width:{(item.share / (mixPlans[0]?.share || 1)) * 100}%; background:{item.color}"
													></span>
												</div>
												<div class="mix-meta">
													<span>{item.plan.subs.toLocaleString()} subscriptions</span>
													<span>{item.share.toFixed(1)}%</span>
												</div>
											</div>
										{/each}
									</div>
									<button type="button" class="mix-foot" onclick={() => setView('prices')}>
										Manage prices<Icon name="arrow-up-right" size={13} />
									</button>
								</article>

								<article class="card activity-card">
									<div class="card-head">
										<div>
											<h2 class="card-title">Activity</h2>
											<p class="card-sub">Changes in the last few days</p>
										</div>
										<button
											type="button"
											class="link-btn"
											onclick={() => showToast('Activity log opened')}
										>
											View log
										</button>
									</div>
									<div class="activity-list">
										{#each activity.slice(0, 4) as item (item.id)}
											<div class="activity-row">
												<span class="activity-icon {item.kind}">
													<Icon
														name={item.kind === 'payout'
															? 'bank'
															: item.kind === 'coupon'
																? 'ticket'
																: item.kind === 'subscription'
																	? 'users'
																	: 'tag'}
														size={14}
													/>
												</span>
												<span class="activity-text">
													<span class="activity-title">{item.title}</span>
													<span class="activity-detail">{item.detail}</span>
												</span>
												<span class="activity-time">{item.time}</span>
											</div>
										{/each}
									</div>
								</article>
							</div>
						</div>
					</section>
				{:else if view === 'prices'}
					<section class="view" aria-labelledby="prices-title">
						<header class="page-head">
							<div class="page-head-text">
								<p class="eyebrow">Catalogue</p>
								<h1 class="page-title" id="prices-title">Prices</h1>
								<p class="page-sub">
									{plans.length} prices · {activePriceCount} active · {statusCounts.draft} drafts
								</p>
							</div>
							<div class="head-actions">
								<button type="button" class="btn btn-secondary" onclick={exportPrices}>
									<Icon name="download" size={15} />Export
								</button>
								<button type="button" class="btn btn-primary" onclick={openNewPrice}>
									<Icon name="plus" size={15} />New price
								</button>
							</div>
						</header>

						<div class="card filters">
							<div class="search-field">
								<Icon name="search" size={15} cls="search-icon" />
								<input
									bind:value={priceQuery}
									placeholder="Search prices…"
									aria-label="Search prices"
									autocomplete="off"
									spellcheck="false"
								/>
								{#if priceQuery}
									<button
										type="button"
										class="clear-btn"
										aria-label="Clear search"
										onclick={() => (priceQuery = '')}
									>
										<Icon name="x" size={13} />
									</button>
								{/if}
							</div>

							<div class="filter-group">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger class="sd-filter-btn">
										<Icon name="filter" size={14} />
										Status
										<span class="filter-count">{priceStatuses.length}</span>
										<Icon name="chevron-down" size={13} />
									</DropdownMenu.Trigger>
									<DropdownMenu.Portal>
										<DropdownMenu.Content class="sd-menu" align="start" sideOffset={6}>
											<DropdownMenu.CheckboxGroup bind:value={priceStatuses}>
												{#each ['active', 'draft', 'archived'] as status}
													<DropdownMenu.CheckboxItem
														value={status}
														closeOnSelect={false}
														class="sd-menu-item sd-check-item"
													>
														<span class="check-box" class:on={priceStatuses.includes(status)}>
															<Icon name="check" size={11} />
														</span>
														<span class="check-label">{statusLabel[status as PriceStatus]}</span>
														<span class="check-count">{statusCounts[status as PriceStatus]}</span>
													</DropdownMenu.CheckboxItem>
												{/each}
											</DropdownMenu.CheckboxGroup>
											<DropdownMenu.Separator class="sd-menu-sep" />
											<DropdownMenu.Item
												class="sd-menu-item"
												onSelect={() => (priceStatuses = ['active', 'draft', 'archived'])}
											>
												Show all statuses
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>

								<DropdownMenu.Root>
									<DropdownMenu.Trigger class="sd-filter-btn">
										<Icon name="calendar" size={14} />
										{priceInterval === 'all' ? 'All intervals' : intervalLabel(priceInterval)}
										<Icon name="chevron-down" size={13} />
									</DropdownMenu.Trigger>
									<DropdownMenu.Portal>
										<DropdownMenu.Content class="sd-menu" align="start" sideOffset={6}>
											<DropdownMenu.RadioGroup
												value={priceInterval}
												onValueChange={(value) => (priceInterval = value as 'all' | Interval)}
											>
												<DropdownMenu.RadioItem value="all" class="sd-menu-item sd-radio-item">
													<span class="radio-box" class:on={priceInterval === 'all'}></span>
													All intervals
												</DropdownMenu.RadioItem>
												<DropdownMenu.RadioItem value="month" class="sd-menu-item sd-radio-item">
													<span class="radio-box" class:on={priceInterval === 'month'}></span>
													Monthly
												</DropdownMenu.RadioItem>
												<DropdownMenu.RadioItem value="year" class="sd-menu-item sd-radio-item">
													<span class="radio-box" class:on={priceInterval === 'year'}></span>
													Annual
												</DropdownMenu.RadioItem>
											</DropdownMenu.RadioGroup>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							</div>

							<span class="result-count">{visiblePlans.length} of {plans.length}</span>
						</div>

						<div class="card table-card">
							<div class="table-wrap">
								<table class="data-table">
									<thead>
										<tr>
											<th scope="col">
												<button
													type="button"
													class="sort-btn"
													class:active={priceSort.key === 'name'}
													onclick={() => sortPrices('name')}
												>
													Price
													<Icon
														name={priceSort.key === 'name'
															? priceSort.dir === 'asc'
																? 'chevron-up'
																: 'chevron-down'
															: 'sort'}
														size={12}
													/>
												</button>
											</th>
											<th scope="col" class="num-col">
												<button
													type="button"
													class="sort-btn"
													class:active={priceSort.key === 'price'}
													onclick={() => sortPrices('price')}
												>
													Amount
													<Icon
														name={priceSort.key === 'price'
															? priceSort.dir === 'asc'
																? 'chevron-up'
																: 'chevron-down'
															: 'sort'}
														size={12}
													/>
												</button>
											</th>
											<th scope="col">Billing</th>
											<th scope="col" class="num-col">
												<button
													type="button"
													class="sort-btn"
													class:active={priceSort.key === 'subs'}
													onclick={() => sortPrices('subs')}
												>
													Subscriptions
													<Icon
														name={priceSort.key === 'subs'
															? priceSort.dir === 'asc'
																? 'chevron-up'
																: 'chevron-down'
															: 'sort'}
														size={12}
													/>
												</button>
											</th>
											<th scope="col" class="num-col">
												<button
													type="button"
													class="sort-btn"
													class:active={priceSort.key === 'mrr'}
													onclick={() => sortPrices('mrr')}
												>
													MRR
													<Icon
														name={priceSort.key === 'mrr'
															? priceSort.dir === 'asc'
																? 'chevron-up'
																: 'chevron-down'
															: 'sort'}
														size={12}
													/>
												</button>
											</th>
											<th scope="col">
												<button
													type="button"
													class="sort-btn"
													class:active={priceSort.key === 'updated'}
													onclick={() => sortPrices('updated')}
												>
													Updated
													<Icon
														name={priceSort.key === 'updated'
															? priceSort.dir === 'asc'
																? 'chevron-up'
																: 'chevron-down'
															: 'sort'}
														size={12}
													/>
												</button>
											</th>
											<th scope="col">Status</th>
											<th scope="col"><span class="sr-only">Actions</span></th>
										</tr>
									</thead>
									<tbody>
										{#each visiblePlans as plan (plan.id)}
											<tr>
												<td>
													<div class="plan-cell">
														<span class="plan-dot {plan.status}"></span>
														<div class="plan-text">
															<span class="plan-name">
																{plan.name}
																{#if plan.popular}<span class="mini-tag">Popular</span>{/if}
															</span>
															<span class="plan-desc">{plan.desc}</span>
															<span class="mono-id">{plan.id}</span>
														</div>
													</div>
												</td>
												<td class="num strong">
													{money(plan.price)}<span class="unit">{intervalShort(plan.interval)}</span>
												</td>
												<td>{intervalLabel(plan.interval)}</td>
												<td class="num">{plan.subs.toLocaleString()}</td>
												<td class="num">{money(planMrr(plan))}</td>
												<td class="muted">{prettyISO(plan.updated)}</td>
												<td>
													<span class="badge {tone(plan.status)}">{statusLabel[plan.status]}</span>
												</td>
												<td class="row-actions">
													<DropdownMenu.Root>
														<DropdownMenu.Trigger
															class="sd-icon-btn"
															aria-label="Actions for {plan.name}"
														>
															<Icon name="more" size={16} />
														</DropdownMenu.Trigger>
														<DropdownMenu.Portal>
															<DropdownMenu.Content class="sd-menu sd-row-menu" align="end" sideOffset={4}>
																<DropdownMenu.Item class="sd-menu-item" onSelect={() => openEditPrice(plan)}>
																	<Icon name="edit" size={15} />Edit price
																</DropdownMenu.Item>
																<DropdownMenu.Item class="sd-menu-item" onSelect={() => duplicatePrice(plan)}>
																	<Icon name="copy" size={15} />Duplicate
																</DropdownMenu.Item>
																<DropdownMenu.Separator class="sd-menu-sep" />
																{#if plan.status !== 'archived'}
																	<DropdownMenu.Item class="sd-menu-item" onSelect={() => archivePrice(plan)}>
																		<Icon name="archive" size={15} />Archive
																	</DropdownMenu.Item>
																{/if}
																{#if plan.subs === 0}
																	<DropdownMenu.Item
																		class="sd-menu-item sd-danger"
																		onSelect={() => deletePrice(plan)}
																	>
																		<Icon name="trash" size={15} />Delete draft
																	</DropdownMenu.Item>
																{/if}
															</DropdownMenu.Content>
														</DropdownMenu.Portal>
													</DropdownMenu.Root>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>

							{#if visiblePlans.length === 0}
								<div class="empty-state">
									<span class="empty-icon"><Icon name="search" size={19} /></span>
									<p class="empty-title">No prices match those filters</p>
									<p class="empty-sub">Try a different search, or reset the filters to see everything.</p>
									<button
										type="button"
										class="btn btn-secondary"
										onclick={() => {
											priceQuery = '';
											priceStatuses = ['active', 'draft', 'archived'];
											priceInterval = 'all';
										}}
									>
										Reset filters
									</button>
								</div>
							{/if}

							<footer class="table-foot">
								<span>Showing {visiblePlans.length} of {plans.length} prices</span>
								<span class="muted">Edits apply to new subscriptions. Existing ones keep their price.</span>
							</footer>
						</div>

						<div class="mobile-cards">
							{#each visiblePlans as plan (plan.id)}
								<article class="card price-card">
									<div class="price-card-head">
										<div class="plan-cell">
											<span class="plan-dot {plan.status}"></span>
											<div class="plan-text">
												<span class="plan-name">
													{plan.name}
													{#if plan.popular}<span class="mini-tag">Popular</span>{/if}
												</span>
												<span class="plan-desc">{plan.desc}</span>
											</div>
										</div>
										<span class="badge {tone(plan.status)}">{statusLabel[plan.status]}</span>
									</div>
									<div class="price-card-grid">
										<div>
											<span class="muted">Price</span>
											<span class="strong">{money(plan.price)}<span class="unit">{intervalShort(plan.interval)}</span></span>
										</div>
										<div>
											<span class="muted">Subscriptions</span>
											<span class="strong">{plan.subs.toLocaleString()}</span>
										</div>
										<div>
											<span class="muted">MRR</span>
											<span class="strong">{money(planMrr(plan))}</span>
										</div>
										<div>
											<span class="muted">Updated</span>
											<span>{prettyISO(plan.updated)}</span>
										</div>
									</div>
									<div class="price-card-foot">
										<span class="mono-id">{plan.id}</span>
										<button type="button" class="btn btn-secondary sm" onclick={() => openEditPrice(plan)}>
											<Icon name="edit" size={13} />Edit
										</button>
									</div>
								</article>
							{/each}
							{#if visiblePlans.length === 0}
								<div class="card empty-state">
									<span class="empty-icon"><Icon name="search" size={19} /></span>
									<p class="empty-title">No prices match those filters</p>
									<p class="empty-sub">Try a different search, or reset the filters.</p>
									<button
										type="button"
										class="btn btn-secondary"
										onclick={() => {
											priceQuery = '';
											priceStatuses = ['active', 'draft', 'archived'];
											priceInterval = 'all';
										}}
									>
										Reset filters
									</button>
								</div>
							{/if}
						</div>
					</section>
				{:else if view === 'coupons'}
					<section class="view" aria-labelledby="coupons-title">
						<header class="page-head">
							<div class="page-head-text">
								<p class="eyebrow">Growth</p>
								<h1 class="page-title" id="coupons-title">Coupons</h1>
								<p class="page-sub">
									{activeCoupons} live codes · {couponRedemptions.toLocaleString()} redemptions to date
								</p>
							</div>
							<div class="head-actions">
								<button type="button" class="btn btn-primary" onclick={() => (couponOpen = true)}>
									<Icon name="plus" size={15} />Create coupon
								</button>
							</div>
						</header>

						<div class="stat-row">
							<article class="card stat">
								<span class="stat-label">Active coupons</span>
								<span class="stat-value"><AnimatedNumber value={activeCoupons} /></span>
								<span class="stat-note">of {coupons.length} total codes</span>
							</article>
							<article class="card stat">
								<span class="stat-label">Redemptions</span>
								<span class="stat-value"><AnimatedNumber value={couponRedemptions} format={(n) => Math.round(n).toLocaleString('en-US')} /></span>
								<span class="stat-note">across all codes</span>
							</article>
							<article class="card stat">
								<span class="stat-label">Estimated discount</span>
								<span class="stat-value"><AnimatedNumber value={discountGiven} format={money} /></span>
								<span class="stat-note">given this quarter</span>
							</article>
						</div>

						<div class="card filters coupon-filters">
							<div class="chip-row" role="group" aria-label="Filter coupons by status">
								{#each couponFilters as filter}
									<button
										type="button"
										class="chip"
										class:active={couponFilter === filter.id}
										aria-pressed={couponFilter === filter.id}
										onclick={() => (couponFilter = filter.id)}
									>
										{filter.label}
										<span class="chip-count">{couponCounts[filter.id]}</span>
									</button>
								{/each}
							</div>
							<div class="search-field grow">
								<Icon name="search" size={15} cls="search-icon" />
								<input
									bind:value={couponQuery}
									placeholder="Search codes…"
									aria-label="Search coupons"
									autocomplete="off"
									spellcheck="false"
								/>
								{#if couponQuery}
									<button
										type="button"
										class="clear-btn"
										aria-label="Clear search"
										onclick={() => (couponQuery = '')}
									>
										<Icon name="x" size={13} />
									</button>
								{/if}
							</div>
						</div>

						<div class="coupon-list">
							{#each visibleCoupons as coupon (coupon.id)}
								<article class="card coupon-row">
									<div class="coupon-main">
										<div class="coupon-code-row">
											<span class="coupon-code">{coupon.code}</span>
											<button
												type="button"
												class="copy-btn"
												aria-label="Copy code {coupon.code}"
												onclick={() => copyCode(coupon.code)}
											>
												<Icon name="copy" size={13} />
											</button>
											<span class="badge {tone(coupon.status)}">{couponStatusLabel[coupon.status]}</span>
										</div>
										<span class="coupon-applies">
											{coupon.applies}
											{#if coupon.expires}· Expires {prettyISO(coupon.expires)}{/if}
										</span>
									</div>

									<div class="coupon-amount">
										<span class="coupon-big">
											{coupon.kind === 'percent' ? `${coupon.value}%` : money(coupon.value)}
										</span>
										<span class="muted">off</span>
									</div>

									<div class="coupon-usage">
										<div class="usage-line">
											<span>{coupon.redemptions.toLocaleString()} used</span>
											<span class="muted">{coupon.limit ? `of ${coupon.limit.toLocaleString()}` : 'Unlimited'}</span>
										</div>
										<div class="progress" aria-hidden="true">
											<span
												class="progress-bar"
												class:full={usagePct(coupon) >= 90}
												style="width:{usagePct(coupon).toFixed(1)}%"
											></span>
										</div>
									</div>

									<div class="coupon-actions">
										<DropdownMenu.Root>
											<DropdownMenu.Trigger class="sd-icon-btn" aria-label="Actions for {coupon.code}">
												<Icon name="more" size={16} />
											</DropdownMenu.Trigger>
											<DropdownMenu.Portal>
												<DropdownMenu.Content class="sd-menu sd-row-menu" align="end" sideOffset={4}>
													<DropdownMenu.Item class="sd-menu-item" onSelect={() => copyCode(coupon.code)}>
														<Icon name="copy" size={15} />Copy code
													</DropdownMenu.Item>
													{#if coupon.status === 'active' || coupon.status === 'paused'}
														<DropdownMenu.Item class="sd-menu-item" onSelect={() => toggleCoupon(coupon)}>
															<Icon name={coupon.status === 'active' ? 'clock' : 'refresh'} size={15} />
															{coupon.status === 'active' ? 'Pause coupon' : 'Resume coupon'}
														</DropdownMenu.Item>
													{/if}
													<DropdownMenu.Item
														class="sd-menu-item"
														onSelect={() => showToast('Redemptions opened', { detail: `${coupon.code} · ${coupon.redemptions} redemptions` })}
													>
														<Icon name="users" size={15} />View redemptions
													</DropdownMenu.Item>
													<DropdownMenu.Separator class="sd-menu-sep" />
													<DropdownMenu.Item class="sd-menu-item sd-danger" onSelect={() => deleteCoupon(coupon)}>
														<Icon name="trash" size={15} />Delete coupon
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									</div>
								</article>
							{/each}

							{#if visibleCoupons.length === 0}
								<div class="card empty-state">
									<span class="empty-icon"><Icon name="ticket" size={19} /></span>
									<p class="empty-title">No coupons here</p>
									<p class="empty-sub">
										{couponQuery ? `Nothing matches “${couponQuery}”.` : 'No codes with that status yet.'}
									</p>
									<button
										type="button"
										class="btn btn-secondary"
										onclick={() => {
											couponQuery = '';
											couponFilter = 'all';
										}}
									>
										Show all coupons
									</button>
								</div>
							{/if}
						</div>

						<p class="foot-note">
							Coupons are applied at checkout before tax. Paused codes keep their redemption history.
						</p>
					</section>
				{:else}
					<section class="view" aria-labelledby="invoices-title">
						<header class="page-head">
							<div class="page-head-text">
								<p class="eyebrow">Billing</p>
								<h1 class="page-title" id="invoices-title">Invoices</h1>
								<p class="page-sub">
									{invoiceRows.length} invoices · {openInvoices} awaiting payment · {money(visibleInvoiceTotal)} in view
								</p>
							</div>
							<div class="head-actions">
								<button type="button" class="btn btn-secondary" onclick={exportInvoices}>
									<Icon name="download" size={15} />Export CSV
								</button>
							</div>
						</header>

						<div class="card filters coupon-filters">
							<div class="chip-row" role="group" aria-label="Filter invoices by status">
								{#each invoiceTabs as tab}
									<button
										type="button"
										class="chip"
										class:active={invoiceStatus === tab.id}
										aria-pressed={invoiceStatus === tab.id}
										onclick={() => (invoiceStatus = tab.id)}
									>
										{tab.label}
										<span class="chip-count">
											{tab.id === 'all'
												? invoiceRows.length
												: invoiceRows.filter((invoice) => invoice.status === tab.id).length}
										</span>
									</button>
								{/each}
							</div>
							<div class="search-field grow">
								<Icon name="search" size={15} cls="search-icon" />
								<input
									bind:value={invoiceQuery}
									placeholder="Search invoices or customers…"
									aria-label="Search invoices"
									autocomplete="off"
									spellcheck="false"
								/>
								{#if invoiceQuery}
									<button
										type="button"
										class="clear-btn"
										aria-label="Clear search"
										onclick={() => (invoiceQuery = '')}
									>
										<Icon name="x" size={13} />
									</button>
								{/if}
							</div>
						</div>

						<div class="card table-card">
							<div class="table-wrap">
								<table class="data-table invoice-table">
									<thead>
										<tr>
											<th scope="col">Invoice</th>
											<th scope="col">
												<button
													type="button"
													class="sort-btn"
													class:active={invoiceSort.key === 'customer'}
													onclick={() => sortInvoices('customer')}
												>
													Customer
													<Icon
														name={invoiceSort.key === 'customer'
															? invoiceSort.dir === 'asc'
																? 'chevron-up'
																: 'chevron-down'
															: 'sort'}
														size={12}
													/>
												</button>
											</th>
											<th scope="col">Plan</th>
											<th scope="col">
												<button
													type="button"
													class="sort-btn"
													class:active={invoiceSort.key === 'date'}
													onclick={() => sortInvoices('date')}
												>
													Date
													<Icon
														name={invoiceSort.key === 'date'
															? invoiceSort.dir === 'asc'
																? 'chevron-up'
																: 'chevron-down'
															: 'sort'}
														size={12}
													/>
												</button>
											</th>
											<th scope="col" class="num-col">
												<button
													type="button"
													class="sort-btn"
													class:active={invoiceSort.key === 'amount'}
													onclick={() => sortInvoices('amount')}
												>
													Amount
													<Icon
														name={invoiceSort.key === 'amount'
															? invoiceSort.dir === 'asc'
																? 'chevron-up'
																: 'chevron-down'
															: 'sort'}
														size={12}
													/>
												</button>
											</th>
											<th scope="col">Status</th>
											<th scope="col"><span class="sr-only">Actions</span></th>
										</tr>
									</thead>
									<tbody>
										{#each visibleInvoices as invoice (invoice.id)}
											<tr>
												<td><span class="mono-id">{invoice.id}</span></td>
												<td>
													<div class="customer-cell">
														<span class="avatar sm">{initials(invoice.customer)}</span>
														<div class="plan-text">
															<span class="plan-name">{invoice.customer}</span>
															<span class="plan-desc">{invoice.company}</span>
														</div>
													</div>
												</td>
												<td>{invoice.plan}</td>
												<td class="muted">{prettyISO(invoice.date)}</td>
												<td class="num strong">{money(invoice.amount)}</td>
												<td><span class="badge {tone(invoice.status)}">{invoiceStatusLabel[invoice.status]}</span></td>
												<td class="row-actions">
													<DropdownMenu.Root>
														<DropdownMenu.Trigger class="sd-icon-btn" aria-label="Actions for {invoice.id}">
															<Icon name="more" size={16} />
														</DropdownMenu.Trigger>
														<DropdownMenu.Portal>
															<DropdownMenu.Content class="sd-menu sd-row-menu" align="end" sideOffset={4}>
																<DropdownMenu.Item class="sd-menu-item" onSelect={() => downloadReceipt(invoice)}>
																	<Icon name="download" size={15} />Download {invoice.status === 'paid' ? 'receipt' : 'invoice'}
																</DropdownMenu.Item>
																{#if invoice.status === 'open'}
																	<DropdownMenu.Item class="sd-menu-item" onSelect={() => markPaid(invoice)}>
																		<Icon name="check-circle" size={15} />Mark as paid
																	</DropdownMenu.Item>
																{/if}
																{#if invoice.status === 'paid'}
																	<DropdownMenu.Item class="sd-menu-item" onSelect={() => refundInvoice(invoice)}>
																		<Icon name="refresh" size={15} />Issue refund
																	</DropdownMenu.Item>
																{/if}
																<DropdownMenu.Item class="sd-menu-item" onSelect={() => copyCode(invoice.id)}>
																	<Icon name="copy" size={15} />Copy invoice ID
																</DropdownMenu.Item>
															</DropdownMenu.Content>
														</DropdownMenu.Portal>
													</DropdownMenu.Root>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>

							{#if visibleInvoices.length === 0}
								<div class="empty-state">
									<span class="empty-icon"><Icon name="receipt" size={19} /></span>
									<p class="empty-title">No invoices match</p>
									<p class="empty-sub">
										{invoiceQuery ? `Nothing matches “${invoiceQuery}”.` : 'No invoices with that status.'}
									</p>
									<button
										type="button"
										class="btn btn-secondary"
										onclick={() => {
											invoiceQuery = '';
											invoiceStatus = 'all';
										}}
									>
										Reset filters
									</button>
								</div>
							{/if}

							<footer class="table-foot">
								<span>Showing {visibleInvoices.length} of {invoiceRows.length} invoices</span>
								<span class="muted">{money(visibleInvoiceTotal)} total in view</span>
							</footer>
						</div>

						<div class="mobile-cards">
							{#each visibleInvoices as invoice (invoice.id)}
								<article class="card invoice-card">
									<div class="invoice-card-head">
										<div class="customer-cell">
											<span class="avatar sm">{initials(invoice.customer)}</span>
											<div class="plan-text">
												<span class="plan-name">{invoice.customer}</span>
												<span class="plan-desc">{invoice.company}</span>
											</div>
										</div>
										<span class="badge {tone(invoice.status)}">{invoiceStatusLabel[invoice.status]}</span>
									</div>
									<div class="invoice-card-grid">
										<div><span class="muted">Invoice</span><span class="mono-id">{invoice.id}</span></div>
										<div><span class="muted">Plan</span><span>{invoice.plan}</span></div>
										<div><span class="muted">Date</span><span>{prettyISO(invoice.date)}</span></div>
										<div><span class="muted">Amount</span><span class="strong">{money(invoice.amount)}</span></div>
									</div>
									<div class="invoice-card-foot">
										<button type="button" class="btn btn-secondary sm" onclick={() => downloadReceipt(invoice)}>
											<Icon name="download" size={13} />{invoice.status === 'paid' ? 'Receipt' : 'Invoice'}
										</button>
										{#if invoice.status === 'open'}
											<button type="button" class="btn btn-primary sm" onclick={() => markPaid(invoice)}>
												Mark paid
											</button>
										{/if}
									</div>
								</article>
							{/each}
							{#if visibleInvoices.length === 0}
								<div class="card empty-state">
									<span class="empty-icon"><Icon name="receipt" size={19} /></span>
									<p class="empty-title">No invoices match</p>
									<p class="empty-sub">Try a different search or status.</p>
									<button
										type="button"
										class="btn btn-secondary"
										onclick={() => {
											invoiceQuery = '';
											invoiceStatus = 'all';
										}}
									>
										Reset filters
									</button>
								</div>
							{/if}
						</div>
					</section>
				{/if}
			</main>
		</div>
	</div>
</Tooltip.Provider>

<PriceDrawer
	open={drawerOpen}
	plan={editingPlan}
	onclose={() => (drawerOpen = false)}
	onsave={savePrice}
/>

<CouponDialog
	open={couponOpen}
	existingCodes={coupons.map((coupon) => coupon.code)}
	onclose={() => (couponOpen = false)}
	onsave={saveCoupon}
/>

<CommandPalette open={paletteOpen} {commands} onclose={() => (paletteOpen = false)} />

<Dialog.Root bind:open={mobileNav}>
	<Dialog.Portal>
		<Dialog.Overlay class="sd-sheet-overlay" />
		<Dialog.Content class="sd-sheet" aria-describedby={undefined}>
			<Dialog.Title class="sd-sr-only">Navigation</Dialog.Title>
			<div class="sheet-head">
				<span class="brand static">
					<span class="logo" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="16" height="16">
							<circle cx="12" cy="12" r="4.4" fill="currentColor" />
							<path d="M12 1.8v3.4M12 18.8v3.4M1.8 12h3.4M18.8 12h3.4M4.8 4.8l2.4 2.4M16.8 16.8l2.4 2.4M19.2 4.8l-2.4 2.4M7.2 16.8l-2.4 2.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
						</svg>
					</span>
					<span class="brand-name">Sundial</span>
				</span>
				<button type="button" class="icon-btn" aria-label="Close navigation" onclick={() => (mobileNav = false)}>
					<Icon name="x" size={17} />
				</button>
			</div>

			<div class="sheet-ws">
				<span class="workspace-mark">{workspace.mark}</span>
				<span class="workspace-text">
					<span class="workspace-name">{workspace.name}</span>
					<span class="workspace-plan">{workspace.plan}</span>
				</span>
				<button
					type="button"
					class="sheet-switch"
					onclick={() => {
						chooseWorkspace(otherWorkspace.id);
						mobileNav = false;
					}}
				>
					<Icon name="refresh" size={13} />Switch
				</button>
			</div>

			<nav class="nav" aria-label="Mobile main">
				{#each navItems as item}
					<button
						type="button"
						class="nav-item"
						class:active={view === item.id}
						onclick={() => setView(item.id)}
						aria-current={view === item.id ? 'page' : undefined}
					>
						<Icon name={item.icon} size={17} />
						<span class="nav-text">{item.label}</span>
						{#if item.id === 'prices'}
							<span class="nav-badge">{plans.length}</span>
						{:else if item.id === 'coupons'}
							<span class="nav-badge">{coupons.length}</span>
						{:else if item.id === 'invoices' && openInvoices > 0}
							<span class="nav-badge warn">{openInvoices}</span>
						{/if}
					</button>
				{/each}
			</nav>

			<div class="sheet-foot">
				<div class="user-row">
					<span class="avatar">MC</span>
					<span class="user-text">
						<span class="user-name">Maya Chen</span>
						<span class="user-mail">maya@sundial.studio</span>
					</span>
				</div>
				<p class="test-note">{testMode ? 'Sandbox keys. No real charges.' : 'Live keys are active.'}</p>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<div class="toasts" aria-live="polite" aria-atomic="false">
	{#each toasts as toast (toast.id)}
		<div class="toast" class:danger={toast.tone === 'danger'}>
			<span class="toast-icon">
				<Icon name={toast.tone === 'danger' ? 'trash' : 'check-circle'} size={16} />
			</span>
			<div class="toast-text">
				<span class="toast-message">{toast.message}</span>
				{#if toast.detail}<span class="toast-detail">{toast.detail}</span>{/if}
			</div>
			{#if toast.undo}
				<button type="button" class="toast-undo" onclick={() => runUndo(toast)}>Undo</button>
			{/if}
			<button
				type="button"
				class="toast-x"
				aria-label="Dismiss notification"
				onclick={() => dismissToast(toast.id)}
			>
				<Icon name="x" size={14} />
			</button>
		</div>
	{/each}
</div>

<style>
	/* Tokens also live on :root so portalled menus and popovers inherit them. */
	:global(:root) {
		--line: #ececec;
		--line-strong: #e2e2e2;
		--fg: #171717;
		--fg2: #666666;
		--fg3: #707070;
		--accent: #255cd1;
		--accent-hover: #1f4fb5;
		--accent-soft: #eef4fd;
		--accent-ink: #1b4bb0;
		--ring: rgb(37 92 209 / 0.14);
		--success: #15803d;
		--success-soft: #ecfdf3;
		--danger: #b91c1c;
		--danger-soft: #fef2f2;
		--warning: #b45309;
		--warning-soft: #fff7ed;
	}

	/* -------------------------------------------------------------- */
	/* shell                                                          */
	/* -------------------------------------------------------------- */

	.app {
		--line: #ececec;
		--line-strong: #e2e2e2;
		--fg: #171717;
		--fg2: #666666;
		--fg3: #707070;
		--accent: #255cd1;
		--accent-hover: #1f4fb5;
		--accent-soft: #eef4fd;
		--accent-ink: #1b4bb0;
		--ring: rgb(37 92 209 / 0.14);
		--success: #15803d;
		--success-soft: #ecfdf3;
		--danger: #b91c1c;
		--danger-soft: #fef2f2;
		--warning: #b45309;
		--warning-soft: #fff7ed;
		display: flex;
		height: 100dvh;
		overflow: hidden;
		background: #ffffff;
		color: var(--fg);
		font-family: 'Inter Variable', 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
		font-size: 14px;
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
	}

	.app :where(button) {
		border: 0;
		background: none;
		padding: 0;
		color: inherit;
		font: inherit;
		text-align: inherit;
	}

	.app input {
		font: inherit;
		color: inherit;
	}

	.app :focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.sidebar {
		width: 240px;
		flex: none;
		background: #fafafa;
		border-right: 1px solid var(--line);
		padding: 16px 12px 12px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		transition: width 200ms cubic-bezier(0.23, 1, 0.32, 1);
	}

	.brand-row {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 16px;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 4px;
		margin-left: -4px;
		border-radius: 7px;
		width: 100%;
		min-width: 0;
		transition: background 120ms;
	}

	.brand:hover {
		background: #f1f1f1;
	}

	.brand.static {
		margin: 0;
		width: auto;
	}

	.logo {
		width: 28px;
		height: 28px;
		border-radius: 8px;
		background: var(--accent);
		color: #ffffff;
		display: grid;
		place-items: center;
		flex: none;
		box-shadow: 0 1px 2px rgb(37 92 209 / 0.3);
	}

	.brand-name {
		font-size: 15.5px;
		font-weight: 600;
		letter-spacing: -0.02em;
		white-space: nowrap;
	}

	.workspace {
		display: flex;
		align-items: center;
		gap: 9px;
		width: 100%;
		padding: 6px 7px;
		border: 1px solid var(--line);
		background: #ffffff;
		border-radius: 9px;
		text-align: left;
		min-width: 0;
		margin-bottom: 20px;
		transition:
			background 120ms,
			border-color 120ms;
	}

	.workspace:hover {
		background: #f6f6f6;
		border-color: #e4e4e4;
	}

	.workspace-mark {
		width: 26px;
		height: 26px;
		border-radius: 7px;
		background: var(--accent-soft);
		color: var(--accent-ink);
		display: grid;
		place-items: center;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.02em;
		flex: none;
	}

	.workspace-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.2;
	}

	.workspace-name {
		font-size: 12.5px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.workspace-plan {
		font-size: 11px;
		color: var(--fg3);
		margin-top: 2px;
	}

	.workspace-chev {
		margin-left: auto;
		color: var(--fg3);
	}

	.nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.nav-label {
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		color: var(--fg3);
		padding: 0 9px 7px;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 34px;
		padding: 0 9px;
		border-radius: 7px;
		color: #555555;
		font-size: 13.5px;
		width: 100%;
		transition:
			background 120ms,
			color 120ms;
	}

	.nav-item:hover {
		background: #f1f1f1;
		color: var(--fg);
	}

	.nav-item.active {
		background: #ffffff;
		color: var(--fg);
		font-weight: 500;
		box-shadow:
			0 1px 2px rgb(0 0 0 / 0.05),
			0 0 0 1px rgb(0 0 0 / 0.045);
	}

	.nav-item.active :global(svg) {
		color: var(--accent);
	}

	.nav-text {
		white-space: nowrap;
	}

	.nav-badge {
		margin-left: auto;
		font-size: 11px;
		font-weight: 500;
		color: var(--fg2);
		background: #efefef;
		border-radius: 5px;
		padding: 1px 5.5px;
		line-height: 1.45;
	}

	.nav-item.active .nav-badge {
		color: var(--fg2);
		background: #f4f4f4;
	}

	.nav-badge.warn {
		background: var(--warning-soft);
		color: var(--warning);
	}

	/* collapsed rail */
	.app.collapsed .sidebar {
		width: 68px;
		padding-inline: 12px;
	}

	.app.collapsed .brand-row {
		justify-content: center;
	}

	.app.collapsed .brand {
		width: 44px;
		margin-left: 0;
		padding: 8px;
		justify-content: center;
	}

	.app.collapsed .brand-name,
	.app.collapsed .workspace-text,
	.app.collapsed :global(.workspace-chev),
	.app.collapsed .nav-label,
	.app.collapsed .nav-text,
	.app.collapsed .nav-badge,
	.app.collapsed .test-card,
	.app.collapsed .user-text,
	.app.collapsed .sidebar-foot :global(.sd-icon-btn) {
		display: none;
	}

	.app.collapsed :global(.sd-workspace) {
		width: 44px;
		padding: 8px;
		justify-content: center;
		margin-inline: auto;
	}

	.app.collapsed .nav {
		align-items: center;
	}

	.app.collapsed .nav-item {
		width: 44px;
		padding: 0;
		justify-content: center;
	}

	.app.collapsed .sidebar-foot {
		align-items: center;
	}

	.app.collapsed .user-row {
		padding: 0;
	}

	.sidebar-foot {
		margin-top: auto;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding-top: 18px;
	}

	.test-card {
		border: 1px solid var(--line);
		background: #ffffff;
		border-radius: 9px;
		padding: 9px 10px;
	}

	.test-row {
		display: flex;
		align-items: center;
		gap: 7px;
	}

	.test-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #f59e0b;
		flex: none;
	}

	.test-dot.live {
		background: #16a34a;
		box-shadow: 0 0 0 3px rgb(22 163 74 / 0.12);
	}

	.test-label {
		font-size: 12px;
		font-weight: 500;
	}

	.test-card :global(.sd-switch) {
		margin-left: auto;
	}

	.test-note {
		font-size: 11px;
		color: var(--fg3);
		line-height: 1.45;
		margin-top: 6px;
	}

	.user-row {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 4px 4px 2px;
		min-width: 0;
	}

	.avatar {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: #eef2f6;
		color: #475569;
		display: grid;
		place-items: center;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.02em;
		flex: none;
	}

	.avatar.sm {
		width: 26px;
		height: 26px;
		font-size: 9.5px;
	}

	.user-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.25;
	}

	.user-name {
		font-size: 12.5px;
		font-weight: 500;
		white-space: nowrap;
	}

	.user-mail {
		font-size: 10.5px;
		color: var(--fg3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-row .icon-btn {
		margin-left: auto;
	}

	.icon-btn {
		width: 30px;
		height: 30px;
		display: grid;
		place-items: center;
		border-radius: 7px;
		color: var(--fg2);
		flex: none;
		transition:
			background 120ms,
			color 120ms;
	}

	.icon-btn:hover {
		background: #f2f2f2;
		color: var(--fg);
	}

	.icon-btn:active {
		background: #ebebeb;
	}

	.shell {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		background: #ffffff;
	}

	.topbar {
		height: 58px;
		flex: none;
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 0 22px;
		border-bottom: 1px solid var(--line);
		background: #ffffff;
	}

	.menu-btn {
		display: none;
	}

	.crumbs {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12.5px;
		min-width: 0;
	}

	.crumb-muted {
		color: var(--fg3);
		white-space: nowrap;
	}

	.crumb-sep {
		color: #cccccc;
	}

	.crumb-current {
		font-weight: 500;
		white-space: nowrap;
	}

	.top-actions {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.search-trigger {
		display: flex;
		align-items: center;
		gap: 7px;
		height: 30px;
		padding: 0 8px 0 9px;
		border-radius: 7px;
		border: 1px solid var(--line);
		background: #fafafa;
		color: var(--fg3);
		font-size: 12.5px;
		min-width: 190px;
		margin-right: 4px;
		transition:
			background 120ms,
			border-color 120ms;
	}

	.search-trigger:hover {
		background: #ffffff;
		border-color: #dcdcdc;
		color: #555555;
	}

	.search-trigger kbd {
		margin-left: auto;
		font-family: inherit;
		font-size: 10.5px;
		color: var(--fg3);
		border: 1px solid #e5e5e5;
		background: #ffffff;
		border-radius: 4px;
		padding: 1px 4px;
		line-height: 1.3;
	}

	.bell {
		position: relative;
	}

	.bell-count {
		position: absolute;
		top: 2px;
		right: 1px;
		min-width: 13px;
		height: 13px;
		padding: 0 3px;
		border-radius: 99px;
		background: var(--accent);
		color: #ffffff;
		font-size: 9px;
		font-weight: 600;
		line-height: 13px;
		text-align: center;
		border: 1.5px solid #ffffff;
	}

	.avatar-btn {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--accent-soft);
		color: var(--accent-ink);
		display: grid;
		place-items: center;
		font-size: 10.5px;
		font-weight: 600;
		margin-left: 4px;
		transition: background 120ms;
	}

	.avatar-btn:hover {
		background: #e2ecfb;
	}

	.main-scroll {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		scroll-behavior: smooth;
	}

	.view {
		max-width: 1180px;
		margin: 0 auto;
		padding: 28px 28px 64px;
	}

	/* -------------------------------------------------------------- */
	/* shared page furniture                                          */
	/* -------------------------------------------------------------- */

	.page-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 20px;
		margin-bottom: 22px;
	}

	.page-head-text {
		min-width: 0;
	}

	.eyebrow {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		font-weight: 500;
		color: var(--fg3);
		margin-bottom: 6px;
	}

	.live-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #16a34a;
		box-shadow: 0 0 0 3px rgb(22 163 74 / 0.12);
		flex: none;
	}

	.page-title {
		font-size: 27px;
		line-height: 1.18;
		font-weight: 600;
		letter-spacing: -0.026em;
	}

	.page-sub {
		font-size: 13.5px;
		color: #6b6b6b;
		margin-top: 5px;
		max-width: 580px;
		line-height: 1.5;
	}

	.head-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		flex: none;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		height: 34px;
		padding: 0 12px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		white-space: nowrap;
		transition:
			background 120ms,
			border-color 120ms,
			box-shadow 120ms,
			transform 80ms;
	}

	.btn:active {
		transform: translateY(0.5px);
	}

	.btn-primary {
		background: var(--accent);
		color: #ffffff;
		box-shadow:
			0 1px 2px rgb(37 92 209 / 0.28),
			inset 0 0 0 1px rgb(255 255 255 / 0.08);
	}

	.btn-primary:hover {
		background: var(--accent-hover);
	}

	.btn-secondary {
		background: #ffffff;
		border: 1px solid var(--line-strong);
		color: #333333;
		box-shadow: 0 1px 1px rgb(0 0 0 / 0.025);
	}

	.btn-secondary:hover {
		background: #fafafa;
		border-color: #d4d4d4;
	}

	.btn.sm {
		height: 29px;
		padding: 0 9px;
		font-size: 12.5px;
		border-radius: 7px;
	}

	.card {
		background: #ffffff;
		border: 1px solid var(--line);
		border-radius: 12px;
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.025);
	}

	.card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 14px;
	}

	.card-title {
		font-size: 15px;
		font-weight: 600;
		letter-spacing: -0.012em;
	}

	.card-sub {
		font-size: 12px;
		color: var(--fg3);
		margin-top: 2px;
	}

	.link-btn {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-size: 12.5px;
		font-weight: 500;
		color: var(--accent);
		border-radius: 4px;
		white-space: nowrap;
	}

	.link-btn:hover {
		color: var(--accent-hover);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 21px;
		padding: 0 7px;
		border-radius: 6px;
		font-size: 11.5px;
		font-weight: 500;
		line-height: 1;
		white-space: nowrap;
		background: #f4f4f5;
		color: #52525b;
	}

	.badge.ok {
		background: var(--success-soft);
		color: var(--success);
	}

	.badge.info {
		background: var(--accent-soft);
		color: var(--accent-ink);
	}

	.badge.warn {
		background: var(--warning-soft);
		color: var(--warning);
	}

	.badge.bad {
		background: var(--danger-soft);
		color: var(--danger);
	}

	.badge.neutral {
		background: #f4f4f5;
		color: #52525b;
	}

	.muted {
		color: var(--fg3);
	}

	.strong {
		font-weight: 500;
	}

	.num {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.data-table th.num-col {
		text-align: right;
	}

	.data-table th.num-col .sort-btn {
		width: 100%;
		justify-content: flex-end;
	}

	.data-table td.num {
		text-align: right;
	}

	.sr-only {
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

	/* -------------------------------------------------------------- */
	/* overview                                                       */
	/* -------------------------------------------------------------- */

	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
		margin-bottom: 14px;
	}

	.kpi {
		padding: 15px 16px 13px;
		min-width: 0;
	}

	.kpi-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.kpi-label {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 12.5px;
		font-weight: 500;
		color: #6b6b6b;
		min-width: 0;
	}

	.kpi-icon {
		width: 25px;
		height: 25px;
		border-radius: 7px;
		background: #f5f7fb;
		color: var(--accent);
		display: grid;
		place-items: center;
		flex: none;
	}

	.kpi-value {
		font-size: 27px;
		font-weight: 600;
		letter-spacing: -0.025em;
		line-height: 1.1;
		margin-top: 10px;
		font-variant-numeric: tabular-nums;
	}

	.kpi-foot {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 11px;
		min-width: 0;
	}

	.kpi-spark {
		margin-left: auto;
		flex: 0 1 86px;
		min-width: 0;
		opacity: 0.95;
	}

	.kpi-spark :global(svg) {
		width: 100%;
		height: 30px;
	}

	.kpi-note {
		font-size: 11.5px;
		color: var(--fg3);
		white-space: nowrap;
	}

	.delta {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		height: 20px;
		padding: 0 6px 0 5px;
		border-radius: 5px;
		font-size: 11.5px;
		font-weight: 500;
		background: #f4f4f5;
		color: #52525b;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.delta.good {
		background: var(--success-soft);
		color: var(--success);
	}

	.delta.bad {
		background: var(--danger-soft);
		color: var(--danger);
	}

	.chart-card {
		padding: 17px 18px 8px;
		margin-bottom: 14px;
	}

	.chart-controls {
		display: flex;
		align-items: center;
		gap: 14px;
		flex-wrap: wrap;
	}

	.segmented {
		display: inline-flex;
		align-items: center;
		gap: 1px;
		background: #f4f4f5;
		border-radius: 7px;
		padding: 2px;
	}

	.segmented button {
		height: 25px;
		padding: 0 9px;
		border-radius: 5px;
		font-size: 12px;
		font-weight: 500;
		color: var(--fg3);
		transition:
			background 120ms,
			color 120ms,
			box-shadow 120ms;
	}

	.segmented button:hover {
		color: var(--fg);
	}

	.segmented button.active {
		background: #ffffff;
		color: var(--fg);
		box-shadow:
			0 1px 2px rgb(0 0 0 / 0.08),
			0 0 0 1px rgb(0 0 0 / 0.02);
	}

	.compare-toggle {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12.5px;
		color: #666666;
	}

	.chart-summary {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16px;
		margin-top: 17px;
		padding: 0 2px;
		flex-wrap: wrap;
	}

	.chart-total {
		font-size: 25px;
		font-weight: 600;
		letter-spacing: -0.025em;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}

	.chart-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 5px;
	}

	.chart-legend {
		display: flex;
		align-items: center;
		gap: 14px;
		font-size: 12px;
		color: var(--fg3);
		flex-wrap: wrap;
		padding-bottom: 2px;
	}

	.chart-legend span {
		display: inline-flex;
		align-items: center;
	}

	.legend-dot {
		display: inline-block;
		width: 7px;
		height: 7px;
		border-radius: 2px;
		background: var(--accent);
		margin-right: 5px;
	}

	.legend-dot.prev {
		background: #c9c9c9;
		border-radius: 50%;
	}

	.legend-note {
		color: var(--fg3);
	}

	.overview-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
		gap: 12px;
		align-items: start;
	}

	.list-card {
		padding: 17px 0 6px;
		min-width: 0;
	}

	.list-card .card-head {
		padding: 0 18px;
	}

	.invoice-list {
		margin-top: 8px;
	}

	.invoice-row {
		display: grid;
		grid-template-columns: 28px minmax(0, 1fr) auto auto auto;
		align-items: center;
		gap: 10px;
		padding: 9px 18px;
	}

	.invoice-row + .invoice-row {
		border-top: 1px solid #f4f4f4;
	}

	.invoice-main {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.3;
	}

	.invoice-name {
		font-size: 12.8px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.invoice-company {
		font-size: 11.5px;
		color: var(--fg3);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.invoice-plan {
		font-size: 12px;
		color: var(--fg3);
		white-space: nowrap;
	}

	.invoice-amount {
		font-size: 12.8px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.side-stack {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
	}

	.main-stack {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
	}

	.payout-card {
		padding: 16px 18px 14px;
	}

	.payout-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.payout-figures {
		display: flex;
		gap: 26px;
		margin-top: 14px;
	}

	.payout-figure {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.payout-figure span {
		font-size: 11px;
		color: var(--fg3);
	}

	.payout-figure strong {
		font-size: 13px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		letter-spacing: -0.01em;
	}

	.payout-bar {
		display: flex;
		gap: 2px;
		height: 5px;
		margin-top: 13px;
		border-radius: 99px;
		overflow: hidden;
	}

	.payout-bar span {
		height: 100%;
	}

	.payout-bar .p1 {
		width: 72%;
		background: var(--accent);
	}

	.payout-bar .p2 {
		width: 16%;
		background: color-mix(in oklab, var(--accent) 38%, #ffffff);
	}

	.payout-bar .p3 {
		width: 12%;
		background: #e3e3e3;
	}

	.payout-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-top: 11px;
		font-size: 11.5px;
		color: var(--fg3);
	}

	.mix-card {
		padding: 16px 18px 15px;
	}

	.mix-total {
		font-size: 14px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.mix-list {
		margin-top: 14px;
		display: flex;
		flex-direction: column;
		gap: 11px;
	}

	.mix-row {
		min-width: 0;
	}

	.mix-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
		font-size: 12.5px;
	}

	.mix-name {
		font-weight: 500;
	}

	.mix-value {
		color: #555555;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.mix-track {
		height: 5px;
		border-radius: 99px;
		background: #f1f1f1;
		overflow: hidden;
		margin-top: 5px;
	}

	.mix-bar {
		display: block;
		height: 100%;
		border-radius: 99px;
		transition: width 400ms cubic-bezier(0.23, 1, 0.32, 1);
	}

	.mix-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		font-size: 11px;
		color: var(--fg3);
		margin-top: 4px;
	}

	.mix-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		margin-top: 13px;
		padding-top: 10px;
		border-top: 1px solid #f2f2f2;
		font-size: 12.5px;
		font-weight: 500;
		color: var(--accent);
	}

	.mix-foot:hover {
		color: var(--accent-hover);
	}

	.activity-card {
		padding: 16px 18px;
	}

	.activity-list {
		margin-top: 10px;
		display: flex;
		flex-direction: column;
	}

	.activity-row {
		display: grid;
		grid-template-columns: 26px minmax(0, 1fr) auto;
		align-items: flex-start;
		gap: 9px;
		padding: 8px 0;
	}

	.activity-row + .activity-row {
		border-top: 1px solid #f4f4f4;
	}

	.activity-icon {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		flex: none;
		background: #f4f4f5;
		color: #666666;
	}

	.activity-icon.price {
		background: var(--accent-soft);
		color: var(--accent);
	}

	.activity-icon.payout {
		background: var(--success-soft);
		color: var(--success);
	}

	.activity-icon.coupon {
		background: var(--warning-soft);
		color: var(--warning);
	}

	.activity-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.35;
	}

	.activity-title {
		font-size: 12.5px;
		font-weight: 500;
	}

	.activity-detail {
		font-size: 11.5px;
		color: var(--fg3);
		margin-top: 1px;
	}

	.activity-time {
		font-size: 11px;
		color: var(--fg3);
		white-space: nowrap;
		padding-top: 1px;
	}

	/* -------------------------------------------------------------- */
	/* filters                                                        */
	/* -------------------------------------------------------------- */

	.filters {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 9px 10px;
		margin-bottom: 12px;
		flex-wrap: wrap;
	}

	.search-field {
		display: flex;
		align-items: center;
		gap: 7px;
		height: 34px;
		padding: 0 9px;
		border: 1px solid var(--line-strong);
		border-radius: 8px;
		background: #ffffff;
		width: 250px;
		min-width: 0;
		transition:
			border-color 120ms,
			box-shadow 120ms;
	}

	.search-field:focus-within {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px rgb(37 92 209 / 0.12);
	}

	.search-field input {
		border: 0;
		outline: 0;
		background: transparent;
		width: 100%;
		font-size: 13px;
		min-width: 0;
	}

	.search-field input::placeholder {
		color: #a3a3a3;
	}

	.clear-btn {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		color: var(--fg3);
		background: #f1f1f1;
		flex: none;
	}

	.clear-btn:hover {
		background: #e8e8e8;
		color: #333333;
	}

	.filter-group {
		display: flex;
		align-items: center;
		gap: 7px;
		flex-wrap: wrap;
	}

	.filter-count {
		display: inline-grid;
		place-items: center;
		min-width: 16px;
		height: 16px;
		padding: 0 4px;
		border-radius: 4px;
		background: #f1f1f1;
		color: var(--fg2);
		font-size: 10.5px;
		font-weight: 500;
		line-height: 1;
	}

	.result-count {
		margin-left: auto;
		font-size: 12px;
		color: var(--fg3);
		white-space: nowrap;
		padding-right: 4px;
	}

	.chip-row {
		display: flex;
		align-items: center;
		gap: 2px;
		background: #f4f4f5;
		padding: 2px;
		border-radius: 8px;
		flex-wrap: wrap;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		height: 28px;
		padding: 0 9px;
		border-radius: 6px;
		font-size: 12.5px;
		font-weight: 500;
		color: var(--fg3);
		transition:
			background 120ms,
			color 120ms,
			box-shadow 120ms;
	}

	.chip:hover {
		color: var(--fg);
	}

	.chip.active {
		background: #ffffff;
		color: var(--fg);
		box-shadow:
			0 1px 2px rgb(0 0 0 / 0.08),
			0 0 0 1px rgb(0 0 0 / 0.02);
	}

	.chip-count {
		font-size: 10.5px;
		font-weight: 500;
		color: var(--fg2);
		background: #ececec;
		border-radius: 4px;
		padding: 1px 4px;
		line-height: 1.35;
	}

	.chip.active .chip-count {
		background: #f0f0f0;
		color: #666666;
	}

	.coupon-filters .search-field.grow {
		margin-left: auto;
		width: 240px;
		flex: 1;
		max-width: 300px;
	}

	/* -------------------------------------------------------------- */
	/* tables                                                         */
	/* -------------------------------------------------------------- */

	.table-card {
		padding: 0;
		overflow: hidden;
	}

	.table-wrap {
		overflow-x: auto;
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 12.8px;
	}

	.data-table th {
		text-align: left;
		font-weight: 500;
		font-size: 11.5px;
		color: var(--fg3);
		padding: 10px 12px;
		border-bottom: 1px solid var(--line);
		background: #fcfcfc;
		white-space: nowrap;
	}

	.data-table td {
		padding: 10px 12px;
		border-bottom: 1px solid #f4f4f4;
		vertical-align: middle;
	}

	.data-table tbody tr {
		transition: background 100ms;
	}

	.data-table tbody tr:hover {
		background: #fcfcfd;
	}

	.data-table th:first-child,
	.data-table td:first-child {
		padding-left: 18px;
	}

	.data-table th:last-child,
	.data-table td:last-child {
		padding-right: 14px;
	}

	.data-table tbody tr:last-child td {
		border-bottom: 0;
	}

	.sort-btn {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		color: var(--fg3);
		font-weight: 500;
		font-size: 11.5px;
		border-radius: 4px;
	}

	.sort-btn :global(svg) {
		opacity: 0.5;
	}

	.sort-btn:hover {
		color: #444444;
	}

	.sort-btn.active {
		color: var(--fg);
	}

	.sort-btn.active :global(svg) {
		opacity: 1;
		color: var(--accent);
	}

	.plan-cell {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		min-width: 0;
	}

	.plan-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #c7c7c7;
		flex: none;
		margin-top: 5px;
	}

	.plan-dot.active {
		background: #16a34a;
	}

	.plan-dot.draft {
		background: #f59e0b;
	}

	.plan-dot.archived {
		background: #bdbdbd;
	}

	.plan-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.35;
	}

	.plan-name {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.plan-desc {
		font-size: 11.5px;
		color: var(--fg3);
		margin-top: 1px;
		max-width: 250px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.mono-id {
		font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
		font-size: 10.5px;
		letter-spacing: -0.01em;
		color: var(--fg3);
	}

	.plan-text .mono-id {
		margin-top: 2px;
	}

	.mini-tag {
		display: inline-flex;
		align-items: center;
		height: 15px;
		padding: 0 4px;
		border-radius: 4px;
		background: var(--accent-soft);
		color: var(--accent-ink);
		font-size: 9.5px;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		flex: none;
	}

	.unit {
		font-size: 11px;
		font-weight: 400;
		color: var(--fg3);
		margin-left: 2px;
	}

	.row-actions {
		text-align: right;
		white-space: nowrap;
	}

	.customer-cell {
		display: flex;
		align-items: center;
		gap: 9px;
		min-width: 0;
	}

	.table-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 18px;
		border-top: 1px solid var(--line);
		background: #fcfcfc;
		font-size: 11.5px;
		color: var(--fg3);
		flex-wrap: wrap;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 42px 20px;
		text-align: center;
	}

	.empty-icon {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: #f5f5f5;
		color: var(--fg3);
		display: grid;
		place-items: center;
		margin-bottom: 7px;
	}

	.empty-title {
		font-size: 14px;
		font-weight: 500;
	}

	.empty-sub {
		font-size: 12.5px;
		color: var(--fg3);
		margin-bottom: 11px;
		max-width: 320px;
		line-height: 1.5;
	}

	.mobile-cards {
		display: none;
		flex-direction: column;
		gap: 10px;
	}

	.price-card {
		padding: 14px;
	}

	.price-card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
	}

	.price-card-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 11px;
		margin-top: 13px;
		padding-top: 12px;
		border-top: 1px solid #f3f3f3;
	}

	.price-card-grid > div {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		font-size: 12.5px;
	}

	.price-card-grid .muted {
		font-size: 10.5px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--fg3);
	}

	.price-card-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-top: 12px;
		padding-top: 10px;
		border-top: 1px solid #f3f3f3;
	}

	/* -------------------------------------------------------------- */
	/* coupons                                                        */
	/* -------------------------------------------------------------- */

	.stat-row {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 12px;
		margin-bottom: 12px;
	}

	.stat {
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.stat-label {
		font-size: 12px;
		color: #6b6b6b;
	}

	.stat-value {
		font-size: 24px;
		font-weight: 600;
		letter-spacing: -0.025em;
		line-height: 1.2;
		margin-top: 2px;
		font-variant-numeric: tabular-nums;
	}

	.stat-note {
		font-size: 11.5px;
		color: var(--fg3);
	}

	.coupon-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.coupon-row {
		display: grid;
		grid-template-columns: minmax(0, 1.7fr) 92px minmax(0, 1.2fr) 34px;
		align-items: center;
		gap: 16px;
		padding: 13px 16px;
	}

	.coupon-main {
		min-width: 0;
	}

	.coupon-code-row {
		display: flex;
		align-items: center;
		gap: 7px;
		min-width: 0;
	}

	.coupon-code {
		font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
		font-size: 12.5px;
		font-weight: 600;
		letter-spacing: 0.02em;
		background: #f6f7f9;
		padding: 2px 6px;
		border-radius: 5px;
		white-space: nowrap;
	}

	.copy-btn {
		width: 20px;
		height: 20px;
		display: grid;
		place-items: center;
		border-radius: 5px;
		color: var(--fg3);
		flex: none;
	}

	.copy-btn:hover {
		background: #f1f1f1;
		color: #444444;
	}

	.coupon-applies {
		display: block;
		font-size: 11.5px;
		color: var(--fg3);
		margin-top: 5px;
	}

	.coupon-amount {
		display: flex;
		align-items: baseline;
		gap: 3px;
	}

	.coupon-big {
		font-size: 20px;
		font-weight: 600;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}

	.coupon-usage {
		min-width: 0;
	}

	.usage-line {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		font-size: 11.5px;
		color: #666666;
	}

	.progress {
		height: 4px;
		border-radius: 99px;
		background: #f1f1f1;
		overflow: hidden;
		margin-top: 6px;
	}

	.progress-bar {
		display: block;
		height: 100%;
		border-radius: 99px;
		background: var(--accent);
		transition: width 400ms cubic-bezier(0.23, 1, 0.32, 1);
	}

	.progress-bar.full {
		background: #f59e0b;
	}

	.coupon-actions {
		text-align: right;
	}

	.foot-note {
		font-size: 11.5px;
		color: var(--fg3);
		margin-top: 12px;
		padding-left: 2px;
	}

	/* -------------------------------------------------------------- */
	/* invoices                                                       */
	/* -------------------------------------------------------------- */

	.invoice-card {
		padding: 14px;
	}

	.invoice-card-head {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 10px;
	}

	.invoice-card-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 11px;
		margin-top: 13px;
		padding-top: 12px;
		border-top: 1px solid #f3f3f3;
	}

	.invoice-card-grid > div {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		font-size: 12.5px;
	}

	.invoice-card-grid .muted {
		font-size: 10.5px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--fg3);
	}

	.invoice-card-foot {
		display: flex;
		align-items: center;
		gap: 7px;
		margin-top: 12px;
		padding-top: 10px;
		border-top: 1px solid #f3f3f3;
	}

	/* -------------------------------------------------------------- */
	/* mobile sheet                                                   */
	/* -------------------------------------------------------------- */

	:global(.sd-sheet-overlay) {
		position: fixed;
		inset: 0;
		background: rgb(15 15 15 / 0.34);
		z-index: 95;
		animation: sd-fade 180ms ease-out;
	}

	:global(.sd-sheet) {
		position: fixed;
		left: 0;
		top: 0;
		bottom: 0;
		width: min(300px, 86vw);
		z-index: 96;
		display: flex;
		flex-direction: column;
		background: #fafafa;
		padding: 14px 12px 14px;
		box-shadow: 24px 0 60px -20px rgb(0 0 0 / 0.3);
		animation: sd-slide 220ms cubic-bezier(0.23, 1, 0.32, 1);
	}

	:global(.sd-sr-only) {
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

	.sheet-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 16px;
	}

	.sheet-ws {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 7px;
		border: 1px solid var(--line);
		background: #ffffff;
		border-radius: 9px;
	}

	.sheet-switch {
		margin-left: auto;
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		height: 40px;
		padding: 0 11px;
		border-radius: 7px;
		border: 1px solid var(--line);
		background: #ffffff;
		color: var(--fg2);
		font-size: 12px;
		font-weight: 500;
		position: relative;
		transition:
			background 120ms,
			color 120ms;
	}

	.sheet-switch::after {
		content: '';
		position: absolute;
		inset: -2px;
	}

	.sheet-switch:hover {
		background: #f6f6f6;
		color: var(--fg);
	}

	.sheet-switch:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.sheet-foot {
		margin-top: auto;
		padding-top: 16px;
		border-top: 1px solid var(--line);
	}

	/* -------------------------------------------------------------- */
	/* toasts                                                         */
	/* -------------------------------------------------------------- */

	.toasts {
		position: fixed;
		right: 18px;
		bottom: 18px;
		z-index: 120;
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: flex-end;
		pointer-events: none;
	}

	.toast {
		pointer-events: auto;
		display: flex;
		align-items: flex-start;
		gap: 9px;
		width: min(370px, calc(100vw - 32px));
		background: #171717;
		color: #fafafa;
		border-radius: 10px;
		padding: 10px 10px 10px 11px;
		box-shadow: 0 12px 30px -8px rgb(0 0 0 / 0.35);
		animation: sd-toast 200ms cubic-bezier(0.23, 1, 0.32, 1);
	}

	.toast-icon {
		color: #86efac;
		margin-top: 1px;
		flex: none;
	}

	.toast.danger .toast-icon {
		color: #fca5a5;
	}

	.toast-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
		flex: 1;
	}

	.toast-message {
		font-size: 12.8px;
		font-weight: 500;
	}

	.toast-detail {
		font-size: 11.5px;
		color: var(--fg3);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.toast-undo {
		font-size: 12px;
		font-weight: 500;
		color: #93b4f5;
		padding: 2px 5px;
		border-radius: 5px;
		flex: none;
	}

	.toast-undo:hover {
		background: rgb(255 255 255 / 0.1);
	}

	.toast-x {
		width: 20px;
		height: 20px;
		display: grid;
		place-items: center;
		border-radius: 5px;
		color: #737373;
		flex: none;
		margin-top: -1px;
	}

	.toast-x:hover {
		background: rgb(255 255 255 / 0.12);
		color: #ffffff;
	}

	/* -------------------------------------------------------------- */
	/* bits-ui portals + component roots (unscoped)                   */
	/* -------------------------------------------------------------- */

	:global(.sd-icon-btn) {
		width: 30px;
		height: 30px;
		display: grid;
		place-items: center;
		border-radius: 7px;
		color: var(--fg2);
		flex: none;
		transition:
			background 120ms,
			color 120ms;
	}

	:global(.sd-icon-btn:hover) {
		background: #f2f2f2;
		color: var(--fg);
	}

	:global(.sd-icon-btn:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	:global(.sd-collapse-btn) {
		color: var(--fg3);
	}

	:global(.sd-bell) {
		position: relative;
	}

	:global(.sd-info-btn) {
		width: 15px;
		height: 15px;
		display: inline-grid;
		place-items: center;
		border-radius: 50%;
		color: #b8b8b8;
		flex: none;
	}

	:global(.sd-info-btn:hover) {
		color: #666666;
	}

	:global(.sd-info-btn:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
		border-radius: 50%;
	}

	:global(.sd-avatar-btn) {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--accent-soft);
		color: var(--accent-ink);
		display: grid;
		place-items: center;
		font-size: 10.5px;
		font-weight: 600;
		margin-left: 4px;
		transition: background 120ms;
	}

	:global(.sd-avatar-btn:hover) {
		background: #e2ecfb;
	}

	:global(.sd-avatar-btn:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	:global(.sd-workspace) {
		display: flex;
		align-items: center;
		gap: 9px;
		width: 100%;
		padding: 6px 7px;
		border: 1px solid var(--line);
		background: #ffffff;
		border-radius: 9px;
		text-align: left;
		min-width: 0;
		margin-bottom: 20px;
		transition:
			background 120ms,
			border-color 120ms;
	}

	:global(.sd-workspace:hover) {
		background: #f6f6f6;
		border-color: #e4e4e4;
	}

	:global(.sd-workspace:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	:global(.workspace-chev) {
		margin-left: auto;
		color: var(--fg3);
	}

	:global(.search-icon) {
		color: var(--fg3);
		flex: none;
	}

	:global(.sd-range-trigger) {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		height: 34px;
		padding: 0 11px;
		border-radius: 8px;
		border: 1px solid var(--line-strong);
		background: #ffffff;
		color: var(--fg);
		font-size: 13px;
		font-weight: 500;
		white-space: nowrap;
		box-shadow: 0 1px 1px rgb(0 0 0 / 0.025);
		transition:
			background 120ms,
			border-color 120ms;
	}

	:global(.sd-range-trigger:hover) {
		background: #fafafa;
		border-color: #d4d4d4;
	}

	:global(.sd-range-trigger:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	:global(.sd-filter-btn) {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 34px;
		padding: 0 9px;
		border: 1px solid var(--line-strong);
		border-radius: 8px;
		background: #ffffff;
		font-size: 12.5px;
		font-weight: 500;
		color: #444444;
		white-space: nowrap;
		box-shadow: 0 1px 1px rgb(0 0 0 / 0.025);
		transition:
			background 120ms,
			border-color 120ms;
	}

	:global(.sd-filter-btn:hover) {
		background: #fafafa;
		border-color: #d4d4d4;
	}

	:global(.sd-filter-btn:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	:global(.sd-switch) {
		position: relative;
		width: 30px;
		height: 18px;
		border-radius: 999px;
		border: 0;
		background: #dcdcdc;
		padding: 0;
		flex: none;
		transition: background 160ms ease;
	}

	:global(.sd-switch[data-state='checked']) {
		background: var(--accent);
	}

	:global(.sd-switch:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	:global(.sd-switch-sm) {
		width: 28px;
		height: 16px;
	}

	:global(.sd-thumb) {
		display: block;
		width: 14px;
		height: 14px;
		border-radius: 999px;
		background: #ffffff;
		box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
		transform: translateX(2px);
		transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
	}

	:global(.sd-switch-sm) :global(.sd-thumb) {
		width: 12px;
		height: 12px;
	}

	:global(.sd-switch[data-state='checked']) :global(.sd-thumb) {
		transform: translateX(14px);
	}

	:global(.sd-popover) {
		z-index: 70;
		background: #ffffff;
		border-radius: 11px;
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.06),
			0 12px 32px -10px rgb(0 0 0 / 0.18);
		animation: sd-pop 160ms cubic-bezier(0.23, 1, 0.32, 1);
		transform-origin: top right;
	}

	:global(.sd-notes) {
		width: min(344px, calc(100vw - 24px));
		padding: 0;
		overflow: hidden;
	}

	:global(.sd-range-pop) {
		width: 282px;
		padding: 10px;
	}

	:global(.sd-tooltip) {
		z-index: 100;
		background: #171717;
		color: #fafafa;
		font-size: 12px;
		line-height: 1.45;
		padding: 6px 9px;
		border-radius: 6px;
		max-width: 230px;
		box-shadow: 0 6px 18px -6px rgb(0 0 0 / 0.3);
		animation: sd-fade 120ms ease-out;
	}

	:global(.sd-menu) {
		z-index: 75;
		min-width: 190px;
		max-width: 290px;
		background: #ffffff;
		border-radius: 10px;
		padding: 5px;
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.06),
			0 10px 28px -10px rgb(0 0 0 / 0.2);
		animation: sd-pop 150ms cubic-bezier(0.23, 1, 0.32, 1);
		transform-origin: top;
	}

	:global(.sd-workspace-menu) {
		min-width: 250px;
	}

	:global(.sd-account-menu) {
		min-width: 230px;
	}

	:global(.sd-row-menu) {
		min-width: 180px;
	}

	:global(.sd-menu-label) {
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--fg3);
		padding: 6px 8px 4px;
	}

	:global(.sd-menu-item) {
		display: flex;
		align-items: center;
		gap: 9px;
		min-height: 32px;
		padding: 6px 8px;
		border-radius: 6px;
		font-size: 13px;
		color: var(--fg);
		outline: none;
		user-select: none;
	}

	:global(.sd-menu-item[data-highlighted]) {
		background: #f4f4f5;
	}

	:global(.sd-menu-item[data-disabled]) {
		opacity: 0.45;
	}

	:global(.sd-menu-item:focus-visible) {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
	}

	:global(.sd-menu-item > svg) {
		color: var(--fg3);
	}

	:global(.sd-menu-item.sd-danger) {
		color: var(--danger);
	}

	:global(.sd-menu-item.sd-danger > svg) {
		color: var(--danger);
	}

	:global(.sd-menu-sep) {
		height: 1px;
		background: var(--line);
		margin: 5px -5px;
	}

	:global(.sd-ws-item) {
		gap: 9px;
		padding: 7px 8px;
	}

	.ws-mark {
		width: 24px;
		height: 24px;
		border-radius: 6px;
		background: var(--accent-soft);
		color: var(--accent-ink);
		display: grid;
		place-items: center;
		font-size: 9px;
		font-weight: 600;
		flex: none;
	}

	.ws-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.25;
	}

	.ws-name {
		font-size: 12.5px;
		font-weight: 500;
	}

	.ws-text .muted {
		font-size: 10.5px;
	}

	.ws-check {
		margin-left: auto;
		color: var(--accent);
		display: grid;
		place-items: center;
		min-width: 14px;
	}

	.check-item {
		gap: 9px;
	}

	.check-box {
		width: 15px;
		height: 15px;
		border-radius: 4px;
		border: 1px solid #d4d4d4;
		background: #ffffff;
		display: grid;
		place-items: center;
		color: transparent;
		flex: none;
		transition:
			background 100ms,
			border-color 100ms,
			color 100ms;
	}

	.check-box.on {
		background: var(--accent);
		border-color: var(--accent);
		color: #ffffff;
	}

	.check-label {
		font-size: 13px;
	}

	.check-count {
		margin-left: auto;
		font-size: 11px;
		color: var(--fg3);
		font-variant-numeric: tabular-nums;
	}

	.radio-item {
		gap: 9px;
	}

	.radio-box {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		border: 1px solid #d4d4d4;
		background: #ffffff;
		flex: none;
		position: relative;
		transition: border-color 100ms;
	}

	.radio-box.on {
		border-color: var(--accent);
	}

	.radio-box.on::after {
		content: '';
		position: absolute;
		inset: 3px;
		border-radius: 50%;
		background: var(--accent);
	}

	/* popover innards (children are scoped) */

	.notes-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 11px 14px 9px;
		border-bottom: 1px solid var(--line);
	}

	.notes-title {
		font-size: 12.5px;
		font-weight: 600;
	}

	.notes-head .link-btn {
		font-size: 11.5px;
	}

	.notes-list {
		display: flex;
		flex-direction: column;
		max-height: 330px;
		overflow-y: auto;
	}

	.note {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 11px 14px;
	}

	.note + .note {
		border-top: 1px solid #f4f4f4;
	}

	.note.unread {
		background: #fafbfe;
	}

	.note-icon {
		width: 27px;
		height: 27px;
		border-radius: 50%;
		background: #f4f4f5;
		color: #666666;
		display: grid;
		place-items: center;
		flex: none;
	}

	.note-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.note-title {
		font-size: 12.5px;
		font-weight: 500;
	}

	.note-body {
		font-size: 11.5px;
		color: var(--fg3);
		line-height: 1.45;
	}

	.note-time {
		font-size: 10.5px;
		color: var(--fg3);
		margin-top: 2px;
	}

	.unread-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
		flex: none;
		margin: 5px 0 0 auto;
	}

	.notes-foot {
		display: block;
		width: 100%;
		padding: 9px 14px;
		border-top: 1px solid var(--line);
		text-align: center;
		font-size: 12.5px;
		font-weight: 500;
		color: var(--accent);
	}

	.notes-foot:hover {
		background: #fafafa;
	}

	.account-head {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 7px 8px 8px;
	}

	.account-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.3;
	}

	.account-name {
		font-size: 12.5px;
		font-weight: 600;
	}

	.account-text .muted {
		font-size: 11px;
	}

	/* range popover innards */

	.pop-label {
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--fg3);
		padding: 4px 5px 5px;
	}

	.range-list {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.range-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		width: 100%;
		padding: 7px 8px;
		border-radius: 6px;
		text-align: left;
		color: var(--fg);
	}

	.range-option:hover {
		background: #f6f6f6;
	}

	.range-option.active {
		background: var(--accent-soft);
		color: var(--accent-ink);
	}

	.range-text {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.range-name {
		font-size: 12.5px;
		font-weight: 500;
	}

	.range-hint {
		font-size: 10.5px;
		color: var(--fg3);
	}

	.range-option.active .range-hint {
		color: var(--accent-ink);
		opacity: 0.75;
	}

	.pop-sep {
		height: 1px;
		background: var(--line);
		margin: 8px -2px;
	}

	.custom-dates {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 7px;
		padding: 2px 1px;
	}

	.custom-dates label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 10.5px;
		color: var(--fg3);
	}

	.custom-dates input {
		height: 30px;
		width: 100%;
		border: 1px solid var(--line-strong);
		border-radius: 6px;
		padding: 0 7px;
		font-size: 11.5px;
		color: var(--fg);
		background: #ffffff;
	}

	.apply-btn {
		width: 100%;
		margin-top: 9px;
		height: 32px;
	}

	/* -------------------------------------------------------------- */
	/* animation                                                      */
	/* -------------------------------------------------------------- */

	@keyframes sd-fade {
		from {
			opacity: 0;
		}
	}

	@keyframes sd-pop {
		from {
			opacity: 0;
			transform: scale(0.97) translateY(-3px);
		}
	}

	@keyframes sd-slide {
		from {
			transform: translateX(-100%);
		}
	}

	@keyframes sd-toast {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.98);
		}
	}

	/* -------------------------------------------------------------- */
	/* responsive                                                     */
	/* -------------------------------------------------------------- */

	@media (max-width: 1399px) {
		.kpi-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 1080px) {
		.overview-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	@media (max-width: 960px) {
		.sidebar {
			display: none;
		}

		.menu-btn {
			display: grid;
		}

		.nav-item {
			height: 44px;
		}

		:global(.sd-collapse-btn) {
			display: none;
		}

		.topbar {
			padding: 0 16px;
		}

		.view {
			padding: 22px 20px 52px;
		}
	}

	@media (max-width: 760px) {
		.coupon-row {
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-areas:
				'main actions'
				'amount actions'
				'usage usage';
			gap: 8px 14px;
			padding: 14px;
		}

		.coupon-main {
			grid-area: main;
		}

		.coupon-amount {
			grid-area: amount;
			margin-top: 2px;
		}

		.coupon-usage {
			grid-area: usage;
			margin-top: 4px;
		}

		.coupon-actions {
			grid-area: actions;
			align-self: start;
		}

		.table-card {
			display: none;
		}

		.mobile-cards {
			display: flex;
		}

		.stat-row {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.stat-value {
			font-size: 21px;
		}

		.view {
			padding: 20px 16px 46px;
		}

		.page-head {
			flex-direction: column;
			gap: 14px;
			margin-bottom: 18px;
		}

		.head-actions {
			width: 100%;
		}

		.head-actions .btn,
		.head-actions :global(.sd-range-trigger) {
			flex: 1;
			justify-content: center;
			height: 44px;
		}

		.page-title {
			font-size: 24px;
		}

		.filters {
			flex-direction: column;
			align-items: stretch;
			padding: 9px;
		}

		.search-field,
		.coupon-filters .search-field.grow {
			width: 100%;
			max-width: none;
			margin-left: 0;
		}

		.filter-group {
			width: 100%;
		}

		.filter-group :global(.sd-filter-btn) {
			flex: 1;
			justify-content: center;
		}

		.result-count {
			margin-left: 0;
			padding: 0 2px;
		}

		.chip-row {
			width: 100%;
			flex-wrap: nowrap;
			overflow-x: auto;
			scrollbar-width: none;
		}

		.chip {
			flex: none;
			height: 40px;
		}

		.btn.sm {
			height: 40px;
		}

		.icon-btn {
			width: 40px;
			height: 40px;
		}

		.chart-controls {
			width: 100%;
			justify-content: space-between;
		}

		.chart-summary {
			flex-direction: column;
			align-items: flex-start;
			gap: 8px;
		}

		.chart-legend {
			margin-left: 0;
		}

		.invoice-plan {
			display: none;
		}

		.invoice-row {
			grid-template-columns: 26px minmax(0, 1fr) auto auto;
			padding-inline: 14px;
		}

		.list-card .card-head {
			padding-inline: 14px;
		}

		.topbar {
			height: 54px;
			padding: 0 12px;
			gap: 6px;
		}

		.search-trigger {
			min-width: 40px;
			width: 40px;
			height: 40px;
			padding: 0;
			justify-content: center;
		}

		.search-trigger span,
		.search-trigger kbd {
			display: none;
		}

		.crumbs {
			font-size: 12px;
		}

		.crumb-muted,
		.crumb-sep {
			display: none;
		}

		.view {
			padding-top: 18px;
		}
	}

	@media (max-width: 600px) {
		.kpi-grid {
			grid-template-columns: minmax(0, 1fr);
		}

		.stat-row {
			grid-template-columns: minmax(0, 1fr);
		}

		.stat-value {
			font-size: 23px;
		}

		.chart-card {
			padding: 14px 12px 6px;
		}

		.chart-card .card-head {
			flex-direction: column;
			align-items: stretch;
			gap: 11px;
		}

		.chart-controls {
			flex-wrap: nowrap;
			align-items: center;
		}

		.segmented button {
			height: 40px;
			padding: 0 11px;
			font-size: 12.5px;
		}

		.card-head {
			gap: 10px;
		}

		.chart-controls {
			gap: 10px;
		}

		.chart-total {
			font-size: 23px;
		}

		.list-card {
			padding-top: 14px;
		}

		.mix-card,
		.activity-card {
			padding: 14px;
		}

		.table-foot {
			flex-direction: column;
			align-items: flex-start;
			gap: 3px;
			padding-inline: 14px;
		}

		.notes-list {
			max-height: 290px;
		}

		.toasts {
			right: 12px;
			bottom: 12px;
		}

		.toast {
			width: calc(100vw - 24px);
		}
	}

	@media (max-width: 480px) {
		.chip-row {
			-webkit-mask-image: linear-gradient(to right, #000 calc(100% - 20px), transparent);
			mask-image: linear-gradient(to right, #000 calc(100% - 20px), transparent);
		}
	}

	@media (max-width: 760px) {
		.topbar :global(.sd-icon-btn),
		.topbar :global(.sd-avatar-btn) {
			width: 36px;
			height: 36px;
		}

		.topbar :global(.sd-avatar-btn) {
			font-size: 11px;
		}

		.topbar .search-trigger,
		.topbar :global(.sd-icon-btn),
		.topbar :global(.sd-avatar-btn) {
			position: relative;
		}

		.topbar .search-trigger::after {
			content: '';
			position: absolute;
			inset: -2px;
		}

		.topbar :global(.sd-icon-btn)::after,
		.topbar :global(.sd-avatar-btn)::after {
			content: '';
			position: absolute;
			inset: -4px;
			border-radius: 50%;
		}

		.chart-controls {
			align-items: center;
		}

		.compare-toggle {
			min-height: 44px;
			padding-right: 2px;
		}

		.compare-toggle :global(.sd-switch) {
			position: relative;
		}

		.compare-toggle :global(.sd-switch)::after {
			content: '';
			position: absolute;
			inset: -14px -50px -14px -8px;
		}

		.compare-toggle > span {
			pointer-events: none;
		}

		/* Keep the visual size, grow the tap area to 44px. */
		.chip,
		.btn.sm,
		.icon-btn,
		.segmented button,
		.link-btn,
		.mix-foot,
		:global(.sd-info-btn) {
			position: relative;
		}

		.chip::after,
		.btn.sm::after,
		.icon-btn::after,
		.segmented button::after {
			content: '';
			position: absolute;
			inset: -2px 0;
		}

		.link-btn::after {
			content: '';
			position: absolute;
			inset: -13px -6px;
		}

		.mix-foot::after {
			content: '';
			position: absolute;
			inset: -8px 0;
		}

		:global(.sd-info-btn)::after {
			content: '';
			position: absolute;
			inset: -15px;
			border-radius: 50%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.app *,
		.app *::before,
		.app *::after {
			transition-duration: 0.01ms !important;
			animation-duration: 0.01ms !important;
		}

		.main-scroll {
			scroll-behavior: auto;
		}
	}
</style>



