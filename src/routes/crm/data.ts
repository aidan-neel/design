export type Stage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type View = 'pipeline' | 'deals' | 'people' | 'companies';

export type Note = {
	id: string;
	at: string;
	who: string;
	text: string;
};

export type Deal = {
	id: string;
	name: string;
	company: string;
	contact: string;
	email: string;
	phone: string;
	stage: Stage;
	amount: number;
	close: string;
	owner: string;
	ownerInitials: string;
	next: string;
	notes: Note[];
};

export const STAGE_META: Record<
	Stage,
	{ label: string; tone: 'lead' | 'info' | 'warn' | 'deal' | 'ok' | 'no' }
> = {
	lead: { label: 'Lead', tone: 'lead' },
	qualified: { label: 'Qualified', tone: 'info' },
	proposal: { label: 'Proposal', tone: 'warn' },
	negotiation: { label: 'Negotiation', tone: 'deal' },
	won: { label: 'Won', tone: 'ok' },
	lost: { label: 'Lost', tone: 'no' }
};

export const PIPELINE_STAGES: Stage[] = ['lead', 'qualified', 'proposal', 'negotiation'];

export const WEIGHT: Record<Stage, number> = {
	lead: 0.1,
	qualified: 0.25,
	proposal: 0.45,
	negotiation: 0.7,
	won: 1,
	lost: 0
};

export const STAGE_OPTIONS = [
	{ value: 'open', label: 'Open' },
	{ value: 'all', label: 'All' },
	{ value: 'lead', label: 'Lead' },
	{ value: 'qualified', label: 'Qualified' },
	{ value: 'proposal', label: 'Proposal' },
	{ value: 'negotiation', label: 'Negotiation' },
	{ value: 'won', label: 'Won' },
	{ value: 'lost', label: 'Lost' }
];

export const OWNER_OPTIONS = [
	{ value: 'all', label: 'Anyone' },
	{ value: 'Maya Chen', label: 'Maya Chen' },
	{ value: 'Jonah Hale', label: 'Jonah Hale' },
	{ value: 'Priya Nair', label: 'Priya Nair' }
];

export const RANGE_OPTIONS = [
	{ value: 'all', label: 'Any date' },
	{ value: 'nov', label: 'Nov 2026' },
	{ value: 'dec', label: 'Dec 2026' },
	{ value: 'q4', label: 'Q4 2026' }
];

