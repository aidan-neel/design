// Meridian — metering & billing for API-first teams.
// All mock data lives here; seeded so every reload is identical.

export const TODAY = new Date(2026, 10, 4); // Wed Nov 4, 2026

export function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// ---------- formatting ----------

export const money = (n: number, cents = false) =>
	'$' + n.toLocaleString('en-US', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });

export const compact = (n: number) =>
	(n < 0 ? '-' : '') + '$' + Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.abs(n));

export const num = (n: number) => n.toLocaleString('en-US');

export const fmtSignedPct = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}%`;

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (ts: number) => {
	const d = new Date(ts);
	return `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};
export const fmtDay = (ts: number) => {
	const d = new Date(ts);
	return `${MON[d.getMonth()]} ${d.getDate()}`;
};
export const fmtMonth = (ts: number) => {
	const d = new Date(ts);
	return `${MON[d.getMonth()]} ’${String(d.getFullYear()).slice(2)}`;
};
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ---------- daily series (730 days) ----------

export type Day = { t: number; iso: string; mrr: number; revenue: number; signups: number; churned: number };
export type RangeId = '7d' | '30d' | '90d' | '12m' | 'month' | 'quarter' | 'custom';

export const RANGE_PRESETS: { id: RangeId; label: string; days: number | 'month' | 'quarter' }[] = [
	{ id: '7d', label: 'Last 7 days', days: 7 },
	{ id: '30d', label: 'Last 30 days', days: 30 },
	{ id: '90d', label: 'Last 90 days', days: 90 },
	{ id: '12m', label: 'Last 12 months', days: 365 },
	{ id: 'month', label: 'This month', days: 'month' },
	{ id: 'quarter', label: 'This quarter', days: 'quarter' }
];

const N_DAYS = 730;

export const DAYS: Day[] = (() => {
	const r = mulberry32(4237);
	const arr: Day[] = [];
	let mrr = 43500;
	for (let i = 0; i < N_DAYS; i++) {
		const date = new Date(TODAY);
		date.setDate(date.getDate() - (N_DAYS - 1 - i));
		const dow = date.getDay();
		const week = dow === 0 || dow === 6 ? 0.76 : dow === 1 ? 1.05 : 1.07;
		let drift = 0.00052;
		if (i >= 380 && i < 393) drift += 0.0038; // usage-meters launch
		if (i >= 618 && i < 630) drift += 0.0024; // annual billing push
		const shock = r() < 0.012 ? -0.014 : 0;
		mrr *= 1 + drift + (r() - 0.5) * 0.0042 + shock;
		const arpu = 88 + (i / N_DAYS) * 18; // avg paid sub
		const noise = 0.8 + r() * 0.4;
		arr.push({
			t: date.getTime(),
			iso: isoDay(date),
			mrr,
			revenue: (mrr / 30.44) * week * noise,
			signups: Math.round(1.2 + r() * 4.4 + (i > 380 ? 1.6 : 0)),
			churned: Math.round(r() * (1 + (i > 500 ? 1.3 : 0.5)))
		});
	}
	// calibrate final MRR to match the plan catalog run-rate below
	const k = 85192 / arr[arr.length - 1].mrr;
	for (const d of arr) {
		d.mrr = Math.round(d.mrr * k);
		d.revenue = d.revenue * k;
	}
	return arr;
})();

// ---------- ranges ----------

export type Resolved = { from: Date; to: Date; fromIso: string; toIso: string; label: string };

