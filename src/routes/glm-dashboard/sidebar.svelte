<script lang="ts">
	import { DropdownMenu, Popover } from 'bits-ui';
	import { MENU_ITEM, POP_CLASS } from './data';
	import { store, type ViewId } from './store.svelte';
	import Icon from './Icon.svelte';

	let { drawer = false }: { drawer?: boolean } = $props();

	let GROUPS: { label: string; items: { id: ViewId; label: string; icon: 'overview' | 'chart' | 'users' | 'tag' }[] }[] = [
		{ label: 'Monetization', items: [
			{ id: 'overview', label: 'Overview', icon: 'overview' },
			{ id: 'revenue', label: 'Revenue', icon: 'chart' }
		] },
		{ label: 'Workspace', items: [
			{ id: 'customers', label: 'Customers', icon: 'users' },
			{ id: 'plans', label: 'Plans & prices', icon: 'tag' }
		] }
	];

	// sliding active pill
	let navEl = $state<HTMLElement | null>(null);
	let pillY = $state(0);
	let primed = false;
	$effect(() => {
		store.view;
		void navEl;
		const el = navEl?.querySelector('[data-nav-active]') as HTMLElement | null;
		if (el && navEl) {
			const y = el.offsetTop - navEl.offsetTop;
			if (primed) pillY = y;
			else {
				pillY = y;
				primed = true;
			}
		}
	});

	function go(id: ViewId) {
		store.view = id;
		if (drawer) store.drawerOpen = false;
	}

	const orgTint: Record<string, string> = { 'Northgate Labs': '#255cd1', 'Verity Studio': '#0f766e', 'Harbour & Co': '#7c3aed' };

	async function copyInvite() {
		try {
			await navigator.clipboard.writeText('https://meridian.dev/join/northgate-labs?k=8f2ab1');
			store.toast('Invite link copied', 'meridian.dev/join/northgate-labs');
		} catch {
			store.toast('Copy failed', 'Clipboard is unavailable in this browser');
		}
	}
</script>

