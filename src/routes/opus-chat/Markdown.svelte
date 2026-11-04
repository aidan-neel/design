<script lang="ts">
	import CopyButton from './CopyButton.svelte';
	import { parseMarkdown, type Inline } from './markdown';

	type Props = { source: string; streaming?: boolean };
	let { source, streaming = false }: Props = $props();

	const blocks = $derived(parseMarkdown(source));
</script>

{#snippet inlines(parts: Inline[])}
	{#each parts as part, index (index)}
		{#if part.kind === 'bold'}<strong>{part.value}</strong>{:else if part.kind === 'code'}<code class="inline-code"
				>{part.value}</code
			>{:else}{part.value}{/if}
	{/each}
{/snippet}

<div class="prose" class:streaming>
	{#each blocks as block, index (index)}
		{#if block.kind === 'heading'}
			<h3>{@render inlines(block.inlines)}</h3>
		{:else if block.kind === 'paragraph'}
			<p>
				{#each block.lines as line, lineIndex (lineIndex)}
					{#if lineIndex > 0}<br />{/if}{@render inlines(line)}
				{/each}
			</p>
		{:else if block.kind === 'list'}
			<svelte:element this={block.ordered ? 'ol' : 'ul'}>
				{#each block.items as item, itemIndex (itemIndex)}
					<li>{@render inlines(item)}</li>
				{/each}
			</svelte:element>
		{:else}
			<figure class="code-block">
				<figcaption>
					<span>{block.language || 'code'}</span>
					<CopyButton text={block.code} label="Copy code" />
				</figcaption>
				<pre><code>{block.code}</code></pre>
			</figure>
		{/if}
	{/each}
</div>

<style>
	.prose {
		color: var(--fg);
		font-size: 15px;
		line-height: 1.65;
		overflow-wrap: anywhere;
	}

	.prose > :global(* + *) {
		margin-top: 12px;
	}

	h3 {
		margin-top: 20px;
		font-size: 15px;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	strong {
		font-weight: 600;
	}

	ul,
	ol {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-left: 22px;
	}

	ul {
		list-style: disc;
	}

	ol {
		list-style: decimal;
	}

	li::marker {
		color: var(--fg-tertiary);
	}

	.inline-code {
		padding: 1px 5px;
		border-radius: 6px;
		background: var(--bg-muted);
		font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
		font-size: 0.86em;
	}

	.code-block {
		overflow: hidden;
		border-radius: 12px;
		background: #fafafa;
		box-shadow: 0 0 0 1px var(--border);
	}

	figcaption {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 36px;
		padding: 0 4px 0 14px;
		border-bottom: 1px solid var(--border);
		color: var(--fg-secondary);
		font-size: 12px;
		font-weight: 500;
	}

	pre {
		overflow-x: auto;
		padding: 14px;
		font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
		font-size: 13px;
		line-height: 1.6;
		tab-size: 2;
	}

	/* The streaming caret rides on the last text block. */
	.streaming > p:last-child::after,
	.streaming > h3:last-child::after,
	.streaming > ul:last-child > li:last-child::after,
	.streaming > ol:last-child > li:last-child::after {
		content: '';
		display: inline-block;
		width: 8px;
		height: 8px;
		margin-left: 4px;
		border-radius: 50%;
		background: var(--fg);
		vertical-align: middle;
		animation: caret-pulse 1s ease-in-out infinite;
	}

	@keyframes caret-pulse {
		50% {
			opacity: 0.25;
			transform: scale(0.8);
		}
	}
</style>