export function resolveRange(id: RangeId, customFrom: string, customTo: string): Resolved {
	const to = new Date(TODAY);
	let from = new Date(TODAY);
	let label = '';
	const preset = RANGE_PRESETS.find((p) => p.id === id);
	if (preset) {
		if (preset.days === 'month') {
			from = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
			label = fmtDay(from.getTime()) + ' – ' + fmtDate(to.getTime());
		} else if (preset.days === 'quarter') {
			from = new Date(TODAY.getFullYear(), Math.floor(TODAY.getMonth() / 3) * 3, 1);
			label = fmtDay(from.getTime()) + ' – ' + fmtDate(to.getTime());
		} else {
			from.setDate(from.getDate() - ((preset.days as number) - 1));
			label = (preset.days as number) <= 90 ? `${fmtDay(from.getTime())} – ${fmtDate(to.getTime())}` : preset.label.toLowerCase();
		}
		return { from, to, fromIso: isoDay(from), toIso: isoDay(to), label };
	}
	// custom
	const f = new Date(customFrom + 'T00:00:00');
	const t = new Date(customTo + 'T00:00:00');
	const ok = !isNaN(f.getTime()) && !isNaN(t.getTime()) && f <= t;
	if (!ok) {
		from.setDate(from.getDate() - 29);
		return { from, to, fromIso: isoDay(from), toIso: isoDay(to), label: 'Last 30 days' };
	}
	label = fmtDay(f.getTime()) + ' – ' + fmtDate(t.getTime());
	return { from: f, to: t, fromIso: isoDay(f), toIso: isoDay(t), label };
}

export function daysBetween(fromIso: string, toIso: string): Day[] {
	return DAYS.filter((d) => d.iso >= fromIso && d.iso <= toIso);
}

export function shiftIso(iso: string, deltaDays: number): string {
	const d = new Date(iso + 'T00:00:00');
	d.setDate(d.getDate() + deltaDays);
	return isoDay(d);
}

// ---------- buckets ----------

export type Bucket = { t: number; label: string; value: number; prev?: number };

export function bucketize(
	slice: Day[],
	metric: 'revenue' | 'mrr' | 'signups',
	gran: 'day' | 'week' | 'month',
	prevSlice?: Day[]
): Bucket[] {
	const key = (d: Day) => {
		if (gran === 'day') return d.iso;
		if (gran === 'month') return d.iso.slice(0, 7);
		const dt = new Date(d.t);
		const dow = (dt.getDay() + 6) % 7; // Monday-start week
		const wk = new Date(dt);
		wk.setDate(wk.getDate() - dow);
		return isoDay(wk);
	};
	const fill = (s: Day[]) => {
		const map = new Map<string, { t: number; acc: number; last: Day }>();
		for (const d of s) {
			const k = key(d);
			const g = map.get(k);
			if (!g) map.set(k, { t: d.t, acc: metric === 'mrr' ? d.mrr : metric === 'revenue' ? d.revenue : d.signups - d.churned, last: d });
			else {
				if (metric === 'revenue') g.acc += d.revenue;
				else if (metric === 'signups') g.acc += d.signups - d.churned;
				g.last = d;
				if (metric === 'mrr') g.acc = d.mrr;
			}
		}
		return [...map.values()].sort((a, b) => a.t - b.t);
	};
	const cur = fill(slice);
	const prev = prevSlice ? fill(prevSlice) : [];
	const n = cur.length;
	const pn = prev.length;
	return cur.map((g, i) => {
		const label =
			gran === 'month'
				? fmtMonth(g.t)
				: gran === 'week'
					? fmtDay(g.t)
					: fmtDay(g.t);
		const p = pn ? prev[Math.min(i + Math.max(0, pn - n), pn - 1)] : undefined;
		return { t: g.t, label, value: g.acc, prev: p?.acc };
	});
}

// ---------- plan catalog ----------

export type Cycle = 'monthly' | 'annual';
export type PlanStatus = 'active' | 'beta' | 'archived';

export type Plan = {
	id: string;
	name: string;
	family: string;
	cycle: Cycle;
	price: number; // normalized per month (annual = per-month, billed yearly)
	subscribers: number;
	status: PlanStatus;
	trialDays: number | null;
	since: string;
	changed?: boolean;
};

export const FAMILY_ORDER = ['Starter', 'Growth', 'Scale', 'Enterprise', 'Meridian API', 'Legacy'];

export const FAMILY_COLORS: Record<string, string> = {
	Starter: '#a9c4e8',
	Growth: '#6b93e0',
	Scale: '#255CD1',
	Enterprise: '#16336f',
	'Meridian API': '#d5e2f6',
	Legacy: '#e4e4e4'
};

