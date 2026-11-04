<script lang="ts">
	let {
		values,
		positive = true,
		width = 92,
		height = 32
	}: { values: number[]; positive?: boolean; width?: number; height?: number } = $props();

	const points = $derived.by(() => {
		if (!values.length) return [] as [number, number][];
		const min = Math.min(...values);
		const max = Math.max(...values);
		const span = max - min || 1;
		const pad = 3;
		return values.map((v, i) => {
			const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * width;
			const y = height - pad - ((v - min) / span) * (height - pad * 2);
			return [Math.round(x * 10) / 10, Math.round(y * 10) / 10] as [number, number];
		});
	});

	const line = $derived(
		points.map(([x, y], i) => (i === 0 ? `M${x} ${y}` : `L${x} ${y}`)).join(' ')
	);
	const area = $derived(
		points.length ? `${line} L${width} ${height} L0 ${height} Z` : ''
	);
	const last = $derived(points[points.length - 1]);
</script>

<svg
	{width}
	{height}
	viewBox="0 0 {width} {height}"
	preserveAspectRatio="none"
	class="spark"
	class:positive
	aria-hidden="true"
>
	{#if points.length > 1}
		<path d={area} class="area" />
		<path d={line} class="stroke" />
		{#if last}
			<circle cx={last[0]} cy={last[1]} r="2" class="dot" />
		{/if}
	{/if}
</svg>

<style>
	.spark {
		display: block;
		overflow: visible;
	}
	.stroke {
		fill: none;
		stroke: #c7c7c7;
		stroke-width: 1.5;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.area {
		fill: #f2f2f2;
		opacity: 0.7;
	}
	.dot {
		fill: #a3a3a3;
		stroke: #fff;
		stroke-width: 1.5;
	}
	.positive .stroke {
		stroke: #16a34a;
	}
	.positive .area {
		fill: #ecfdf3;
	}
	.positive .dot {
		fill: #16a34a;
	}
	.spark:not(.positive) .stroke {
		stroke: #dc2626;
	}
	.spark:not(.positive) .area {
		fill: #fef2f2;
	}
	.spark:not(.positive) .dot {
		fill: #dc2626;
	}
</style>
