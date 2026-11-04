<script lang="ts">
	import '@fontsource-variable/inter';
	import CopyButton from '#lib/kit/CopyButton.svelte';
	import FieldError from '#lib/kit/FieldError.svelte';
	import IconButton from '#lib/kit/IconButton.svelte';
	import KitRoot from '#lib/kit/KitRoot.svelte';
	import MenuContent from '#lib/kit/MenuContent.svelte';
	import MenuItem from '#lib/kit/MenuItem.svelte';
	import Sidebar from '#lib/kit/Sidebar.svelte';
	import Tip from '#lib/kit/Tip.svelte';
	import { DropdownMenu } from 'bits-ui';
	import { onDestroy, tick } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';
	import Icon from './Icon.svelte';
	import {
		createConversations,
		createMessage,
		historyGroups,
		models,
		streamedReply,
		suggestions,
		type Conversation,
		type Message
	} from './conversations';

	const THINKING_DELAY_MS = 900;
	const STREAM_WORD_INTERVAL_MS = 35;
	const TOAST_MS = 4000;
	const MAX_FILE_BYTES = 20 * 1024 * 1024;

	type Attachment = { id: number; name: string; size: number };
	type Toast = { id: number; text: string; undo?: () => void };

	let conversations = $state(createConversations());
	let activeId = $state<string | null>('churn');
	let draft = $state('');
	let query = $state('');
	let modelValue = $state<string>(models[0].value);
	let webSearch = $state(true);
	let sidebarCollapsed = $state(false);
	let feedback = $state<Record<number, 'up' | 'down'>>({});
	let attachments = $state<Attachment[]>([]);
	let attachError = $state<string | null>(null);
	let toast = $state<Toast | null>(null);
	let answerEls = $state<Record<number, HTMLElement>>({});
	let draftBodyEl: HTMLElement | undefined = $state();
	let fileInput: HTMLInputElement | undefined = $state();
	let historyPill = $state<{ y: number; height: number } | null>(null);

	let navEl: HTMLElement | undefined = $state();
	let scrollerEl: HTMLElement | undefined = $state();
	let searchEl: HTMLInputElement | undefined = $state();
	let composerEl: HTMLTextAreaElement | undefined = $state();

	let thinkingTimer: ReturnType<typeof setTimeout> | undefined;
	let streamTimer: ReturnType<typeof setInterval> | undefined;
	let toastTimer: ReturnType<typeof setTimeout> | undefined;
	let nextLocalId = 1;

	const active = $derived(conversations.find((conversation) => conversation.id === activeId));
	const isResponding = $derived(active?.messages.some((message) => message.status !== 'done') ?? false);
	const canSend = $derived(draft.trim().length > 0 && !isResponding);
	const modelLabel = $derived(models.find((model) => model.value === modelValue)?.label ?? models[0].label);
	const visibleGroups = $derived(groupHistory(conversations, query));

	$effect(() => {
		void activeId;
		void visibleGroups;
		tick().then(measureHistoryPill);
	});

	$effect(() => {
		const last = active?.messages.at(-1);
		void last?.text;
		void last?.status;
		tick().then(() => scrollerEl?.scrollTo({ top: scrollerEl.scrollHeight }));
	});

	onDestroy(() => {
		clearTimeout(thinkingTimer);
		clearInterval(streamTimer);
		clearTimeout(toastTimer);
	});

	function groupHistory(all: Conversation[], search: string) {
		const needle = search.trim().toLowerCase();
		const matches = all.filter((conversation) => conversation.title.toLowerCase().includes(needle));

		return historyGroups
			.map((name) => ({ name, items: matches.filter((conversation) => conversation.group === name) }))
			.filter((group) => group.items.length > 0);
	}

	function measureHistoryPill() {
		const current = navEl?.querySelector<HTMLElement>('[aria-current="page"]')?.closest<HTMLElement>('.history-row');
		historyPill = current ? { y: current.offsetTop, height: current.offsetHeight } : null;
	}

	function startNewChat() {
		activeId = null;
		draft = '';
		composerEl?.focus();
	}

	function send(text: string) {
		const prompt = text.trim();
		if (prompt.length === 0 || isResponding) return;

		const conversation = active ?? openConversation(prompt);
		const files = attachments.length ? ` · ${attachments.map((a) => a.name).join(', ')}` : '';
		conversation.messages.push(createMessage('user', prompt + files, 'done'));
		conversation.messages.push(createMessage('assistant', '', 'thinking'));
		draft = '';
		attachments = [];
		attachError = null;

		const reply = conversation.messages[conversation.messages.length - 1];
		streamReply(reply);
	}

	function openConversation(firstPrompt: string): Conversation {
		const id = `chat-${conversations.length + 1}`;
		conversations.unshift({ id, title: firstPrompt.slice(0, 48), group: 'Today', messages: [] });
		activeId = id;
		return conversations[0];
	}

	function streamReply(reply: Message) {
		const words = streamedReply.split(' ');
		let shown = 0;

		thinkingTimer = setTimeout(() => {
			reply.status = 'streaming';
			streamTimer = setInterval(() => {
				shown += 1;
				reply.text = words.slice(0, shown).join(' ');
				if (shown >= words.length) finishReply(reply);
			}, STREAM_WORD_INTERVAL_MS);
		}, THINKING_DELAY_MS);
	}

	function finishReply(reply: Message) {
		clearTimeout(thinkingTimer);
		clearInterval(streamTimer);
		if (reply.text.length === 0) reply.text = 'Stopped before answering.';
		reply.status = 'done';
	}

	function regenerate(message: Message) {
		if (isResponding) return;
		message.rich = undefined;
		message.text = '';
		message.status = 'thinking';
		delete feedback[message.id];
		streamReply(message);
	}

	function rate(message: Message, value: 'up' | 'down') {
		if (feedback[message.id] === value) delete feedback[message.id];
		else feedback[message.id] = value;
	}

	function deleteConversation(id: string) {
		const index = conversations.findIndex((c) => c.id === id);
		if (index === -1) return;
		const [removed] = conversations.splice(index, 1);
		const wasActive = activeId === id;
		if (wasActive) activeId = conversations[Math.min(index, conversations.length - 1)]?.id ?? null;
		showToast(`Deleted “${removed.title}”`, () => {
			conversations.splice(index, 0, removed);
			if (wasActive) activeId = removed.id;
		});
	}

	async function copyLink(id: string | null) {
		try {
			await navigator.clipboard.writeText(`${location.origin}/assistant?chat=${id ?? ''}`);
			showToast('Link copied');
		} catch (error) {
			console.error('Clipboard write was refused', error);
			showToast('Couldn’t copy the link. Check clipboard permissions.');
		}
	}

	function exportMarkdown() {
		if (!active) return;
		const body = active.messages
			.map((m) => `**${m.role === 'user' ? 'You' : 'Halo'}:** ${answerEls[m.id]?.innerText ?? m.text}`)
			.join('\n\n');
		const url = URL.createObjectURL(new Blob([`# ${active.title}\n\n${body}\n`], { type: 'text/markdown' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = `${active.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
		link.click();
		URL.revokeObjectURL(url);
		showToast('Exported as Markdown');
	}

	function addFiles(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const files = [...(input.files ?? [])];
		input.value = '';
		const tooBig = files.find((f) => f.size > MAX_FILE_BYTES);
		if (tooBig) {
			attachError = `${tooBig.name} is over 20 MB. Try a smaller export.`;
			return;
		}
		attachError = null;
		attachments = [...attachments, ...files.map((f) => ({ id: nextLocalId++, name: f.name, size: f.size }))];
		composerEl?.focus();
	}

	function removeAttachment(id: number) {
		attachments = attachments.filter((a) => a.id !== id);
		attachError = null;
	}

	function showToast(text: string, undo?: () => void) {
		clearTimeout(toastTimer);
		toast = { id: nextLocalId++, text, undo };
		toastTimer = setTimeout(() => (toast = null), undo ? 5000 : TOAST_MS);
	}

	function undoToast() {
		toast?.undo?.();
		clearTimeout(toastTimer);
		toast = null;
	}

	function stopResponding() {
		const pending = active?.messages.find((message) => message.status !== 'done');
		if (pending) finishReply(pending);
	}

	function handleComposerKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
		event.preventDefault();
		send(draft);
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		const isTyping =
			event.target instanceof Element && event.target.matches('input, textarea, [contenteditable="true"]');
		if (event.key !== '/' || isTyping) return;
		event.preventDefault();
		searchEl?.focus();
	}
</script>

<svelte:head>
	<title>Halo · Assistant</title>
</svelte:head>

<svelte:window onkeydown={handleWindowKeydown} />

<KitRoot class="halo-kit">
	<div class="app">
		<Sidebar bind:collapsed={sidebarCollapsed} defaultWidth={240} minWidth={200} maxWidth={360} class="side-col">
			{#snippet children()}
				<aside class="sidebar">
					<div class="brand">
						<span class="logo" aria-hidden="true">{@render sparkle(12)}</span>
						<span class="brand-name">Halo</span>
						<IconButton label="Close sidebar" keys={['⌘', 'B']} side="bottom" onclick={() => (sidebarCollapsed = true)}>
							<Icon name="sidebar" />
						</IconButton>
					</div>

					<button class="btn btn-primary btn-block" type="button" onclick={startNewChat}>
						<Icon name="plus" size={14} />
						New chat
					</button>

					<label class="search">
						<Icon name="search" size={14} />
						<input bind:this={searchEl} bind:value={query} type="search" placeholder="Search chats" aria-label="Search chats" />
						<kbd>/</kbd>
					</label>

					<nav class="history" bind:this={navEl} aria-label="Chat history">
						{#if historyPill}
							<span class="history-pill" style:transform="translateY({historyPill.y}px)" style:height="{historyPill.height}px"></span>
						{/if}

						{#each visibleGroups as group (group.name)}
							<p class="group-label">{group.name}</p>
							{#each group.items as conversation (conversation.id)}
								<div class="history-row">
									<button
										class="history-item"
										type="button"
										aria-current={conversation.id === activeId ? 'page' : undefined}
										onclick={() => (activeId = conversation.id)}
									>
										{conversation.title}
									</button>
									<DropdownMenu.Root>
										<DropdownMenu.Trigger class="row-menu" aria-label="Options for {conversation.title}">
											<Icon name="more" size={14} />
										</DropdownMenu.Trigger>
										<MenuContent side="right" align="start" sideOffset={8} minWidth={168}>
											<MenuItem onSelect={() => copyLink(conversation.id)}>Copy link</MenuItem>
											<DropdownMenu.Separator class="kit-menu-sep" />
											<MenuItem tone="danger" onSelect={() => deleteConversation(conversation.id)}>Delete</MenuItem>
										</MenuContent>
									</DropdownMenu.Root>
								</div>
							{/each}
						{:else}
							<p class="history-empty">No chats match “{query}”</p>
						{/each}
					</nav>

					<div class="usage">
						<div class="usage-row">
							<span>Messages this month</span>
							<span class="tabular">412 / 1,000</span>
						</div>
						<div class="meter"><span style:width="41.2%"></span></div>
					</div>

					<div class="account">
						<span class="avatar">MR</span>
						<span class="account-text">
							<span class="account-name">Maya Reyes</span>
							<span class="account-plan">Pro · Northwind</span>
						</span>
						<DropdownMenu.Root>
							<Tip label="Settings" side="top">
								{#snippet trigger({ props })}
									<DropdownMenu.Trigger {...props} class="kit-icon-btn" aria-label="Settings">
										<Icon name="sliders" />
									</DropdownMenu.Trigger>
								{/snippet}
							</Tip>
							<MenuContent side="top" align="end" minWidth={200}>
								<MenuItem onSelect={() => showToast('Settings are read-only in this demo')} keys={['⌘', ',']}>Settings</MenuItem>
								<MenuItem onSelect={() => showToast('Usage resets on Dec 1')}>Usage &amp; billing</MenuItem>
								<DropdownMenu.Separator class="kit-menu-sep" />
								<MenuItem onSelect={() => showToast('Signed out (not really, it’s a demo)')}>Sign out</MenuItem>
							</MenuContent>
						</DropdownMenu.Root>
					</div>
				</aside>
			{/snippet}
		</Sidebar>

		<main class="main">
			<header class="topbar">
				{#if sidebarCollapsed}
					<span class="topbar-lead" in:fly={{ x: -6, duration: 200, easing: quintOut }}>
						<IconButton label="Open sidebar" keys={['⌘', 'B']} side="bottom" onclick={() => (sidebarCollapsed = false)}>
							<Icon name="sidebar" />
						</IconButton>
						<IconButton label="New chat" side="bottom" onclick={startNewChat}>
							<Icon name="plus" />
						</IconButton>
					</span>
				{/if}
				<h1 class="chat-title">{active?.title ?? 'New chat'}</h1>

				<DropdownMenu.Root>
					<DropdownMenu.Trigger class="model-trigger">
						{modelLabel}
						<Icon name="chevronDown" size={14} />
					</DropdownMenu.Trigger>
					<DropdownMenu.Portal>
						<DropdownMenu.Content class="model-menu" sideOffset={6} align="start">
							<DropdownMenu.RadioGroup bind:value={modelValue}>
								{#each models as model (model.value)}
									<DropdownMenu.RadioItem value={model.value} class="model-item">
										{#snippet children({ checked })}
											<span class="model-item-text">
												<span class="model-item-label">{model.label}</span>
												<span class="model-item-hint">{model.hint}</span>
											</span>
											{#if checked}
												<Icon name="check" size={14} />
											{/if}
										{/snippet}
									</DropdownMenu.RadioItem>
								{/each}
							</DropdownMenu.RadioGroup>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>

				<div class="topbar-actions">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger disabled={!active}>
							{#snippet child({ props })}
								<button {...props} class="btn btn-secondary" type="button">
									<Icon name="share" size={14} />
									Share
								</button>
							{/snippet}
						</DropdownMenu.Trigger>
						<MenuContent align="end" minWidth={196}>
							<MenuItem onSelect={() => copyLink(activeId)}>Copy link</MenuItem>
							<MenuItem onSelect={exportMarkdown}>Export as Markdown</MenuItem>
						</MenuContent>
					</DropdownMenu.Root>
					<DropdownMenu.Root>
						<Tip label="More" side="bottom">
							{#snippet trigger({ props })}
								<DropdownMenu.Trigger {...props} class="kit-icon-btn" aria-label="More options" disabled={!active}>
									<Icon name="more" />
								</DropdownMenu.Trigger>
							{/snippet}
						</Tip>
						<MenuContent align="end" minWidth={180}>
							<MenuItem onSelect={() => copyLink(activeId)}>Copy link</MenuItem>
							<DropdownMenu.Separator class="kit-menu-sep" />
							<MenuItem tone="danger" onSelect={() => active && deleteConversation(active.id)}>Delete chat</MenuItem>
						</MenuContent>
					</DropdownMenu.Root>
				</div>
			</header>

			<div class="scroller" bind:this={scrollerEl}>
				{#key activeId}
					{#if active}
						<div class="transcript">
							{#each active.messages as message (message.id)}
								{#if message.role === 'user'}
									<div class="msg-user" in:fly={{ y: 6, duration: 250, easing: quintOut }}>
										<p class="bubble">{message.text}</p>
									</div>
								{:else}
									<div class="msg-assistant" in:fly={{ y: 6, duration: 250, easing: quintOut }}>
										<span class="logo logo-sm" aria-hidden="true">{@render sparkle(10)}</span>
										<div class="answer-col">
											{#if message.status === 'thinking'}
												<p class="thinking">Thinking…</p>
											{:else}
												<div class="answer" bind:this={answerEls[message.id]}>
													{#if message.rich === 'churn-analysis'}
														{@render churnAnalysis()}
													{:else if message.rich === 'cs-note'}
														{@render csNote()}
													{:else}
														<p>
															{message.text}{#if message.status === 'streaming'}<span class="caret"></span>{/if}
														</p>
													{/if}
												</div>
											{/if}

											{#if message.status === 'done'}
												{@render answerActions(message)}
											{/if}
										</div>
									</div>
								{/if}
							{/each}
						</div>
					{:else}
						{@render emptyState()}
					{/if}
				{/key}
			</div>

			<footer class="composer-wrap">
				<form
					class="composer"
					onsubmit={(event) => {
						event.preventDefault();
						send(draft);
					}}
				>
					{#if attachments.length}
						<div class="attachments">
							{#each attachments as a (a.id)}
								<span class="attachment" in:fly={{ y: 4, duration: 180, easing: quintOut }} out:fade={{ duration: 100 }}>
									<Icon name="file" size={12} />
									<span class="attachment-name">{a.name}</span>
									<button type="button" class="attachment-x" aria-label="Remove {a.name}" onclick={() => removeAttachment(a.id)}>
										<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
									</button>
								</span>
							{/each}
						</div>
					{/if}
					<textarea
						bind:this={composerEl}
						bind:value={draft}
						rows="1"
						placeholder="Message Halo"
						aria-label="Message Halo"
						onkeydown={handleComposerKeydown}
					></textarea>

					<div class="composer-bar">
						<input bind:this={fileInput} type="file" multiple hidden onchange={addFiles} />
						<IconButton label="Attach files" onclick={() => fileInput?.click()}>
							<Icon name="paperclip" />
						</IconButton>
						<button class="chip" type="button" aria-pressed={webSearch} onclick={() => (webSearch = !webSearch)}>
							<Icon name="globe" size={14} />
							Web search
						</button>

						<span class="composer-hint"><kbd>↵</kbd> send <kbd>⇧↵</kbd> new line</span>

						{#if isResponding}
							<button class="send" type="button" aria-label="Stop responding" onclick={stopResponding}>
								<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><rect width="10" height="10" rx="2" fill="currentColor" /></svg>
							</button>
						{:else}
							<button class="send" type="submit" aria-label="Send message" disabled={!canSend}>
								<Icon name="arrowUp" size={14} />
							</button>
						{/if}
					</div>
				</form>
				<div class="composer-error"><FieldError message={attachError} /></div>
			</footer>
		</main>

		{#if toast}
			{#key toast.id}
				<div class="toast" role="status" in:fly={{ y: 12, duration: 240, easing: quintOut }} out:fade={{ duration: 140 }}>
					{toast.text}
					{#if toast.undo}
						<button type="button" class="toast-undo" onclick={undoToast}>Undo</button>
					{/if}
				</div>
			{/key}
		{/if}
	</div>
</KitRoot>

{#snippet sparkle(size: number)}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
		<path d="M12 2c.7 5.4 2.8 7.4 8.2 8.2-5.4.7-7.5 2.8-8.2 8.2-.7-5.4-2.8-7.5-8.2-8.2C9.2 9.4 11.3 7.4 12 2z" />
		<path d="M19 15.5c.3 2.2 1.1 3 3.3 3.3-2.2.3-3 1.1-3.3 3.3-.3-2.2-1.1-3-3.3-3.3 2.2-.3 3-1.1 3.3-3.3z" />
	</svg>
{/snippet}

{#snippet answerActions(message: Message)}
	<div class="actions">
		<CopyButton text={() => answerEls[message.id]?.innerText ?? message.text} label="Copy answer" class="act-btn" />
		<IconButton label="Regenerate" class="act-btn" disabled={isResponding} onclick={() => regenerate(message)}>
			<Icon name="retry" size={14} />
		</IconButton>
		<IconButton label="Good answer" class="act-btn rate" aria-pressed={feedback[message.id] === 'up'} onclick={() => rate(message, 'up')}>
			<Icon name="thumbsUp" size={14} />
		</IconButton>
		<IconButton label="Bad answer" class="act-btn rate" aria-pressed={feedback[message.id] === 'down'} onclick={() => rate(message, 'down')}>
			<Icon name="thumbsDown" size={14} />
		</IconButton>
		<span class="actions-meta">{modelLabel} · 2.1s</span>
	</div>
{/snippet}

{#snippet churnAnalysis()}
	<div class="trace">
		<span class="trace-chip"><Icon name="file" size={12} />billing_export_sep.csv</span>
		<span class="trace-chip"><Icon name="file" size={12} />cancel_survey_q3.csv</span>
		<span class="trace-meta">Read 2 files · 4,118 rows</span>
	</div>
	<p>
		Logo churn rose from <strong>2.1%</strong> in August to <strong>3.4%</strong> in September. Nearly all of
		the increase came from Starter accounts on monthly billing.
	</p>
	<table class="data">
		<thead>
			<tr>
				<th>Driver</th>
				<th class="num">Accounts</th>
				<th class="num">MRR lost</th>
				<th class="num">vs Aug</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Price change on Sep 4</td>
				<td class="num">41</td>
				<td class="num">$8,240</td>
				<td class="num"><span class="tag tag-danger">+28</span></td>
			</tr>
			<tr>
				<td>Failed renewals (expired card)</td>
				<td class="num">23</td>
				<td class="num">$3,910</td>
				<td class="num"><span class="tag tag-warning">+11</span></td>
			</tr>
			<tr>
				<td>Switched to a competitor</td>
				<td class="num">12</td>
				<td class="num">$2,760</td>
				<td class="num"><span class="tag">+2</span></td>
			</tr>
		</tbody>
	</table>
	<p>
		Annual plans held steady at <strong>0.6%</strong>. Cost was the top cancellation reason for 63% of
		Starter accounts, up from 22% in August.
	</p>
	<p class="subhead">Suggested next steps</p>
	<ol>
		<li>Offer Starter accounts renewing in October 3 months at the old price.</li>
		<li>Turn on card updater and send dunning emails 7 days before renewal.</li>
	</ol>
{/snippet}

{#snippet csNote()}
	<p>Here’s a draft for <strong>#cs-team</strong>:</p>
	<div class="draft">
		<div class="draft-head">
			<span># cs-team</span>
			<CopyButton variant="text" text={() => draftBodyEl?.innerText ?? ''} class="draft-copy" />
		</div>
		<div class="draft-body" bind:this={draftBodyEl}>
			<p>Hi team, quick update on September churn.</p>
			<p>
				Logo churn hit 3.4% (up from 2.1%), driven by Starter monthly accounts after the Sep 4 price change.
				Two actions start this week:
			</p>
			<ul>
				<li>
					<strong>Price offer:</strong> reach out to the 212 Starter accounts renewing in October with 3 months
					at the old price.
				</li>
				<li>
					<strong>Failed renewals:</strong> dunning emails go live Oct 9. Flag any account in your book with an
					expired card.
				</li>
			</ul>
			<p>The account list is in the churn doc. Questions in thread.</p>
		</div>
	</div>
	<p>Want me to post it, or tweak the tone first?</p>
{/snippet}

{#snippet emptyState()}
	<div class="empty">
		<span class="logo logo-lg" aria-hidden="true">{@render sparkle(16)}</span>
		<h2>What should we work on?</h2>
		<p>Halo can read your billing, support and product data.</p>
		<div class="suggestions">
			{#each suggestions as suggestion (suggestion.label)}
				<button class="suggestion" type="button" onclick={() => send(suggestion.label)}>
					<Icon name={suggestion.icon} size={14} />
					<span class="suggestion-label">{suggestion.label}</span>
				</button>
			{/each}
		</div>
	</div>
{/snippet}

<style>
	/* KitRoot wrapper: no box, only themes the portalled menus and tooltips */
	:global(.halo-kit) {
		display: contents;
		font-family: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
		--kit-pop-radius: 10px;
		--kit-item-radius: 6px;
		--kit-item-height: 28px;
		--kit-accent: #0a0a0a;
		--kit-success: #0a0a0a;
		--kit-icon-btn-radius: 8px;
		--kit-icon-btn-color: #737373;
		--kit-icon-btn-hover-bg: #efefef;
		--kit-icon-btn-pressed-color: #0a0a0a;
		--kit-handle-active: #0a0a0a;
	}

	.app {
		--bg: #ffffff;
		--bg-subtle: #f7f7f7;
		--bg-muted: #f0f0f0;
		--bg-hover: #efefef;
		--border: #ececec;
		--fg: #171717;
		--fg-secondary: #737373;
		--fg-tertiary: #a3a3a3;
		--accent: #0a0a0a;
		--ring: rgb(10 10 10 / 0.14);

		--shadow-btn: 0 1px 2px rgb(40 40 40 / 0.08), 0 0 0 1px #ececec;
		--shadow-btn-primary: inset 0 1px 0 rgb(255 255 255 / 0.14), 0 1px 2px rgb(0 0 0 / 0.2), 0 0 0 1px #000;
		--shadow-card: 0 1px 2px rgb(0 0 0 / 0.04), 0 0 0 1px var(--border);
		--shadow-composer: 0 0 0 1px rgb(0 0 0 / 0.07), 0 6px 20px -6px rgb(0 0 0 / 0.1), 0 1px 2px rgb(0 0 0 / 0.04);
		--shadow-focus: 0 0 0 3px var(--ring);

		--ease-out: cubic-bezier(0.23, 1, 0.32, 1);

		position: fixed;
		inset: 0;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		background: var(--bg);
		color: var(--fg);
		font-family: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
		font-feature-settings: 'cv11', 'ss01';
		font-size: 13px;
		line-height: 1.4;
	}

	button {
		font: inherit;
		color: inherit;
		user-select: none;
	}

	kbd {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 4px;
		border-radius: 5px;
		background: var(--bg);
		box-shadow: 0 0 0 1px var(--border);
		color: var(--fg-secondary);
		font-family: inherit;
		font-size: 11px;
		font-weight: 500;
		line-height: 1;
	}

	.tabular {
		font-variant-numeric: tabular-nums;
	}

	/* Buttons */

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		height: 28px;
		padding: 0 10px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		transition:
			transform 150ms var(--ease-out),
			box-shadow 150ms var(--ease-out),
			background 100ms var(--ease-out);
	}

	.btn:active:not(:disabled) {
		transform: scale(0.97);
	}

	.btn:focus-visible {
		outline: none;
		box-shadow: var(--shadow-focus), var(--shadow-btn);
	}

	.btn:disabled {
		opacity: 0.5;
	}

	.btn-primary {
		background: linear-gradient(#2b2b2b, var(--accent));
		color: #fff;
		box-shadow: var(--shadow-btn-primary);
	}

	.btn-primary:focus-visible {
		box-shadow: var(--shadow-focus), var(--shadow-btn-primary);
	}

	.btn-secondary {
		background: linear-gradient(#fff, #f7f7f7);
		box-shadow: var(--shadow-btn);
	}

	.btn-block {
		width: 100%;
	}






	@media (hover: hover) {
		.btn-primary:hover:not(:disabled) {
			background: linear-gradient(#383838, #1a1a1a);
		}

		.btn-secondary:hover:not(:disabled) {
			background: linear-gradient(#fff, #f1f1f1);
		}

	}

	/* Logo */

	.logo {
		display: inline-grid;
		place-items: center;
		flex-shrink: 0;
		width: 22px;
		height: 22px;
		border-radius: 7px;
		background: linear-gradient(#2b2b2b, var(--accent));
		box-shadow: var(--shadow-btn-primary);
		color: #fff;
	}

	.logo-sm {
		width: 20px;
		height: 20px;
		border-radius: 6px;
	}

	.logo-lg {
		width: 36px;
		height: 36px;
		border-radius: 10px;
	}

	/* Sidebar */

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 8px;
		height: 100%;
		min-height: 0;
		padding: 10px 8px 8px;
		background: var(--bg-subtle);
		box-shadow: inset -1px 0 0 var(--border);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 28px;
		padding-left: 8px;
		margin-bottom: 4px;
	}

	.brand-name {
		flex: 1;
		font-size: 14px;
		font-weight: 500;
		letter-spacing: -0.01em;
	}

	.search {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 28px;
		padding: 0 5px 0 8px;
		border-radius: 8px;
		background: var(--bg);
		box-shadow: var(--shadow-btn);
		color: var(--fg-tertiary);
		transition: box-shadow 150ms var(--ease-out);
	}

	.search:focus-within {
		box-shadow: 0 0 0 1px var(--fg), var(--shadow-focus);
	}

	.search input {
		flex: 1;
		min-width: 0;
		border: 0;
		outline: none;
		background: none;
		color: var(--fg);
		font: inherit;
	}

	.search input::placeholder {
		color: var(--fg-tertiary);
	}

	.search input::-webkit-search-cancel-button {
		display: none;
	}

	.history {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-height: 0;
		margin: 0 -8px;
		padding: 2px 8px;
		overflow-y: auto;
		scrollbar-width: thin;
	}

	.history-pill {
		position: absolute;
		top: 0;
		left: 8px;
		right: 8px;
		border-radius: 7px;
		background: var(--bg);
		box-shadow: var(--shadow-btn);
		transition:
			transform 250ms var(--ease-out),
			height 250ms var(--ease-out);
	}

	.group-label {
		padding: 10px 8px 4px;
		color: var(--fg-secondary);
		font-size: 11px;
		font-weight: 500;
	}

	.group-label:first-of-type {
		padding-top: 6px;
	}

	/* row: title button plus a menu trigger that appears on hover, focus or while open */
	.history-row {
		position: relative;
		flex-shrink: 0;
	}

	.history-row :global(.row-menu) {
		position: absolute;
		top: 2px;
		right: 2px;
		z-index: 2;
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 6px;
		color: var(--fg-secondary);
		opacity: 0;
		transition:
			opacity 100ms var(--ease-out),
			background 100ms var(--ease-out);
	}

	.history-row:hover :global(.row-menu),
	.history-row :global(.row-menu:focus-visible),
	.history-row :global(.row-menu[data-state='open']) {
		opacity: 1;
	}

	.history-row :global(.row-menu:hover),
	.history-row :global(.row-menu[data-state='open']) {
		background: var(--bg-hover);
		color: var(--fg);
	}

	.history-row :global(.row-menu:focus-visible) {
		outline: none;
		box-shadow: var(--shadow-focus);
	}

	.history-row:hover .history-item {
		padding-right: 30px;
	}

	.history-item {
		position: relative;
		display: block;
		width: 100%;
		flex-shrink: 0;
		height: 28px;
		padding: 0 8px;
		border-radius: 7px;
		overflow: hidden;
		color: var(--fg-secondary);
		text-align: left;
		text-overflow: ellipsis;
		white-space: nowrap;
		transition: color 100ms var(--ease-out);
	}

	.history-item[aria-current='page'] {
		color: var(--fg);
	}

	.history-item:focus-visible {
		outline: none;
		box-shadow: var(--shadow-focus);
	}

	@media (hover: hover) {
		.history-item:hover {
			color: var(--fg);
		}

		.history-item:not([aria-current='page']):hover {
			background: rgb(0 0 0 / 0.035);
		}
	}

	.history-empty {
		padding: 8px;
		color: var(--fg-secondary);
	}

	.usage {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 10px;
		border-radius: 10px;
		background: var(--bg);
		box-shadow: var(--shadow-card);
	}

	.usage-row {
		display: flex;
		justify-content: space-between;
		color: var(--fg-secondary);
		font-size: 12px;
	}

	.usage-row .tabular {
		color: var(--fg);
		font-weight: 500;
	}

	.meter {
		height: 4px;
		border-radius: 9999px;
		background: var(--bg-muted);
		overflow: hidden;
	}

	.meter span {
		display: block;
		height: 100%;
		border-radius: inherit;
		background: var(--accent);
	}

	.account {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 2px 0 0 8px;
	}

	.avatar {
		display: inline-grid;
		place-items: center;
		flex-shrink: 0;
		width: 26px;
		height: 26px;
		border-radius: 9999px;
		background: #eef4ff;
		color: #1d4ed8;
		font-size: 11px;
		font-weight: 500;
	}

	.account-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.25;
	}

	.account-name {
		font-weight: 500;
	}

	.account-plan {
		color: var(--fg-secondary);
		font-size: 12px;
	}

	/* Main column */

	.main {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr) auto;
		min-width: 0;
		min-height: 0;
	}

	.topbar {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 44px;
		padding: 0 10px 0 16px;
		box-shadow: inset 0 -1px 0 var(--border);
	}

	.chat-title {
		min-width: 0;
		overflow: hidden;
		font-size: 13px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.topbar-actions {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-left: auto;
	}

	.topbar :global(.model-trigger) {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		height: 24px;
		padding: 0 6px 0 8px;
		border-radius: 6px;
		background: var(--bg-subtle);
		box-shadow: inset 0 0 0 1px var(--border);
		color: var(--fg-secondary);
		font-size: 12px;
		font-weight: 500;
		transition:
			color 100ms var(--ease-out),
			background 100ms var(--ease-out);
	}

	.topbar :global(.model-trigger[data-state='open']),
	.topbar :global(.model-trigger:hover) {
		background: var(--bg-muted);
		color: var(--fg);
	}

	.topbar :global(.model-trigger:focus-visible) {
		outline: none;
		box-shadow: inset 0 0 0 1px var(--border), var(--shadow-focus);
	}

	/* The menu is portalled to <body>, outside .app, so it can't read the tokens above. */
	:global(.model-menu) {
		z-index: 50;
		width: 220px;
		padding: 4px;
		border-radius: 12px;
		background: #fff;
		box-shadow:
			0 0 0 1px rgb(0 0 0 / 0.06),
			0 8px 24px -4px rgb(0 0 0 / 0.1),
			0 2px 6px rgb(0 0 0 / 0.04);
		font-family: 'Inter Variable', ui-sans-serif, system-ui, sans-serif;
		font-size: 13px;
		color: #171717;
		outline: none;
		transform-origin: var(--bits-floating-transform-origin);
		animation: menu-in 200ms cubic-bezier(0.23, 1, 0.32, 1);
	}

	:global(.model-item) {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		border-radius: 8px;
		outline: none;
	}

	:global(.model-item[data-highlighted]) {
		background: #f5f5f5;
	}

	:global(.model-item-text) {
		flex: 1;
		display: flex;
		flex-direction: column;
		line-height: 1.3;
	}

	:global(.model-item-label) {
		font-weight: 500;
	}

	:global(.model-item-hint) {
		color: #737373;
		font-size: 12px;
	}

	@keyframes -global-menu-in {
		from {
			opacity: 0;
			transform: scale(0.96) translateY(-4px);
		}
	}

	.scroller {
		overflow-y: auto;
		scrollbar-width: thin;
		mask-image: linear-gradient(to bottom, #000 calc(100% - 24px), transparent);
	}

	.transcript {
		display: flex;
		flex-direction: column;
		gap: 20px;
		max-width: 680px;
		margin: 0 auto;
		padding: 20px 16px 24px;
	}

	/* Messages */

	.msg-user {
		display: flex;
		justify-content: flex-end;
	}

	.bubble {
		max-width: 78%;
		padding: 7px 11px;
		border-radius: 12px 12px 4px 12px;
		background: var(--bg-muted);
		font-size: 14px;
		line-height: 1.5;
	}

	.msg-assistant {
		display: flex;
		gap: 10px;
	}

	.msg-assistant > .logo {
		margin-top: 1px;
	}

	.answer-col {
		flex: 1;
		min-width: 0;
	}

	.answer {
		display: flex;
		flex-direction: column;
		gap: 10px;
		font-size: 14px;
		line-height: 1.55;
	}

	.answer strong,
	.draft strong {
		font-weight: 500;
	}

	.answer .subhead {
		margin-top: 2px;
		margin-bottom: -6px;
		font-weight: 500;
	}

	.answer ol,
	.draft ul {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-left: 18px;
	}

	.answer ol {
		list-style: decimal;
	}

	.draft ul {
		list-style: disc;
	}

	.answer li::marker,
	.draft li::marker {
		color: var(--fg-tertiary);
	}

	.thinking {
		width: fit-content;
		background: linear-gradient(90deg, var(--fg-tertiary) 0%, var(--fg) 50%, var(--fg-tertiary) 100%) 0 0 / 200% 100%;
		background-clip: text;
		color: transparent;
		font-size: 14px;
		line-height: 1.55;
		animation: shimmer 1.6s linear infinite;
	}

	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}

	.caret {
		display: inline-block;
		width: 2px;
		height: 15px;
		margin-left: 2px;
		border-radius: 1px;
		background: var(--fg);
		vertical-align: -2px;
		animation: blink 1s steps(2) infinite;
	}

	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	.trace {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}

	.trace-chip {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		height: 22px;
		padding: 0 7px;
		border-radius: 6px;
		background: var(--bg-subtle);
		box-shadow: inset 0 0 0 1px var(--border);
		color: var(--fg-secondary);
		font-family: ui-monospace, 'SF Mono', Menlo, monospace;
		font-size: 11.5px;
	}

	.trace-meta {
		color: var(--fg-secondary);
		font-size: 12px;
	}

	.data {
		width: 100%;
		border-collapse: collapse;
		border-radius: 10px;
		box-shadow: var(--shadow-card);
		font-size: 13px;
		font-variant-numeric: tabular-nums;
		overflow: hidden;
	}

	.data th {
		height: 30px;
		padding: 0 10px;
		background: var(--bg-subtle);
		color: var(--fg-secondary);
		font-size: 12px;
		font-weight: 500;
		text-align: left;
	}

	.data td {
		height: 34px;
		padding: 0 10px;
		box-shadow: inset 0 1px 0 var(--border);
	}

	.data .num {
		text-align: right;
	}

	.tag {
		display: inline-flex;
		align-items: center;
		height: 20px;
		padding: 0 6px;
		border-radius: 6px;
		background: var(--bg-subtle);
		box-shadow: inset 0 0 0 1px var(--border);
		color: var(--fg-secondary);
		font-size: 12px;
		font-weight: 500;
	}

	.tag-danger {
		background: #fef2f2;
		box-shadow: inset 0 0 0 1px #fde0e0;
		color: #b91c1c;
	}

	.tag-warning {
		background: #fff7e6;
		box-shadow: inset 0 0 0 1px #fde9c3;
		color: #b45309;
	}

	.draft {
		border-radius: 10px;
		background: var(--bg-subtle);
		box-shadow: inset 0 0 0 1px var(--border);
	}

	.draft-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 34px;
		padding: 0 6px 0 12px;
		box-shadow: inset 0 -1px 0 var(--border);
		color: var(--fg-secondary);
		font-size: 12px;
		font-weight: 500;
	}

	.draft-body {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px 12px 12px;
		font-size: 13.5px;
		line-height: 1.55;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 2px;
		margin: 6px 0 0 -4px;
	}

	.actions-meta {
		margin-left: 6px;
		color: var(--fg-tertiary);
		font-size: 12px;
	}

	/* Empty state */

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100%;
		max-width: 640px;
		margin: 0 auto;
		padding: 24px 16px;
		text-align: center;
	}

	.empty h2 {
		margin-top: 14px;
		font-size: 20px;
		font-weight: 500;
		letter-spacing: -0.015em;
	}

	.empty p {
		margin-top: 4px;
		color: var(--fg-secondary);
	}

	.suggestions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
		width: 100%;
		margin-top: 20px;
	}

	.suggestion {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 36px;
		padding: 0 10px;
		border-radius: 10px;
		background: var(--bg);
		box-shadow: var(--shadow-card);
		color: var(--fg-secondary);
		text-align: left;
		transition:
			color 100ms var(--ease-out),
			box-shadow 150ms var(--ease-out),
			transform 150ms var(--ease-out);
	}

	.suggestion :global(svg) {
		flex-shrink: 0;
	}

	.suggestion-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.suggestion:active {
		transform: scale(0.98);
	}

	.suggestion:focus-visible {
		outline: none;
		box-shadow: var(--shadow-focus), var(--shadow-card);
	}

	@media (hover: hover) {
		.suggestion:hover {
			color: var(--fg);
			box-shadow: 0 1px 3px rgb(0 0 0 / 0.06), 0 0 0 1px #e0e0e0;
		}
	}

	/* Composer */

	.composer-wrap {
		padding: 0 16px 12px;
	}

	.composer {
		display: flex;
		flex-direction: column;
		max-width: 680px;
		margin: 0 auto;
		border-radius: 14px;
		background: var(--bg);
		box-shadow: var(--shadow-composer);
		transition: box-shadow 150ms var(--ease-out);
	}

	/* the composer draws the ring for its textarea; the textarea never draws its own */
	.composer:has(textarea:focus) {
		box-shadow: 0 0 0 1px rgb(0 0 0 / 0.18), 0 6px 20px -6px rgb(0 0 0 / 0.12), 0 1px 2px rgb(0 0 0 / 0.04);
	}

	.composer textarea {
		field-sizing: content;
		min-height: 40px;
		max-height: 168px;
		padding: 11px 12px 4px;
		border: 0;
		outline: none;
		resize: none;
		background: none;
		color: var(--fg);
		font: inherit;
		font-size: 14px;
		line-height: 1.5;
	}

	.composer textarea::placeholder {
		color: var(--fg-tertiary);
	}

	.attachments {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: 10px 10px 0;
	}

	.attachment {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 26px;
		padding: 0 4px 0 8px;
		border-radius: 8px;
		background: var(--bg-subtle);
		box-shadow: inset 0 0 0 1px var(--border);
		color: var(--fg);
		font-size: 12px;
	}

	.attachment-name {
		max-width: 180px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.attachment-x {
		display: grid;
		place-items: center;
		width: 18px;
		height: 18px;
		border-radius: 5px;
		color: var(--fg-tertiary);
		transition:
			background 100ms var(--ease-out),
			color 100ms var(--ease-out);
	}

	.attachment-x:hover {
		background: var(--bg-hover);
		color: var(--fg);
	}

	.attachment-x svg {
		width: 12px;
		height: 12px;
	}

	.composer-error {
		max-width: 680px;
		margin: 0 auto;
		padding-left: 4px;
	}

	.composer-bar {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 4px 6px 6px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		height: 26px;
		padding: 0 8px;
		border-radius: 9999px;
		box-shadow: inset 0 0 0 1px var(--border);
		color: var(--fg-secondary);
		font-size: 12px;
		font-weight: 500;
		transition:
			background 100ms var(--ease-out),
			color 100ms var(--ease-out),
			transform 150ms var(--ease-out);
	}

	.chip:active {
		transform: scale(0.96);
	}

	.chip[aria-pressed='true'] {
		background: var(--bg-muted);
		box-shadow: inset 0 0 0 1px #e0e0e0;
		color: var(--fg);
	}

	.chip:focus-visible {
		outline: none;
		box-shadow: inset 0 0 0 1px var(--border), var(--shadow-focus);
	}

	.composer-hint {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		margin-left: auto;
		margin-right: 6px;
		color: var(--fg-tertiary);
		font-size: 12px;
	}

	.composer-hint kbd:not(:first-child) {
		margin-left: 6px;
	}

	.send {
		display: inline-grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 8px;
		background: linear-gradient(#2b2b2b, var(--accent));
		box-shadow: var(--shadow-btn-primary);
		color: #fff;
		transition:
			opacity 150ms var(--ease-out),
			transform 150ms var(--ease-out);
	}

	.send:active:not(:disabled) {
		transform: scale(0.94);
	}

	.send:disabled {
		opacity: 0.25;
	}

	.send:focus-visible {
		outline: none;
		box-shadow: var(--shadow-focus), var(--shadow-btn-primary);
	}

	.topbar-lead {
		display: flex;
		align-items: center;
		gap: 2px;
		margin-left: -8px;
	}

	/* answer actions */
	.actions :global(.act-btn) {
		--kit-icon-btn-size: 24px;
		--kit-icon-size: 14px;
		--kit-icon-btn-radius: 6px;
	}

	.actions :global(.rate[aria-pressed='true'] svg) {
		animation: rate-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
		fill: rgb(10 10 10 / 0.08);
	}

	@keyframes rate-pop {
		40% {
			transform: scale(1.25) rotate(-8deg);
		}
	}

	.draft-head :global(.draft-copy) {
		--kit-text-btn-height: 22px;
		--kit-icon-btn-color: var(--fg-secondary);
		background: linear-gradient(#fff, #f7f7f7);
		box-shadow: var(--shadow-btn);
		font-size: 12px;
	}

	.toast {
		position: fixed;
		right: 20px;
		bottom: 20px;
		z-index: 70;
		display: flex;
		align-items: center;
		gap: 10px;
		height: 36px;
		padding: 0 6px 0 12px;
		border-radius: 10px;
		background: #171717;
		color: #fafafa;
		font-size: 13px;
		box-shadow: 0 8px 24px -6px rgb(0 0 0 / 0.3);
	}

	.toast-undo {
		height: 24px;
		padding: 0 8px;
		border-radius: 6px;
		background: rgb(255 255 255 / 0.12);
		color: #fff;
		font-size: 12px;
		font-weight: 500;
		transition: background 100ms var(--ease-out);
	}

	.toast-undo:hover {
		background: rgb(255 255 255 / 0.2);
	}

	/* narrow screens: the history column gives way to the conversation */
	@media (max-width: 767px) {
		.app :global(.side-col) {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.app *,
		:global(.model-menu) {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}
	}
</style>
