/** All data on this page is sample data for one winter night on an hourly tariff. */

export const SLOT_MINUTES = 30;
/** Slot 0 is 16:00 today; the day runs 48 half-hour slots to 16:00 tomorrow. */
export const FIRST_SLOT_HOUR = 16;
/** "Now" in the planner: you get home at 17:00. */
export const NOW_SLOT = 2;

/** Grid price in US cents per kWh, per half hour from 16:00. */
export const PRICES: readonly number[] = [
	24, 27, 34, 41, 44, 43, 39, 35, 30, 27, 24, 22, 19, 17, 15, 14, 13, 12, 10, 9, 8, 7, 7, 8, 8, 9,
	11, 13, 16, 20, 25, 29, 31, 28, 24, 20, 17, 14, 12, 10, 9, 9, 10, 12, 14, 17, 20, 22
];

/** Grid carbon intensity in gCO2/kWh, per half hour from 16:00. */
export const CARBON: readonly number[] = [
	240, 250, 290, 320, 330, 325, 310, 290, 270, 250, 230, 210, 190, 175, 160, 150, 140, 135, 128,
	120, 115, 112, 110, 115, 120, 128, 140, 160, 185, 210, 240, 260, 255, 230, 200, 170, 140, 115, 95,
	82, 75, 72, 74, 82, 95, 120, 160, 200
];

