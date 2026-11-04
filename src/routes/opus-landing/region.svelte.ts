import { getContext, setContext } from 'svelte';

export type RegionCode = 'us' | 'uk' | 'eu';

type RegionInfo = {
	label: string;
	currency: 'USD' | 'GBP' | 'EUR';
	/** Multiplier from US dollars. Sample rates, fixed for this page. */
	rate: number;
	minorUnit: string;
	locale: string;
};

export const REGIONS: Record<RegionCode, RegionInfo> = {
	us: { label: 'United States', currency: 'USD', rate: 1, minorUnit: '¢', locale: 'en-US' },
	uk: { label: 'United Kingdom', currency: 'GBP', rate: 0.79, minorUnit: 'p', locale: 'en-GB' },
	eu: { label: 'Europe', currency: 'EUR', rate: 0.92, minorUnit: 'c', locale: 'en-IE' }
};

/** The visitor's region. Every price on the page converts through it. */
export class Region {
	code = $state<RegionCode>('us');

	get info(): RegionInfo {
		return REGIONS[this.code];
	}

	/** Formats a US-dollar amount in the local currency. */
	money(usd: number, fractionDigits = 2): string {
		return new Intl.NumberFormat(this.info.locale, {
			style: 'currency',
			currency: this.info.currency,
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: fractionDigits
		}).format(usd * this.info.rate);
	}

	/** Formats a price in US cents per kWh as local minor units, e.g. "41¢" or "32p". */
	unitPrice(usCents: number): string {
		return `${Math.round(usCents * this.info.rate)}${this.info.minorUnit}`;
	}
}

const REGION_KEY = Symbol('ebb-region');

export function provideRegion(): Region {
	return setContext(REGION_KEY, new Region());
}

export function useRegion(): Region {
	return getContext<Region>(REGION_KEY);
}
