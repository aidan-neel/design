<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import CopyButton from './CopyButton.svelte';
	import { findModel, MODELS, type AssistantMessage, type ModelId } from './data';
	import { formatTimestamp } from './format';
	import Icon from './Icon.svelte';
	import Markdown from './Markdown.svelte';
	import Tip from './Tip.svelte';
	import { toaster } from './toasts.svelte';

	type Props = {
		message: AssistantMessage;
		isLatest: boolean;
		showTimestamp: boolean;
		onregenerate: (model: ModelId) => void;
		onshowreply: (index: number) => void;
		onfeedback: (value: 'up' | 'down') => void;
	};
	let { message, isLatest, showTimestamp, onregenerate, onshowreply, onfeedback }: Props = $props();

	const reply = $derived(message.replies[message.replyIndex]);
	const model = $derived(findModel(reply.model));
	const isBusy = $derived(reply.status === 'thinking' || reply.status === 'streaming');

	function giveFeedback(value: 'up' | 'down') {
		const isNew = message.feedback !== value;
		onfeedback(value);
		if (isNew && value === 'down') toaster.show('Thanks. Halden uses this to improve replies.');
	}
</script>

<article class="message" class:latest={isLatest} aria-busy={isBusy}>
	{#if reply.status === 'thinking'}
		<p class="thinking" role="status">{reply.model === 'halden-4-pro' ? 'Reasoning' : 'Thinking'}</p>
	{:else if reply.text === ''}
		<p class="text-[15px] text-(--fg-secondary)">You stopped this reply before it started.</p>
	{:else}
		<Markdown source={reply.text} streaming={reply.status === 'streaming'} />
	{/if}

	{#if reply.status === 'stopped' && reply.text !== ''}
		<p class="mt-2 text-[13px] text-(--fg-secondary)">Stopped</p>
	{/if}

	{#if reply.sources.length > 0 && !isBusy}
		<ul class="sources" aria-label="Sources">
			{#each reply.sources as source (source.url)}
				<li>
					<a class="source" href={source.url} target="_blank" rel="noopener noreferrer">
						<span class="source-mark">{source.domain.charAt(0).toUpperCase()}</span>
						<span class="truncate">{source.title}</span>
						<span class="shrink-0 text-(--fg-tertiary)">{source.domain}</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	{#if !isBusy}
		<div class="actions">
			<CopyButton text={reply.text} label="Copy reply" />

			<DropdownMenu.Root>
				<Tip label="Regenerate">
					{#snippet children(props)}
						<DropdownMenu.Trigger {...props} class="icon-btn size-7!" aria-label="Regenerate reply">
							<Icon name="retry" size={15} />
						</DropdownMenu.Trigger>
					{/snippet}
				</Tip>
				<DropdownMenu.Portal to=".hd-app">
					<DropdownMenu.Content class="menu" side="bottom" align="start" sideOffset={6}>
						<DropdownMenu.Item class="menu-item" onSelect={() => onregenerate(reply.model)}>
							<Icon name="retry" />Try again
						</DropdownMenu.Item>
						<DropdownMenu.Separator class="menu-separator" />
						<DropdownMenu.Group>
							<DropdownMenu.GroupHeading class="menu-label">Try with another model</DropdownMenu.GroupHeading>
							{#each MODELS.filter((candidate) => candidate.id !== reply.model) as candidate (candidate.id)}
								<DropdownMenu.Item class="menu-item" onSelect={() => onregenerate(candidate.id)}>
									<span class="flex flex-col py-1.5 leading-tight">
										<span>{candidate.name}</span>
										<span class="text-[12px] text-(--fg-secondary)">{candidate.description}</span>
									</span>
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>

			<Tip label="Good reply" onclick={() => giveFeedback('up')}>
				{#snippet children(props)}
					<button
						{...props}
						type="button"
						class="icon-btn size-7!"
						class:pressed={message.feedback === 'up'}
						aria-label="Good reply"
						aria-pressed={message.feedback === 'up'}
					>
						<Icon name="thumbUp" size={15} />
					</button>
				{/snippet}
			</Tip>
			<Tip label="Bad reply" onclick={() => giveFeedback('down')}>
				{#snippet children(props)}
					<button
						{...props}
						type="button"
						class="icon-btn size-7!"
						class:pressed={message.feedback === 'down'}
						aria-label="Bad reply"
						aria-pressed={message.feedback === 'down'}
					>
						<Icon name="thumbDown" size={15} />
					</button>
				{/snippet}
			</Tip>

			{#if message.replies.length > 1}
				<div class="pager" aria-label="Reply versions">
					<button
						type="button"
						class="icon-btn size-6!"
						aria-label="Previous version"
						disabled={message.replyIndex === 0}
						onclick={() => onshowreply(message.replyIndex - 1)}
					>
						<Icon name="chevronLeft" size={14} />
					</button>
					<span class="tabular-nums">{message.replyIndex + 1} / {message.replies.length}</span>
					<button
						type="button"
						class="icon-btn size-6!"
						aria-label="Next version"
						disabled={message.replyIndex === message.replies.length - 1}
						onclick={() => onshowreply(message.replyIndex + 1)}
					>
						<Icon name="chevronRight" size={14} />
					</button>
				</div>
			{/if}

			<span class="meta">
				{model.name}{#if showTimestamp}<span aria-hidden="true"> · </span>{formatTimestamp(reply.createdAt)}{/if}
			</span>
		</div>
	{/if}
</article>

<style>
	.message {
		display: flex;
		flex-direction: column;
	}

	.thinking {
		width: fit-content;
		font-size: 15px;
		font-weight: 500;
		background: linear-gradient(90deg, var(--fg-tertiary) 0%, var(--fg) 45%, var(--fg-tertiary) 90%);
		background-size: 200% 100%;
		background-clip: text;
		color: transparent;
		animation: shimmer 1.6s linear infinite;
	}

	@keyframes shimmer {
		from {
			background-position: 100% 0;
		}
		to {
			background-position: -100% 0;
		}
	}

	.sources {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 14px;
	}

	.source {
		display: flex;
		align-items: center;
		gap: 8px;
		max-width: 300px;
		height: 30px;
		padding: 0 10px 0 6px;
		border-radius: 999px;
		background: var(--bg);
		box-shadow: var(--shadow-btn);
		color: var(--fg);
		font-size: 13px;
		transition: background-color 120ms var(--ease-out);
	}

	@media (hover: hover) {
		.source:hover {
			background: var(--bg-subtle);
		}
	}

	.source-mark {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--bg-muted);
		color: var(--fg-secondary);
		font-size: 10px;
		font-weight: 600;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 2px;
		margin: 10px 0 0 -6px;
		opacity: 0;
		transition: opacity 150ms var(--ease-out);
	}

	.latest .actions,
	.message:hover .actions,
	.actions:focus-within,
	.actions:has([data-state='open']) {
		opacity: 1;
	}

	@media (hover: none) {
		.actions {
			opacity: 1;
		}
	}

	.pressed {
		color: var(--fg);
		background: var(--bg-hover);
	}

	.pager {
		display: flex;
		align-items: center;
		gap: 2px;
		margin-left: 4px;
		color: var(--fg-secondary);
		font-size: 12px;
		font-weight: 500;
	}

	.meta {
		margin-left: 8px;
		overflow: hidden;
		color: var(--fg-secondary);
		font-size: 12px;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	@media (prefers-reduced-motion: reduce) {
		.thinking {
			animation: none;
			color: var(--fg-secondary);
		}
	}
</style>
