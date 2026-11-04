// Meridian admin — reactive app state (Svelte 5 runes in a module).
import { snap } from './data';
import { CUSTOMER_SEED, PLAN_SEED, type Customer, type Plan, type RangeId, type SubStatus } from './data';

export type ViewId = 'overview' | 'revenue' | 'customers' | 'plans';
export type Toast = { id: number; title: string; desc?: string; undo?: () => void };
export type DialogState =
	| null
	| { kind: 'price'; planId: string }
	| { kind: 'addplan' }
	| { kind: 'shortcuts' }
	| { kind: 'profile' }
	| { kind: 'logout' }
	| { kind: 'customer'; customerId: string };

export type Notification = { id: number; title: string; desc: string; when: string };

const seedPlans: Plan[] = structuredClone(PLAN_SEED);
const seedCustomers: Customer[] = structuredClone(CUSTOMER_SEED);

let toastId = 0;

class Store {
	orgs = ['Northgate Labs', 'Verity Studio', 'Harbour & Co'];
	org = $state('Northgate Labs');
	view = $state<ViewId>('overview');

	rangeId = $state<RangeId>('30d');
	customFrom = $state('2026-10-05');
	customTo = $state('2026-11-04');
	compare = $state(true);

	search = $state('');
	searchEl: HTMLInputElement | null = null;
	searchTick = $state(0);

	density = $state<'cozy' | 'compact'>('cozy');
	drawerOpen = $state(false);

	plans = $state<Plan[]>(structuredClone(PLAN_SEED));
	customers = $state<Customer[]>(structuredClone(CUSTOMER_SEED));

	selection = $state<string[]>([]);
	dialog: DialogState = $state(null);

	toasts = $state<Toast[]>([]);
	notifRead = $state(false);

	prefs = $state({ name: 'Ada Ihuoma', email: 'ada@northgate.dev' });

	revert() {
		this.plans = structuredClone(seedPlans);
		this.customers = structuredClone(seedCustomers);
		this.org = 'Northgate Labs';
		this.selection = [];
	}

	exporters: Record<ViewId, (() => void) | undefined> = { overview: undefined, revenue: undefined, customers: undefined, plans: undefined };

	toast(title: string, desc?: string, undo?: () => void) {
		const id = ++toastId;
		this.toasts = [{ id, title, desc, undo }, ...this.toasts].slice(0, 3);
		setTimeout(() => this.dismiss(id), 5000);
	}
	dismiss(id: number) {
		this.toasts = this.toasts.filter((t) => t.id !== id);
	}

	focusSearch() {
		this.searchTick++;
	}

	// ---- plan mutations ----
	setPrice(id: string, price: number) {
		const p = this.plans.find((x) => x.id === id);
		if (!p) return;
		const before = snap(this.plans);
		p.price = price;
		p.changed = true;
		this.toast('Price updated', `${p.name} · ${p.subscribers} subscribers`, () => {
			this.plans = before;
		});
	}
	addPlan(p: Plan) {
		this.plans = [...this.plans, p];
		this.toast('Price created', `${p.name} · ${p.cycle}`);
	}
	setStatus(id: string, status: Plan['status']) {
		const p = this.plans.find((x) => x.id === id);
		if (!p) return;
		const before = p.status;
		p.status = status;
		const label = status === 'archived' ? 'archived' : status === 'beta' ? 'moved to beta' : 'published';
		this.toast(`${p.name} ${label}`, undefined, () => (p.status = before));
	}
	duplicate(id: string) {
		const p = this.plans.find((x) => x.id === id);
		if (!p) return;
		const copy: Plan = { ...snap(p), id: `copy-${id}-${Date.now()}`, name: `${p.name} (copy)`, status: 'beta', subscribers: 0, since: 'Draft' };
		this.plans = [...this.plans, copy];
		this.toast('Price duplicated', `${copy.name} is a draft in beta`);
	}

	// ---- customer mutations ----
	setCustomerPlan(id: string, planId: string) {
		const c = this.customers.find((x) => x.id === id);
		const p = this.plans.find((x) => x.id === planId);
		if (!c || !p) return;
		const before = { plan: c.planId, mrr: c.mrr };
		const wasTrialing = c.status === 'trialing';
		c.planId = planId;
		c.mrr = wasTrialing ? 0 : p.price;
		if (c.status !== 'churned' && !wasTrialing) c.status = 'active';
		this.toast(`Moved to ${p.name}`, `${c.company}`, () => {
			c.planId = before.plan;
			c.mrr = before.mrr;
		});
	}
	cancelCustomer(id: string) {
		const c = this.customers.find((x) => x.id === id);
		if (!c) return;
		const before = { status: c.status, mrr: c.mrr, next: c.nextInvoice };
		c.status = 'churned';
		c.mrr = 0;
		c.nextInvoice = '—';
		this.toast(`${c.company} cancelled`, 'Ends at period · Nov 30', () => {
			c.status = before.status;
			c.mrr = before.mrr;
			c.nextInvoice = before.next;
		});
	}
	remindPastDue(id: string) {
		const c = this.customers.find((x) => x.id === id);
		if (!c) return;
		this.toast('Reminder sent', `${c.name} · ${c.company}`);
	}
	resubscribe(id: string) {
		const c = this.customers.find((x) => x.id === id);
		if (!c) return;
		const p = this.plans.find((x) => x.id === c.planId);
		const before = { status: c.status, mrr: c.mrr, next: c.nextInvoice };
		c.status = 'active';
		c.mrr = p ? p.price : 0;
		c.nextInvoice = 'Dec 27';
		this.toast(`${c.company} reactivated`, p?.name + ' · billing resumes Dec 27', () => {
			c.status = before.status;
			c.mrr = before.mrr;
			c.nextInvoice = before.next;
		});
	}
}

export const store = new Store();

// notifications are lazy: build once
export function notifications(): Notification[] {
	if (!store.notifRead) {
		return [
			{ id: 1, title: 'Payment failures up 9%', desc: '4,518 across 16 invoices this week', when: '2h' },
			{ id: 2, title: 'Growth annual price published', desc: 'You changed $89 → $79 last night', when: '18h' }
		];
	}
	return [];
}
