<script lang="ts">
	import { tick } from 'svelte';
	import AssistantMessage from './AssistantMessage.svelte';
	import type { ChatStore } from './chat.svelte';
	import Composer from './Composer.svelte';
	import Icon, { type IconName } from './Icon.svelte';
	import LogoMark from './LogoMark.svelte';
	import { rise } from './motion';
	import UserMessage from './UserMessage.svelte';

	type Props = { store: ChatStore; enterToSend: boolean; showTimestamps: boolean };
	let { store, enterToSend, showTimestamps }: Props = $props();

	const PIN_THRESHOLD_PX = 96;

	const SUGGESTIONS: readonly { icon: IconName; prompt: string }[] = [
		{ icon: 'mail', prompt: 'Draft a refund reply to a customer' },
		{ icon: 'code', prompt: 'Find out why this SQL query is slow' },
		{ icon: 'calendar', prompt: 'Plan a 3-day team offsite in Lisbon' },
		{ icon: 'lines', prompt: 'Summarize a document into five key points' }
	];

	let composer = $state<Composer>();
	let scroller = $state<HTMLElement>();
	let isPinnedToBottom = $state(true);
	let isDraggingFiles = $state(false);
	let dragDepth = 0;

	const conversation = $derived(store.active);
	const lastMessage = $derived(conversation?.messages.at(-1));
	const streamingLength = $derived(
		lastMessage?.role === 'assistant' ? (lastMessage.replies[lastMessage.replyIndex]?.text.length ?? 0) : 0
	);

	export function focusComposer() {
		composer?.focus();
	}

	// Jump to the end when switching chats.
	$effect(() => {
		void conversation?.id;
		isPinnedToBottom = true;
		tick().then(() => scrollToBottom('instant'));
	});

	// Follow new messages and streamed text, unless the reader scrolled up.
	$effect(() => {
		void conversation?.messages.length;
		void streamingLength;
		if (isPinnedToBottom) tick().then(() => scrollToBottom('instant'));
	});

	function scrollToBottom(behavior: ScrollBehavior) {
		scroller?.scrollTo({ top: scroller.scrollHeight, behavior });
	}

	function handleScroll() {
		if (!scroller) return;
		const distance = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;
		isPinnedToBottom = distance < PIN_THRESHOLD_PX;
	}

	function jumpToLatest() {
		isPinnedToBottom = true;
		scrollToBottom('smooth');
	}

	function hasFiles(event: DragEvent): boolean {
		return event.dataTransfer?.types.includes('Files') ?? false;
	}

	function handleDragEnter(event: DragEvent) {
		if (!hasFiles(event)) return;
		event.preventDefault();
		dragDepth += 1;
		isDraggingFiles = true;
	}

	function handleDragLeave(event: DragEvent) {
		if (!hasFiles(event)) return;
		dragDepth -= 1;
		if (dragDepth <= 0) isDraggingFiles = false;
	}

	function handleDrop(event: DragEvent) {
		if (!hasFiles(event)) return;
		event.preventDefault();
		dragDepth = 0;
		isDraggingFiles = false;
		if (event.dataTransfer?.files) composer?.addFiles(event.dataTransfer.files);
	}
</script>

