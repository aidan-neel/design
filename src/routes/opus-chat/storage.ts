/**
 * Per-device conveniences (sidebar state, preferences). Storage can be blocked or hold
 * stale data, so reads fall back to the default and the app keeps working without it.
 */

export function readStored<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
	try {
		const raw = localStorage.getItem(key);
		if (raw === null) return fallback;
		const parsed: unknown = JSON.parse(raw);
		return isValid(parsed) ? parsed : fallback;
	} catch (error) {
		console.warn(`Ignoring stored "${key}"`, error);
		return fallback;
	}
}

export function writeStored(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.warn(`Couldn't save "${key}"`, error);
	}
}
