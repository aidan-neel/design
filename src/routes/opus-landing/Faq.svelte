<script lang="ts">
	import { Accordion } from 'bits-ui';
	import CopyEmail from './CopyEmail.svelte';
	import { FAQS } from './data';
	import Icon from './Icon.svelte';

	let openId = $state(FAQS[0].id);
</script>

<section class="section" id="ebb-faq" tabindex="-1" aria-labelledby="faq-title">
	<div class="container grid">
		<div>
			<h2 class="h2" id="faq-title">Questions before you plug it in</h2>
			<p class="lede">Something else on your mind? We answer email within a working day.</p>
			<div class="contact">
				<CopyEmail />
			</div>
		</div>

		<Accordion.Root type="single" bind:value={openId} class="faq">
			{#each FAQS as faq (faq.id)}
				<Accordion.Item value={faq.id} class="faq-item">
					<Accordion.Header level={3} class="faq-header">
						<Accordion.Trigger class="faq-trigger">
							{faq.question}
							<span class="faq-icon" aria-hidden="true"><Icon name="plus" size={16} /></span>
						</Accordion.Trigger>
					</Accordion.Header>
					<Accordion.Content class="faq-content">
						<p>{faq.answer}</p>
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</div>
</section>

<style>
	.grid {
		display: grid;
		gap: 40px;
	}
	@media (min-width: 1024px) {
		.grid {
			grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
			gap: 64px;
		}
	}
	.contact {
		margin-top: 20px;
	}

	:global(.ebb .faq) {
		border-top: 1px solid var(--border);
	}
	:global(.ebb .faq-item) {
		border-bottom: 1px solid var(--border);
	}
	:global(.ebb .faq-header) {
		margin: 0;
	}
	:global(.ebb .faq-trigger) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		width: 100%;
		min-height: 64px;
		padding: 16px 0;
		border: 0;
		background: transparent;
		color: var(--fg);
		font: 500 17px/1.35 var(--font);
		letter-spacing: -0.01em;
		text-align: start;
	}
	:global(.ebb .faq-trigger:focus-visible) {
		outline-offset: -2px;
		border-radius: 8px;
	}
	.faq-icon {
		display: grid;
		flex-shrink: 0;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 8px;
		background: linear-gradient(#fff, #f7f7f7);
		box-shadow: var(--shadow-btn);
		color: var(--fg-2);
		transition: transform 250ms var(--ease-out);
	}
	:global(.ebb .faq-trigger[data-state='open']) .faq-icon {
		transform: rotate(45deg);
		color: var(--fg);
	}
	:global(.ebb .faq-content) {
		overflow: hidden;
	}
	:global(.ebb .faq-content[data-state='open']) {
		animation: faq-down 250ms var(--ease-out);
	}
	:global(.ebb .faq-content[data-state='closed']) {
		animation: faq-up 180ms var(--ease-out);
	}
	:global(.ebb .faq-content) p {
		max-width: 600px;
		margin: 0;
		padding: 0 48px 24px 0;
		color: var(--fg-2);
		font-size: 15px;
		line-height: 1.6;
	}
	@keyframes faq-down {
		from {
			height: 0;
			opacity: 0;
		}
		to {
			height: var(--bits-accordion-content-height);
			opacity: 1;
		}
	}
	@keyframes faq-up {
		from {
			height: var(--bits-accordion-content-height);
			opacity: 1;
		}
		to {
			height: 0;
			opacity: 0;
		}
	}
</style>
