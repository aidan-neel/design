<!--
	Error line under a field. Height, opacity and position animate together, so the form below
	slides instead of jumping, and the last message stays readable while it animates out.
-->
<script lang="ts">
	import './kit.css';
	type Props = { message: string | null; id?: string };

	let { message, id }: Props = $props();

	let lastMessage = $state('');
	$effect(() => {
		if (message) lastMessage = message;
	});
</script>

<div class="kit-field-error" data-visible={message ? '' : undefined}>
	<div>
		<p {id} aria-live="polite">
			{#if lastMessage}
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<circle cx="12" cy="12" r="9" />
					<path d="M12 8v4.5M12 16h.01" />
				</svg>
			{/if}
			<span>{lastMessage}</span>
		</p>
	</div>
</div>
