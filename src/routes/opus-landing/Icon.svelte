<script lang="ts" module>
	/** Hand-drawn 24px stroke icons, 1.5 stroke, so the page doesn't lean on a stock set. */
	const PATHS = {
		menu: 'M4 8h16M4 16h16',
		x: 'M6 6l12 12M18 6L6 18',
		'arrow-right': 'M5 12h14M13 6l6 6-6 6',
		'arrow-down': 'M12 5v14M6 13l6 6 6-6',
		'arrow-up': 'M12 19V5M6 11l6-6 6 6',
		check: 'M5 12.5l4.5 4.5L19 7.5',
		copy: 'M9 9h10v10H9zM5 15V5h10',
		'chevron-down': 'M6 9l6 6 6-6',
		'chevron-right': 'M9 6l6 6-6 6',
		search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
		car: 'M5.5 16H4v-3.5l1.5-1L8 7h8l2.5 4.5 1.5 1V16h-1.5M9.5 16h5M5.5 11.5h13M7.5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM16.5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
		dish: 'M5 4h14v16H5zM5 8h14M8 6h.01M11 6h.01M9 14a3 3 0 1 0 6 0 3 3 0 0 0-6 0',
		washer: 'M5 3h14v18H5zM5 7h14M12 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 5h.01',
		heat: 'M10 13.5V5a2 2 0 1 1 4 0v8.5a4 4 0 1 1-4 0zM12 9v7.5',
		clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
		plus: 'M12 5v14M5 12h14',
		minus: 'M5 12h14',
		alert: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v5M12 16h.01',
		refresh: 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4',
		globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.5 5.6 3.5 9s-1 6.4-3.5 9M12 3c-2.5 2.6-3.5 5.6-3.5 9s1 6.4 3.5 9',
		grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01'
	} as const;

	export type IconName = keyof typeof PATHS;
</script>

<script lang="ts">
	let { name, size = 16, class: className = '' }: { name: IconName; size?: number; class?: string } =
		$props();
</script>

<svg
	class={className}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path d={PATHS[name]} />
</svg>