export const PLAN_SEED: Plan[] = [
	{ id: 'p-sandbox', name: 'Sandbox', family: 'Legacy', cycle: 'monthly', price: 0, subscribers: 1240, status: 'active', trialDays: 0, since: 'Feb 2024' },
	{ id: 'p-starter-m', name: 'Starter', family: 'Starter', cycle: 'monthly', price: 29, subscribers: 312, status: 'active', trialDays: 14, since: 'Feb 2024' },
	{ id: 'p-starter-a', name: 'Starter annual', family: 'Starter', cycle: 'annual', price: 24, subscribers: 96, status: 'active', trialDays: 14, since: 'Feb 2024' },
	{ id: 'p-growth-m', name: 'Growth', family: 'Growth', cycle: 'monthly', price: 99, subscribers: 182, status: 'active', trialDays: 14, since: 'Mar 2024' },
	{ id: 'p-growth-a', name: 'Growth annual', family: 'Growth', cycle: 'annual', price: 79, subscribers: 64, status: 'active', trialDays: 14, since: 'Mar 2024' },
	{ id: 'p-scale-m', name: 'Scale', family: 'Scale', cycle: 'monthly', price: 499, subscribers: 41, status: 'active', trialDays: 30, since: 'Jan 2025' },
	{ id: 'p-scale-a', name: 'Scale annual', family: 'Scale', cycle: 'annual', price: 399, subscribers: 9, status: 'active', trialDays: 30, since: 'Jan 2025' },
	{ id: 'p-usage-beta', name: 'Scale usage', family: 'Scale', cycle: 'monthly', price: 399, subscribers: 12, status: 'beta', trialDays: 30, since: 'Aug 2026' },
	{ id: 'p-enterprise', name: 'Enterprise', family: 'Enterprise', cycle: 'annual', price: 2500, subscribers: 7, status: 'active', trialDays: null, since: 'Oct 2025' },
	{ id: 'p-meters', name: 'Extended meters', family: 'Meridian API', cycle: 'monthly', price: 149, subscribers: 23, status: 'active', trialDays: 0, since: 'Apr 2026' },
	{ id: 'p-legacy-starter', name: 'Starter (2023 pricing)', family: 'Legacy', cycle: 'monthly', price: 19, subscribers: 61, status: 'archived', trialDays: 7, since: 'Jan 2023' }
];

// deep-clone plain values out of reactive proxies (structuredClone can't clone them)
export function snap<T>(o: T): T {
	return JSON.parse(JSON.stringify(o));
}

export const runRate = (p: Plan) => p.price * p.subscribers;

const T0 = DAYS[0].t;
const T1 = DAYS[DAYS.length - 1].t;
export const arpuAt = (d: Day) => 88 + 18 * ((d.t - T0) / (T1 - T0));
export const subsAt = (d: Day) => Math.round(d.mrr / arpuAt(d));

// ---------- plan mix by month (for stacked chart) ----------

export type MixRow = { t: number; label: string; values: Record<string, number> };

export const MIX: MixRow[] = (() => {
	const r = mulberry32(8831);
	const base: Record<string, number[]> = {
		Starter: [0.135, 0.11],
		Growth: [0.285, 0.27],
		Scale: [0.295, 0.335],
		Enterprise: [0.21, 0.245],
		'Meridian API': [0.026, 0.034],
		Legacy: [0.049, 0.006]
	};
	const months: { t: number; total: number }[] = [];
	const map = new Map<string, number>();
	for (const d of DAYS) {
		const k = d.iso.slice(0, 7);
		if (!map.has(k)) map.set(k, 0);
		map.set(k, map.get(k)! + d.revenue);
	}
	const keys = [...map.keys()].sort();
	for (let i = keys.length - 12; i < keys.length; i++) {
		const k = keys[i];
		const [y, m] = k.split('-').map(Number);
		months.push({ t: new Date(y, m - 1, 1).getTime(), total: map.get(k)! });
	}
	return months.map((mo, idx) => {
		const s = idx / 11;
		const shares = Object.keys(base).map((fam) => {
			const v = base[fam][0] + (base[fam][1] - base[fam][0]) * s;
			return [fam, Math.max(0, v * (1 + (r() - 0.5) * 0.05))] as const;
		});
		const sum = shares.reduce((a, [, v]) => a + v, 0);
		const values: Record<string, number> = {};
		for (const [fam, v] of shares) values[fam] = (v / sum) * mo.total;
		return { t: mo.t, label: fmtMonth(mo.t), values };
	});
})();

