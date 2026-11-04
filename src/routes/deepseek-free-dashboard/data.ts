// Sample data for the Sundial billing dashboard. Everything is deterministic
// so the screen renders identically on every load.

export type Interval = 'month' | 'year';
export type PriceStatus = 'active' | 'draft' | 'archived';

export type Plan = {
	id: string;
	name: string;
	desc: string;
	price: number;
	interval: Interval;
	status: PriceStatus;
	subs: number;
	seats: number;
	updated: string; // ISO date
	popular: boolean;
};

export type InvoiceStatus = 'paid' | 'open' | 'refunded' | 'failed';

export type PriceDraft = Pick<
	Plan,
	'name' | 'desc' | 'price' | 'interval' | 'status' | 'seats' | 'popular'
>;

export type Invoice = {
	id: string;
	customer: string;
	company: string;
	plan: string;
	amount: number;
	status: InvoiceStatus;
	date: string;
};

export type CouponStatus = 'active' | 'paused' | 'scheduled' | 'expired';

export type Coupon = {
	id: string;
	code: string;
	kind: 'percent' | 'amount';
	value: number;
	applies: string;
	redemptions: number;
	limit: number | null;
	status: CouponStatus;
	expires: string | null;
};

export const TODAY = new Date(2026, 10, 3); // Nov 3, 2026

export const plans: Plan[] = [
	{
		id: 'price_1QaH2fK9dLm3',
		name: 'Starter',
		desc: 'For solo makers selling a first collection',
		price: 19,
		interval: 'month',
		status: 'active',
		subs: 1842,
		seats: 1,
		updated: '2026-10-28',
		popular: false
	},
	{
		id: 'price_1QaH2fK9dLm4',
		name: 'Starter Annual',
		desc: 'Starter, billed once a year',
		price: 190,
		interval: 'year',
		status: 'active',
		subs: 511,
		seats: 1,
		updated: '2026-10-28',
		popular: false
	},
	{
		id: 'price_1QbT7mN2pRq8',
		name: 'Studio',
		desc: 'For small teams shipping every week',
		price: 49,
		interval: 'month',
		status: 'active',
		subs: 1406,
		seats: 3,
		updated: '2026-10-22',
		popular: true
	},
	{
		id: 'price_1QbT7mN2pRq9',
		name: 'Studio Annual',
		desc: 'Studio, two months free',
		price: 490,
		interval: 'year',
		status: 'active',
		subs: 402,
		seats: 3,
		updated: '2026-10-22',
		popular: false
	},
	{
		id: 'price_1QcV4kL8sTz1',
		name: 'Pro',
		desc: 'Advanced storefronts and custom domains',
		price: 99,
		interval: 'month',
		status: 'active',
		subs: 612,
		seats: 10,
		updated: '2026-09-30',
		popular: false
	},
	{
		id: 'price_1QcV4kL8sTz2',
		name: 'Pro Annual',
		desc: 'Pro, billed once a year',
		price: 990,
		interval: 'year',
		status: 'active',
		subs: 233,
		seats: 10,
		updated: '2026-09-30',
		popular: false
	},
	{
		id: 'price_1QdX9jH5wYb6',
		name: 'Scale',
		desc: 'High-volume checkout with priority support',
		price: 249,
		interval: 'month',
		status: 'active',
		subs: 148,
		seats: 25,
		updated: '2026-10-14',
		popular: false
	},
	{
		id: 'price_1QdX9jH5wYb7',
		name: 'Scale Annual',
		desc: 'Scale, billed once a year',
		price: 2490,
		interval: 'year',
		status: 'active',
		subs: 51,
		seats: 25,
		updated: '2026-10-14',
		popular: false
	},
	{
		id: 'price_1QeN3pW7xVc4',
		name: 'Enterprise',
		desc: 'SSO, audit logs and a dedicated success manager',
		price: 2400,
		interval: 'month',
		status: 'draft',
		subs: 0,
		seats: 100,
		updated: '2026-11-02',
		popular: false
	},
	{
		id: 'price_1QeN3pW7xVc5',
		name: 'Team',
		desc: 'Shared storefronts for growing teams',
		price: 149,
		interval: 'month',
		status: 'draft',
		subs: 0,
		seats: 5,
		updated: '2026-11-03',
		popular: false
	},
	{
		id: 'price_1QfR8tS3zKd2',
		name: 'Legacy Pro',
		desc: 'Grandfathered Pro pricing from 2024',
		price: 79,
		interval: 'month',
		status: 'archived',
		subs: 58,
		seats: 5,
		updated: '2026-06-12',
		popular: false
	},
	{
		id: 'price_1QfR8tS3zKd3',
		name: 'Studio 2025',
		desc: 'Retired annual Studio price',
		price: 45,
		interval: 'month',
		status: 'archived',
		subs: 0,
		seats: 3,
		updated: '2026-06-12',
		popular: false
	}
];