<div class="flex h-dvh flex-col px-3 pt-3 pb-4 {drawer ? 'w-[280px]' : 'w-[248px]'}">
	<!-- org switcher -->
	<Popover.Root>
		<Popover.Trigger class="flex w-full cursor-default select-none items-center gap-2 rounded-lg px-1.5 py-1 text-left outline-none transition-colors duration-150 hover:bg-black/[0.04] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_#255cd12e]">
			<span class="grid size-6 shrink-0 place-items-center rounded-md text-[11px] font-semibold text-white" style="background:{orgTint[store.org] ?? '#171717'}">
				{store.org.slice(0, 1)}
			</span>
			<span class="min-w-0 flex-1 truncate text-[14px] font-medium tracking-[-0.01em] text-[#171717]">{store.org}</span>
			<Icon name="chev-updown" size={13} class="text-[#a3a3a3]" />
		</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content class={POP_CLASS + ' w-[240px]'} sideOffset={6} align="start">
				{#each store.orgs as o (o)}
					<button class="{'flex h-8 w-full cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-[#171717] outline-none transition-colors duration-150 hover:bg-[#f4f4f4] focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_#255cd12e]'}" onclick={() => (store.org = o)}>
						<span class="grid size-5 shrink-0 place-items-center rounded-[5px] text-[10px] font-semibold text-white" style="background:{orgTint[o] ?? '#171717'}">{o.slice(0, 1)}</span>
						{o}
						{#if store.org === o}
							<Icon name="check" size={13} class="ml-auto text-[#737373]" />
						{/if}
					</button>
				{/each}
				<div class="mx-2 my-1 h-px bg-[#ececec]"></div>
				<button class="{'flex h-8 w-full cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-[#171717] outline-none hover:bg-[#f4f4f4]'}" onclick={copyInvite}>
					<Icon name="mail" size={14} class="text-[#737373]" />
					Copy invite link
				</button>
				<button class="{'flex h-8 w-full cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-[#171717] outline-none hover:bg-[#f4f4f4]'}" onclick={() => (store.dialog = { kind: 'profile' })}>
					<Icon name="gear" size={14} class="text-[#737373]" />
					Workspace settings
				</button>
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>

	<!-- global search -->
	<div class="relative mt-3">
		<Icon name="search" size={15} class="pointer-events-none absolute top-2.5 left-2.5 text-[#a3a3a3]" />
		<input
			data-meridian-search
			type="search"
			placeholder="Search"
			aria-label="Search the current view"
			class="h-9 w-full rounded-[10px] bg-white pr-7 pl-8 text-[13px] text-[#171717] placeholder:text-[#a3a3a3] shadow-[0_0_0_1px_#ececec,0_1px_2px_rgb(40_40_40/0.06)] outline-none transition-shadow duration-150 focus:shadow-[0_0_0_1px_#255cd1,0_0_0_4px_#255cd126]"
			bind:value={store.search}
		/>
		<kbd class="absolute top-1.5 right-1.5 grid h-6 min-w-5 place-items-center rounded-md bg-[#f7f7f7] px-1 text-[11px] font-medium text-[#a3a3a3] shadow-[0_0_0_1px_#ececec]">/</kbd>
	</div>

	<!-- nav -->
	<nav class="relative mt-4 flex flex-1 flex-col overflow-y-auto" aria-label="Main" bind:this={navEl}>
		<div
			class="pointer-events-none absolute inset-x-0 h-8 rounded-lg bg-white shadow-[0_0_0_1px_#ececec,0_1px_2px_rgb(40_40_40/0.1)] transition-transform duration-250 ease-out"
			style="transform: translateY({pillY}px)"
			aria-hidden="true"
		></div>
		{#each GROUPS as g (g.label)}
			<div class={g.label === 'Workspace' ? 'mt-5' : ''}>
				<div class="mb-1 px-2.5 text-[11px] font-medium tracking-[0.06em] text-[#a3a3a3] uppercase">{g.label}</div>
				<ul class="flex flex-col gap-0.5">
					{#each g.items as it (it.id)}
						<li>
							<button
								data-nav-active={store.view === it.id ? '' : undefined}
								aria-current={store.view === it.id ? 'page' : undefined}
								onclick={() => go(it.id)}
								class="group relative flex h-8 w-full cursor-default items-center gap-2.5 rounded-lg px-2.5 text-[14px] whitespace-nowrap outline-none transition-colors duration-120 hover:text-[#171717] focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_2px_#255cd12e] {store.view === it.id ? 'text-[#171717]' : 'text-[#737373]'}"
							>
								<Icon name={it.icon} size={16} class={store.view === it.id ? 'text-[#171717]' : 'text-[#a3a3a3]'} />
								{it.label}
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</nav>

	<!-- footer / user -->
	<Popover.Root>
		<Popover.Trigger class="mt-3 flex w-full cursor-default select-none items-center gap-2 border-t border-black/[0.06] px-1.5 pt-3 text-left outline-none focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_#255cd12e,0_-1px_0_#fff] rounded-b-lg">
			<span class="grid size-7 shrink-0 place-items-center rounded-full bg-[#fef3e6] text-[10.5px] font-semibold text-[#b45309]">
				{store.prefs.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
			</span>
			<span class="min-w-0 flex-1 leading-tight">
				<span class="block truncate text-[13px] font-medium text-[#171717]">{store.prefs.name}</span>
				<span class="block truncate text-[12px] text-[#a3a3a3]">{store.prefs.email}</span>
			</span>
			<Icon name="chev-updown" size={13} class="text-[#a3a3a3]" />
		</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content class={POP_CLASS + ' w-[220px]'} sideOffset={8} align="start">
				<button class="{'flex h-8 w-full cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-[#171717] outline-none hover:bg-[#f4f4f4]'}" onclick={() => (store.dialog = { kind: 'profile' })}>
					<Icon name="users" size={14} class="text-[#737373]" />
					Profile
				</button>
				<button class="{'flex h-8 w-full cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-[#171717] outline-none hover:bg-[#f4f4f4]'}" onclick={() => (store.dialog = { kind: 'shortcuts' })}>
					<Icon name="keyboard" size={14} class="text-[#737373]" />
					Keyboard shortcuts
				</button>
				<div class="mx-2 my-1 h-px bg-[#ececec]"></div>
				<button class="{'flex h-8 w-full cursor-default select-none items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-[#b91c1c] outline-none hover:bg-[#fef2f2]'}" onclick={() => (store.dialog = { kind: 'logout' })}>
					<Icon name="logout" size={14} class="text-[#dc2626]" />
					Log out
				</button>
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
</div>
