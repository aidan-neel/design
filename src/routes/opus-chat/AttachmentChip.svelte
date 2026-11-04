<script lang="ts">
	import type { Attachment, AttachmentKind } from './data';
	import { formatBytes } from './format';
	import Icon, { type IconName } from './Icon.svelte';
	import Tip from './Tip.svelte';

	type Props = {
		attachment: Attachment;
		/** 0–100 while the upload runs; omit once it is done. */
		progress?: number;
		onremove?: () => void;
	};
	let { attachment, progress, onremove }: Props = $props();

	const KIND_ICONS: Record<AttachmentKind, IconName> = {
		image: 'image',
		pdf: 'file',
		code: 'code',
		sheet: 'sheet',
		doc: 'lines'
	};

	const KIND_LABELS: Record<AttachmentKind, string> = {
		image: 'Image',
		pdf: 'PDF',
		code: 'Code',
		sheet: 'Spreadsheet',
		doc: 'Document'
	};

	const isUploading = $derived(progress !== undefined && progress < 100);
</script>

<div class="chip" title={attachment.name}>
	{#if attachment.previewUrl}
		<img class="thumb" src={attachment.previewUrl} alt="" />
	{:else}
		<span class="thumb thumb-icon" data-kind={attachment.kind}><Icon name={KIND_ICONS[attachment.kind]} size={16} /></span>
	{/if}
	<span class="min-w-0 leading-tight">
		<span class="block truncate text-[13px] font-medium text-(--fg)">{attachment.name}</span>
		<span class="block truncate text-[12px] text-(--fg-secondary) tabular-nums">
			{isUploading ? `Uploading ${Math.round(progress ?? 0)}%` : `${KIND_LABELS[attachment.kind]} · ${formatBytes(attachment.size)}`}
		</span>
	</span>
	{#if onremove}
		<Tip label="Remove" onclick={onremove}>
			{#snippet children(props)}
				<button {...props} type="button" class="remove" aria-label={`Remove ${attachment.name}`}>
					<Icon name="x" size={12} />
				</button>
			{/snippet}
		</Tip>
	{/if}
	{#if isUploading}
		<span class="progress" style:transform={`scaleX(${(progress ?? 0) / 100})`}></span>
	{/if}
</div>

<style>
	.chip {
		position: relative;
		display: flex;
		align-items: center;
		gap: 10px;
		width: 220px;
		max-width: 100%;
		height: 52px;
		padding: 0 10px 0 8px;
		overflow: hidden;
		border-radius: 12px;
		background: var(--bg);
		box-shadow: var(--shadow-btn);
	}

	.thumb {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		border-radius: 8px;
		object-fit: cover;
		outline: 1px solid rgb(0 0 0 / 0.06);
		outline-offset: -1px;
	}

	.thumb-icon {
		display: grid;
		place-items: center;
		background: var(--bg-muted);
		color: var(--fg-secondary);
		outline: none;
	}

	.thumb-icon[data-kind='pdf'] {
		background: #fef2f2;
		color: #b91c1c;
	}

	.thumb-icon[data-kind='code'] {
		background: #eef4ff;
		color: #1d4ed8;
	}

	.thumb-icon[data-kind='sheet'] {
		background: #ecfdf3;
		color: #15803d;
	}

	.remove {
		position: absolute;
		top: 4px;
		right: 4px;
		display: grid;
		place-items: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--fg);
		color: #ffffff;
		opacity: 0;
		transition:
			opacity 120ms var(--ease-out),
			transform 150ms var(--ease-out);
	}

	.remove:active {
		transform: scale(0.9);
	}

	.chip:hover .remove,
	.remove:focus-visible {
		opacity: 1;
	}

	@media (hover: none) {
		.remove {
			opacity: 1;
		}
	}

	.progress {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 2px;
		background: var(--accent);
		transform-origin: left;
		transition: transform 120ms linear;
	}
</style>