export const seedDeals: Deal[] = [
	{
		id: 'd1',
		name: 'Seasonal produce program',
		company: 'Pike Place Market PDA',
		contact: 'Elena Voss',
		email: 'elena.voss@pikeplacement.org',
		phone: '206-555-0142',
		stage: 'negotiation',
		amount: 48200,
		close: '2026-11-14',
		owner: 'Maya Chen',
		ownerInitials: 'MC',
		next: 'Send revised winter SKU list by Thursday',
		notes: [
			{
				id: 'n1',
				at: '2026-11-02T16:40:00',
				who: 'Maya Chen',
				text: 'Elena asked to split citrus and root veg into separate lines.'
			},
			{
				id: 'n2',
				at: '2026-10-28T11:15:00',
				who: 'Maya Chen',
				text: 'Walked the stall with Elena. They want twice-weekly drops in December.'
			}
		]
	},
	{
		id: 'd2',
		name: 'Tasting-menu pantry',
		company: 'Canlis',
		contact: 'Tommee Brady',
		email: 'tbrady@canlis.com',
		phone: '206-555-0194',
		stage: 'proposal',
		amount: 22800,
		close: '2026-11-21',
		owner: 'Maya Chen',
		ownerInitials: 'MC',
		next: 'Follow up on the foraged-mushroom addendum',
		notes: [
			{
				id: 'n3',
				at: '2026-11-01T09:20:00',
				who: 'Maya Chen',
				text: 'Sent the tasting-menu packet. Tommee reviewing with the chef de cuisine.'
			}
		]
	},
	{
		id: 'd3',
		name: 'Regional grocery set',
		company: 'PCC Community Markets',
		contact: 'Jordan Ames',
		email: 'james@pccmarkets.com',
		phone: '206-555-0118',
		stage: 'negotiation',
		amount: 112400,
		close: '2026-11-28',
		owner: 'Jonah Hale',
		ownerInitials: 'JH',
		next: 'Legal review of the 12-month volume clause',
		notes: [
			{
				id: 'n4',
				at: '2026-10-30T14:05:00',
				who: 'Jonah Hale',
				text: 'PCC wants a 4% volume rebate above $90k. Countered at 3%.'
			}
		]
	},
	{
		id: 'd4',
		name: 'Holiday gift boxes',
		company: "Fran's Chocolates",
		contact: 'Fran Bigelow',
		email: 'wholesale@franschocolates.com',
		phone: '206-555-0160',
		stage: 'qualified',
		amount: 9600,
		close: '2026-12-04',
		owner: 'Priya Nair',
		ownerInitials: 'PN',
		next: 'Confirm hazelnut allotment with the farm',
		notes: [
			{
				id: 'n5',
				at: '2026-10-27T10:00:00',
				who: 'Priya Nair',
				text: 'Discovery call. They need 400 boxes packed by 2 Dec.'
			}
		]
	},
	{
		id: 'd5',
		name: "Chef's counter restock",
		company: 'The Walrus and the Carpenter',
		contact: 'Renee Erickson',
		email: 'renee@walruscarpenter.com',
		phone: '206-555-0177',
		stage: 'proposal',
		amount: 18450,
		close: '2026-11-18',
		owner: 'Maya Chen',
		ownerInitials: 'MC',
		next: 'Price the oyster-bar garnish kit',
		notes: [
			{
				id: 'n6',
				at: '2026-11-03T08:50:00',
				who: 'Maya Chen',
				text: 'Renee wants the same butter as last winter, plus a citrus oil.'
			}
		]
	},
	{
		id: 'd6',
		name: 'Campus dining contract',
		company: 'University of Washington',
		contact: 'Marcus Hill',
		email: 'mhill@uw.edu',
		phone: '206-555-0104',
		stage: 'lead',
		amount: 164000,
		close: '2026-12-12',
		owner: 'Jonah Hale',
		ownerInitials: 'JH',
		next: 'Intro meeting with housing and food services',
		notes: [
			{
				id: 'n7',
				at: '2026-10-24T15:30:00',
				who: 'Jonah Hale',
				text: 'Inbound from a dining RFP. First call booked for 7 Nov.'
			}
		]
	},
	{
		id: 'd7',
		name: 'Weekend brunch program',
		company: 'Tilikum Place Cafe',
		contact: 'Heather Earnhardt',
		email: 'heather@tilikumplacecafe.com',
		phone: '206-555-0133',
		stage: 'qualified',
		amount: 11200,
		close: '2026-11-25',
		owner: 'Priya Nair',
		ownerInitials: 'PN',
		next: 'Drop sample preserves on Friday',
		notes: []
	},
	{
		id: 'd8',
		name: 'Private dining pantry',
		company: 'The Corson Building',
		contact: 'Matthew Dillon',
		email: 'matthew@thecorsonbuilding.com',
		phone: '206-555-0188',
		stage: 'lead',
		amount: 7850,
		close: '2026-12-02',
		owner: 'Maya Chen',
		ownerInitials: 'MC',
		next: 'Tour the kitchen next Tuesday',
		notes: []
	},
	{
		id: 'd9',
		name: 'Hotel F&B wholesale',
		company: 'Willows Lodge',
		contact: 'Sofia Grant',
		email: 'sgrant@willowslodge.com',
		phone: '425-555-0121',
		stage: 'negotiation',
		amount: 54600,
		close: '2026-11-20',
		owner: 'Jonah Hale',
		ownerInitials: 'JH',
		next: 'Counter on the two-year term',
		notes: [
			{
				id: 'n8',
				at: '2026-11-02T13:10:00',
				who: 'Jonah Hale',
				text: 'Sofia can sign this month if we hold 2025 pricing on dairy.'
			}
		]
	},
	{
		id: 'd10',
		name: 'Farm-to-table CSA add-on',
		company: 'Metropolitan Market',
		contact: 'Chris Trueblood',
		email: 'ctrueblood@metropolitan-market.com',
		phone: '206-555-0155',
		stage: 'proposal',
		amount: 31900,
		close: '2026-12-08',
		owner: 'Priya Nair',
		ownerInitials: 'PN',
		next: 'Wait on category-manager sign-off',
		notes: [
			{
				id: 'n9',
				at: '2026-10-31T12:00:00',
				who: 'Priya Nair',
				text: 'Pilot in Queen Anne and Sand Point. Rollout if sell-through hits 70%.'
			}
		]
	},
	{
		id: 'd11',
		name: 'Summer ice program',
		company: 'Serious Pie',
		contact: 'Dana Tough',
		email: 'dtough@seriouspie.com',
		phone: '206-555-0190',
		stage: 'won',
		amount: 16400,
		close: '2026-10-12',
		owner: 'Maya Chen',
		ownerInitials: 'MC',
		next: 'Kick off weekly drops on 1 Apr',
		notes: [
			{
				id: 'n10',
				at: '2026-10-12T17:00:00',
				who: 'Maya Chen',
				text: 'Signed. First invoice goes out 15 March.'
			}
		]
	},
	{
		id: 'd12',
		name: 'Stadium concessions',
		company: 'Lumen Field',
		contact: 'Patrice Cole',
		email: 'pcole@lumenfield.com',
		phone: '206-555-0129',
		stage: 'lost',
		amount: 88000,
		close: '2026-10-22',
		owner: 'Jonah Hale',
		ownerInitials: 'JH',
		next: 'Revisit after the 2027 season bid',
		notes: [
			{
				id: 'n11',
				at: '2026-10-22T09:40:00',
				who: 'Jonah Hale',
				text: 'Lost to Sysco on distribution coverage. Keep the chef contact warm.'
			}
		]
	}
];

export function money(n: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	}).format(n);
}

export function shortDate(iso: string): string {
	return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'short'
	});
}

export function noteWhen(iso: string): string {
	return new Date(iso).toLocaleString('en-GB', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function inRange(close: string, range: string): boolean {
	if (range === 'all') return true;
	const m = close.slice(5, 7);
	if (range === 'nov') return close.startsWith('2026-11');
	if (range === 'dec') return close.startsWith('2026-12');
	if (range === 'q4') return close.startsWith('2026-10') || m === '11' || m === '12';
	return true;
}

export function isOpen(stage: Stage): boolean {
	return stage !== 'won' && stage !== 'lost';
}
