import { getContext, setContext } from 'svelte';

export type Toast = {
	id: number;
	message: string;
	tone: 'neutral' | 'error';
	action?: { label: string; run: () => void };
};

const VISIBLE_MS = 5000;

/** Dark toast stack. Errors stay until dismissed; everything else leaves after 5 s. */
export class Toaster {
	#items = $state<Toast[]>([]);
	#nextId = 1;

	get items(): readonly Toast[] {
		return this.#items;
	}

	show(message: string, options: Omit<Toast, 'id' | 'message'> = { tone: 'neutral' }): void {
		const toast: Toast = { id: this.#nextId++, message, ...options };
		this.#items = [...this.#items.slice(-2), toast];
		if (toast.tone !== 'error') {
			setTimeout(() => this.dismiss(toast.id), VISIBLE_MS);
		}
	}

	dismiss(id: number): void {
		this.#items = this.#items.filter((toast) => toast.id !== id);
	}
}

const TOASTER_KEY = Symbol('ebb-toaster');

export function provideToaster(): Toaster {
	return setContext(TOASTER_KEY, new Toaster());
}

export function useToaster(): Toaster {
	return getContext<Toaster>(TOASTER_KEY);
}