<div
	class="thread"
	role="region"
	aria-label="Conversation"
	ondragenter={handleDragEnter}
	ondragover={(event) => hasFiles(event) && event.preventDefault()}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	{#if conversation}
		<div class="scroller" bind:this={scroller} onscroll={handleScroll}>
			{#key conversation.id}
				<ol class="column messages" aria-live="polite" aria-relevant="additions">
					{#each conversation.messages as message, index (message.id)}
						<li in:rise>
							{#if message.role === 'user'}
								<UserMessage
									{message}
									showTimestamp={showTimestamps}
									onresend={(text) => store.editAndResend(conversation.id, message.id, text)}
								/>
							{:else}
								<AssistantMessage
									{message}
									isLatest={index === conversation.messages.length - 1}
									showTimestamp={showTimestamps}
									onregenerate={(model) => store.regenerate(conversation.id, message.id, model)}
									onshowreply={(replyIndex) => store.showReply(conversation.id, message.id, replyIndex)}
									onfeedback={(value) => store.toggleFeedback(conversation.id, message.id, value)}
								/>
							{/if}
						</li>
					{/each}
				</ol>
			{/key}
		</div>

		<div class="dock">
			<div class="column relative">
				{#if !isPinnedToBottom}
					<button type="button" class="jump" aria-label="Jump to latest message" onclick={jumpToLatest} transition:rise={{ distance: 4 }}>
						<Icon name="arrowDown" size={16} />
					</button>
				{/if}
				<Composer bind:this={composer} {store} {enterToSend} placeholder="Reply to Halden" />
				<p class="disclaimer">Halden can make mistakes. Check important details.</p>
			</div>
		</div>
	{:else}
		<div class="empty">
			<div class="column">
				<div class="reveal mb-7 flex flex-col items-center gap-4 text-center" style="--i: 0">
					<LogoMark />
					<h1 class="text-[26px] font-semibold tracking-[-0.025em] text-(--fg) max-sm:text-[22px]">What are we working on?</h1>
				</div>
				<div class="reveal" style="--i: 1">
					<Composer bind:this={composer} {store} {enterToSend} placeholder="Ask Halden anything" />
				</div>
				<ul class="reveal suggestions" style="--i: 2" aria-label="Suggestions">
					{#each SUGGESTIONS as suggestion (suggestion.prompt)}
						<li>
							<button type="button" class="suggestion" onclick={() => composer?.fill(suggestion.prompt)}>
								<Icon name={suggestion.icon} size={16} class="shrink-0 text-(--fg-tertiary)" />
								<span class="truncate">{suggestion.prompt}</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}

	{#if isDraggingFiles}
		<div class="drop" aria-hidden="true">
			<div class="drop-card">
				<Icon name="paperclip" size={20} />
				<p class="font-medium text-(--fg)">Drop files to attach</p>
				<p class="text-[13px] text-(--fg-secondary)">Up to 5 files, 20 MB each</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.thread {
		position: relative;
		display: flex;
		flex: 1;
		flex-direction: column;
		min-height: 0;
	}

	.scroller {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
	}

	.column {
		width: 100%;
		max-width: 736px;
		margin: 0 auto;
		padding: 0 24px;
	}

	.messages {
		display: flex;
		flex-direction: column;
		gap: 32px;
		padding-top: 16px;
		padding-bottom: 32px;
	}

	.dock {
		position: relative;
		flex-shrink: 0;
		padding-bottom: 8px;
	}

	/* Fade the thread into the composer instead of a hard edge. */
	.dock::before {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 100%;
		height: 24px;
		background: linear-gradient(to bottom, rgb(255 255 255 / 0), var(--bg));
		pointer-events: none;
	}

	.disclaimer {
		padding: 8px 0 0;
		color: var(--fg-secondary);
		font-size: 12px;
		text-align: center;
	}

	.jump {
		position: absolute;
		left: 50%;
		bottom: calc(100% + 12px);
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		margin-left: -17px;
		border-radius: 50%;
		background: var(--bg);
		box-shadow: var(--shadow-pop);
		color: var(--fg);
		transition: transform 150ms var(--ease-out);
	}

	.jump:active {
		transform: scale(0.94);
	}

	.empty {
		display: flex;
		flex: 1;
		align-items: center;
		padding-bottom: 8vh;
		overflow-y: auto;
	}

	.suggestions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 4px 8px;
		margin-top: 16px;
	}

	.suggestion {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		height: 40px;
		padding: 0 12px;
		border-radius: 10px;
		color: var(--fg-secondary);
		font-size: 14px;
		text-align: start;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	@media (hover: hover) {
		.suggestion:hover {
			background: var(--bg-hover);
			color: var(--fg);
		}
	}

	.drop {
		position: absolute;
		inset: 8px;
		z-index: 20;
		display: grid;
		place-items: center;
		border-radius: 14px;
		background: rgb(255 255 255 / 0.86);
		box-shadow: inset 0 0 0 2px var(--accent);
		animation: hd-fade-in 150ms var(--ease-out);
	}

	.drop-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		color: var(--accent);
		text-align: center;
	}

	@media (max-width: 767px) {
		.column {
			padding: 0 16px;
		}

		.suggestions {
			grid-template-columns: minmax(0, 1fr);
		}

		.suggestion {
			height: 44px;
		}
	}
</style>
