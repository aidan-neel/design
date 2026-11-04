<script lang="ts">
	import { fly } from 'svelte/transition';
	import { store } from './store.svelte';
	import Icon from './Icon.svelte';

	function clearAndUndo(t: { id: number; undo?: () => void }) {
		if (t.undo) t.undo();
		store.dismiss(t.id);
	}
</script>

{#if store.toasts.length}
	<div class="pointer-events-none fixed bottom-5 left-1/2 z-[60] flex w-[calc(100%-32px)] max-w-[380px] -translate-x-1/2 flex-col items-center gap-2 md:left-auto md:right-6 md:translate-x-0 md:items-end">
		{#each store.toasts as t (t.id)}
			<div
				role="status"
				class="pointer-events-auto flex min-h-10 w-full select-none items-center gap-2 rounded-[10px] bg-[#171717] py-1.5 pr-1.5 pl-3 text-[13px] font-medium text-white shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_16px_40px_-12px_rgb(0_0_0/0.45)]"
				transition:fly={{ y: 10, duration: 180, opacity: 1 }}
			>
				<div class="min-w-0 flex-1">
					<p class="truncate">{t.title}</p>
					{#if t.desc}
						<p class="truncate text-[12px] font-normal text-[#b3b3b3]">{t.desc}</p>
					{/if}
				</div>
				{#if t.undo}
					<button
						class="h-7 shrink-0 cursor-default rounded-md bg-white/10 px-2 text-[12.5px] font-medium text-white transition-colors duration-150 outline-none hover:bg-white/[0.16] focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-white/70 active:scale-[0.97]"
						onclick={() => clearAndUndo(t)}
					>
						Undo
					</button>
				{/if}
				<button
					class="grid size-7 shrink-0 cursor-default place-items-center rounded-md text-white/60 transition-colors duration-150 outline-none hover:bg-white/10 hover:text-white"
					onclick={() => store.dismiss(t.id)}
					aria-label="Dismiss"
				>
					<Icon name="x" size={13} />
				</button>
			</div>
		{/each}
	</div>
{/if}