// ---------- MRR movement (last 12 months) ----------

export type MoveRow = {
	label: string;
	opening: number;
	new: number;
	expansion: number;
	contraction: number;
	churned: number;
	closing: number;
};

export const MOVEMENT: MoveRow[] = (() => {
	const r = mulberry32(31);
	const byMonth = new Map<string, Day>();
	const map = new Map<string, number>();
	for (const d of DAYS) map.set(d.iso.slice(0, 7), d.mrr);
	const keys = [...map.keys()].sort();
	const rows: MoveRow[] = [];
	for (let i = keys.length - 12; i < keys.length; i++) {
		const k = keys[i];
		const [y, m] = k.split('-').map(Number);
		const opening = i > 0 ? map.get(keys[i - 1])! : map.get(k)! * 0.972;
		const closing = map.get(k)!;
		const net = closing - opening;
		const churned = Math.round(opening * (0.019 + r() * 0.02)) * -1;
		const contraction = Math.round(opening * (0.004 + r() * 0.012)) * -1;
		const rest = net - churned - contraction;
		const newShare = 0.55 + r() * 0.12;
		rows.push({
			label: `${MON[m - 1]} ’${String(y).slice(2)}`,
			opening: Math.round(opening),
			new: Math.round(rest * newShare),
			expansion: Math.round(rest * (1 - newShare)),
			contraction,
			churned,
			closing: Math.round(closing)
		});
	}
	return rows;
})();

// ---------- customers ----------

export type SubStatus = 'active' | 'trialing' | 'past_due' | 'churned';

export type Customer = {
	id: string;
	company: string;
	name: string;
	planId: string;
	status: SubStatus;
	seats: number;
	mrr: number;
	since: string;
	nextInvoice: string;
};

export const CUSTOMER_SEED: Customer[] = [
	{ id: 'c-1', company: 'Northwind Press', name: 'Marta Vogel', planId: 'p-scale-m', status: 'active', seats: 48, mrr: 499, since: 'Sep 24', nextInvoice: 'Dec 1' },
	{ id: 'c-2', company: 'Fernway Studio', name: 'Alex Chu', planId: 'p-growth-m', status: 'active', seats: 14, mrr: 99, since: 'Mar 24', nextInvoice: 'Nov 20' },
	{ id: 'c-3', company: 'Halcyon Health', name: 'Priya Nair', planId: 'p-enterprise', status: 'active', seats: 210, mrr: 2500, since: 'Oct 25', nextInvoice: 'Nov 26' },
	{ id: 'c-4', company: 'Binocular', name: 'Sam Reyes', planId: 'p-starter-m', status: 'trialing', seats: 3, mrr: 0, since: 'Nov 2', nextInvoice: 'Nov 16' },
	{ id: 'c-5', company: 'Ledgerly', name: 'Kai Osei', planId: 'p-growth-a', status: 'active', seats: 9, mrr: 79, since: 'Jul 25', nextInvoice: 'Jul 30' },
	{ id: 'c-6', company: 'Marlow Freight', name: 'Dana Whitfield', planId: 'p-scale-m', status: 'past_due', seats: 37, mrr: 499, since: 'Jan 25', nextInvoice: 'Nov 18' },
	{ id: 'c-7', company: 'Quartzline', name: 'Nia Bello', planId: 'p-starter-m', status: 'active', seats: 5, mrr: 29, since: 'May 25', nextInvoice: 'Nov 12' },
	{ id: 'c-8', company: 'Vessel Analytics', name: 'Tom Reiner', planId: 'p-usage-beta', status: 'trialing', seats: 11, mrr: 0, since: 'Oct 28', nextInvoice: 'Nov 27' },
	{ id: 'c-9', company: 'Pantry Car', name: 'Lucia Marek', planId: 'p-legacy-starter', status: 'active', seats: 2, mrr: 19, since: 'Feb 23', nextInvoice: 'Nov 9' },
	{ id: 'c-10', company: 'Atlas Cartography', name: 'Rui Chen', planId: 'p-scale-a', status: 'active', seats: 22, mrr: 399, since: 'Feb 25', nextInvoice: 'Feb 28' },
	{ id: 'c-11', company: 'Bramble & Co', name: 'Iris Delgado', planId: 'p-growth-m', status: 'churned', seats: 8, mrr: 0, since: 'Apr 24', nextInvoice: '—' },
	{ id: 'c-12', company: 'Signalbox', name: 'Owen Pratt', planId: 'p-meters', status: 'active', seats: 6, mrr: 149, since: 'Jun 26', nextInvoice: 'Nov 14' },
	{ id: 'c-13', company: 'Hearthside', name: 'Wren Calloway', planId: 'p-starter-m', status: 'active', seats: 4, mrr: 29, since: 'Aug 26', nextInvoice: 'Dec 3' },
	{ id: 'c-14', company: 'Fogbank Security', name: 'Ana Sosa', planId: 'p-growth-m', status: 'churned', seats: 12, mrr: 0, since: 'Nov 24', nextInvoice: '—' },
	{ id: 'c-15', company: 'Copperleaf', name: 'Jun Tanaka', planId: 'p-scale-m', status: 'active', seats: 31, mrr: 499, since: 'Dec 25', nextInvoice: 'Dec 6' }
];

