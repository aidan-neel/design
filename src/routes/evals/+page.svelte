<script lang="ts">
	import { comparisons, getOutput, models, SKILL_STATUS } from '#lib/comparisons.ts';
	import OutputCard from '#lib/OutputCard.svelte';
	import Select from '#lib/Select.svelte';

	const panes = [
		{ key: 'without', label: 'Without skill' },
		{ key: 'with', label: 'With skill' }
	] as const;

	let model = $state(models[0].value);
	let activeId = $state(comparisons[0].id);
	let active = $derived(comparisons.find((c) => c.id === activeId) ?? comparisons[0]);
</script>

<main class="mx-auto max-w-190 px-6 pt-12 pb-16 sm:pt-20">
	<header class="mb-10">
		<div class="enter flex items-center justify-between gap-3" style="--i: 0">
			<h1 class="m-0 text-[18px] font-semibold tracking-tight">
				design
				<span class="ml-1 font-mono text-[12px] font-normal text-muted">v0.0.0</span>
			</h1>
			<span class="rounded-lg bg-white px-2.5 py-0.75 font-mono text-[11.5px] shadow-ring">
				aidan-neel/design
			</span>
		</div>
		<p class="enter mt-2.5 max-w-[52ch] text-pretty text-[#555]" style="--i: 1">
			Artificial taste for artificial intelligence
		</p>
	</header>

	<dl class="mb-12">
		<div class="enter flex h-13 items-center justify-between border-t border-line" style="--i: 2">
			<dt class="font-mono text-[12px] text-muted">Model</dt>
			<dd><Select bind:value={model} options={models} label="Model" /></dd>
		</div>
		<div class="enter flex h-13 items-center justify-between border-t border-line" style="--i: 3">
			<dt class="font-mono text-[12px] text-muted">Skill</dt>
			<dd class="flex items-center gap-2 font-medium">
				<span
					class="size-2 rounded-full {SKILL_STATUS === 'ready'
						? 'bg-green-500 ring-3 ring-green-500/20'
						: 'bg-amber-500 ring-3 ring-amber-500/20'}"
				></span>
				{SKILL_STATUS === 'ready' ? 'Ready' : 'Placeholder'}
			</dd>
		</div>
		<div class="enter flex h-13 items-center justify-between border-y border-line" style="--i: 4">
			<dt class="font-mono text-[12px] text-muted">Comparisons</dt>
			<dd class="font-semibold tabular-nums">{comparisons.length}</dd>
		</div>
	</dl>

	<section class="enter mb-10" style="--i: 5">
		<div class="mb-2.5 flex flex-wrap items-center justify-between gap-2">
			<h2 class="m-0 text-[13px] font-medium text-[#444]">Component</h2>
			<div class="flex rounded-lg bg-[#efefef] p-0.5" role="tablist" aria-label="Component">
				{#each comparisons as c (c.id)}
					<button
						role="tab"
						aria-selected={c.id === activeId}
						onclick={() => (activeId = c.id)}
						class="rounded-md px-2.5 py-0.75 text-[12px] transition-[background-color,color] duration-50 ease-out {c.id ===
						activeId
							? 'bg-white font-medium text-[#1a1a1a] shadow-ring duration-170'
							: 'text-[#666]'}"
					>
						{c.label}
					</button>
				{/each}
			</div>
		</div>
		<div class="rounded-[10px] bg-white px-4 py-3.5 text-[13px] shadow-ring">
			<span class="font-mono text-muted">&gt;</span>
			{active.prompt}
		</div>
	</section>

	<section class="mb-10">
		<h2 class="enter mb-2.5 text-[13px] font-medium text-[#444]" style="--i: 6">Output</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			{#each panes as pane, i (pane.key)}
				{@const out = getOutput(active, model, pane.key)}
				<div class="enter" style="--i: {7 + i}">
					{#key `${model}:${active.id}:${pane.key}`}
						<OutputCard
							label={pane.label}
							src={out.src}
							tokens={out.tokens}
						/>
					{/key}
				</div>
			{/each}
		</div>
	</section>

	<footer class="enter flex justify-between font-mono text-[12px] text-muted" style="--i: 9">
		<span>MIT</span>
		<a
			href="https://github.com/aidan-neel/design"
			class="text-[#555] no-underline hover:text-[#1a1a1a]">aidan-neel/design</a
		>
	</footer>
</main>
