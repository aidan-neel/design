<script lang="ts">
	let { name, size = 16 }: { name: string; size?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.8"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if name === 'mail'}
		<rect x="3" y="5" width="18" height="14" rx="2.5" />
		<path d="m3.5 7.5 8.5 5.5 8.5-5.5" />
	{:else if name === 'lock'}
		<rect x="5" y="11" width="14" height="9.5" rx="2.5" />
		<path d="M8.5 11V7.5a3.5 3.5 0 0 1 7 0V11" />
	{:else if name === 'eye'}
		<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" />
		<circle cx="12" cy="12" r="2.8" />
	{:else if name === 'eye-off'}
		<path d="M17.94 17.24A10.3 10.3 0 0 1 12 18.9c-6.5 0-10-6.9-10-6.9a18.6 18.6 0 0 1 5.06-5.6" />
		<path d="M9.9 5.2A9.6 9.6 0 0 1 12 5.1c6.5 0 10 6.9 10 6.9a18.7 18.7 0 0 1-2.16 3.1" />
		<path d="M14.12 13.62a2.9 2.9 0 1 1-4.1-4.1" />
		<path d="M3 3l18 18" />
	{:else if name === 'user'}
		<path d="M20 21v-1.2c0-2.6-3.4-4.6-8-4.6s-8 2-8 4.6V21" />
		<circle cx="12" cy="8" r="4" />
	{:else if name === 'alert'}
		<circle cx="12" cy="12" r="9" />
		<path d="M12 7.8v4.8" />
		<path d="M12 15.9h.01" />
	{:else if name === 'check'}
		<path d="M4.5 12.6l4.6 4.6L19.5 6.9" />
	{:else if name === 'x'}
		<path d="M6 6l12 12" />
		<path d="M18 6L6 18" />
	{:else if name === 'arrow-right'}
		<path d="M4.5 12h15" />
		<path d="m13.5 6 6 6-6 6" />
	{:else if name === 'arrow-left'}
		<path d="M19.5 12h-15" />
		<path d="m10.5 6-6 6 6 6" />
	{:else if name === 'shield'}
		<path d="M12 3l7 2.7v5.5c0 4.3-2.9 7.3-7 8.8-4.1-1.5-7-4.5-7-8.8V5.7z" />
		<path d="M9.2 11.7l2 2 3.6-3.8" />
	{:else if name === 'building'}
		<rect x="4.5" y="3.5" width="15" height="17" rx="2" />
		<path d="M9 7.5h1.6M13.4 7.5H15M9 11h1.6M13.4 11H15" />
		<path d="M9.5 20.5v-3.5h5v3.5" />
	{:else if name === 'refresh'}
		<path d="M21 4v5h-5" />
		<path d="M20.5 13a8.5 8.5 0 1 1-2-8.7L21 7" />
	{/if}
</svg>