export const invoices: Invoice[] = [
	{ id: 'INV-2041', customer: 'Maya Okafor', company: 'Northline Studio', plan: 'Studio', amount: 49, status: 'paid', date: '2026-11-03' },
	{ id: 'INV-2040', customer: 'Jonas Weber', company: 'Field Notes GmbH', plan: 'Scale Annual', amount: 2490, status: 'paid', date: '2026-11-03' },
	{ id: 'INV-2039', customer: 'Priya Raman', company: 'Kite & Co.', plan: 'Pro', amount: 99, status: 'open', date: '2026-11-02' },
	{ id: 'INV-2038', customer: 'Elliot Park', company: 'Two Rivers', plan: 'Starter', amount: 19, status: 'paid', date: '2026-11-02' },
	{ id: 'INV-2037', customer: 'Sofia Marchetti', company: 'Atelier Sud', plan: 'Studio Annual', amount: 490, status: 'refunded', date: '2026-11-01' },
	{ id: 'INV-2036', customer: 'Darnell Price', company: 'Harborgoods', plan: 'Pro Annual', amount: 990, status: 'paid', date: '2026-11-01' },
	{ id: 'INV-2035', customer: 'Anna Lindqvist', company: 'Norr Studio', plan: 'Scale', amount: 249, status: 'failed', date: '2026-10-31' },
	{ id: 'INV-2034', customer: 'Theo Martins', company: 'Casa Verde', plan: 'Studio', amount: 49, status: 'paid', date: '2026-10-31' },
	{ id: 'INV-2033', customer: 'Grace Liu', company: 'Paper Moon', plan: 'Starter Annual', amount: 190, status: 'paid', date: '2026-10-30' },
	{ id: 'INV-2032', customer: 'Omar Haddad', company: 'Dune Supply', plan: 'Pro', amount: 99, status: 'paid', date: '2026-10-29' },
	{ id: 'INV-2031', customer: 'Lena Fischer', company: 'Studio Berg', plan: 'Legacy Pro', amount: 79, status: 'paid', date: '2026-10-29' },
	{ id: 'INV-2030', customer: 'Caleb Wright', company: 'Wright & Sons', plan: 'Scale', amount: 249, status: 'open', date: '2026-10-28' },
	{ id: 'INV-2029', customer: 'Hana Sato', company: 'Mono Market', plan: 'Studio', amount: 49, status: 'paid', date: '2026-10-28' },
	{ id: 'INV-2028', customer: 'Mateo Silva', company: 'Lumen Works', plan: 'Pro Annual', amount: 990, status: 'paid', date: '2026-10-27' },
	{ id: 'INV-2027', customer: 'Iris Novak', company: 'Sunday Press', plan: 'Starter', amount: 19, status: 'refunded', date: '2026-10-26' },
	{ id: 'INV-2026', customer: 'Noor Rahman', company: 'Halfmoon', plan: 'Studio Annual', amount: 490, status: 'paid', date: '2026-10-26' }
];

export const initialCoupons: Coupon[] = [
	{ id: 'cpn_launch25', code: 'LAUNCH25', kind: 'percent', value: 25, applies: 'All plans', redemptions: 312, limit: 500, status: 'active', expires: '2026-12-31' },
	{ id: 'cpn_studio20', code: 'STUDIO20', kind: 'percent', value: 20, applies: 'Studio, Studio Annual', redemptions: 148, limit: 250, status: 'active', expires: '2026-11-30' },
	{ id: 'cpn_annual3', code: 'ANNUAL3', kind: 'amount', value: 147, applies: 'Annual plans', redemptions: 41, limit: 100, status: 'active', expires: '2027-01-31' },
	{ id: 'cpn_black40', code: 'BLACKFRIDAY', kind: 'percent', value: 40, applies: 'All plans', redemptions: 689, limit: 1000, status: 'expired', expires: '2026-11-01' },
	{ id: 'cpn_welcome', code: 'WELCOME10', kind: 'percent', value: 10, applies: 'New customers', redemptions: 204, limit: null, status: 'paused', expires: null },
	{ id: 'cpn_partner', code: 'PARTNER50', kind: 'percent', value: 50, applies: 'Studio', redemptions: 0, limit: 50, status: 'scheduled', expires: '2027-03-31' }
];

