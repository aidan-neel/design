<script lang="ts">
	import { Dialog } from 'bits-ui';
	import './dialog.css';

	type Doc = 'privacy' | 'terms' | 'security';

	let {
		open = $bindable(false),
		doc = $bindable('privacy'),
		onreturnfocus
	}: {
		open?: boolean;
		doc?: Doc;
		onreturnfocus: () => void;
	} = $props();

	const DOCS: Record<Doc, { title: string; updated: string; body: string[] }> = {
		privacy: {
			title: 'Privacy Policy',
			updated: 'Last updated 12 October 2026',
			body: [
				'Ledgerline Ltd collects only what the product needs to run: your name, your email, and the financial records you choose to sync from connected bank feeds. Records stay in an EU data centre in Frankfurt and are never sold or shared with advertisers.',
				'Bank connections are read-only and handled by TrueLayer under FCA regulation. We store access tokens, never your banking credentials, and disconnecting a feed deletes its cached data within 24 hours.',
				'You can export or permanently delete your workspace from Settings \u2192 Workspace at any time. Deletion completes within 30 days, apart from invoices already sent to clients, which we keep for UK tax-record requirements.'
			]
		},
		terms: {
			title: 'Terms of Service',
			updated: 'Last updated 12 October 2026',
			body: [
				'Ledgerline is bookkeeping software for independent studios. A subscription covers one workspace, unlimited invoices, and bank feeds for up to three accounts. Fees are billed monthly or annually and renew automatically until cancelled.',
				'You keep full ownership of your records. Summaries and set-aside calculations are guidance, not regulated tax or investment advice \u2014 check the figures with your accountant before filing.',
				'You can cancel at any time and access continues until the end of the paid period. Refunds within 14 days of the first payment are honoured as required under UK consumer law.'
			]
		},
		security: {
			title: 'Security at Ledgerline',
			updated: 'Most recent audit: August 2026',
			body: [
				'All traffic runs over TLS 1.3 and records are encrypted at rest with AES-256. Encryption keys rotate quarterly, and production access requires SSO with hardware-key two-factor authentication.',
				'Ledgerline completes a SOC 2 Type II audit every year and runs continuous vulnerability scanning. Audit reports are available under NDA from security@ledgerline.app.',
				'If you think you have found a security issue, email security@ledgerline.app. We triage every report within one working day.'
			]
		}
	};

	let current = $derived(DOCS[doc]);
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="ll-ovl" />
		<Dialog.Content
			class="ll-dlg"
			onCloseAutoFocus={(e) => {
				e.preventDefault();
				onreturnfocus();
			}}
		>
			<Dialog.Close class="ll-dlg-x" aria-label="Close">
				<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
					<path d="M6 6l12 12" /><path d="M18 6L6 18" />
				</svg>
			</Dialog.Close>
			<Dialog.Title class="ll-dlg-t">{current.title}</Dialog.Title>
			<p class="ll-doc-meta">{current.updated}</p>
			<div class="ll-doc-scroll" tabindex="-1">
				{#each current.body as para (para)}
					<p>{para}</p>
				{/each}
			</div>
			<button class="ll-ghost" onclick={() => (open = false)}>Close</button>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
