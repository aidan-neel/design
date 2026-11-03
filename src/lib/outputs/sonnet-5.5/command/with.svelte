<script>
	import { Command, Dialog } from 'bits-ui';

	// Lucide paths, copied verbatim (ISC). 24x24 viewBox, stroke 2, rendered at 16px.
	const icons = {
		search: '<path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" />',
		filePlus:
			'<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" /><path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M9 15h6" /><path d="M12 18v-6" />',
		folderPlus:
			'<path d="M12 10v6" /><path d="M9 13h6" /><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />',
		terminal: '<path d="M12 19h8" /><path d="m4 17 6-6-6-6" />',
		house:
			'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
		settings:
			'<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" /><circle cx="12" cy="12" r="3" />',
		history:
			'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" />',
		keyboard:
			'<path d="M10 8h.01" /><path d="M12 12h.01" /><path d="M14 8h.01" /><path d="M16 12h.01" /><path d="M18 8h.01" /><path d="M6 8h.01" /><path d="M7 16h10" /><path d="M8 12h.01" /><rect width="20" height="16" x="2" y="4" rx="2" />',
		panelLeft: '<rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18" />',
		zoomIn:
			'<circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /><line x1="11" x2="11" y1="8" y2="14" /><line x1="8" x2="14" y1="11" y2="11" />',
		zoomOut:
			'<circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /><line x1="8" x2="14" y1="11" y2="11" />',
		maximize:
			'<path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />',
		link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />',
		userPlus:
			'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" x2="19" y1="8" y2="14" /><line x1="22" x2="16" y1="11" y2="11" />',
		logOut:
			'<path d="m16 17 5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />'
	};

	const groups = [
		{
			label: 'Create',
			items: [
				{ label: 'New file', icon: 'filePlus', keywords: ['add', 'document'] },
				{ label: 'New folder', icon: 'folderPlus', keywords: ['add', 'directory'] },
				{ label: 'New terminal', icon: 'terminal', keywords: ['shell', 'console', 'cli'] }
			]
		},
		{
			label: 'Go to',
			items: [
				{ label: 'Dashboard', icon: 'house', keywords: ['home', 'overview'] },
				{ label: 'Recent files', icon: 'history', keywords: ['open', 'history'] },
				{ label: 'Settings', icon: 'settings', keywords: ['preferences', 'options', 'config'] },
				{ label: 'Keyboard shortcuts', icon: 'keyboard', keywords: ['keys', 'bindings', 'hotkeys'] }
			]
		},
		{
			label: 'View',
			items: [
				{ label: 'Toggle sidebar', icon: 'panelLeft', keywords: ['hide', 'show', 'panel'] },
				{ label: 'Zoom in', icon: 'zoomIn', keywords: ['larger', 'bigger'] },
				{ label: 'Zoom out', icon: 'zoomOut', keywords: ['smaller'] },
				{ label: 'Enter full screen', icon: 'maximize', keywords: ['maximize', 'expand'] }
			]
		},
		{
			label: 'Team',
			items: [
				{ label: 'Copy link', icon: 'link', keywords: ['share', 'url'] },
				{ label: 'Invite teammates', icon: 'userPlus', keywords: ['add', 'member', 'people'] },
				{ label: 'Sign out', icon: 'logOut', keywords: ['log out', 'logout', 'exit'] }
			]
		}
	];

	let open = $state(false);
	let search = $state('');
	let list = $state(null);
	let triggerEl = $state(null);
	let more = $state({ above: false, below: false });
	let announcement = $state('');
	let mod = $state('Ctrl');

	$effect(() => {
		const platform = navigator.userAgentData?.platform ?? navigator.platform ?? '';
		if (/mac|iphone|ipad/i.test(platform)) mod = '⌘';
	});

	// Every open starts from a clean query.
	$effect(() => {
		if (open) search = '';
	});

	function onWindowKeydown(e) {
		if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
		e.preventDefault();
		if (!e.repeat) open = !open;
	}

	function run(item) {
		open = false;
		announcement = '';
		setTimeout(() => (announcement = `${item.label} ran`), 50);
	}

	function measure() {
		if (!list) return;
		more = {
			above: list.scrollTop > 1,
			below: list.scrollTop + list.clientHeight < list.scrollHeight - 1
		};
	}

	$effect(() => {
		if (!list) return;
		const observer = new ResizeObserver(measure);
		observer.observe(list);
		if (list.firstElementChild) observer.observe(list.firstElementChild);
		measure();
		return () => observer.disconnect();
	});