export type ActivityItem = {
	id: number;
	title: string;
	detail: string;
	time: string;
	kind: 'price' | 'payout' | 'coupon' | 'subscription';
};

export const activity: ActivityItem[] = [
	{ id: 1, title: 'Price updated', detail: 'Maya Chen raised Studio to $49 per month', time: '2h ago', kind: 'price' },
	{ id: 2, title: 'Payout sent', detail: '$61,204.18 to Chase •• 4821', time: 'Yesterday', kind: 'payout' },
	{ id: 3, title: 'Coupon redeemed', detail: 'Northline Studio used LAUNCH25', time: 'Yesterday', kind: 'coupon' },
	{ id: 4, title: 'New price created', detail: 'Team was added as a draft at $149 per month', time: '2d ago', kind: 'price' },
	{ id: 5, title: 'Price archived', detail: 'Studio 2025 kept its existing subscriptions', time: 'Oct 30', kind: 'price' }
];

/* ------------------------------------------------------------------ */
/* money + date helpers                                               */
/* ------------------------------------------------------------------ */

const nf = new Intl.NumberFormat('en-US');

export function money(n: number): string {
	return '$' + nf.format(Math.round(n));
}

export function money2(n: number): string {
	return (
		'$' +
		n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
	);
}

export function compactMoney(n: number): string {
	if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1) + 'M';
	if (n >= 1000) {
		const k = n / 1000;
		return '$' + (k >= 100 ? Math.round(k) : k.toFixed(k >= 10 ? 0 : 1)) + 'k';
	}
	return '$' + Math.round(n);
}

export function addDays(d: Date, n: number): Date {
	const copy = new Date(d);
	copy.setDate(copy.getDate() + n);
	return copy;
}

