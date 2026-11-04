<script lang="ts">
	type Props = { size?: number };
	let { size = 40 }: Props = $props();
</script>

<!-- Halden's mark: a sun resting on a ridge line. -->
<svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" class="mark">
	<defs>
		<linearGradient id="halden-mark-fill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="40">
			<stop offset="0" stop-color="#4a74e8" />
			<stop offset="1" stop-color="#2f5bd3" />
		</linearGradient>
	</defs>
	<rect width="40" height="40" rx="12" fill="url(#halden-mark-fill)" />
	<circle cx="20" cy="22" r="6" fill="#ffffff" />
	<path d="M7 27.5c4-3 9-4.5 13-4.5s9 1.5 13 4.5V34H7z" fill="url(#halden-mark-fill)" />
	<path d="M8 27.5c4-3 8-4.5 12-4.5s8 1.5 12 4.5" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
</svg>

<style>
	.mark {
		flex-shrink: 0;
		border-radius: 12px;
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.25),
			0 1px 2px rgb(0 0 0 / 0.12),
			0 0 0 1px rgb(30 60 160 / 0.4);
	}
</style>
