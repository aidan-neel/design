<script lang="ts">
	import '@fontsource-variable/inter';
	import CopyButton from '#lib/kit/CopyButton.svelte';
	import FieldError from '#lib/kit/FieldError.svelte';
	import IconButton from '#lib/kit/IconButton.svelte';
	import KitRoot from '#lib/kit/KitRoot.svelte';
	import MenuContent from '#lib/kit/MenuContent.svelte';
	import MenuItem from '#lib/kit/MenuItem.svelte';
	import MenuRadioItem from '#lib/kit/MenuRadioItem.svelte';
	import Sidebar from '#lib/kit/Sidebar.svelte';
	import Tip from '#lib/kit/Tip.svelte';
	import { DropdownMenu } from 'bits-ui';
	import { onDestroy, tick } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, fly } from 'svelte/transition';

	// ---------- data ----------
	type ChatId = string;
	type Group = 'today' | 'yesterday' | 'week';

	type Attachment = { id: number; name: string; size: number };

	type Part =
		| { kind: 'p'; text: string }
		| { kind: 'ul'; items: string[] }
		| { kind: 'table' }
		| { kind: 'files'; files: Attachment[] };

	type Msg = {
		id: number;
		role: 'user' | 'assistant';
		parts: Part[];
		full?: string;
		streaming?: boolean;
	};

	type Chat = { id: ChatId; label: string; time: string; group: Group; pinned: boolean };
	type Project = { id: ChatId; label: string; swatch: string };
	type Toast = { id: number; text: string; undo?: () => void };

	const TIER_TEXT =
		"Here are three options tuned for mid-market buyers: Starter — everything a small team needs to evaluate Cove in under a week, free for the first 14 days. Team — predictable per-seat pricing with shared workspaces, SSO, and admin controls. Business — a usage-based tier with burst headroom for teams whose workload spikes month to month. I'd lead with Team; it clears procurement fastest.";

	const SEND_REPLY =
		'Tightened the intro, merged the two predictability points, and moved the recommendation to the top so it reads in under a minute. Want the same pass on the launch email?';

	const MAX_FILE_BYTES = 10 * 1024 * 1024;
	const MAX_FILES = 4;
	const TOAST_MS = 5000;
	const THINKING_MS = 700;

	const store = $state<Record<ChatId, Msg[]>>({
		q4: [
			{
				id: 1,
				role: 'user',
				parts: [
					{
						kind: 'p',
						text: "We're picking Q4 pricing for the mid-market segment. Compare seat-based vs usage-based — which fits us better? Keep it short."
					}
				]
			},
			{
				id: 2,
				role: 'assistant',
				parts: [
					{
						kind: 'p',
						text: 'Short version: seats for predictability, usage for fairness. For mid-market specifically, seat-based usually closes faster.'
					},
					{ kind: 'table' },
					{
						kind: 'ul',
						items: [
							'Mid-market buyers sign annual contracts — a fixed per-seat cost clears procurement faster than an open-ended usage bill.',
							'Usage-based wins on perceived fairness at low volume, but it makes budgeting harder on both sides.',
							'A hybrid (per-seat base, usage overage) captures both, at the cost of a more complex pricing page.'
						]
					},
					{ kind: 'p', text: 'Want this as a one-page summary for the pricing review on Thursday?' }
				]
			},
			{
				id: 3,
				role: 'user',
				parts: [{ kind: 'p', text: 'Good. Draft tier names with a one-line pitch each.' }]
			},
			{
				id: 4,
				role: 'assistant',
				streaming: true,
				full: TIER_TEXT,
				parts: [{ kind: 'p', text: TIER_TEXT.split(' ').slice(0, 16).join(' ') }]
			}
		]
	});

	let chats = $state<Chat[]>([
		{ id: 'q4', label: 'Q4 pricing analysis', time: '2m', group: 'today', pinned: false },
		{ id: 'onboarding', label: 'Onboarding copy rewrite', time: '1h', group: 'today', pinned: false },
		{ id: 'churn', label: 'Churn cohort SQL', time: '4h', group: 'today', pinned: false },
		{ id: 'launch', label: 'Launch email v3', time: '1d', group: 'yesterday', pinned: false },
		{ id: 'macros', label: 'Support macro cleanup', time: '1d', group: 'yesterday', pinned: false },
		{ id: 'roadmap', label: 'Roadmap tradeoffs', time: '4d', group: 'week', pinned: false },
		{ id: 'invoice', label: 'Invoice parser edge cases', time: '5d', group: 'week', pinned: false }
	]);

	const projects: Project[] = [
		{ id: 'site', label: 'Website refresh', swatch: '#ff5a1f' },
		{ id: 'migration', label: 'Data migration', swatch: '#a3a3a3' }
	];

	const GROUPS: { key: Group; label: string }[] = [
		{ key: 'today', label: 'Today' },
		{ key: 'yesterday', label: 'Yesterday' },
		{ key: 'week', label: 'Last 7 days' }
	];

	const workspaces = [
		{ id: 'northwind', name: 'Cove', domain: 'northwind.co', initial: 'C' },
		{ id: 'personal', name: 'Personal', domain: 'aidan@northwind.co', initial: 'P' }
	];

	const models = [
		{ id: 'flash', name: 'Cove 2.5 Flash', meta: 'Fastest' },
		{ id: 'std', name: 'Cove 2.5', meta: 'Balanced' },
		{ id: 'pro', name: 'Cove 2 Pro', meta: 'Most capable' }
	];
	const legacyModels = [{ id: 'legacy', name: 'Cove 1.5', meta: 'Legacy' }];
	const allModels = [...models, ...legacyModels];

	const suggestions = [
		'Compare seat vs usage pricing',
		'Summarize this thread',
		'Rewrite for brevity',
		'Plan a launch timeline'
	];

	const quickActions = ['Make it shorter', 'Add a table', 'Draft a follow-up email'];

	// ---------- state ----------
	let activeId: ChatId | null = $state('q4');
	let workspaceId = $state('northwind');
	let modelId = $state('flash');
	let draft = $state('');
	let query = $state('');
	let sidebarCollapsed = $state(false);
	let attachments = $state<Attachment[]>([]);
	let attachError = $state<string | null>(null);
	let feedback = $state<Record<number, 'up' | 'down'>>({});
	let renaming = $state(false);
	let renameDraft = $state('');
	let toast = $state<Toast | null>(null);
	let pill = $state<{ y: number; h: number } | null>(null);

	let taEl: HTMLTextAreaElement | undefined = $state();
	let searchEl: HTMLInputElement | undefined = $state();
	let renameEl: HTMLInputElement | undefined = $state();
	let navEl: HTMLElement | undefined = $state();
	let msgArea: HTMLElement | undefined = $state();
	let fileInput: HTMLInputElement | undefined = $state();
	let imageInput: HTMLInputElement | undefined = $state();

	let nextId = 100;

	const workspace = $derived(workspaces.find((w) => w.id === workspaceId) ?? workspaces[0]);
	const modelName = $derived(allModels.find((m) => m.id === modelId)?.name ?? models[0].name);
	const activeChat = $derived(chats.find((c) => c.id === activeId));
	const title = $derived(activeChat?.label ?? projects.find((p) => p.id === activeId)?.label ?? 'New chat');
	const msgs = $derived(activeId ? (store[activeId] ?? []) : []);
	const isStreaming = $derived(msgs.some((m) => m.streaming));
	const canSend = $derived(!isStreaming && (draft.trim().length > 0 || attachments.length > 0));

	const visibleChats = $derived.by(() => {
		const needle = query.trim().toLowerCase();
		return needle ? chats.filter((c) => c.label.toLowerCase().includes(needle)) : chats;
	});
	const pinnedChats = $derived(visibleChats.filter((c) => c.pinned));
	const visibleProjects = $derived.by(() => {
		const needle = query.trim().toLowerCase();
		return needle ? projects.filter((p) => p.label.toLowerCase().includes(needle)) : projects;
	});
	const hasResults = $derived(visibleChats.length > 0 || visibleProjects.length > 0);

	function chatsIn(group: Group): Chat[] {
		return visibleChats.filter((c) => c.group === group && !c.pinned);
	}

	// ---------- icons (1.5px stroke, 16px) ----------
	const paths = {
		plus: 'M12 5v14M5 12h14',
		search: 'M21 21l-4.35-4.35M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z',
		chevrons: 'm7 15 5 5 5-5M7 9l5-5 5 5',
		chevron: 'm6 9 6 6 6-6',
		check: 'M20 6 9 17l-5-5',
		arrowUp: 'M12 19V5M5 12l7-7 7 7',
		paperclip:
			'm21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48',
		image: 'M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
		refresh: 'M21 12a9 9 0 1 1-2.64-6.36L21 8M21 3v5h-5',
		thumbUp:
			'M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z',
		thumbDown:
			'M17 14V2M11 18.12 12 14H6.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 8.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z',
		share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
		sparkle:
			'M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z',
		stop: 'M9 9h6v6H9z',
		panel: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 3v18',
		pencil: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z',
		pin: 'M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z',
		trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
		link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
		download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
		sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
		logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
		users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
		bolt: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
		x: 'M18 6 6 18M6 6l12 12',
		file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6'
	};
	type IconName = keyof typeof paths;

	// ---------- first-paint reveal (class removed on end so no stacking context lingers) ----------
	function reveal(node: HTMLElement, delay = 0) {
		node.classList.add('reveal');
		if (delay) node.style.animationDelay = `${delay}ms`;
		node.addEventListener(
			'animationend',
			() => {
				node.classList.remove('reveal');
				node.style.animationDelay = '';
			},
			{ once: true }
		);
	}

	// ---------- streaming ----------
	const timers = new Set<ReturnType<typeof setTimeout>>();

	function later(ms: number, run: () => void): void {
		const t = setTimeout(() => {
			timers.delete(t);
			run();
		}, ms);
		timers.add(t);
	}

	function clearTimers(): void {
		for (const t of timers) clearTimeout(t);
		timers.clear();
	}

	function streamInto(chat: ChatId, msgId: number, full: string, speed = 60): void {
		const msg = store[chat]?.find((m) => m.id === msgId);
		if (!msg) return;
		const words = full.split(' ');
		let shown = Math.max(1, Math.floor(words.length * 0.18));
		msg.full = full;
		msg.streaming = true;
		const step = () => {
			shown += 1;
			msg.parts = [{ kind: 'p', text: words.slice(0, shown).join(' ') }];
			if (shown >= words.length) msg.streaming = false;
			else later(speed, step);
		};
		step();
	}

	function stopStreaming(): void {
		clearTimers();
		for (const list of Object.values(store)) {
			for (const m of list) {
				if (!m.streaming) continue;
				m.streaming = false;
				if (m.parts.length === 0) m.parts = [{ kind: 'p', text: 'Stopped.' }];
			}
		}
	}

	// ---------- chats ----------
	function selectChat(id: ChatId): void {
		activeId = id;
		renaming = false;
		store[id] ??= [];
	}

	function newChat(): void {
		stopStreaming();
		const id = `c${nextId++}`;
		chats.unshift({ id, label: 'New conversation', time: 'now', group: 'today', pinned: false });
		store[id] = [];
		activeId = id;
		draft = '';
		tick().then(() => taEl?.focus());
	}

	function togglePin(id: ChatId): void {
		const chat = chats.find((c) => c.id === id);
		if (chat) chat.pinned = !chat.pinned;
	}

	function deleteChat(id: ChatId): void {
		const index = chats.findIndex((c) => c.id === id);
		if (index === -1) return;
		const [removed] = chats.splice(index, 1);
		const wasActive = activeId === id;
		if (wasActive) activeId = chats[Math.min(index, chats.length - 1)]?.id ?? null;
		showToast(`Deleted “${removed.label}”`, () => {
			chats.splice(index, 0, removed);
			if (wasActive) activeId = removed.id;
		});
	}

	async function startRename(id: ChatId): Promise<void> {
		selectChat(id);
		const chat = chats.find((c) => c.id === id);
		if (!chat) return;
		renameDraft = chat.label;
		renaming = true;
		await tick();
		renameEl?.select();
	}

	function commitRename(): void {
		if (!renaming) return;
		renaming = false;
		const label = renameDraft.trim();
		if (activeChat && label) activeChat.label = label;
	}

	function onRenameKeydown(e: KeyboardEvent): void {
		if (e.key === 'Enter') commitRename();
		if (e.key === 'Escape') renaming = false;
	}

	// ---------- composer ----------
	function autoSize(): void {
		if (!taEl) return;
		taEl.style.height = 'auto';
		taEl.style.height = `${Math.min(taEl.scrollHeight, 160)}px`;
	}

	function send(): void {
		if (!canSend) return;
		if (!activeId) newChat();
		const chat = activeId;
		if (!chat) return;
		const list = (store[chat] ??= []);
		const parts: Part[] = [];
		if (attachments.length) parts.push({ kind: 'files', files: attachments });
		if (draft.trim()) parts.push({ kind: 'p', text: draft.trim() });
		list.push({ id: nextId++, role: 'user', parts });
		const replyId = nextId++;
		list.push({ id: replyId, role: 'assistant', streaming: true, parts: [] });
		draft = '';
		attachments = [];
		attachError = null;
		tick().then(autoSize);
		later(THINKING_MS, () => streamInto(chat, replyId, SEND_REPLY));
	}

	function retry(msg: Msg): void {
		if (!activeId || !msg.full || isStreaming) return;
		streamInto(activeId, msg.id, msg.full);
	}

	function useSuggestion(text: string): void {
		draft = text;
		taEl?.focus();
		tick().then(autoSize);
	}

	function addFiles(event: Event): void {
		const input = event.currentTarget as HTMLInputElement;
		const files = [...(input.files ?? [])];
		input.value = '';
		const tooBig = files.find((f) => f.size > MAX_FILE_BYTES);
		if (tooBig) {
			attachError = `${tooBig.name} is ${formatSize(tooBig.size)}. Files can be up to 10 MB.`;
			return;
		}
		if (attachments.length + files.length > MAX_FILES) {
			attachError = `You can attach up to ${MAX_FILES} files per message.`;
			return;
		}
		attachError = null;
		attachments = [...attachments, ...files.map((f) => ({ id: nextId++, name: f.name, size: f.size }))];
		taEl?.focus();
	}

	function removeAttachment(id: number): void {
		attachments = attachments.filter((a) => a.id !== id);
		attachError = null;
		taEl?.focus();
	}

	function formatSize(bytes: number): string {
		if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
		return `${Math.max(1, Math.round(bytes / 1024))} KB`;
	}

	// ---------- message actions ----------
	function messageText(msg: Msg): string {
		return msg.parts
			.map((p) => {
				if (p.kind === 'p') return p.text;
				if (p.kind === 'ul') return p.items.map((item) => `- ${item}`).join('\n');
				if (p.kind === 'table')
					return '| | Seat-based | Usage-based |\n|---|---|---|\n| Predictability | Fixed monthly cost | Varies with volume |\n| Best fit | Stable team size | Spiky workloads |\n| Procurement | Easy to approve | Needs forecasting |';
				return p.files.map((f) => `[${f.name}]`).join(' ');
			})
			.join('\n\n');
	}

	function rate(msg: Msg, value: 'up' | 'down'): void {
		if (feedback[msg.id] === value) delete feedback[msg.id];
		else feedback[msg.id] = value;
	}

	// ---------- share ----------
	async function copyLink(): Promise<void> {
		const url = `${location.origin}/chatapp?c=${activeId ?? ''}`;
		try {
			await navigator.clipboard.writeText(url);
			showToast('Link copied');
		} catch (error) {
			console.error('Clipboard write was refused', error);
			showToast('Couldn’t copy the link. Check clipboard permissions.');
		}
	}

	function exportMarkdown(): void {
		const body = msgs.map((m) => `**${m.role === 'user' ? 'You' : 'Cove'}:** ${messageText(m)}`).join('\n\n');
		const url = URL.createObjectURL(new Blob([`# ${title}\n\n${body}\n`], { type: 'text/markdown' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
		link.click();
		URL.revokeObjectURL(url);
		showToast('Exported as Markdown');
	}

	// ---------- toast ----------
	let toastTimer: ReturnType<typeof setTimeout> | undefined;

	function showToast(text: string, undo?: () => void): void {
		clearTimeout(toastTimer);
		toast = { id: nextId++, text, undo };
		toastTimer = setTimeout(() => (toast = null), TOAST_MS);
	}

	function undoToast(): void {
		toast?.undo?.();
		clearTimeout(toastTimer);
		toast = null;
	}

	// ---------- active pill ----------
	async function measurePill(): Promise<void> {
		await tick();
		const el = activeId ? navEl?.querySelector<HTMLElement>(`[data-id="${activeId}"]`) : null;
		pill = el && navEl ? { y: offsetWithin(el, navEl), h: el.offsetHeight } : null;
	}

	/** Layout offset of `el` inside `ancestor`; unlike getBoundingClientRect it ignores the reveal transforms. */
	function offsetWithin(el: HTMLElement, ancestor: HTMLElement): number {
		let y = 0;
		let node: Element | null = el;
		while (node instanceof HTMLElement && node !== ancestor) {
			y += node.offsetTop;
			node = node.offsetParent;
		}
		return y;
	}

	$effect(() => {
		void activeId;
		void visibleChats.map((c) => `${c.id}${c.pinned}`).join();
		void visibleProjects.length;
		measurePill();
	});

	// ---------- scrolling ----------
	/** Follow new content (stream, actions, a taller composer) only while the reader is at the bottom. */
	function stickToBottom(node: HTMLElement) {
		const content = node.firstElementChild;
		let atBottom = true;
		const onScroll = () => {
			atBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
		};
		const observer = new ResizeObserver(() => {
			if (atBottom) node.scrollTop = node.scrollHeight;
		});
		observer.observe(node);
		if (content) observer.observe(content);
		node.addEventListener('scroll', onScroll, { passive: true });
		return {
			destroy() {
				observer.disconnect();
				node.removeEventListener('scroll', onScroll);
			}
		};
	}

	$effect(() => {
		void msgs.length;
		void activeId;
		tick().then(() => {
			if (msgArea) msgArea.scrollTop = msgArea.scrollHeight;
		});
	});

	// kick off the in-progress stream on load
	$effect(() => {
		later(600, () => streamInto('q4', 4, TIER_TEXT, 70));
		return clearTimers;
	});

	onDestroy(() => clearTimeout(toastTimer));

	function onWindowKeydown(e: KeyboardEvent): void {
		const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, [contenteditable]');
		if (e.key === '/' && !typing) {
			e.preventDefault();
			searchEl?.focus();
		}
	}

	function onSearchKeydown(e: KeyboardEvent): void {
		if (e.key !== 'Escape') return;
		query = '';
		searchEl?.blur();
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<svelte:head>
	<title>Cove — {title}</title>
</svelte:head>

{#snippet icon(name: IconName, cls = 'size-4')}
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		class={cls}
		aria-hidden="true"
	>
		<path d={paths[name]} />
	</svg>
{/snippet}

{#snippet dots()}
	<svg viewBox="0 0 24 24" fill="currentColor" class="size-4" aria-hidden="true">
		<circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
	</svg>
{/snippet}

{#snippet chatMenuItems(c: Chat)}
	<MenuItem onSelect={() => startRename(c.id)}>{@render icon('pencil')}Rename</MenuItem>
	<MenuItem onSelect={() => togglePin(c.id)}>{@render icon('pin')}{c.pinned ? 'Unpin' : 'Pin to top'}</MenuItem>
	<DropdownMenu.Separator class="kit-menu-sep" />
	<MenuItem tone="danger" onSelect={() => deleteChat(c.id)}>{@render icon('trash')}Delete</MenuItem>
{/snippet}

{#snippet chatRow(c: Chat)}
	<li class="group/row relative">
		<button
			data-id={c.id}
			onclick={() => selectChat(c.id)}
			aria-current={activeId === c.id ? 'page' : undefined}
			class="row relative z-10 flex h-7 w-full items-center gap-2 pr-1 pl-2.5 text-left text-[13px] whitespace-nowrap transition-colors duration-[120ms] {activeId === c.id ? 'text-[#171717]' : 'text-[#525252] hover:bg-black/[.04] hover:text-[#171717]'}"
		>
			<span class="min-w-0 flex-1 truncate">{c.label}</span>
			<span class="w-7 shrink-0 text-right text-[11px] tabular-nums text-[#a3a3a3] transition-opacity duration-100 group-hover/row:opacity-0 group-has-[[data-state=open]]/row:opacity-0">{c.time}</span>
		</button>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				aria-label="Options for {c.label}"
				class="row-menu absolute top-1/2 right-0.5 z-20 grid size-6 -translate-y-1/2 place-items-center text-[#737373] opacity-0 transition-[opacity,background-color,color] duration-100 group-hover/row:opacity-100 hover:bg-black/[.06] hover:text-[#171717] focus-visible:opacity-100 data-[state=open]:bg-black/[.06] data-[state=open]:opacity-100"
			>
				{@render dots()}
			</DropdownMenu.Trigger>
			<MenuContent align="start" side="right" sideOffset={8} minWidth={168}>
				{@render chatMenuItems(c)}
			</MenuContent>
		</DropdownMenu.Root>
	</li>
{/snippet}

<KitRoot class="chatapp flex h-dvh overflow-hidden bg-[#f7f7f7]">
	<!-- ============ sidebar (inset shell: shares the app tint, no fill of its own) ============ -->
	<Sidebar bind:collapsed={sidebarCollapsed} defaultWidth={252} minWidth={208} maxWidth={380} class="max-md:hidden">
		{#snippet children()}
			<aside class="flex h-full flex-col px-3 pt-3 pb-3">
				<!-- workspace switcher: same left edge and width as every row below it -->
				<div use:reveal>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="flex h-10 w-full items-center gap-2.5 px-2.5 text-left transition-colors duration-[120ms] hover:bg-black/[.04] data-[state=open]:bg-black/[.04]"
						>
							<span class="grid size-6 shrink-0 place-items-center bg-[#ff5a1f] text-[11px] font-medium text-white">{workspace.initial}</span>
							<span class="min-w-0 flex-1 leading-[1.2]">
								<span class="block truncate text-[13.5px] font-medium tracking-[-0.01em] text-[#171717]">{workspace.name}</span>
								<span class="block truncate text-[11px] text-[#a3a3a3]">{workspace.domain}</span>
							</span>
							{@render icon('chevrons', 'size-3.5 shrink-0 text-[#a3a3a3]')}
						</DropdownMenu.Trigger>
						<MenuContent minWidth={228}>
							<DropdownMenu.Group>
								<DropdownMenu.GroupHeading class="kit-menu-label">Workspaces</DropdownMenu.GroupHeading>
								<DropdownMenu.RadioGroup bind:value={workspaceId}>
									{#each workspaces as w (w.id)}
										<MenuRadioItem value={w.id} meta={w.id === 'northwind' ? '12 members' : 'Just you'}>
											<span class="grid size-4 shrink-0 place-items-center bg-[#ffe8dc] text-[9px] font-semibold text-[#c2410c]">{w.initial}</span>
											{w.name}
										</MenuRadioItem>
									{/each}
								</DropdownMenu.RadioGroup>
							</DropdownMenu.Group>
							<DropdownMenu.Separator class="kit-menu-sep" />
							<MenuItem onSelect={() => showToast('Invite link copied')}>{@render icon('users')}Invite members</MenuItem>
							<MenuItem onSelect={() => showToast('Workspace settings are read-only in this demo')}>{@render icon('sliders')}Workspace settings</MenuItem>
						</MenuContent>
					</DropdownMenu.Root>
				</div>

				<!-- primary action -->
				<div class="mt-2" use:reveal={40}>
					<button
						onclick={newChat}
						class="press inline-flex h-8 w-full items-center justify-center gap-1.5 bg-[#ff5a1f] px-3 text-[13.5px] font-medium text-white select-none hover:bg-[#e84e12]"
					>
						{@render icon('plus')}
						New chat
					</button>
				</div>

				<!-- search: the wrapper owns the focus ring, the input never draws one -->
				<div class="mt-2" use:reveal={80}>
					<label
						class="field flex h-8 items-center gap-2 bg-white px-2.5 shadow-[0_1px_2px_rgb(40_40_40/.08),0_0_0_1px_#ececec] transition-shadow duration-150"
					>
						{@render icon('search', 'size-3.5 shrink-0 text-[#a3a3a3]')}
						<input
							bind:this={searchEl}
							bind:value={query}
							onkeydown={onSearchKeydown}
							class="min-w-0 flex-1 bg-transparent text-[13px] text-[#171717] placeholder:text-[#a3a3a3]"
							placeholder="Search chats"
							aria-label="Search chats"
						/>
						{#if query}
							<button
								onclick={() => {
									query = '';
									searchEl?.focus();
								}}
								aria-label="Clear search"
								class="grid size-5 place-items-center text-[#a3a3a3] transition-colors duration-100 hover:text-[#171717]"
								in:fade={{ duration: 120 }}
							>
								{@render icon('x', 'size-3.5')}
							</button>
						{:else}
							<kbd class="kcap">/</kbd>
						{/if}
					</label>
				</div>

				<!-- nav -->
				<nav aria-label="Chats" bind:this={navEl} class="relative mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2">
					{#if pill}
						<div
							class="pointer-events-none absolute inset-x-0 top-0 z-0 bg-white shadow-[0_1px_2px_rgb(40_40_40/.08),0_0_0_1px_#ececec] transition-[transform,height] duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)]"
							style="transform: translateY({pill.y}px); height: {pill.h}px"
						></div>
					{/if}

					{#if pinnedChats.length}
						<section class="relative" use:reveal={100}>
							<h2 class="mb-1 px-2.5 text-[11px] font-medium text-[#a3a3a3]">Pinned</h2>
							<ul class="flex flex-col gap-0.5">
								{#each pinnedChats as c (c.id)}{@render chatRow(c)}{/each}
							</ul>
						</section>
					{/if}

					{#each GROUPS as g, gi (g.key)}
						{@const list = chatsIn(g.key)}
						{#if list.length}
							<section class="relative" use:reveal={120 + gi * 40}>
								<h2 class="mb-1 px-2.5 text-[11px] font-medium text-[#a3a3a3]">{g.label}</h2>
								<ul class="flex flex-col gap-0.5">
									{#each list as c (c.id)}{@render chatRow(c)}{/each}
								</ul>
							</section>
						{/if}
					{/each}

					{#if visibleProjects.length}
						<section class="relative" use:reveal={240}>
							<h2 class="mb-1 px-2.5 text-[11px] font-medium text-[#a3a3a3]">Projects</h2>
							<ul class="flex flex-col gap-0.5">
								{#each visibleProjects as p (p.id)}
									<li>
										<button
											data-id={p.id}
											onclick={() => selectChat(p.id)}
											aria-current={activeId === p.id ? 'page' : undefined}
											class="row relative z-10 flex h-7 w-full items-center gap-2 px-2.5 text-left text-[13px] whitespace-nowrap transition-colors duration-[120ms] {activeId === p.id ? 'text-[#171717]' : 'text-[#525252] hover:bg-black/[.04] hover:text-[#171717]'}"
										>
											<span class="size-2.5 shrink-0" style="background: {p.swatch}"></span>
											<span class="truncate">{p.label}</span>
										</button>
									</li>
								{/each}
							</ul>
						</section>
					{/if}

					{#if !hasResults}
						<p class="px-2.5 pt-1 text-[12.5px] text-[#a3a3a3]" in:fade={{ duration: 150 }}>
							No chats match “{query.trim()}”.
						</p>
					{/if}
				</nav>

				<!-- footer: account menu + plan usage -->
				<div class="mt-auto border-t border-black/[.06] pt-2" use:reveal={280}>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="flex h-11 w-full items-center gap-2.5 px-2.5 text-left transition-colors duration-[120ms] hover:bg-black/[.04] data-[state=open]:bg-black/[.04]"
						>
							<span class="grid size-6 shrink-0 place-items-center bg-[#ffe8dc] text-[10px] font-medium text-[#c2410c]">AK</span>
							<span class="min-w-0 flex-1 leading-[1.2]">
								<span class="block truncate text-[13px] font-medium text-[#171717]">Aidan Kelly</span>
								<span class="block truncate text-[11px] text-[#a3a3a3]">aidan@northwind.co</span>
							</span>
							{@render icon('chevrons', 'size-3.5 shrink-0 text-[#a3a3a3]')}
						</DropdownMenu.Trigger>
						<MenuContent side="top" minWidth={220}>
							<MenuItem onSelect={() => showToast('Settings are read-only in this demo')} keys={['⌘', ',']}>{@render icon('sliders')}Settings</MenuItem>
							<MenuItem onSelect={() => showToast('Opening plans…')}>{@render icon('bolt')}Upgrade plan</MenuItem>
							<DropdownMenu.Separator class="kit-menu-sep" />
							<MenuItem onSelect={() => showToast('Signed out (not really, it’s a demo)')}>{@render icon('logout')}Sign out</MenuItem>
						</MenuContent>
					</DropdownMenu.Root>
					<div class="mt-2 px-2.5">
						<div class="flex items-baseline justify-between text-[11px] text-[#737373]">
							<span>Pro plan</span>
							<span class="tabular-nums text-[#a3a3a3]">1,247 / 2,000 credits</span>
						</div>
						<div class="mt-1.5 h-1 overflow-hidden bg-[#ececec]">
							<div class="h-full w-[62%] bg-[#ff5a1f]"></div>
						</div>
					</div>
				</div>
			</aside>
		{/snippet}
	</Sidebar>

	<!-- ============ main inset panel ============ -->
	<main
		class="my-2 mr-2 flex min-w-0 flex-1 flex-col overflow-hidden bg-white shadow-[0_0_0_1px_rgb(0_0_0/.06),0_1px_2px_rgb(0_0_0/.04)] transition-[margin] duration-[240ms] ease-[cubic-bezier(.23,1,.32,1)] max-md:m-0 {sidebarCollapsed ? 'ml-2' : 'ml-0'}"
	>
		<!-- top bar -->
		<header class="flex h-12 shrink-0 items-center gap-2 border-b border-[#ececec] pr-3 pl-2" use:reveal={60}>
			<IconButton
				label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
				keys={['⌘', 'B']}
				side="bottom"
				onclick={() => (sidebarCollapsed = !sidebarCollapsed)}
				class="max-md:hidden"
			>
				{@render icon('panel')}
			</IconButton>
			{#if sidebarCollapsed}
				<span in:fly={{ x: -6, duration: 200, easing: cubicOut }}>
					<IconButton label="New chat" side="bottom" onclick={newChat}>{@render icon('plus')}</IconButton>
				</span>
			{/if}

			<div class="ml-1 flex min-w-0 items-baseline gap-2">
				{#if renaming}
					<input
						bind:this={renameEl}
						class=" h-7 w-[min(360px,40vw)] bg-white px-1.5 text-[14px] font-medium tracking-[-0.01em] text-[#171717] shadow-[0_0_0_1px_#ff5a1f,0_0_0_3px_rgb(255_90_31/.15)]"
						bind:value={renameDraft}
						onkeydown={onRenameKeydown}
						onblur={commitRename}
						aria-label="Chat name"
					/>
				{:else}
					<h1 class="truncate px-1.5 text-[14px] font-medium tracking-[-0.01em] text-[#171717]">{title}</h1>
					{#if msgs.length > 0}
						<span class="shrink-0 text-[11px] tabular-nums text-[#a3a3a3] max-md:hidden">{msgs.length} messages</span>
					{/if}
				{/if}
			</div>

			<div class="ml-auto flex items-center gap-1">
				<!-- model selector -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="press inline-flex h-8 items-center gap-1.5 bg-gradient-to-b from-white to-[#f7f7f7] px-2.5 text-[13px] font-medium whitespace-nowrap text-[#171717] select-none shadow-[0_1px_2px_rgb(40_40_40/.08),0_0_0_1px_#ececec] hover:to-[#f2f2f2] data-[state=open]:to-[#f2f2f2] [&[data-state=open]_.chev]:rotate-180"
					>
						{modelName}
						{@render icon('chevron', 'chev size-3.5 text-[#a3a3a3] transition-transform duration-200')}
					</DropdownMenu.Trigger>
					<MenuContent align="end" minWidth={248}>
						<DropdownMenu.RadioGroup bind:value={modelId}>
							<DropdownMenu.Group>
								<DropdownMenu.GroupHeading class="kit-menu-label">Latest</DropdownMenu.GroupHeading>
								{#each models as m (m.id)}
									<MenuRadioItem value={m.id} meta={m.meta}>{m.name}</MenuRadioItem>
								{/each}
							</DropdownMenu.Group>
							<DropdownMenu.Separator class="kit-menu-sep" />
							<DropdownMenu.Group>
								<DropdownMenu.GroupHeading class="kit-menu-label">Legacy</DropdownMenu.GroupHeading>
								{#each legacyModels as m (m.id)}
									<MenuRadioItem value={m.id} meta={m.meta}>{m.name}</MenuRadioItem>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.RadioGroup>
						<DropdownMenu.Separator class="kit-menu-sep" />
						<p class="px-2 pt-1 pb-1.5 text-[11px] leading-[1.4] text-[#a3a3a3]">Cove 2.5 Flash is fastest for everyday chats.</p>
					</MenuContent>
				</DropdownMenu.Root>

				<span class="mx-1 h-4 w-px bg-[#ececec]"></span>

				<DropdownMenu.Root>
					<Tip label="Share" side="bottom">
						{#snippet trigger({ props })}
							<DropdownMenu.Trigger {...props} aria-label="Share" class="kit-icon-btn">{@render icon('share')}</DropdownMenu.Trigger>
						{/snippet}
					</Tip>
					<MenuContent align="end" minWidth={200}>
						<MenuItem onSelect={copyLink}>{@render icon('link')}Copy link</MenuItem>
						<MenuItem onSelect={exportMarkdown} disabled={msgs.length === 0}>{@render icon('download')}Export as Markdown</MenuItem>
					</MenuContent>
				</DropdownMenu.Root>

				<DropdownMenu.Root>
					<Tip label="More" side="bottom">
						{#snippet trigger({ props })}
							<DropdownMenu.Trigger {...props} aria-label="Chat options" class="kit-icon-btn" disabled={!activeChat}>{@render dots()}</DropdownMenu.Trigger>
						{/snippet}
					</Tip>
					<MenuContent align="end" minWidth={180}>
						{#if activeChat}{@render chatMenuItems(activeChat)}{/if}
					</MenuContent>
				</DropdownMenu.Root>
			</div>
		</header>

		<!-- messages -->
		<div bind:this={msgArea} use:stickToBottom class="min-h-0 flex-1 overflow-y-auto">
			<div class="min-h-full">
				{#if msgs.length === 0}
					<!-- empty state -->
					<div class="grid min-h-full place-items-center px-6">
						<div class="w-full max-w-[440px] text-center" use:reveal={80}>
							<span class="mx-auto grid size-10 place-items-center bg-[#fff3ec] text-[#d9480f]">
								{@render icon('sparkle', 'size-5')}
							</span>
							<p class="mt-3 text-[16px] font-medium tracking-[-0.01em] text-[#171717]">How can I help, Aidan?</p>
							<p class="mt-1 text-[13px] text-[#737373]">Ask anything, or start from one of these.</p>
							<div class="mt-4 grid grid-cols-2 gap-2 text-left">
								{#each suggestions as s (s)}
									<button
										onclick={() => useSuggestion(s)}
										class="press bg-gradient-to-b from-white to-[#f7f7f7] px-3 py-2.5 text-left text-[13px] text-[#171717] shadow-[0_1px_2px_rgb(40_40_40/.08),0_0_0_1px_#ececec] hover:to-[#f2f2f2]"
									>
										{s}
									</button>
								{/each}
							</div>
						</div>
					</div>
				{:else}
					<div class="mx-auto w-full max-w-[720px] px-5 pt-4 pb-4">
						<div class="flex items-center gap-3 py-1" use:reveal={80}>
							<span class="h-px flex-1 bg-[#ececec]"></span>
							<span class="text-[11px] font-medium text-[#a3a3a3]">Today</span>
							<span class="h-px flex-1 bg-[#ececec]"></span>
						</div>

						<div class="mt-3 flex flex-col gap-5">
							{#each msgs as m, i (m.id)}
								{#if m.role === 'user'}
									<div class="flex flex-col items-end gap-1.5" use:reveal={Math.min(120 + i * 40, 280)}>
										{#each m.parts as p, j (j)}
											{#if p.kind === 'files'}
												<div class="flex max-w-[80%] flex-wrap justify-end gap-1.5">
													{#each p.files as f (f.id)}
														<span class="inline-flex h-8 items-center gap-2 bg-white px-2.5 text-[12.5px] text-[#171717] shadow-[0_0_0_1px_#ececec]">
															{@render icon('file', 'size-3.5 text-[#a3a3a3]')}
															<span class="max-w-[180px] truncate">{f.name}</span>
															<span class="text-[11px] text-[#a3a3a3] tabular-nums">{formatSize(f.size)}</span>
														</span>
													{/each}
												</div>
											{:else if p.kind === 'p'}
												<p class="max-w-[80%] bg-[#fff3ec] px-3.5 py-2.5 text-[14px] leading-[1.5] text-[#171717]">{p.text}</p>
											{/if}
										{/each}
									</div>
								{:else}
									<div class="group flex gap-2.5" use:reveal={Math.min(120 + i * 40, 280)}>
										<span class="mt-0.5 grid size-6 shrink-0 place-items-center bg-[#ff5a1f] text-white">
											{@render icon('sparkle', 'size-3.5')}
										</span>
										<div class="min-w-0 flex-1">
											{#if m.streaming && m.parts.length === 0}
												<div class="space-y-2 pt-1.5" role="status" aria-label="Cove is thinking">
													<div class="skeleton h-3 w-[72%]"></div>
													<div class="skeleton h-3 w-[54%]"></div>
												</div>
											{:else}
												<div class="space-y-3 text-[14px] leading-[1.55] text-[#171717]">
													{#each m.parts as p, j (j)}
														{#if p.kind === 'p'}
															<p class={m.streaming ? 'caret' : ''}>{p.text}</p>
														{:else if p.kind === 'ul'}
															<ul class="list-disc space-y-1 pl-[18px] marker:text-[#c0c0c0]">
																{#each p.items as it (it)}
																	<li>{it}</li>
																{/each}
															</ul>
														{:else if p.kind === 'table'}
															<div class="overflow-x-auto shadow-[0_0_0_1px_#ececec]">
																<table class="w-full min-w-[420px] border-collapse text-[13px]">
																	<thead>
																		<tr class="bg-[#fafafa] text-left">
																			<th class="w-[34%] px-3 py-2 text-[12px] font-medium text-[#737373]"><span class="sr-only">Factor</span></th>
																			<th class="px-3 py-2 text-[12px] font-medium text-[#737373]">Seat-based</th>
																			<th class="px-3 py-2 text-[12px] font-medium text-[#737373]">Usage-based</th>
																		</tr>
																	</thead>
																	<tbody class="text-[#171717]">
																		<tr class="border-t border-[#ececec]">
																			<td class="px-3 py-2 text-[#737373]">Predictability</td>
																			<td class="px-3 py-2">Fixed monthly cost</td>
																			<td class="px-3 py-2">Varies with volume</td>
																		</tr>
																		<tr class="border-t border-[#ececec]">
																			<td class="px-3 py-2 text-[#737373]">Best fit</td>
																			<td class="px-3 py-2">Stable team size</td>
																			<td class="px-3 py-2">Spiky workloads</td>
																		</tr>
																		<tr class="border-t border-[#ececec]">
																			<td class="px-3 py-2 text-[#737373]">Procurement</td>
																			<td class="px-3 py-2">Easy to approve</td>
																			<td class="px-3 py-2">Needs forecasting</td>
																		</tr>
																	</tbody>
																</table>
															</div>
														{/if}
													{/each}
												</div>
												{#if !m.streaming}
													<!-- actions: dimmed at rest, full on hover; never hidden from keyboard users -->
													<div class="msg-actions mt-1.5 -ml-1 flex items-center gap-0.5" in:fade={{ duration: 150 }}>
														<CopyButton text={() => messageText(m)} label="Copy" />
														<IconButton label="Retry" onclick={() => retry(m)} disabled={isStreaming}>{@render icon('refresh')}</IconButton>
														<IconButton label="Good response" aria-pressed={feedback[m.id] === 'up'} onclick={() => rate(m, 'up')} class="fb">
															{@render icon('thumbUp')}
														</IconButton>
														<IconButton label="Bad response" aria-pressed={feedback[m.id] === 'down'} onclick={() => rate(m, 'down')} class="fb">
															{@render icon('thumbDown')}
														</IconButton>
														<span class="ml-1.5 text-[11px] text-[#a3a3a3]">{modelName}</span>
													</div>
												{/if}
											{/if}
										</div>
									</div>
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- composer -->
		<div class="shrink-0 px-4 pb-3" use:reveal={200}>
			<div class="mx-auto w-full max-w-[720px]">
				{#if msgs.length > 0}
					<div class="mb-2 flex flex-wrap gap-1.5">
						{#each quickActions as qa (qa)}
							<button
								onclick={() => useSuggestion(qa)}
								class="press inline-flex h-[26px] items-center bg-gradient-to-b from-white to-[#f7f7f7] px-2.5 text-[12px] font-medium text-[#737373] shadow-[0_1px_2px_rgb(40_40_40/.08),0_0_0_1px_#ececec] hover:text-[#171717]"
							>
								{qa}
							</button>
						{/each}
					</div>
				{/if}

				<div
					class="composer bg-white shadow-[0_1px_2px_rgb(40_40_40/.08),0_0_0_1px_#ececec] transition-shadow duration-150 {attachError ? 'has-error' : ''}"
				>
					{#if attachments.length}
						<div class="flex flex-wrap gap-1.5 px-2.5 pt-2.5">
							{#each attachments as a (a.id)}
								<span
									class="inline-flex h-7 items-center gap-1.5 bg-[#f7f7f7] pr-1 pl-2 text-[12px] text-[#171717] shadow-[0_0_0_1px_#ececec]"
									in:fly={{ y: 4, duration: 180, easing: cubicOut }}
									out:fade={{ duration: 100 }}
								>
									{@render icon('file', 'size-3.5 text-[#a3a3a3]')}
									<span class="max-w-[160px] truncate">{a.name}</span>
									<span class="text-[11px] tabular-nums text-[#a3a3a3]">{formatSize(a.size)}</span>
									<button
										onclick={() => removeAttachment(a.id)}
										aria-label="Remove {a.name}"
										class="grid size-5 place-items-center text-[#a3a3a3] transition-colors duration-100 hover:bg-black/[.05] hover:text-[#171717]"
									>
										{@render icon('x', 'size-3')}
									</button>
								</span>
							{/each}
						</div>
					{/if}
					<textarea
						bind:this={taEl}
						bind:value={draft}
						oninput={autoSize}
						onkeydown={(e) => {
							if (e.key === 'Enter' && !e.shiftKey) {
								e.preventDefault();
								send();
							}
						}}
						rows="1"
						placeholder="Reply to Cove…"
						aria-label="Message Cove"
						class="block max-h-[160px] w-full resize-none bg-transparent px-3.5 pt-3 pb-1 text-[14px] leading-[1.5] text-[#171717] placeholder:text-[#a3a3a3]"
					></textarea>
					<div class="flex items-center gap-0.5 px-2 pb-2">
						<input bind:this={fileInput} type="file" multiple class="hidden" onchange={addFiles} />
						<input bind:this={imageInput} type="file" accept="image/*" multiple class="hidden" onchange={addFiles} />
						<IconButton label="Attach files" onclick={() => fileInput?.click()}>{@render icon('paperclip')}</IconButton>
						<IconButton label="Add image" onclick={() => imageInput?.click()}>{@render icon('image')}</IconButton>
						<div class="ml-auto flex items-center gap-2">
							<span class="kcap transition-opacity duration-150 {draft.trim() && !isStreaming ? 'opacity-100' : 'opacity-0'}" aria-hidden="true">⏎</span>
							<IconButton
								label={isStreaming ? 'Stop generating' : 'Send message'}
								onclick={isStreaming ? stopStreaming : send}
								disabled={!isStreaming && !canSend}
								class="send"
							>
								<span class="swap">
									<svg data-active={isStreaming ? undefined : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={paths.arrowUp} /></svg>
									<svg data-active={isStreaming ? '' : undefined} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={paths.stop} /></svg>
								</span>
							</IconButton>
						</div>
					</div>
				</div>
				<FieldError message={attachError} />
				<p class="pt-2 text-center text-[11px] text-[#a3a3a3]">Cove can make mistakes. Verify important information.</p>
			</div>
		</div>
	</main>

	<!-- toast: one at a time, undo where the action can be reversed -->
	{#if toast}
		{#key toast.id}
			<div
				class="fixed right-5 bottom-5 z-50 flex h-10 items-center gap-3 bg-[#171717] pr-1.5 pl-3.5 text-[13px] text-white shadow-[0_8px_24px_-6px_rgb(0_0_0/.3)]"
				role="status"
				in:fly={{ y: 12, duration: 220, easing: cubicOut }}
				out:fade={{ duration: 140 }}
			>
				<span class="whitespace-nowrap">{toast.text}</span>
				{#if toast.undo}
					<button onclick={undoToast} class="h-7 bg-white/10 px-2.5 text-[12.5px] font-medium text-white transition-colors duration-100 hover:bg-white/20">
						Undo
					</button>
				{:else}
					<span class="w-1.5"></span>
				{/if}
			</div>
		{/key}
	{/if}
</KitRoot>

<style>
	:global(.chatapp) {
		font-family: 'Inter Variable', 'Inter', ui-sans-serif, system-ui, sans-serif;
		font-feature-settings: 'cv11', 'ss01';
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;

		/* hard edges, one orange accent */
		--kit-pop-radius: 0;
		--kit-item-radius: 0;
		--kit-tip-radius: 0;
		--kit-icon-btn-radius: 0;
		--kit-key-bg: #f4f4f4;
		--kit-accent: #ea580c;
		--kit-success: #ea580c;
		--kit-icon-btn-color: #a3a3a3;
		--kit-icon-btn-hover-bg: rgb(0 0 0 / 0.045);
		--kit-icon-btn-pressed-color: #ea580c;
		--kit-handle-active: #ff5a1f;
	}
	@media (max-width: 767px) {
		:global(.chatapp) {
			--kit-icon-btn-size: 36px;
		}
	}

	/*
	 * One focus ring per control. Text fields never draw their own: the wrapper around them does
	 * (search, composer). Otherwise the input's ring sits inside the wrapper's and the two misalign.
	 */
	:global(.chatapp :focus-visible:not(input, textarea, .kit-sidebar-handle)) {
		outline: 2px solid rgb(255 90 31 / 0.55);
		outline-offset: 2px;
	}
	:global(.chatapp :is(input, textarea)) {
		outline: none;
	}
	/* rows live in a scroll container that would clip an outside ring */
	:global(.chatapp .row:focus-visible),
	:global(.chatapp .row-menu:focus-visible) {
		outline-offset: -2px;
	}

	.field:focus-within,
	.composer:has(textarea:focus) {
		box-shadow:
			0 0 0 1px #ff5a1f,
			0 0 0 3px rgb(255 90 31 / 0.15);
	}
	.composer.has-error,
	.composer.has-error:has(textarea:focus) {
		box-shadow:
			0 0 0 1px #dc2626,
			0 0 0 3px rgb(220 38 38 / 0.12);
	}

	/* message actions: quiet until the message is hovered or an action is focused */
	.msg-actions {
		opacity: 0.55;
		transition: opacity 150ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	:global(.group:hover) > div > .msg-actions,
	.msg-actions:focus-within {
		opacity: 1;
	}
	@media (hover: none) {
		.msg-actions {
			opacity: 1;
		}
	}

	/* rating: a small spring when it turns on */
	:global(.chatapp .fb[aria-pressed='true'] svg) {
		animation: pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
		fill: rgb(234 88 12 / 0.14);
	}
	@keyframes pop {
		40% {
			transform: scale(1.25) rotate(-8deg);
		}
	}

	/* send ↔ stop share one button; the icons cross-fade in place */
	:global(.chatapp .send) {
		--kit-icon-btn-size: 30px;
		--kit-icon-btn-color: #fff;
		--kit-icon-btn-hover-color: #fff;
		--kit-icon-btn-hover-bg: #e84e12;
		background: #ff5a1f;
		box-shadow:
			inset 0 1px 0 rgb(255 255 255 / 0.25),
			0 1px 2px rgb(0 0 0 / 0.16),
			0 0 0 1px rgb(217 72 15 / 0.9);
	}
	:global(.chatapp .send:disabled) {
		opacity: 0.4;
	}
	.swap {
		display: grid;
		place-items: center;
	}
	.swap > svg {
		grid-area: 1 / 1;
		width: 16px;
		height: 16px;
		transition:
			opacity 160ms cubic-bezier(0.23, 1, 0.32, 1),
			transform 200ms cubic-bezier(0.23, 1, 0.32, 1),
			filter 160ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.swap > svg:not([data-active]) {
		opacity: 0;
		transform: scale(0.5);
		filter: blur(2px);
	}

	/* press feedback (global so it also reaches bits-ui triggers) */
	:global(.chatapp .press) {
		transition-property: transform, background, box-shadow, color;
		transition-duration: 150ms;
		transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
	}
	:global(.chatapp .press:active) {
		transform: scale(0.97);
	}

	/* keycap */
	.kcap {
		display: inline-flex;
		align-items: center;
		height: 18px;
		padding: 0 5px;
		background: #f7f7f7;
		box-shadow: 0 0 0 1px #ececec;
		font-family: inherit;
		font-size: 11px;
		line-height: 1;
		color: #a3a3a3;
	}

	/* first-paint reveal (staggered ≤ 300ms total) */
	:global(.chatapp .reveal) {
		opacity: 0;
		animation: rise 400ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
	}
	@keyframes -global-rise {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	/* streaming caret */
	.caret::after {
		content: '';
		display: inline-block;
		width: 2px;
		height: 0.95em;
		margin-left: 2px;
		vertical-align: -0.15em;
		background: #ff5a1f;
		animation: blink 1s steps(2, start) infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}

	/* pending skeleton (shimmer) */
	.skeleton {
		border-radius: 2px;
		background: linear-gradient(90deg, #f2f2f2 0%, #e9e9e9 50%, #f2f2f2 100%);
		background-size: 200% 100%;
		animation: shimmer 1.4s linear infinite;
	}
	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.chatapp .reveal) {
			animation: none;
			opacity: 1;
		}
		.caret::after,
		.skeleton {
			animation: none;
		}
		:global(.chatapp *) {
			transition-duration: 0.01ms !important;
			animation-duration: 0.01ms !important;
		}
	}
</style>
