<script lang="ts" module>
	// One hand-drawn set: 24px grid, 1.5 stroke, round joins.
	const PATHS = {
		plus: 'M12 5v14M5 12h14',
		compose: 'M11 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V13M17.4 4.1a1.9 1.9 0 0 1 2.7 2.7L12.7 14.2l-3.6.9.9-3.6z',
		search: 'M11 4.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM19.5 19.5l-3.9-3.9',
		sidebar: 'M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2zM9.5 4.5v15',
		chevronDown: 'M7.5 10l4.5 4.5 4.5-4.5',
		chevronUpDown: 'M8.5 9.5 12 6l3.5 3.5M8.5 14.5 12 18l3.5-3.5',
		chevronLeft: 'M14 7.5 9.5 12l4.5 4.5',
		chevronRight: 'M10 7.5l4.5 4.5-4.5 4.5',
		more: 'M6 12h.01M12 12h.01M18 12h.01',
		pin: 'M9 4.5h6M10 4.5v4.8L7 13h10l-3-3.7V4.5M12 13v6.5',
		unpin: 'M9 4.5h6M10 4.5v3M14 4.5v4.8l3 3.7h-4M7 13l2.5-3.1M12 13v6.5M4.5 4.5l15 15',
		pencil: 'M5 19l.9-3.7L15.7 5.5a1.9 1.9 0 0 1 2.8 2.7L8.7 18.1zM13.8 7.4l2.8 2.8',
		archive: 'M4.5 5h15v4h-15zM6 9v9a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 18V9M10 13h4',
		trash: 'M4.5 7h15M9.5 7V5h5v2M6.5 7l.8 11.1a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7M10.5 11v5M13.5 11v5',
		share: 'M12 14.5V4.5M8.5 8 12 4.5 15.5 8M5.5 12v6a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-6',
		copy: 'M9 9h9a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 18 20h-8a1.5 1.5 0 0 1-1.5-1.5v-8M15 9V6a1.5 1.5 0 0 0-1.5-1.5h-8A1.5 1.5 0 0 0 4 6v8a1.5 1.5 0 0 0 1.5 1.5H8.5',
		check: 'M5.5 12.5l4 4 9-9',
		retry: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v3.8h-3.8',
		thumbUp: 'M8 10.5v9M8 10.5l3.6-6a1.8 1.8 0 0 1 2.4 1.9l-.5 3h4.4a2 2 0 0 1 2 2.4l-1.2 6a2 2 0 0 1-2 1.7H8M8 10.5H5.5v9H8',
		thumbDown: 'M8 13.5v-9M8 13.5l3.6 6a1.8 1.8 0 0 0 2.4-1.9l-.5-3h4.4a2 2 0 0 0 2-2.4l-1.2-6a2 2 0 0 0-2-1.7H8M8 13.5H5.5v-9H8',
		paperclip: 'M19 11.5l-7.1 7.1a4.6 4.6 0 0 1-6.5-6.5l7.4-7.4a3 3 0 0 1 4.3 4.3l-7.4 7.4a1.5 1.5 0 0 1-2.1-2.1l6.7-6.7',
		image: 'M4.5 7a2.5 2.5 0 0 1 2.5-2.5h10A2.5 2.5 0 0 1 19.5 7v10a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 17zM4.5 15.5l4-4 4.5 4.5 2-2 4.5 4.5M15 9h.01',
		arrowUp: 'M12 18.5v-13M6.5 11 12 5.5l5.5 5.5',
		arrowDown: 'M12 5.5v13M6.5 13l5.5 5.5 5.5-5.5',
		x: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
		file: 'M13.5 4H8a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 8 20h8a1.5 1.5 0 0 0 1.5-1.5V8zM13.5 4v4h4',
		code: 'M8.5 8 4.5 12l4 4M15.5 8l4 4-4 4',
		sheet: 'M5 5.5h14v13H5zM5 10h14M5 14.5h14M10 5.5v13',
		globe: 'M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16zM4 12h16M12 4c2.1 2.2 3.2 4.9 3.2 8s-1.1 5.8-3.2 8c-2.1-2.2-3.2-4.9-3.2-8S9.9 6.2 12 4z',
		sliders: 'M4.5 7.5h8M16.5 7.5h3M4.5 16.5h3M11.5 16.5h8M14.5 5.5v4M9.5 14.5v4',
		download: 'M12 4.5v10M7.5 10.5 12 15l4.5-4.5M5 19.5h14',
		menu: 'M4.5 7h15M4.5 12h15M4.5 17h9',
		keyboard: 'M3.5 7.5A1.5 1.5 0 0 1 5 6h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 18H5a1.5 1.5 0 0 1-1.5-1.5zM7 9.5h.01M10.3 9.5h.01M13.7 9.5h.01M17 9.5h.01M8 14.5h8',
		mail: 'M4.5 6.5h15v11h-15zM5 7l7 5.5L19 7',
		calendar: 'M5 6.5h14v13H5zM5 10.5h14M9 4.5v4M15 4.5v4',
		lines: 'M5 7h14M5 12h14M5 17h8',
		stop: 'M8 8h8v8H8z'
	} as const;

	export type IconName = keyof typeof PATHS;

	// The ellipsis is three dots drawn as zero-length strokes, so it needs a heavier pen.
	const DOT_STROKE = 2.6;
	const STROKE = 1.5;
</script>

<script lang="ts">
	type Props = { name: IconName; size?: number; class?: string };
	let { name, size = 16, class: className = '' }: Props = $props();
</script>

<svg
	class={className}
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={name === 'stop' ? 'currentColor' : 'none'}
	stroke="currentColor"
	stroke-width={name === 'more' ? DOT_STROKE : STROKE}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path d={PATHS[name]} />
</svg>
