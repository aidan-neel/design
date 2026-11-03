<script lang="ts" module>
	// Lucide-style outline paths on a 24px grid, drawn at a 1.5px stroke.
	const paths = {
		plus: ['M5 12h14', 'M12 5v14'],
		search: ['M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0', 'm21 21-4.3-4.3'],
		sidebar: ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 3v18'],
		chevronDown: ['m6 9 6 6 6-6'],
		share: ['M12 3v12', 'm7 8 5-5 5 5', 'M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4'],
		more: ['M12 12h.01', 'M19 12h.01', 'M5 12h.01'],
		copy: [
			'M8 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z',
			'M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2'
		],
		check: ['M20 6 9 17l-5-5'],
		retry: ['M21 12a9 9 0 0 1-15.5 6.2L3 16', 'M3 21v-5h5', 'M3 12a9 9 0 0 1 15.5-6.2L21 8', 'M21 3v5h-5'],
		thumbsUp: [
			'M7 10v12',
			'M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z'
		],
		thumbsDown: [
			'M17 14V2',
			'M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z'
		],
		paperclip: [
			'm21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48'
		],
		arrowUp: ['m5 12 7-7 7 7', 'M12 19V5'],
		sliders: ['M3 6h11', 'M18 6h3', 'M16 4v4', 'M3 12h3', 'M10 12h11', 'M8 10v4', 'M3 18h13', 'M20 18h1', 'M18 16v4'],
		file: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5'],
		globe: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', 'M3 12h18', 'M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18'],
		chart: ['M3 3v18h18', 'M7 15l4-4 3 3 5-6'],
		pen: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'],
		code: ['m16 18 6-6-6-6', 'm8 6-6 6 6 6']
	} as const;

	export type IconName = keyof typeof paths;
</script>

<script lang="ts">
	let { name, size = 16 }: { name: IconName; size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={name === 'more' ? 3 : 1.5}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#each paths[name] as d (d)}
		<path {d} />
	{/each}
</svg>
