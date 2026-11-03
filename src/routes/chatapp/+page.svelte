<script lang="ts">
	import '@fontsource-variable/inter';
	import { tick } from 'svelte';
	import { cubicIn, cubicOut } from 'svelte/easing';

	// ---------- data ----------
	type ChatId = string;

	type Part =
		| { kind: 'p'; text: string }
		| { kind: 'ul'; items: string[] }
		| { kind: 'table' };

	type Msg = {
		id: number;
		role: 'user' | 'assistant';
		parts: Part[];
		full?: string;
		streaming?: boolean;
	};

	type ChatItem = { id: ChatId; label: string; time: string };
	type ProjectItem = { id: ChatId; label: string; swatch: string };

	let nextId = 100;

	const TIER_TEXT =
		"Here are three options tuned for mid-market buyers: Starter — everything a small team needs to evaluate Cove in under a week, free for the first 14 days. Team — predictable per-seat pricing with shared workspaces, SSO, and admin controls. Business — a usage-based tier with burst headroom for teams whose workload spikes month to month. I'd lead with Team; it clears procurement fastest.";

	const SEND_REPLY =
		'Tightened the intro, merged the two predictability points, and moved the recommendation to the top so it reads in under a minute. Want the same pass on the launch email?';

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

	const todayGroup: ChatItem[] = $state([
		{ id: 'q4', label: 'Q4 pricing analysis', time: '2m' },
		{ id: 'onboarding', label: 'Onboarding copy rewrite', time: '1h' },
		{ id: 'churn', label: 'Churn cohort SQL', time: '4h' }
	]);
	const yesterdayGroup: ChatItem[] = $state([
		{ id: 'launch', label: 'Launch email v3', time: '1d' },
		{ id: 'macros', label: 'Support macro cleanup', time: '1d' }
	]);
	const lastWeekGroup: ChatItem[] = $state([
		{ id: 'roadmap', label: 'Roadmap tradeoffs', time: '4d' },
		{ id: 'invoice', label: 'Invoice parser edge cases', time: '5d' }
	]);
	const projects: ProjectItem[] = [
		{ id: 'site', label: 'Website refresh', swatch: '#ff5a1f' },
		{ id: 'migration', label: 'Data migration', swatch: '#a3a3a3' }
	];

	const models = [
		{ id: 'flash', name: 'Cove 2.5 Flash', meta: 'Fastest' },
		{ id: 'std', name: 'Cove 2.5', meta: 'Balanced' },
		{ id: 'pro', name: 'Cove 2 Pro', meta: 'Most capable' }
	];
	const legacyModels = [{ id: 'legacy', name: 'Cove 1.5', meta: 'Legacy' }];

	const suggestions = [
		'Compare seat vs usage pricing',
		'Summarize this thread',
		'Rewrite for brevity',
		'Plan a launch timeline'
	];

	const quickActions = ['Make it shorter', 'Add a table', 'Draft a follow-up email'];

	// ---------- state ----------
	let activeId: ChatId | null = $state('q4');
	let selectedModel = $state('Cove 2.5 Flash');
	let modelOpen = $state(false);
	let draft = $state('');
	let copiedId = $state<number | null>(null);
	let pillY = $state<number | null>(null);
	let pillH = $state(28);
	let taEl: HTMLTextAreaElement | undefined = $state();
	let navEl: HTMLElement | undefined = $state();
	let composerEl: HTMLElement | undefined = $state();

	let msgArea: HTMLElement | undefined = $state();

	const title = $derived.by(() => {
		if (!activeId) return 'New chat';
		const all = [...todayGroup, ...yesterdayGroup, ...lastWeekGroup, ...projects];
		return all.find((c) => c.id === activeId)?.label ?? 'New chat';
	});
	const msgs = $derived(activeId ? (store[activeId] ?? []) : []);
	const isStreaming = $derived(msgs.some((m) => m.streaming));

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
		copy: 'M9 9h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
		refresh: 'M21 12a9 9 0 1 1-2.64-6.36L21 8M21 3v5h-5',
		thumbUp:
			'M7 10v12M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z',
		thumbDown:
			'M17 14V2M11 18.12 12 14H6.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 8.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z',
		share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
		sparkle:
			'M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z',
		stop: 'M9 9h6v6H9z'
	};

	// keep icon paths accessible to the template snippet
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
	const timers = new Set<ReturnType<typeof setInterval>>();

	function stopAllStreams() {
		for (const t of timers) clearInterval(t);
		timers.clear();
	}

	function streamInto(chat: ChatId, msgId: number, full: string, speed = 60) {
		const list = store[chat];
		if (!list) return;
		const msg = list.find((m) => m.id === msgId);
		if (!msg) return;
		const words = full.split(' ');
		let i = Math.max(1, Math.floor(words.length * 0.18));
		msg.streaming = true;
		msg.parts = [{ kind: 'p', text: words.slice(0, i).join(' ') }];
		const t = setInterval(() => {
			i += 1;
			if (i >= words.length) {
				clearInterval(t);
				timers.delete(t);
				if (msg) {
					msg.parts = [{ kind: 'p', text: full }];
					msg.streaming = false;
				}
			} else if (msg) {
				msg.parts = [{ kind: 'p', text: words.slice(0, i).join(' ') }];
			}
		}, speed);
		timers.add(t);
	}

	function stopStreaming() {
		stopAllStreams();
		for (const list of Object.values(store)) {
			for (const m of list) if (m.streaming) m.streaming = false;
		}
	}

	// ---------- actions ----------
	function selectChat(id: ChatId) {
		activeId = id;
		if (!store[id]) store[id] = [];
		modelOpen = false;
	}

	function newChat() {
		stopStreaming();
		const id = 'c' + Date.now();
		todayGroup.unshift({ id, label: 'New conversation', time: 'now' });
		store[id] = [];
		activeId = id;
		draft = '';
	}

	function autoSize() {
		if (!taEl) return;
		taEl.style.height = 'auto';
		taEl.style.height = Math.min(taEl.scrollHeight, 120) + 'px';
	}

	function send() {
		const text = draft.trim();
		if (!text || isStreaming) return;
		if (!activeId) newChat();
		const chat = activeId!;
		const list = (store[chat] ??= []);
		const uid = nextId++;
		list.push({ id: uid, role: 'user', parts: [{ kind: 'p', text }] });
		const aid = nextId++;
		list.push({ id: aid, role: 'assistant', streaming: true, parts: [] });
		draft = '';
		if (taEl) taEl.style.height = 'auto';
		setTimeout(() => {
			const t = setTimeout(() => streamInto(chat, aid, SEND_REPLY), 350);
			// hold the skeleton for the pending window, then start streaming
			const list2 = store[chat];
			const m = list2?.find((x) => x.id === aid);
			if (m) m.full = SEND_REPLY;
			timers.add(t as unknown as ReturnType<typeof setInterval>);
		}, 0);
		queueMicrotask(() => scrollToBottom());
	}

	function retry(msg: Msg) {
		if (!activeId || !msg.full || msg.streaming) return;
		streamInto(activeId, msg.id, msg.full);
	}

	function copyMsg(msg: Msg) {
		const text = msg.parts
			.map((p) => (p.kind === 'p' ? p.text : p.kind === 'ul' ? p.items.join('\n') : ''))
			.join('\n\n')
			.trim();
		if (!text) return;
		navigator.clipboard?.writeText(text).catch(() => {});
		copiedId = msg.id;
		setTimeout(() => (copiedId = null), 1500);
	}

	function scrollToBottom() {
		if (msgArea) msgArea.scrollTop = msgArea.scrollHeight;
	}

	// ---------- active pill ----------
	async function updatePill() {
		await tick();
		if (!navEl || !activeId) {
			pillY = null;
			return;
		}
		const el = navEl.querySelector(`[data-id="${activeId}"]`) as HTMLElement | null;
		if (!el) {
			pillY = null;
			return;
		}
		pillY = el.offsetTop;
		pillH = el.offsetHeight;
	}

	$effect(() => {
		void activeId;
		void todayGroup.length;
		updatePill();
	});

	// kick off the in-progress stream on load + scroll the new message into view
	$effect(() => {
		const t = setTimeout(() => streamInto('q4', 4, TIER_TEXT, 70), 600);
		return () => {
			clearTimeout(t);
			stopAllStreams();
		};
	});

	$effect(() => {
		void msgs.length;
		queueMicrotask(() => scrollToBottom());
	});

	function onWindowKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') modelOpen = false;
	}

	function onWindowPointerdown(e: PointerEvent) {
		const t = e.target as HTMLElement;
		if (!t.closest('.model-wrap')) modelOpen = false;
	}

	function pickModel(name: string) {
		selectedModel = name;
		modelOpen = false;
	}

	function popIn(node: HTMLElement) {
		return {
			duration: 180,
			easing: cubicOut,
			css: (t: number) => `opacity:${t}; transform: scale(${0.96 + 0.04 * t}) translateY(${(1 - t) * -4}px);`
		};
	}
	function popOut(node: HTMLElement) {
		return {
			duration: 120,
			easing: cubicIn,
			css: (t: number) => `opacity:${t}; transform: scale(${0.98 + 0.02 * t});`
		};
	}
