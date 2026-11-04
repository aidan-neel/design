<script lang="ts">
	export type IconName =
		| 'overview'
		| 'chart'
		| 'users'
		| 'tag'
		| 'bell'
		| 'search'
		| 'calendar'
		| 'download'
		| 'plus'
		| 'chev-down'
		| 'chev-right'
		| 'chev-updown'
		| 'arrow-up-right'
		| 'arrow-up'
		| 'dots'
		| 'x'
		| 'check'
		| 'copy'
		| 'archive'
		| 'pause'
		| 'play'
		| 'pencil'
		| 'undo'
		| 'sliders'
		| 'gear'
		| 'logout'
		| 'panel'
		| 'keyboard'
		| 'alert'
		| 'info'
		| 'receipt'
		| 'filter'
		| 'bars'
		| 'globe'
		| 'mail'
		| 'refresh'
		| 'spark';

	let {
		name,
		size = 16,
		stroke = 1.5,
		class: cls = ''
	}: { name: IconName; size?: number; stroke?: number; class?: string } = $props();

	const P: Record<IconName, string[]> = {
		overview: ['M3.5 3.5h7v7h-7z', 'M13.5 3.5h7v7h-7z', 'M3.5 13.5h7v7h-7z', 'M13.5 13.5h7v7h-7z'],
		chart: ['M3.5 4v16h17', 'M6.5 15.5l4-5 3.5 3 5-7'],
		users: [
			'M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20',
			'M9.5 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
			'M21 20v-1.5a4 4 0 0 0-3-3.87',
			'M15.5 4.7a3.5 3.5 0 0 1 0 6.6'
		],
		tag: ['M3.5 10.5V5A1.5 1.5 0 0 1 5 3.5h5.5L21 13.5 13.5 21 3.5 10.5Z', 'M7 7h.01'],
		bell: ['M18 16.5H6c1.2-1.5 1.5-3.6 1.5-6C7.5 6 9 3.5 12 3.5s4.5 2.5 4.5 7c0 2.4.3 4.5 1.5 6Z', 'M10.4 19.5a1.7 1.7 0 0 0 3.2 0'],
		search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z', 'M20.5 20.5 16.6 16.6'],
		calendar: ['M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-11Z', 'M4.5 10h15', 'M8.5 3.5v3', 'M15.5 3.5v3'],
		download: ['M12 3.5V15', 'M7.5 10.5 12 15l4.5-4.5', 'M4.5 20.5h15'],
		plus: ['M12 5.5v13', 'M5.5 12h13'],
		'chev-down': ['M6.5 9.5 12 15l5.5-5.5'],
		'chev-right': ['M9.5 6.5 15 12l-5.5 5.5'],
		'chev-updown': ['M8 9.5l4-4 4 4', 'M8 14.5l4 4 4-4'],
		'arrow-up-right': ['M6.5 17.5 17.5 6.5', 'M9.5 6.5h8v8'],
		'arrow-up': ['M12 19V5', 'M6.5 10.5 12 5l5.5 5.5'],
		dots: ['M12 5.49v.02', 'M12 11.99v.02', 'M12 18.49v.02'],
		x: ['M6 6l12 12', 'M18 6 6 18'],
		check: ['M5 12.5 10 17.5 19 7'],
		copy: ['M8.5 8.5h11v11h-11z', 'M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3'],
		archive: ['M3.5 4.5h17v4h-17z', 'M5.5 8.5v11h13v-11', 'M10 12.5h4'],
		pause: ['M9.5 5.5v13', 'M14.5 5.5v13'],
		play: ['M8 5.5l10 6.5-10 6.5v-13Z'],
		pencil: ['M13 5.5 18.5 11', 'M4.5 19.5V15L16 3.5 20.5 8 9 19.5H4.5Z'],
		undo: ['M4 9h9a5 5 0 0 1 0 10H8', 'M7.5 5.5 4 9l3.5 3.5'],
		sliders: ['M4 7.5h5', 'M13 7.5h7', 'M11 5v5', 'M4 16.5h9', 'M17 16.5h3', 'M15 14v5'],
		gear: [
			'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
			'M12 2.5v3',
			'M12 18.5v3',
			'M2.5 12h3',
			'M18.5 12h3',
			'M5.3 5.3l2.1 2.1',
			'M16.6 16.6l2.1 2.1',
			'M18.7 5.3l-2.1 2.1',
			'M7.4 16.6l-2.1 2.1'
		],
		logout: ['M14 4.5h4.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H14', 'M10 15.5 6.5 12 10 8.5', 'M6.5 12H16'],
		panel: ['M4.5 5.5h15v13h-15z', 'M9.5 5.5v13'],
		keyboard: ['M3.5 6.5h17v11h-17z', 'M6.5 10h.01', 'M9.5 10h.01', 'M12.5 10h.01', 'M15.5 10h.01', 'M8 14.5h8'],
		alert: ['M12 3.5 21 19.5H3L12 3.5Z', 'M12 10v4', 'M12 16.5h.01'],
		info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 11v5', 'M12 8h.01'],
		receipt: ['M6.5 3.5h11a2 2 0 0 1 2 2v15l-3-2-2 2-2-2-2 2-2-2-3 2v-15a2 2 0 0 1 2-2Z', 'M9.5 8.5h5', 'M9.5 12h5'],
		filter: ['M4.5 5.5h15', 'M7.5 12h9', 'M10.5 18.5h3'],
		bars: ['M4.5 20v-8', 'M10.5 20V5', 'M16.5 20v-5'],
		globe: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M3.5 12h17', 'M12 3.5c2.4 2.2 3.6 5.2 3.6 8.5s-1.2 6.3-3.6 8.5c-2.4-2.2-3.6-5.2-3.6-8.5s1.2-6.3 3.6-8.5Z'],
		mail: ['M3.5 6.5h17v11h-17z', 'M4 7.5l8 6 8-6'],
		refresh: ['M20 12a8 8 0 1 1-2.3-5.6', 'M20.5 3.5V8H16'],
		spark: ['M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3Z']
	};

	const d = $derived(P[name]);
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={name === 'dots' || name === 'info' || name === 'keyboard' || name === 'tag' || name === 'alert' ? 2.2 : stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	class={'shrink-0 ' + cls}
	aria-hidden="true"
>
	{#each d as line}
		<path d={line} />
	{/each}
</svg>
