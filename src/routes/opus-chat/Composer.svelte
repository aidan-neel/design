<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { onDestroy, tick } from 'svelte';
	import AttachmentChip from './AttachmentChip.svelte';
	import { createId, type ChatStore } from './chat.svelte';
	import { findModel, MODELS, type Attachment } from './data';
	import { attachmentKind, formatBytes } from './format';
	import Icon from './Icon.svelte';
	import { popIcon, rise, shrinkOut } from './motion';
	import Tip from './Tip.svelte';
	import { toaster } from './toasts.svelte';

	type Props = { store: ChatStore; enterToSend: boolean; placeholder: string };
	let { store, enterToSend, placeholder }: Props = $props();

	type PendingFile = { attachment: Attachment; progress: number };

	const MAX_FILES = 5;
	const MAX_FILE_BYTES = 20_000_000;
	const MAX_CHARACTERS = 4000;
	const COUNTER_FROM = 3600;
	const MAX_TEXTAREA_PX = 240;
	const UPLOAD_TICK_MS = 60;

	let text = $state('');
	let pending = $state<PendingFile[]>([]);
	let textarea = $state<HTMLTextAreaElement>();
	let fileInput = $state<HTMLInputElement>();
	let photoInput = $state<HTMLInputElement>();
	const uploadTimers = new Map<string, ReturnType<typeof setInterval>>();

	const isUploading = $derived(pending.some((file) => file.progress < 100));
	const isOverLimit = $derived(text.length > MAX_CHARACTERS);
	const hasContent = $derived(text.trim() !== '' || pending.length > 0);
	const canSend = $derived(hasContent && !isUploading && !isOverLimit);
	const sendHint = $derived(
		isUploading ? 'Wait for uploads to finish' : isOverLimit ? `Shorten to ${MAX_CHARACTERS.toLocaleString()} characters` : 'Send'
	);

	export function focus() {
		textarea?.focus();
	}

	export async function fill(prompt: string) {
		text = prompt;
		await tick();
		resize();
		textarea?.focus();
		textarea?.setSelectionRange(prompt.length, prompt.length);
	}

	export function addFiles(files: Iterable<File>) {
		for (const file of files) {
			if (pending.length >= MAX_FILES) {
				toaster.show(`You can attach up to ${MAX_FILES} files per message.`, { tone: 'error' });
				return;
			}
			if (file.size > MAX_FILE_BYTES) {
				toaster.show(`${file.name} is ${formatBytes(file.size)}. Attach files under ${formatBytes(MAX_FILE_BYTES)}.`, {
					tone: 'error'
				});
				continue;
			}
			startUpload(file);
		}
	}

	function startUpload(file: File) {
		const kind = attachmentKind(file);
		const attachment: Attachment = {
			id: createId('file'),
			name: file.name,
			size: file.size,
			kind,
			previewUrl: kind === 'image' ? URL.createObjectURL(file) : undefined
		};
		pending.push({ attachment, progress: 0 });

		// No backend: fake an upload whose speed depends on file size.
		const step = Math.max(4, 40 - file.size / 250_000);
		const timer = setInterval(() => {
			const entry = pending.find((candidate) => candidate.attachment.id === attachment.id);
			if (!entry) return stopUpload(attachment.id);
			entry.progress = Math.min(100, entry.progress + step);
			if (entry.progress === 100) stopUpload(attachment.id);
		}, UPLOAD_TICK_MS);
		uploadTimers.set(attachment.id, timer);
	}

	function stopUpload(id: string) {
		clearInterval(uploadTimers.get(id));
		uploadTimers.delete(id);
	}

	function removeFile(id: string) {
		stopUpload(id);
		const entry = pending.find((candidate) => candidate.attachment.id === id);
		if (entry?.attachment.previewUrl) URL.revokeObjectURL(entry.attachment.previewUrl);
		pending = pending.filter((candidate) => candidate.attachment.id !== id);
	}

	function send() {
		if (!canSend) return;
		store.send(text.trim(), pending.map((file) => $state.snapshot(file.attachment)));
		text = '';
		pending = [];
		tick().then(resize);
	}

	function resize() {
		if (!textarea) return;
		textarea.style.height = 'auto';
		textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_PX)}px`;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && store.isStreaming) {
			event.preventDefault();
			store.stop();
			return;
		}
		if (event.key !== 'Enter' || event.isComposing) return;

		const wantsSend = enterToSend ? !event.shiftKey : event.metaKey || event.ctrlKey;
		if (!wantsSend) return;
		event.preventDefault();
		if (!store.isStreaming) send();
	}

	function handlePaste(event: ClipboardEvent) {
		const files = event.clipboardData?.files;
		if (!files || files.length === 0) return;
		event.preventDefault();
		addFiles(files);
	}

	function handlePicked(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		if (input.files) addFiles(input.files);
		input.value = '';
	}

	function selectModel(id: string) {
		const model = MODELS.find((candidate) => candidate.id === id);
		if (model) store.model = model.id;
	}

	onDestroy(() => {
		for (const timer of uploadTimers.values()) clearInterval(timer);
	});
</script>

<div class="composer">
	{#if pending.length > 0}
		<div class="flex flex-wrap gap-2 px-3 pt-3">
			{#each pending as file (file.attachment.id)}
				<div in:rise out:shrinkOut>
					<AttachmentChip attachment={file.attachment} progress={file.progress} onremove={() => removeFile(file.attachment.id)} />
				</div>
			{/each}
		</div>
	{/if}

	<textarea
		bind:this={textarea}
		bind:value={text}
		oninput={resize}
		onkeydown={handleKeydown}
		onpaste={handlePaste}
		rows="1"
		{placeholder}
		aria-label="Message Halden"
		class="block max-h-60 w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[15px] leading-relaxed text-(--fg) outline-none placeholder:text-(--fg-tertiary)"
	></textarea>

	<div class="toolbar">
		<DropdownMenu.Root>
			<Tip label="Attach files">
				{#snippet children(props)}
					<DropdownMenu.Trigger {...props} class="icon-btn" aria-label="Attach files">
						<Icon name="plus" size={18} />
					</DropdownMenu.Trigger>
				{/snippet}
			</Tip>
			<DropdownMenu.Portal to=".hd-app">
				<DropdownMenu.Content class="menu" side="top" align="start" sideOffset={8}>
					<DropdownMenu.Item class="menu-item" onSelect={() => fileInput?.click()}>
						<Icon name="paperclip" />Upload files
					</DropdownMenu.Item>
					<DropdownMenu.Item class="menu-item" onSelect={() => photoInput?.click()}>
						<Icon name="image" />Add photos
					</DropdownMenu.Item>
					<DropdownMenu.Separator class="menu-separator" />
					<p class="px-2.5 pt-1 pb-1.5 text-[12px] text-(--fg-secondary)">Up to {MAX_FILES} files, {formatBytes(MAX_FILE_BYTES)} each</p>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>

		<Tip label={store.webSearch ? 'Web search is on' : 'Search the web for this reply'} onclick={() => (store.webSearch = !store.webSearch)}>
			{#snippet children(props)}
				<button {...props} type="button" class="toggle" aria-pressed={store.webSearch}>
					<Icon name="globe" size={16} />
					<span class="max-sm:sr-only">Search</span>
				</button>
			{/snippet}
		</Tip>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="model-trigger" aria-label={`Model: ${findModel(store.model).name}`}>
				<span class="truncate">{findModel(store.model).name}</span>
				<Icon name="chevronDown" size={14} class="shrink-0 text-(--fg-tertiary)" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal to=".hd-app">
				<DropdownMenu.Content class="menu w-[280px]" side="top" align="start" sideOffset={8}>
					<p class="menu-label" aria-hidden="true">Model</p>
					<DropdownMenu.RadioGroup value={store.model} onValueChange={selectModel} aria-label="Model">
						{#each MODELS as model (model.id)}
							<DropdownMenu.RadioItem class="menu-item py-2" value={model.id} closeOnSelect>
								{#snippet children({ checked })}
									<span class="flex min-w-0 flex-1 flex-col leading-tight">
										<span class="font-medium">{model.name}</span>
										<span class="mt-0.5 text-[12px] text-(--fg-secondary)">{model.description}</span>
									</span>
									{#if checked}<span class="text-(--accent)" in:popIcon><Icon name="check" /></span>{/if}
								{/snippet}
							</DropdownMenu.RadioItem>
						{/each}
					</DropdownMenu.RadioGroup>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>

		<span class="ml-auto"></span>

		{#if text.length > COUNTER_FROM}
			<span class={['mr-2 text-[12px] tabular-nums', isOverLimit ? 'text-(--danger)' : 'text-(--fg-secondary)']}>
				{text.length.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()}
			</span>
		{/if}

		{#if store.isStreaming}
			<Tip label="Stop" shortcut="Esc" onclick={() => store.stop()}>
				{#snippet children(props)}
					<button {...props} type="button" class="send" aria-label="Stop reply">
						<span class="grid" in:popIcon><Icon name="stop" size={14} /></span>
					</button>
				{/snippet}
			</Tip>
		{:else}
			<Tip label={sendHint} shortcut={canSend ? (enterToSend ? '↵' : '⌘↵') : undefined} onclick={send}>
				{#snippet children(props)}
					<button {...props} type="button" class="send" aria-label="Send message" aria-disabled={!canSend} data-ready={canSend}>
						<span class="grid" in:popIcon><Icon name="arrowUp" size={17} /></span>
					</button>
				{/snippet}
			</Tip>
		{/if}
	</div>

	<input bind:this={fileInput} type="file" multiple class="hidden" onchange={handlePicked} />
	<input bind:this={photoInput} type="file" multiple accept="image/*" class="hidden" onchange={handlePicked} />
</div>

<style>
	.composer {
		border-radius: 22px;
		background: var(--bg);
		box-shadow:
			0 0 0 1px #e6e6e6,
			0 2px 6px -2px rgb(0 0 0 / 0.06),
			0 8px 24px -8px rgb(0 0 0 / 0.06);
		transition: box-shadow 150ms var(--ease-out);
	}

	.composer:has(textarea:focus) {
		box-shadow:
			0 0 0 1px var(--accent),
			0 0 0 4px var(--ring),
			0 8px 24px -8px rgb(0 0 0 / 0.06);
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 6px 8px 8px;
	}

	.toggle,
	.toolbar :global(.model-trigger) {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 30px;
		padding: 0 10px;
		border-radius: 999px;
		color: var(--fg-secondary);
		font-size: 13px;
		font-weight: 500;
		white-space: nowrap;
		transition:
			background-color 120ms var(--ease-out),
			color 120ms var(--ease-out),
			box-shadow 120ms var(--ease-out),
			transform 150ms var(--ease-out);
	}

	.toolbar :global(.model-trigger) {
		min-width: 0;
		gap: 4px;
	}

	.toggle:active,
	.toolbar :global(.model-trigger:active) {
		transform: scale(0.97);
	}

	@media (hover: hover) {
		.toggle:hover,
		.toolbar :global(.model-trigger:hover) {
			background: var(--bg-hover);
			color: var(--fg);
		}
	}

	.toolbar :global(.model-trigger[data-state='open']) {
		background: var(--bg-hover);
		color: var(--fg);
	}

	.toggle[aria-pressed='true'] {
		background: var(--accent-soft);
		color: var(--accent);
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--accent), white 75%);
	}

	.send {
		display: grid;
		place-items: center;
		flex-shrink: 0;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: var(--fg);
		color: #ffffff;
		transition:
			background-color 150ms var(--ease-out),
			transform 150ms var(--ease-out);
	}

	.send:active {
		transform: scale(0.92);
	}

	.send[data-ready='false'] {
		background: #e4e4e4;
		color: #ffffff;
	}

	.send[data-ready='false']:active {
		transform: none;
	}

	@media (max-width: 767px) {
		.toggle,
		.toolbar :global(.model-trigger),
		.send {
			position: relative;
			height: 36px;
		}

		.send {
			width: 36px;
		}

		.toggle::after,
		.toolbar :global(.model-trigger::after),
		.send::after {
			content: '';
			position: absolute;
			inset: -4px 0;
		}
	}
</style>