export function shortDate(d: Date): string {
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function longDate(d: Date): string {
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function weekdayDate(d: Date): string {
	return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function isoDate(d: Date): string {
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${d.getFullYear()}-${m}-${day}`;
}

export function prettyISO(iso: string): string {
	const [y, m, d] = iso.split('-').map(Number);
	return shortDate(new Date(y, m - 1, d));
}

/* ------------------------------------------------------------------ */
/* date ranges                                                        */
/* ------------------------------------------------------------------ */

export type RangeId = '7d' | '30d' | '90d' | 'qtd' | 'lastMonth' | 'custom';

export type DateRange = { id: RangeId; start: Date; end: Date; label: string };

export const rangePresets: { id: RangeId; label: string; hint: string }[] = [
	{ id: '7d', label: 'Last 7 days', hint: 'Oct 28 – Nov 3' },
	{ id: '30d', label: 'Last 30 days', hint: 'Oct 5 – Nov 3' },
	{ id: '90d', label: 'Last 90 days', hint: 'Aug 6 – Nov 3' },
	{ id: 'qtd', label: 'Quarter to date', hint: 'Oct 1 – Nov 3' },
	{ id: 'lastMonth', label: 'Last month', hint: 'Oct 1 – Oct 31' }
];

export function getRange(
	id: RangeId,
	custom?: { start: Date; end: Date } | null
): DateRange {
	let start: Date;
	let end: Date = new Date(TODAY);
	if (id === '7d') start = addDays(TODAY, -6);
	else if (id === '30d') start = addDays(TODAY, -29);
	else if (id === '90d') start = addDays(TODAY, -89);
	else if (id === 'qtd') start = new Date(2026, 9, 1);
	else if (id === 'lastMonth') {
		start = new Date(2026, 9, 1);
		end = new Date(2026, 9, 31);
	} else if (custom) {
		start = new Date(custom.start);
		end = new Date(custom.end);
	} else {
		start = addDays(TODAY, -29);
	}
	const label =
		start.getFullYear() === end.getFullYear()
			? `${shortDate(start)} – ${longDate(end)}`
			: `${longDate(start)} – ${longDate(end)}`;
	return { id, start, end, label };
}

export function previousRange(range: DateRange): DateRange {
	const length = Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000) + 1;
	const end = addDays(range.start, -1);
	const start = addDays(end, -(length - 1));
	return {
		id: 'custom',
		start,
		end,
		label: `${shortDate(start)} – ${shortDate(end)}`
	};
}

export function rangeDays(range: DateRange): number {
	return Math.round((range.end.getTime() - range.start.getTime()) / 86_400_000) + 1;
}

/* ------------------------------------------------------------------ */
/* daily revenue series                                               */
/* ------------------------------------------------------------------ */

export type DayPoint = {
	date: Date;
	gross: number;
	refunds: number;
	net: number;
	orders: number;
};

function mulberry32(seed: number) {
	return function () {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const weekdayFactor = [0.72, 1.13, 1.17, 1.14, 1.1, 1.03, 0.77]; // Sun..Sat

export const days: DayPoint[] = (() => {
	const rng = mulberry32(20261103);
	const start = new Date(2026, 0, 1);
	const total = Math.round((TODAY.getTime() - start.getTime()) / 86_400_000) + 1;
	const out: DayPoint[] = [];
	for (let i = 0; i < total; i++) {
		const date = addDays(start, i);
		const trend = 5320 * Math.pow(1.0015, i);
		const wave = Math.sin(i / 9.3) * 260 + Math.sin(i / 3.1) * 85;
		const noise = (rng() - 0.5) * 620;
		const gross = Math.round(trend * weekdayFactor[date.getDay()] + wave + noise);
		const refunds = Math.round(gross * (0.014 + rng() * 0.014));
		const orders = Math.max(18, Math.round((gross - refunds) / (58 + rng() * 20)));
		out.push({ date, gross, refunds, net: gross - refunds, orders });
	}
	return out;
})();

export function daysInRange(range: DateRange): DayPoint[] {
	const start = range.start.getTime();
	const end = range.end.getTime();
	return days.filter((d) => d.date.getTime() >= start && d.date.getTime() <= end);
}

export type Granularity = 'day' | 'week' | 'month';

export type ChartPoint = {
	label: string;
	fullLabel: string;
	net: number;
	gross: number;
	refunds: number;
	orders: number;
	start: Date;
};

function summarize(points: DayPoint[], start: Date): ChartPoint {
	const net = points.reduce((a, b) => a + b.net, 0);
	const gross = points.reduce((a, b) => a + b.gross, 0);
	const refunds = points.reduce((a, b) => a + b.refunds, 0);
	const orders = points.reduce((a, b) => a + b.orders, 0);
	const last = points[points.length - 1].date;
	return {
		label: shortDate(start),
		fullLabel:
			points.length === 1
				? longDate(start)
				: `${shortDate(start)} – ${longDate(last)}`,
		net,
		gross,
		refunds,
		orders,
		start
	};
}

export function bucketSeries(range: DateRange, granularity: Granularity): ChartPoint[] {
	const source = daysInRange(range);
	if (granularity === 'day') return source.map((p) => summarize([p], p.date));
	if (granularity === 'week') {
		const out: ChartPoint[] = [];
		for (let i = 0; i < source.length; i += 7) {
			const chunk = source.slice(i, i + 7);
			out.push(summarize(chunk, chunk[0].date));
		}
		return out;
	}
	const groups = new Map<string, DayPoint[]>();
	for (const p of source) {
		const key = `${p.date.getFullYear()}-${p.date.getMonth()}`;
		const list = groups.get(key) ?? [];
		list.push(p);
		groups.set(key, list);
	}
	return [...groups.values()].map((group) => {
		const point = summarize(group, group[0].date);
		return {
			...point,
			label: group[0].date.toLocaleDateString('en-US', { month: 'short' }),
			fullLabel: group[0].date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
		};
	});
}

export function sumNet(points: ChartPoint[]): number {
	return points.reduce((a, b) => a + b.net, 0);
}

/* ------------------------------------------------------------------ */
/* plans + metrics                                                    */
/* ------------------------------------------------------------------ */

export function planMrr(plan: Plan): number {
	return plan.interval === 'month' ? plan.price * plan.subs : (plan.price / 12) * plan.subs;
}

export function totalMrr(list: Plan[]): number {
	return list.reduce((sum, p) => sum + planMrr(p), 0);
}

export function activeSubscriptions(list: Plan[]): number {
	return list.filter((p) => p.status !== 'draft').reduce((sum, p) => sum + p.subs, 0);
}

export const intervalLabel = (interval: Interval) => (interval === 'month' ? 'Monthly' : 'Annual');
export const intervalShort = (interval: Interval) => (interval === 'month' ? '/mo' : '/yr');
export const statusLabel: Record<PriceStatus, string> = {
	active: 'Active',
	draft: 'Draft',
	archived: 'Archived'
};

export function initials(name: string): string {
	return name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('');
}
