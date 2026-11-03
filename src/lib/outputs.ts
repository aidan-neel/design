import type { Component } from 'svelte';

// Keys are absolute paths like /src/lib/outputs/<model>/<comparison-id>/<variant>.svelte
const modules = import.meta.glob<{ default: Component }>('/src/lib/outputs/*/*/*.svelte');

export function loadOutput(path: string | null) {
	return path ? (modules[path] ?? null) : null;
}