</script>

<svelte:window onkeydown={onWindowKeydown} />

{#snippet icon(paths)}
	<svg
		class="icon"
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
	>
		{@html paths}
	</svg>
{/snippet}

<Dialog.Root bind:open>
	<Dialog.Trigger aria-keyshortcuts="Meta+K Control+K">
		{#snippet child({ props })}
			<button {...props} bind:this={triggerEl} type="button" class="trigger">
				{@render icon(icons.search)}
				<span class="trigger-label">Search actions</span>
				<span class="keys" aria-hidden="true"><span>{mod}</span><span>K</span></span>
			</button>
		{/snippet}
	</Dialog.Trigger>

	<Dialog.Portal>
		<Dialog.Overlay>
			{#snippet child({ props })}
				<div {...props} class="overlay"></div>
			{/snippet}
		</Dialog.Overlay>

		<Dialog.Content
			onCloseAutoFocus={(e) => {
				e.preventDefault();
				triggerEl?.focus();
			}}
		>
			{#snippet child({ props })}
				<div {...props} class="content">
					<Dialog.Title>
						{#snippet child({ props })}
							<h2 {...props} class="sr-only">Command palette</h2>
						{/snippet}
					</Dialog.Title>

					<Command.Root label="Actions" loop vimBindings={false}>
						{#snippet child({ props })}
							<div {...props} class="root">
								<div class="field">
									{@render icon(icons.search)}
									<Command.Input bind:value={search}>
										{#snippet child({ props })}
											<input
												{...props}
												bind:value={search}
												class="input"
												placeholder="Search actions"
												aria-label="Search actions"
											/>
										{/snippet}
									</Command.Input>
								</div>

								<Command.List bind:ref={list} onscroll={measure}>
									{#snippet child({ props })}
										<div
											{...props}
											class="list"
											data-more-above={more.above || undefined}
											data-more-below={more.below || undefined}
										>
											<Command.Viewport>
												<Command.Empty>
													{#snippet child({ props })}
														<div {...props} class="empty">
															<span>No matching actions</span>
															<button type="button" class="clear" onclick={() => (search = '')}>
																Clear search
															</button>
														</div>
													{/snippet}
												</Command.Empty>

												{#each groups as group (group.label)}
													<Command.Group>
														{#snippet child({ props })}
															<div {...props} class="group">
																<Command.GroupHeading>
																	{#snippet child({ props })}
																		<div {...props} class="heading">{group.label}</div>
																	{/snippet}
																</Command.GroupHeading>
																<Command.GroupItems>
																	{#each group.items as item (item.label)}
																		<Command.Item
																			value={item.label}
																			keywords={item.keywords}
																			onSelect={() => run(item)}
																		>
																			{#snippet child({ props })}
																				<div {...props} class="item">
																					{@render icon(icons[item.icon])}
																					<span class="item-label">{item.label}</span>
																				</div>
																			{/snippet}
																		</Command.Item>
																	{/each}
																</Command.GroupItems>
															</div>
														{/snippet}
													</Command.Group>
												{/each}
											</Command.Viewport>
										</div>
									{/snippet}
								</Command.List>
							</div>
						{/snippet}
					</Command.Root>
				</div>
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<div class="sr-only" aria-live="polite">{announcement}</div>

<style>
	.trigger,
	.overlay,
	.content {
		--surface: oklch(1 0 0);
		--fg: oklch(0.22 0.006 255);
		--muted: oklch(0.5 0.008 255);
		--hover: oklch(0.965 0.004 255);
		--line: oklch(0.88 0.006 255);
		--divider: oklch(0.92 0.005 255);
		--focus: oklch(0.55 0.008 255);
		--scrim: oklch(0 0 0 / 0.4);
		--shadow: 0 16px 48px oklch(0 0 0 / 0.16), 0 2px 8px oklch(0 0 0 / 0.06);
		--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
		--row: 32px;
		--pad: 6px;
		--z: 100;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		padding: 0;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
		border: 0;
	}

	.icon {
		flex: none;
		color: var(--muted);
	}

	/* Trigger */
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		width: 15rem;
		max-width: 100%;
		height: 32px;
		padding: 0 10px;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--surface);
		color: var(--muted);
		font: inherit;
		font-size: 14px;
		font-weight: 500;
		line-height: 1;
		white-space: nowrap;
		cursor: default;
		transition: background-color 120ms ease;
	}

	.trigger-label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.keys {
		display: flex;
		gap: 2px;
		margin-left: auto;
		font-size: 12px;
		font-weight: 400;
		font-variant-numeric: tabular-nums;
	}

	.trigger:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}

	@media (hover: hover) and (pointer: fine) {
		.trigger:hover {
			background: var(--hover);
		}
	}

	/* Overlay and panel: a keyboard-opened surface, so a short fade and nothing else. */
	.overlay {
		position: fixed;
		inset: 0;
		z-index: var(--z);
		background: var(--scrim);
		opacity: 1;
		transition: opacity 100ms var(--ease-out);
	}

	.content {
		position: fixed;
		z-index: var(--z);
		top: max(1rem, 12dvh);
		left: 50%;
		translate: -50% 0;
		width: min(35rem, calc(100vw - 2rem));
		overflow: hidden;
		border-radius: 12px;
		background: var(--surface);
		color: var(--fg);
		font-family: inherit;
		box-shadow: var(--shadow);
		opacity: 1;
		transition: opacity 100ms var(--ease-out);
	}

	.overlay[data-starting-style],
	.content[data-starting-style] {
		opacity: 0;
	}

	.overlay[data-ending-style],
	.content[data-ending-style] {
		opacity: 0;
		transition: opacity 60ms ease-in;
	}

	.root {
		display: flex;
		flex-direction: column;
	}

	/* Search field */
	.field {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 40px;
		padding: 0 16px;
		border-bottom: 1px solid var(--divider);
		transition: border-color 120ms ease;
	}

	.field:focus-within {
		border-bottom-color: var(--focus);
	}

	.input {
		flex: 1;
		min-width: 0;
		height: 100%;
		padding: 0;
		border: 0;
		outline: 0;
		background: transparent;
		color: var(--fg);
		font: inherit;
		font-size: 14px;
		line-height: 20px;
		cursor: default;
	}

	.input::placeholder {
		color: var(--muted);
		opacity: 1;
	}

	/* List: no scrollbar, the edge fades where more rows are hidden. */
	.list {
		max-height: min(22rem, calc(88dvh - 5rem));
		padding: var(--pad);
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: none;
		--fade-top: 0px;
		--fade-bottom: 0px;
		mask-image: linear-gradient(
			to bottom,
			transparent,
			#000 var(--fade-top),
			#000 calc(100% - var(--fade-bottom)),
			transparent
		);
	}

	.list::-webkit-scrollbar {
		display: none;
	}

	.list[data-more-above] {
		--fade-top: 16px;
	}

	.list[data-more-below] {
		--fade-bottom: 16px;
	}

	.heading {
		display: flex;
		align-items: center;
		height: 28px;
		padding: 8px 10px 0;
		color: var(--muted);
		font-size: 12px;
		font-weight: 500;
		line-height: 16px;
	}

	.item {
		display: flex;
		align-items: center;
		gap: 10px;
		height: var(--row);
		padding: 0 10px;
		border-radius: 6px;
		color: var(--fg);
		font-size: 14px;
		line-height: 20px;
		cursor: default;
		user-select: none;
		transition: background-color 60ms ease;
	}

	.item-label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* The pointer and the keyboard share one highlight: it snaps on and fades off. */
	.item[data-selected] {
		background: var(--hover);
		transition: none;
	}

	/* No match */
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 24px 16px 20px;
		color: var(--muted);
		font-size: 14px;
		line-height: 20px;
	}

	.clear {
		height: 28px;
		padding: 0 10px;
		border: 0;
		border-radius: 6px;
		background: transparent;
		color: var(--fg);
		font: inherit;
		font-size: 14px;
		font-weight: 500;
		line-height: 1;
		cursor: default;
		transition: background-color 120ms ease;
	}

	.clear:focus-visible {
		outline: 2px solid var(--focus);
		outline-offset: 2px;
	}

	@media (hover: hover) and (pointer: fine) {
		.clear:hover {
			background: var(--hover);
		}
	}

	/* Touch: 44px targets, 16px input text so iOS does not zoom. */
	@media (pointer: coarse) {
		.trigger {
			height: 44px;
		}

		.content {
			--row: 44px;
		}

		.field {
			height: 44px;
		}

		.input {
			font-size: 16px;
		}

		.heading {
			height: 32px;
		}

		.clear {
			height: 44px;
			padding: 0 16px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.overlay,
		.content {
			transition-duration: 1ms;
		}
	}
</style>
