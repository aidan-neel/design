import { APPLIANCES, CARBON, NOW_SLOT, PRICES, slotLabel, type Appliance } from './data';

export type Objective = 'cost' | 'carbon';

export type Job = {
	appliance: Appliance;
	readyBy: number;
};

export type Footprint = {
	/** US dollars. */
	cost: number;
	/** Kilograms of CO2. */
	carbonKg: number;
};

/** The window a job may run in: [first, end), end exclusive. */
export function allowedWindow(job: Job): { first: number; end: number } {
	const leadLimit = job.appliance.maxLeadSlots;
	const first = leadLimit === undefined ? NOW_SLOT : Math.max(NOW_SLOT, job.readyBy - leadLimit);
	return { first, end: job.readyBy };
}

/** Ebb's pick: the slots that minimise price (or carbon) and still finish by the ready time. */
export function planJob(job: Job, objective: Objective): number[] {
	const weights = objective === 'cost' ? PRICES : CARBON;
	const { first, end } = allowedWindow(job);

	if (job.appliance.isSplittable) {
		return pickCheapestSlots(weights, first, end, job.appliance.slots);
	}
	return contiguousSlots(pickCheapestStart(weights, first, end, job.appliance.slots), job.appliance.slots);
}

/** What happens without Ebb: the job starts when habit says it does. */
export function habitSlots(job: Job): number[] {
	const { slots, habitStart } = job.appliance;
	const latestStart = job.readyBy - slots;
	const start = habitStart === null ? latestStart : Math.min(habitStart, latestStart);
	return contiguousSlots(start, slots);
}

export function contiguousSlots(start: number, length: number): number[] {
	return Array.from({ length }, (_, offset) => start + offset);
}

export function clampStart(job: Job, start: number): number {
	const { first, end } = allowedWindow(job);
	return Math.min(Math.max(start, first), end - job.appliance.slots);
}

export function footprint(appliance: Appliance, slots: readonly number[]): Footprint {
	const cents = slots.reduce((sum, slot) => sum + PRICES[slot], 0) * appliance.kwhPerSlot;
	const grams = slots.reduce((sum, slot) => sum + CARBON[slot], 0) * appliance.kwhPerSlot;
	return { cost: cents / 100, carbonKg: grams / 1000 };
}

export function sumFootprints(items: readonly Footprint[]): Footprint {
	return items.reduce(
		(total, item) => ({ cost: total.cost + item.cost, carbonKg: total.carbonKg + item.carbonKg }),
		{ cost: 0, carbonKg: 0 }
	);
}

export function defaultJobs(): Job[] {
	return APPLIANCES.map((appliance) => ({ appliance, readyBy: appliance.defaultReadyBy }));
}

/** "01:00–03:00", or "00:30–05:30, 2 pauses" for a split job. */
export function describeSlots(slots: readonly number[]): string {
	if (slots.length === 0) return 'Not scheduled';

	const first = slots[0];
	const last = slots[slots.length - 1];
	const range = `${slotLabel(first)}–${slotLabel(last + 1)}`;
	const pauses = slots.filter((slot, index) => index > 0 && slot !== slots[index - 1] + 1).length;
	if (pauses === 0) return range;
	return `${range}, ${pauses} ${pauses === 1 ? 'pause' : 'pauses'}`;
}

function pickCheapestSlots(weights: readonly number[], first: number, end: number, count: number): number[] {
	const candidates = [];
	for (let slot = first; slot < end; slot++) candidates.push(slot);

	return candidates
		.sort((a, b) => weights[a] - weights[b] || a - b)
		.slice(0, count)
		.sort((a, b) => a - b);
}

function pickCheapestStart(weights: readonly number[], first: number, end: number, length: number): number {
	let bestStart = first;
	let bestSum = Infinity;
	for (let start = first; start + length <= end; start++) {
		const sum = contiguousSlots(start, length).reduce((total, slot) => total + weights[slot], 0);
		if (sum < bestSum) {
			bestSum = sum;
			bestStart = start;
		}
	}
	return bestStart;
}