export function slotLabel(slot: number): string {
	const totalMinutes = FIRST_SLOT_HOUR * 60 + slot * SLOT_MINUTES;
	const hours = Math.floor(totalMinutes / 60) % 24;
	const minutes = totalMinutes % 60;
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export type ApplianceId = 'car' | 'dishwasher' | 'washer' | 'heatpump';

export type Appliance = {
	id: ApplianceId;
	name: string;
	detail: string;
	/** kWh drawn per half-hour slot while running. */
	kwhPerSlot: number;
	/** Number of half-hour slots the job needs. */
	slots: number;
	/** Car charging can pause and resume, so it may use any cheap slots. */
	isSplittable: boolean;
	/** Heat leaks: preheat must start no earlier than this many slots before ready time. */
	maxLeadSlots?: number;
	defaultReadyBy: number;
	/** When this would start without Ebb. `null` means a timer that ends at the ready time. */
	habitStart: number | null;
	habitLabel: string;
	icon: 'car' | 'dish' | 'washer' | 'heat';
};

export const APPLIANCES: readonly Appliance[] = [
	{
		id: 'car',
		habitStart: 2,
		habitLabel: 'plugged in at 17:00',
		name: 'Car',
		detail: '32 kWh to 80%, 7.2 kW charger',
		kwhPerSlot: 3.6,
		slots: 9,
		isSplittable: true,
		defaultReadyBy: 30,
		icon: 'car'
	},
	{
		id: 'heatpump',
		habitStart: null,
		habitLabel: 'timer before you wake',
		name: 'Heat pump',
		detail: 'Preheat to 21°C, within 3 h of waking',
		kwhPerSlot: 1.2,
		slots: 3,
		isSplittable: false,
		maxLeadSlots: 6,
		defaultReadyBy: 30,
		icon: 'heat'
	},
	{
		id: 'dishwasher',
		habitStart: 7,
		habitLabel: 'after dinner, 19:30',
		name: 'Dishwasher',
		detail: 'Eco cycle, 2 h',
		kwhPerSlot: 0.35,
		slots: 4,
		isSplittable: false,
		defaultReadyBy: 30,
		icon: 'dish'
	},
	{
		id: 'washer',
		habitStart: 3,
		habitLabel: 'when you get home',
		name: 'Washing machine',
		detail: '40°C cotton, 1.5 h',
		kwhPerSlot: 0.3,
		slots: 3,
		isSplittable: false,
		defaultReadyBy: 32,
		icon: 'washer'
	}
];

export const READY_BY_OPTIONS: readonly number[] = [12, 16, 26, 28, 30, 32];

export type Plan = {
	id: 'basic' | 'home' | 'building';
	name: string;
	summary: string;
	monthly: number;
	yearly: number;
	features: readonly string[];
};

export const HUB_PRICE = 149;
export const BUILDING_HUB_PRICE = 119;
export const BUILDING_MIN_UNITS = 10;
export const BUILDING_MAX_UNITS = 500;

export function clampBuildingUnits(units: number): number {
	if (!Number.isFinite(units)) return BUILDING_MIN_UNITS;
	return Math.min(BUILDING_MAX_UNITS, Math.max(BUILDING_MIN_UNITS, Math.round(units)));
}

export const PLANS: readonly Plan[] = [
	{
		id: 'basic',
		name: 'Basic',
		summary: 'Cost-only scheduling for up to 3 devices.',
		monthly: 0,
		yearly: 0,
		features: ['Up to 3 devices', 'Cheapest-hours scheduling', 'Runs offline on the hub']
	},
	{
		id: 'home',
		name: 'Home',
		summary: 'Every device, carbon mode and battery trading.',
		monthly: 6,
		yearly: 60,
		features: [
			'Unlimited devices',
			'Cost or carbon mode',
			'Home battery charge and discharge',
			'Solar export timing'
		]
	},
	{
		id: 'building',
		name: 'Building',
		summary: 'For landlords and housing co-ops. Billed per unit.',
		monthly: 4,
		yearly: 40,
		features: ['Everything in Home', 'One dashboard for all units', 'Tenant privacy controls']
	}
];

export type Ownership = 'car' | 'heatpump' | 'battery' | 'solar';

export const OWNERSHIP_OPTIONS: readonly { id: Ownership; label: string }[] = [
	{ id: 'car', label: 'Electric car' },
	{ id: 'heatpump', label: 'Heat pump' },
	{ id: 'battery', label: 'Home battery' },
	{ id: 'solar', label: 'Solar panels' }
];

export type DeviceStatus = 'supported' | 'beta' | 'planned';
export type DeviceCategory = 'Chargers' | 'Heating' | 'Batteries' | 'Appliances' | 'Plugs';

export type Device = {
	name: string;
	category: DeviceCategory;
	protocol: string;
	status: DeviceStatus;
};

export const DEVICE_CATEGORIES: readonly DeviceCategory[] = [
	'Chargers',
	'Heating',
	'Batteries',
	'Appliances',
	'Plugs'
];

export const DEVICES: readonly Device[] = [
	{ name: 'Wall chargers with OCPP 1.6J', category: 'Chargers', protocol: 'OCPP 1.6J', status: 'supported' },
	{ name: 'Wall chargers with OCPP 2.0.1', category: 'Chargers', protocol: 'OCPP 2.0.1', status: 'supported' },
	{ name: 'Cars with a charging schedule API', category: 'Chargers', protocol: 'Cloud API', status: 'beta' },
	{ name: 'Bidirectional chargers (V2H)', category: 'Chargers', protocol: 'ISO 15118-20', status: 'planned' },
	{ name: 'SG Ready heat pumps', category: 'Heating', protocol: 'SG Ready relay', status: 'supported' },
	{ name: 'Heat pumps with EEBus', category: 'Heating', protocol: 'EEBus', status: 'beta' },
	{ name: 'Hot water cylinders with immersion', category: 'Heating', protocol: 'Relay + CT clamp', status: 'supported' },
	{ name: 'Smart thermostats with OpenTherm', category: 'Heating', protocol: 'OpenTherm', status: 'planned' },
	{ name: 'Hybrid inverters with Modbus TCP', category: 'Batteries', protocol: 'Modbus TCP', status: 'supported' },
	{ name: 'Batteries with SunSpec', category: 'Batteries', protocol: 'SunSpec Modbus', status: 'supported' },
	{ name: 'AC-coupled batteries with a local API', category: 'Batteries', protocol: 'Local REST', status: 'beta' },
	{ name: 'Dishwashers with remote start', category: 'Appliances', protocol: 'Matter 1.3', status: 'supported' },
	{ name: 'Washing machines with remote start', category: 'Appliances', protocol: 'Matter 1.3', status: 'supported' },
	{ name: 'Tumble dryers with remote start', category: 'Appliances', protocol: 'Matter 1.3', status: 'beta' },
	{ name: 'Matter smart plugs', category: 'Plugs', protocol: 'Matter over Thread', status: 'supported' },
	{ name: 'Zigbee 3.0 smart plugs', category: 'Plugs', protocol: 'Zigbee 3.0', status: 'supported' },
	{ name: 'Wi-Fi plugs with a local API', category: 'Plugs', protocol: 'Local HTTP', status: 'beta' },
	{ name: 'Z-Wave plugs', category: 'Plugs', protocol: 'Z-Wave', status: 'planned' }
];

export const FAQS: readonly { id: string; question: string; answer: string }[] = [
	{
		id: 'tariff',
		question: 'Do I need an hourly tariff?',
		answer:
			'Ebb saves the most on a tariff that changes price every hour or half hour. On a fixed day/night tariff it still moves loads into the night window, but savings are smaller. The hub reads your tariff from your supplier, or you can type in your rates.'
	},
	{
		id: 'offline',
		question: 'What happens if my internet goes down?',
		answer:
			"Tonight's plan lives on the hub, not in the cloud. If the connection drops, everything already scheduled still runs. Ebb fetches tomorrow's prices as soon as it is back online."
	},
	{
		id: 'override',
		question: 'Can I override a plan?',
		answer:
			'Yes. Tap "Run now" on any device in the app, or press the button on the device itself. Ebb treats a manual start as a decision and replans everything else around it.'
	},
	{
		id: 'install',
		question: 'How long does installation take?',
		answer:
			'About 20 minutes for most homes. Plug the hub into power and your router, then the app finds devices on your network. The optional CT clamp clips around your meter tail and needs no electrician.'
	},
	{
		id: 'data',
		question: 'What data leaves my home?',
		answer:
			'Prices come in; nothing about your usage goes out unless you turn on cloud backup. The hub keeps 13 months of half-hourly history locally, and you can export it as CSV at any time.'
	}
];

export type NightStep = {
	slot: number;
	title: string;
	body: string;
};

/** The story the "one night" section scrolls through. `{price}` is replaced with that slot's price. */
export const NIGHT_STEPS: readonly NightStep[] = [
	{
		slot: 3,
		title: 'Peak starts. The battery takes over.',
		body: 'Power hits {price} at 17:30. Ebb switches the house to the home battery so you cook and watch TV without paying peak rates.',
	},
	{
		slot: 13,
		title: 'Prices fall. Ebb waits.',
		body: 'At 22:30 power is cheaper, but not cheapest. The car is plugged in and nothing happens yet, on purpose.',
	},
	{
		slot: 18,
		title: 'The car starts charging at {price}.',
		body: 'Ebb picks the nine cheapest half hours before 07:00 and charges in those. It pauses and resumes as prices move.',
	},
	{
		slot: 21,
		title: 'Dishwasher and battery share the trough.',
		body: 'At {price} the dishwasher runs its eco cycle and the battery refills for tomorrow morning’s peak.',
	},
	{
		slot: 25,
		title: 'The heat pump preheats the house.',
		body: 'Preheating too early wastes heat, so Ebb waits for the last cheap window before you wake up.',
	},
	{
		slot: 30,
		title: 'Car at 80%. House at 21°C.',
		body: 'Everything was ready by 07:00. You spent less than half of what the same night costs on autopilot.',
	}
];

export const CHANGELOG: readonly { date: string; title: string; body: string }[] = [
	{
		date: 'Oct 28, 2026',
		title: 'Carbon mode',
		body: 'Plan around grid carbon intensity instead of price, or set a blend of both.'
	},
	{
		date: 'Sep 30, 2026',
		title: 'Heat pump preheat limits',
		body: 'Set how early a preheat may start so the house is not warm at 02:00 and cold at 07:00.'
	},
	{
		date: 'Aug 19, 2026',
		title: 'Hub firmware 0.9',
		body: 'Schedules now survive power cuts. The hub resumes the plan within 40 seconds of power returning.'
	}
];

export const CONTACT_EMAIL = 'hello@ebb.energy';