// ---------- failed payments ----------

export const FAILURES = [
	{ company: 'Marlow Freight', amount: 499, date: 'Nov 2', reason: 'Card declined' },
	{ company: 'Halcyon Health', amount: 2500, date: 'Nov 1', reason: 'Expired card' },
	{ company: 'Copperleaf', amount: 499, date: 'Oct 30', reason: 'Insufficient funds' },
	{ company: 'Quartzline', amount: 29, date: 'Oct 30', reason: 'Card declined' }
];
export const FAILURE_TOTAL = 4518;

// ---------- csv export ----------

export function downloadCsv(name: string, rows: (string | number)[][]) {
	const esc = (v: string | number) => {
		const s = String(v);
		return /[",\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
	};
	const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
	const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	a.click();
	setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---------- shared class strings (tokens) ----------

export const RING = '#255cd12e';
export const SHADOW_CARD = 'shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.04)]';
export const CARD = 'rounded-xl bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.04)]';
export const BTN =
	'inline-flex h-8 shrink-0 cursor-default select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] px-2.5 text-[13px] font-medium outline-none transition-[background,box-shadow,color,transform] duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_#255cd12e]';
export const BTN_SEC =
	BTN + ' bg-gradient-to-b from-white to-[#f7f7f7] text-[#171717] shadow-[0_0_0_1px_#ececec,0_1px_2px_rgb(40_40_40/0.08)] hover:to-[#f2f2f2]';
export const BTN_PRI =
	BTN + ' bg-[#255cd1] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(0_0_0/0.16),0_0_0_1px_rgb(24_58_128)] hover:bg-[#2253bd]';
export const BTN_GHOST =
	BTN + ' text-[#737373] hover:bg-black/[0.04] hover:text-[#171717] focus-visible:shadow-[0_0_0_3px_#255cd12e]';
export const INPUT_CLS =
	'h-9 w-full rounded-[9px] bg-white px-3 text-[13px] font-normal text-[#171717] placeholder:text-[#a3a3a3] shadow-[0_0_0_1px_#ececec] outline-none transition-shadow duration-150 focus:shadow-[0_0_0_1px_#255cd1,0_0_0_4px_#255cd126]';
export const POP_CLASS =
	'z-50 rounded-xl bg-white p-1 [font-family:Inter_Variable,ui-sans-serif,sans-serif] shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_12px_32px_-8px_rgb(0_0_0/0.12),0_2px_6px_rgb(0_0_0/0.05)]';
export const MENU_ITEM =
	'flex h-8 w-full cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-[#171717] outline-none data-highlighted:bg-[#f4f4f4] data-[disabled]:opacity-50';
export const SEGM = 'flex h-7 items-center gap-0.5 rounded-[9px] bg-[#f0f0f0] p-0.5';
export const SEGM_ITEM =
	'inline-flex h-6 cursor-default select-none items-center gap-1 rounded-[7px] px-2 text-[12.5px] font-medium text-[#737373] outline-none transition-[color,box-shadow] duration-150 data-[active]:bg-white data-[active]:text-[#171717] data-[active]:shadow-[0_0_0_1px_#e8e8e8,0_1px_2px_rgb(40_40_40/0.08)]';
