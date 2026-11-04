export type ToastAction = { label: string; run: () => void };

export type Toast = {
	id: number;
	message: string;
	tone: 'neutral' | 'error';
	action?: ToastAction;
};

const AUTO_DISMISS_MS = 5000;

/** Errors stay until dismissed; everything else clears itself after five seconds. */
class Toaster {
	items = $state<Toast[]>([]);
	#nextId = 0;

	show(message: string, options: { tone?: Toast['tone']; action?: ToastAction } = {}): void {
		this.#nextId += 1;
		const toast: Toast = { id: this.#nextId, message, tone: options.tone ?? 'neutral', action: options.action };
		this.items = [...this.items.slice(-2), toast];
		if (toast.tone !== 'error') setTimeout(() => this.dismiss(toast.id), AUTO_DISMISS_MS);
	}

	dismiss(id: number): void {
		this.items = this.items.filter((toast) => toast.id !== id);
	}
}

export const toaster = new Toaster();
