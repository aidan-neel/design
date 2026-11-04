<script lang="ts">
	let { size = 'md' }: { size?: 'md' | 'lg' } = $props();
</script>

<span class="logo" class:is-large={size === 'lg'}>
	<svg class="mark" viewBox="0 0 28 28" aria-hidden="true">
		<rect width="28" height="28" rx="8" fill="#0a0a0a" />
		<path
			d="M6 11.5c2.7 0 2.7-3 5.4-3s2.7 3 5.3 3 2.7-3 5.3-3M6 17c2.7 0 2.7 3 5.4 3s2.7-3 5.3-3 2.7 3 5.3 3"
			fill="none"
			stroke="#5eead4"
			stroke-width="1.8"
			stroke-linecap="round"
		/>
	</svg>
	<span class="word">ebb</span>
</span>

<style>
	.logo {
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}
	.mark {
		width: 24px;
		height: 24px;
	}
	.word {
		font-size: 19px;
		font-weight: 500;
		letter-spacing: -0.04em;
		line-height: 1;
		transform: translateY(-1px);
	}
	.is-large .mark {
		width: 32px;
		height: 32px;
	}
	.is-large .word {
		font-size: 24px;
	}
</style>