</script>

<svelte:window onkeydown={onWindowKeydown} onpointerdown={onWindowPointerdown} />

<svelte:head>
	<title>Cove — Q4 pricing analysis</title>
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

<div class="chatapp flex h-dvh overflow-hidden bg-[#f7f7f7]">
	<!-- ============ sidebar (inset shell: shares the app tint, no fill of its own) ============ -->
	<aside class="sticky top-0 hidden h-dvh w-[244px] shrink-0 flex-col overflow-hidden px-3 pt-3 pb-2 md:flex">
		<!-- workspace switcher -->
		<div class="flex h-10 items-center gap-2 px-1" use:reveal>
			<button class="flex min-w-0 flex-1 items-center gap-2 px-1.5 py-1 transition-colors duration-[120ms] hover:bg-black/[.04]">
				<span class="grid size-6 shrink-0 place-items-center bg-[#ff5a1f] text-[11px] font-medium text-white">C</span>
				<span class="min-w-0 leading-tight">
					<span class="block truncate text-[14px] font-medium tracking-[-0.01em] text-[#171717]">Cove</span>
					<span class="block truncate text-[11px] text-[#a3a3a3]">northwind.co</span>
				</span>
				{@render icon('chevrons', 'ml-auto size-3.5 shrink-0 text-[#a3a3a3]')}
			</button>
		</div>

		<!-- primary action -->
		<div class="mt-2" use:reveal={40}>
			<button
				onclick={newChat}
				class="press inline-flex h-[30px] w-full items-center justify-center gap-1.5 bg-[#ff5a1f] px-3 text-[14px] font-medium text-white select-none transition-[background,box-shadow,transform] duration-150 hover:bg-[#e84e12]"
			>
				{@render icon('plus')}
				New chat
			</button>
		</div>

		<!-- search -->
		<div class="mt-2" use:reveal={80}>
			<div class="flex h-[30px] items-center gap-2 bg-white px-2.5 shadow-[0_1px_2px_rgb(40_40_40/.08),0_0_0_1px_#ececec] transition-shadow duration-150 focus-within:shadow-[0_0_0_1px_#ff5a1f,0_0_0_4px_rgb(255_90_31/.15)]">
				{@render icon('search', 'size-3.5 shrink-0 text-[#a3a3a3]')}
				<input
					class="min-w-0 flex-1 bg-transparent text-[13px] text-[#171717] outline-none placeholder:text-[#a3a3a3]"
					placeholder="Search chats"
				/>
				<span class="kcap">/</span>
			</div>
		</div>

		<!-- nav -->
		<nav aria-label="Chats" bind:this={navEl} class="relative mt-4 flex flex-1 flex-col gap-5 overflow-y-auto pb-2">
			{#if pillY !== null}
				<div
					class="absolute inset-x-0 top-0 z-0 bg-white shadow-[0_1px_2px_rgb(40_40_40/.08),0_0_0_1px_#ececec] transition-[transform,height] duration-[250ms] ease-[cubic-bezier(.23,1,.32,1)]"
					style="transform: translateY({pillY}px); height: {pillH}px"
				></div>
			{/if}

			<div class="relative" use:reveal={120}>
				<div class="mb-1 px-2.5 text-[11px] font-medium text-[#a3a3a3]">Today</div>
				<ul class="flex flex-col gap-0.5">
					{#each todayGroup as c (c.id)}
						<li>
							<button
								data-id={c.id}
								onclick={() => selectChat(c.id)}
								aria-current={activeId === c.id ? 'page' : undefined}
								class="relative z-10 flex h-7 w-full items-center gap-2 px-2.5 text-[13px] text-[#525252] whitespace-nowrap transition-colors duration-[120ms] hover:bg-black/[.04] hover:text-[#171717] {activeId === c.id ? 'text-[#171717]' : ''}"
							>
								<span class="truncate">{c.label}</span>
								<span class="ml-auto shrink-0 text-[11px] tabular-nums text-[#a3a3a3]">{c.time}</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>

			<div class="relative" use:reveal={160}>
				<div class="mb-1 px-2.5 text-[11px] font-medium text-[#a3a3a3]">Yesterday</div>
				<ul class="flex flex-col gap-0.5">
					{#each yesterdayGroup as c (c.id)}
						<li>
							<button
								data-id={c.id}
								onclick={() => selectChat(c.id)}
								aria-current={activeId === c.id ? 'page' : undefined}
								class="relative z-10 flex h-7 w-full items-center gap-2 px-2.5 text-[13px] text-[#525252] whitespace-nowrap transition-colors duration-[120ms] hover:bg-black/[.04] hover:text-[#171717] {activeId === c.id ? 'text-[#171717]' : ''}"
							>
								<span class="truncate">{c.label}</span>
								<span class="ml-auto shrink-0 text-[11px] tabular-nums text-[#a3a3a3]">{c.time}</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>

			<div class="relative" use:reveal={200}>
				<div class="mb-1 px-2.5 text-[11px] font-medium text-[#a3a3a3]">Last 7 days</div>
				<ul class="flex flex-col gap-0.5">
					{#each lastWeekGroup as c (c.id)}
						<li>
							<button
								data-id={c.id}
								onclick={() => selectChat(c.id)}
								aria-current={activeId === c.id ? 'page' : undefined}
								class="relative z-10 flex h-7 w-full items-center gap-2 px-2.5 text-[13px] text-[#525252] whitespace-nowrap transition-colors duration-[120ms] hover:bg-black/[.04] hover:text-[#171717] {activeId === c.id ? 'text-[#171717]' : ''}"
							>
								<span class="truncate">{c.label}</span>
								<span class="ml-auto shrink-0 text-[11px] tabular-nums text-[#a3a3a3]">{c.time}</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>

			<div use:reveal={240}>
				<div class="mb-1 px-2.5 text-[11px] font-medium text-[#a3a3a3]">Projects</div>
				<ul class="flex flex-col gap-0.5">
					{#each projects as p (p.id)}
						<li>
							<button
								data-id={p.id}
								onclick={() => selectChat(p.id)}
								aria-current={activeId === p.id ? 'page' : undefined}
								class="relative z-10 flex h-7 w-full items-center gap-2 px-2.5 text-[13px] text-[#525252] whitespace-nowrap transition-colors duration-[120ms] hover:bg-black/[.04] hover:text-[#171717] {activeId === p.id ? 'text-[#171717]' : ''}"
							>
								<span class="size-2.5 shrink-0" style="background: {p.swatch}"></span>
								<span class="truncate">{p.label}</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		</nav>

		<!-- footer: user + plan usage -->
		<div class="mt-auto border-t border-black/[.06] px-1 pt-3" use:reveal={280}>
			<div class="flex items-center gap-2">
				<span class="grid size-7 shrink-0 place-items-center bg-[#ffe8dc] text-[11px] font-medium text-[#c2410c]">AK</span>
				<div class="min-w-0 leading-tight">
					<div class="truncate text-[13px] font-medium text-[#171717]">Aidan Kelly</div>
					<div class="truncate text-[11px] text-[#a3a3a3]">aidan@northwind.co</div>
				</div>
				{@render icon('chevrons', 'ml-auto size-3.5 shrink-0 text-[#a3a3a3]')}
			</div>
			<div class="mt-2.5 px-0.5 pb-1">
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

	<!-- ============ main inset panel ============ -->
	<main class="my-2 mr-2 ml-0 flex min-w-0 flex-1 flex-col overflow-hidden bg-white shadow-[0_0_0_1px_rgb(0_0_0/.06),0_1px_2px_rgb(0_0_0/.04)] max-md:my-0 max-md:mr-0">
		<!-- top bar -->
		<header class="flex h-12 shrink-0 items-center gap-3 border-b border-[#ececec] px-4" use:reveal={60}>
			<div class="flex min-w-0 items-baseline gap-2">
				<h1 class="truncate text-[14px] font-medium tracking-[-0.01em] text-[#171717]">{title}</h1>
				{#if msgs.length > 0}
					<span class="shrink-0 text-[11px] tabular-nums text-[#a3a3a3] max-md:hidden">{msgs.length} messages</span>
				{/if}
			</div>

			<div class="ml-auto flex items-center gap-1.5">
				<!-- model selector -->
				<div class="model-wrap relative">
					<button
						onclick={() => (modelOpen = !modelOpen)}
						aria-expanded={modelOpen}
						aria-haspopup="listbox"
						class="press inline-flex h-[30px] items-center gap-1.5 bg-gradient-to-b from-white to-[#f7f7f7] px-2.5 text-[13px] font-medium whitespace-nowrap text-[#171717] select-none shadow-[0_1px_2px_rgb(40_40_40/.08),0_0_0_1px_#ececec] transition-[background,box-shadow,transform] duration-150 hover:to-[#f2f2f2]"
					>
						{selectedModel}
						{@render icon('chevron', 'size-3.5 text-[#a3a3a3]')}
					</button>
					{#if modelOpen}
						<div
							role="listbox"
							aria-label="Model"
							class="absolute top-[calc(100%+6px)] right-0 z-50 w-[240px] origin-top-right bg-white p-1 shadow-[0_0_0_1px_rgb(0_0_0/.06),0_8px_24px_-4px_rgb(0_0_0/.10),0_2px_6px_rgb(0_0_0/.04)]"
							in:popIn
							out:popOut
						>
							<div class="px-2 pt-1.5 pb-1 text-[11px] font-medium text-[#a3a3a3]">Latest</div>
							{#each models as m (m.id)}
								<button
									role="option"
									aria-selected={selectedModel === m.name}
									onclick={() => pickModel(m.name)}
									class="flex h-8 w-full items-center gap-2 px-2 text-[13px] text-[#171717] transition-colors duration-[120ms] hover:bg-[#f5f5f5]"
								>
									<span class="truncate">{m.name}</span>
									<span class="ml-auto text-[11px] text-[#a3a3a3]">{m.meta}</span>
									{#if selectedModel === m.name}
										{@render icon('check', 'size-3.5 shrink-0 text-[#d9480f]')}
									{/if}
								</button>
							{/each}
							<div class="mt-1 border-t border-[#ececec] px-2 pt-1.5 pb-1 text-[11px] font-medium text-[#a3a3a3]">Legacy</div>
							{#each legacyModels as m (m.id)}
								<button
									role="option"
									aria-selected={selectedModel === m.name}
									onclick={() => pickModel(m.name)}
									class="flex h-8 w-full items-center gap-2 px-2 text-[13px] text-[#737373] transition-colors duration-[120ms] hover:bg-[#f5f5f5]"
								>
									<span class="truncate">{m.name}</span>
									<span class="ml-auto text-[11px] text-[#a3a3a3]">{m.meta}</span>
									{#if selectedModel === m.name}
										{@render icon('check', 'size-3.5 shrink-0 text-[#d9480f]')}
									{/if}
								</button>
							{/each}
							<div class="mt-1 border-t border-[#ececec] px-2 py-2 text-[11px] leading-[1.4] text-[#a3a3a3]">
								Cove 2.5 Flash is fastest for everyday chats.
							</div>
						</div>
					{/if}
				</div>

				<span class="mx-0.5 h-4 w-px bg-[#ececec]"></span>

				<button aria-label="Share" class="ibtn">{@render icon('share')}</button>
				<button aria-label="More" class="ibtn">
					<svg viewBox="0 0 24 24" fill="currentColor" class="size-4" aria-hidden="true">
						<circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
					</svg>
				</button>
			</div>
		</header>

		<!-- messages -->
		<div bind:this={msgArea} class="min-h-0 flex-1 overflow-y-auto">
			{#if msgs.length === 0}
				<!-- empty state -->
				<div class="grid h-full place-items-center px-6">
					<div class="w-full max-w-[420px] text-center" use:reveal={80}>
						<span class="mx-auto grid size-10 place-items-center bg-[#fff3ec] text-[#d9480f]">
							{@render icon('sparkle', 'size-5')}
						</span>
						<p class="mt-3 text-[16px] font-medium tracking-[-0.01em] text-[#171717]">How can I help, Aidan?</p>
						<p class="mt-1 text-[13px] text-[#737373]">Ask anything, or start from one of these.</p>
						<div class="mt-4 grid grid-cols-2 gap-2 text-left">
							{#each suggestions as s (s)}
								<button
									onclick={() => {
										draft = s;
										taEl?.focus();
									}}
									class="press bg-gradient-to-b from-white to-[#f7f7f7] px-3 py-2.5 text-[13px] text-[#171717] shadow-[0_1px_2px_rgb(40_40_40/.08),0_0_0_1px_#ececec] transition-[background,transform] duration-150 hover:to-[#f2f2f2]"
								>
									{s}
								</button>
							{/each}
						</div>
					</div>
				</div>
			{:else}
				<div class="mx-auto w-full max-w-[720px] px-5 pt-4 pb-2">
					<!-- date divider -->
					<div class="flex items-center gap-3 py-1" use:reveal={80}>
						<span class="h-px flex-1 bg-[#ececec]"></span>
						<span class="text-[11px] font-medium text-[#a3a3a3]">Today</span>
						<span class="h-px flex-1 bg-[#ececec]"></span>
					</div>

					<div class="mt-3 flex flex-col gap-5">
						{#each msgs as m, i (m.id)}
							{#if m.role === 'user'}
								<!-- user message -->
								<div class="flex flex-col items-end" use:reveal={Math.min(120 + i * 40, 280)}>
									<div class="max-w-[80%] bg-[#fff3ec] px-3.5 py-2.5 text-[14px] leading-[1.5] text-[#171717]">
										{#each m.parts as p, j (j)}
											{#if p.kind === 'p'}<p>{p.text}</p>{/if}
										{/each}
									</div>
								</div>
							{:else}
								<!-- assistant message -->
								<div class="group flex gap-2.5" use:reveal={Math.min(120 + i * 40, 280)}>
									<span class="mt-0.5 grid size-6 shrink-0 place-items-center bg-[#ff5a1f] text-white">
										{@render icon('sparkle', 'size-3.5')}
									</span>
									<div class="min-w-0 flex-1">
										{#if m.streaming && m.parts.length === 0}
											<!-- pending skeleton -->
											<div class="space-y-2 pt-1" aria-label="Cove is thinking">
												<div class="skeleton h-3 w-[72%]"></div>
												<div class="skeleton h-3 w-[54%]"></div>
											</div>
										{:else}
											<div class="space-y-3 text-[14px] leading-[1.55] text-[#171717]">
												{#each m.parts as p, j (j)}
													{#if p.kind === 'p'}
														<p class="{m.streaming ? 'caret' : ''}">{p.text}</p>
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
																		<th class="w-[34%] px-3 py-2 text-left text-[12px] font-medium text-[#737373]"></th>
																		<th class="px-3 py-2 text-left text-[12px] font-medium text-[#737373]">Seat-based</th>
																		<th class="px-3 py-2 text-left text-[12px] font-medium text-[#737373]">Usage-based</th>
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
												<div class="mt-1.5 -ml-1 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
													<button aria-label="Copy" class="ibtn" onclick={() => copyMsg(m)}>
														{#if copiedId === m.id}
															{@render icon('check', 'size-3.5 text-[#d9480f]')}
														{:else}
															{@render icon('copy', 'size-3.5')}
														{/if}
													</button>
													<button aria-label="Retry" class="ibtn" onclick={() => retry(m)}>
														{@render icon('refresh', 'size-3.5')}
													</button>
													<button aria-label="Good response" class="ibtn">{@render icon('thumbUp', 'size-3.5')}</button>
													<button aria-label="Bad response" class="ibtn">{@render icon('thumbDown', 'size-3.5')}</button>
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

		<!-- composer -->
		{#if msgs.length > 0}
			<div class="shrink-0 px-4 pb-3" use:reveal={260}>
				<div class="mx-auto w-full max-w-[720px]">
					<div class="mb-2 flex gap-1.5">
						{#each quickActions as qa (qa)}
							<button
								onclick={() => {
									draft = qa;
									taEl?.focus();
								}}
								class="press inline-flex h-[26px] items-center bg-gradient-to-b from-white to-[#f7f7f7] px-2.5 text-[12px] font-medium text-[#737373] shadow-[0_1px_2px_rgb(40_40_40/.08),0_0_0_1px_#ececec] transition-[color,background,transform] duration-150 hover:text-[#171717]"
							>
								{qa}
							</button>
						{/each}
					</div>

					<div bind:this={composerEl} class="bg-white shadow-[0_1px_2px_rgb(40_40_40/.08),0_0_0_1px_#ececec] transition-shadow duration-150 focus-within:shadow-[0_0_0_1px_#ff5a1f,0_0_0_4px_rgb(255_90_31/.15)]">
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
							class="block max-h-[120px] w-full resize-none bg-transparent px-3.5 pt-2.5 pb-1 text-[14px] leading-[1.5] text-[#171717] outline-none placeholder:text-[#a3a3a3]"
						></textarea>
						<div class="flex items-center gap-1 px-2 pb-2">
							<button aria-label="Attach file" class="ibtn">{@render icon('paperclip')}</button>
							<button aria-label="Add image" class="ibtn">{@render icon('image')}</button>
							<div class="ml-auto flex items-center gap-2">
								{#if isStreaming}
									<button
										onclick={stopStreaming}
										aria-label="Stop generating"
										class="press grid size-[30px] place-items-center bg-[#ff5a1f] text-white shadow-[inset_0_1px_0_rgb(255_255_255/.25),0_1px_2px_rgb(0_0_0/.16),0_0_0_1px_rgb(217_72_15/.9)] transition-[background,transform] duration-150 hover:bg-[#e84e12]"
									>
										{@render icon('stop', 'size-3.5')}
									</button>
								{:else}
									<span class="kcap" class:hidden={!draft}>⏎</span>
									<button
										onclick={send}
										disabled={!draft.trim()}
										aria-label="Send message"
										class="press grid size-[30px] place-items-center bg-[#ff5a1f] text-white shadow-[inset_0_1px_0_rgb(255_255_255/.25),0_1px_2px_rgb(0_0_0/.16),0_0_0_1px_rgb(217_72_15/.9)] transition-[background,transform,opacity] duration-150 hover:bg-[#e84e12] disabled:pointer-events-none disabled:opacity-40"
									>
										{@render icon('arrowUp')}
									</button>
								{/if}
							</div>
						</div>
					</div>
					<p class="pt-2 text-center text-[11px] text-[#a3a3a3]">Cove can make mistakes. Verify important information.</p>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	.chatapp {
		font-family: 'Inter Variable', 'Inter', ui-sans-serif, system-ui, sans-serif;
		font-feature-settings: 'cv11', 'ss01';
		-webkit-font-smoothing: antialiased;
		text-rendering: optimizeLegibility;
	}

	/* blue focus ring (overrides the global accent) */
	.chatapp :global(:focus-visible) {
		outline: 2px solid rgb(255 90 31 / 0.45);
		outline-offset: 2px;
	}

	/* press feedback */
	.press {
		transition-property: transform, background, box-shadow, color;
		transition-duration: 150ms;
		transition-timing-function: cubic-bezier(0.23, 1, 0.32, 1);
	}
	.press:active {
		transform: scale(0.97);
	}

	/* icon button */
	.ibtn {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 0;
		color: #a3a3a3;
		transition:
			background 120ms cubic-bezier(0.23, 1, 0.32, 1),
			color 120ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.ibtn:hover {
		background: rgb(0 0 0 / 0.04);
		color: #171717;
	}
	@media (max-width: 767px) {
		.ibtn {
			width: 36px;
			height: 36px;
		}
	}

	/* keycap */
	.kcap {
		display: inline-flex;
		align-items: center;
		height: 18px;
		padding: 0 5px;
		border-radius: 0;
		background: #f7f7f7;
		box-shadow: 0 0 0 1px #ececec;
		font-size: 11px;
		line-height: 1;
		color: #a3a3a3;
	}
	.kcap.hidden {
		display: none;
	}

	/* first-paint reveal (staggered ≤ 300ms total) */
	.reveal {
		opacity: 0;
		animation: rise 400ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
	}
	@keyframes rise {
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
		.reveal {
			animation: none;
			opacity: 1;
		}
		.caret::after,
		.skeleton {
			animation: none;
		}
		.press,
		.ibtn,
		.chatapp * {
			transition-duration: 0.01ms !important;
			animation-duration: 0.01ms !important;
		}
	}
</style>
