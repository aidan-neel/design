import { HUB_PRICE, PLANS, type Ownership, type Plan } from './data';

export type Billing = 'monthly' | 'yearly';
export type HomePlanId = 'basic' | 'home';

export type Estimate = {
	monthlySavings: number;
	monthlyPlanCost: number;
	netYearly: number;
	/** Months until savings cover the hub, or null if they never do. */
	paybackMonths: number | null;
};

/** Share of a household bill each kind of load represents and Ebb can move. Sample figures. */
const SHIFTABLE_SHARE: Record<Ownership | 'appliances', number> = {
	appliances: 0.12,
	car: 0.25,
	heatpump: 0.2,
	battery: 0.18,
	solar: 0.06
};

/** How much of a shiftable load's cost each plan saves. Home adds carbon mode and battery trading. */
const CAPTURE_RATE: Record<HomePlanId, number> = { basic: 0.32, home: 0.5 };

const BASIC_DEVICE_LIMIT = 3;
const APPLIANCE_COUNT = 2;

export function monthlyPrice(plan: Plan, billing: Billing): number {
	return billing === 'yearly' ? plan.yearly / 12 : plan.monthly;
}

export function estimateSavings(
	planId: HomePlanId,
	monthlyBill: number,
	owned: ReadonlySet<Ownership>,
	billing: Billing
): Estimate {
	const plan = PLANS.find((candidate) => candidate.id === planId);
	if (!plan) throw new Error(`Unknown plan "${planId}"`);

	const share = planId === 'basic' ? basicShare(owned) : homeShare(owned);
	const monthlySavings = monthlyBill * share * CAPTURE_RATE[planId];
	const monthlyPlanCost = monthlyPrice(plan, billing);
	const netMonthly = monthlySavings - monthlyPlanCost;

	return {
		monthlySavings,
		monthlyPlanCost,
		netYearly: netMonthly * 12,
		paybackMonths: netMonthly > 0 ? HUB_PRICE / netMonthly : null
	};
}

/** Basic skips batteries and solar, and covers only 3 devices: big loads first, then appliances. */
function basicShare(owned: ReadonlySet<Ownership>): number {
	const bigLoads = (['car', 'heatpump'] as const).filter((load) => owned.has(load));
	const applianceSlots = Math.min(APPLIANCE_COUNT, BASIC_DEVICE_LIMIT - bigLoads.length);
	const applianceShare = (SHIFTABLE_SHARE.appliances * applianceSlots) / APPLIANCE_COUNT;
	return bigLoads.reduce((sum, load) => sum + SHIFTABLE_SHARE[load], applianceShare);
}

function homeShare(owned: ReadonlySet<Ownership>): number {
	return [...owned].reduce((sum, load) => sum + SHIFTABLE_SHARE[load], SHIFTABLE_SHARE.appliances);
}
