<script>
	import { Command, Dialog } from 'bits-ui';

	let open = $state(false);
	let query = $state('');

	let listEl = $state(null);
	let moreBelow = $state(false);

	function updateMoreBelow() {
		if (!listEl) return;
		moreBelow = listEl.scrollTop + listEl.clientHeight < listEl.scrollHeight - 2;
	}

	function handleKeydown(event) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			open = true;
		}
	}

	const groups = [
		{
			heading: 'Actions',
			items: [
				{ value: 'New file', shortcut: '⌘N', icon: 'file-plus', keywords: ['create'] },
				{ value: 'New folder', shortcut: '⌘⇧N', icon: 'folder-plus', keywords: ['create', 'directory'] },
				{ value: 'Rename', shortcut: 'F2', icon: 'pencil', keywords: ['edit', 'title'] },
				{ value: 'Duplicate', shortcut: '⌘D', icon: 'copy', keywords: ['clone'] },
				{ value: 'Move to…', shortcut: '⌘⇧M', icon: 'corner-down-right', keywords: ['move', 'folder'] },
				{ value: 'Delete', shortcut: '⌫', icon: 'trash', keywords: ['remove', 'trash'] }
			]
		},
		{
			heading: 'Navigate',
			items: [
				{ value: 'Go to dashboard', shortcut: '⌘1', icon: 'dashboard', keywords: ['home', 'overview'] },
				{ value: 'Go to projects', shortcut: '⌘2', icon: 'folder', keywords: ['workspace'] },
				{ value: 'Go to settings', shortcut: '⌘,', icon: 'settings', keywords: ['preferences', 'config'] }
			]
		},
		{
			heading: 'Workspace',
			items: [
				{ value: 'Invite teammates', shortcut: '', icon: 'user-plus', keywords: ['people', 'members', 'share'] },
				{ value: 'Keyboard shortcuts', shortcut: '?', icon: 'keyboard', keywords: ['keys', 'bindings'] },
				{ value: 'Copy link', shortcut: '⌘⇧C', icon: 'link', keywords: ['share', 'url'] }
			]
		}
	];

	$effect(() => {
		void query;
		if (listEl) updateMoreBelow();
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#snippet icon(name)}
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.75"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="size-4"
		aria-hidden="true"
	>
		{#if name === 'search'}
			<circle cx="11" cy="11" r="8" />
			<path d="m21 21-4.3-4.3" />
		{:else if name === 'file-plus'}
			<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
			<path d="M14 2v4a2 2 0 0 0 2 2h4" />
			<path d="M9 15h6" />
			<path d="M12 12v6" />
		{:else if name === 'folder-plus'}
			<path d="M12 10v6" />
			<path d="M9 13h6" />
			<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
		{:else if name === 'pencil'}
			<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
			<path d="m15 5 4 4" />
		{:else if name === 'copy'}
			<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
			<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
		{:else if name === 'corner-down-right'}
			<path d="m15 10 5 5-5 5" />
			<path d="M4 4v7a4 4 0 0 0 4 4h12" />
		{:else if name === 'trash'}
			<path d="M3 6h18" />
			<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
			<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
			<line x1="10" x2="10" y1="11" y2="17" />
			<line x1="14" x2="14" y1="11" y2="17" />
		{:else if name === 'dashboard'}
			<rect width="7" height="9" x="3" y="3" rx="1" />
			<rect width="7" height="5" x="14" y="3" rx="1" />
			<rect width="7" height="9" x="14" y="12" rx="1" />
			<rect width="7" height="5" x="3" y="16" rx="1" />
		{:else if name === 'folder'}
			<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
		{:else if name === 'settings'}
			<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
			<circle cx="12" cy="12" r="3" />
		{:else if name === 'user-plus'}
			<path d="M2 21a8 8 0 0 1 13.292-6" />
			<circle cx="10" cy="8" r="5" />
			<path d="M19 16v6" />
			<path d="M22 19h-6" />
		{:else if name === 'keyboard'}
			<path d="M10 8h.01" />
			<path d="M12 12h.01" />
			<path d="M14 8h.01" />
			<path d="M16 12h.01" />
			<path d="M18 8h.01" />
			<path d="M6 8h.01" />
			<path d="M7 16h10" />
			<path d="M8 12h.01" />
			<rect width="20" height="16" x="2" y="4" rx="2" />
		{:else if name === 'link'}
			<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
			<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
		{/if}
	</svg>
{/snippet}

<Dialog.Root bind:open>
	<Dialog.Trigger
		class="flex h-9 w-80 max-w-full items-center gap-2.5 rounded-lg border border-line bg-white px-3 text-left text-sm transition-colors duration-150 hover:bg-neutral-100"
	>
		<span class="shrink-0 text-muted">{@render icon('search')}</span>
		<span class="min-w-0 flex-1 truncate font-medium text-[#1a1a1a]">Search actions</span>
		<kbd aria-hidden="true" class="shrink-0 rounded-[5px] border border-line px-1.5 py-0.5 text-xs font-medium text-muted">
			⌘K
		</kbd>
	</Dialog.Trigger>

	<Dialog.Portal>
		<Dialog.Overlay>
			{#snippet child({ props })}
				<div {...props} class="scrim"></div>
			{/snippet}
		</Dialog.Overlay>

		<Dialog.Content>
			{#snippet child({ props })}
				<div {...props} class="palette">
					<Dialog.Title class="sr-only">Command palette</Dialog.Title>
					<Dialog.Description class="sr-only">
						Search for an action and press Enter to run it.
					</Dialog.Description>

					<Command.Root label="Search actions" class="flex min-h-0 flex-1 flex-col">
						<div class="relative border-b border-line">
							<span class="pointer-events-none absolute top-1/2 left-3 flex -translate-y-1/2 text-muted">
								{@render icon('search')}
							</span>
							<Command.Input
								bind:value={query}
								placeholder="Search actions"
								class="h-9 w-full bg-transparent pr-3 pl-10 text-sm text-[#1a1a1a] placeholder:text-muted focus-visible:rounded-t-xl focus-visible:outline-offset-[-2px]"
							/>
						</div>

						<div class="flex min-h-0 flex-1 flex-col" class:more-below={moreBelow}>
							<Command.List
								bind:ref={listEl}
								onscroll={updateMoreBelow}
								class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
							>
								<Command.Viewport>
									<Command.Empty class="flex flex-col items-center gap-2 px-4 py-10 text-center">
										{#if query}
											<p class="text-sm text-muted">No actions match "{query}".</p>
											<button
												type="button"
												onclick={() => (query = '')}
												class="text-sm font-medium text-[#1a1a1a] underline decoration-[#c9c9c9] underline-offset-2 transition-colors duration-150 hover:decoration-[#1a1a1a]"
											>
												Clear search
											</button>
										{:else}
											<p class="text-sm text-muted">No actions available.</p>
										{/if}
									</Command.Empty>

									{#each groups as group (group.heading)}
										<Command.Group value={group.heading}>
											<Command.GroupHeading class="px-2 pt-2.5 pb-1 text-xs font-medium text-muted">
												{group.heading}
											</Command.GroupHeading>
											<Command.GroupItems>
												{#each group.items as item (item.value)}
													<Command.Item
														value={item.value}
														keywords={item.keywords}
														onSelect={() => (open = false)}
														class="flex h-8 items-center gap-2.5 rounded-md px-2 text-sm text-[#1a1a1a] transition-colors duration-[60ms] data-[selected]:bg-neutral-100 data-[selected]:transition-none"
													>
														<span class="flex size-4 shrink-0 items-center justify-center text-muted">
															{@render icon(item.icon)}
														</span>
														<span class="min-w-0 flex-1 truncate">{item.value}</span>
														{#if item.shortcut}
															<span class="shrink-0 text-xs text-muted">{item.shortcut}</span>
														{/if}
													</Command.Item>
												{/each}
											</Command.GroupItems>
										</Command.Group>
									{/each}
								</Command.Viewport>
							</Command.List>
						</div>
					</Command.Root>
				</div>
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgb(0 0 0 / 0.45);
		opacity: 1;
		transition: opacity 100ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.scrim[data-starting-style],
	.scrim[data-ending-style] {
		opacity: 0;
	}
	.scrim[data-ending-style] {
		transition: opacity 60ms ease-in;
	}

	.palette {
		position: fixed;
		left: 50%;
		top: 50%;
		z-index: 50;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		width: min(560px, calc(100vw - 2rem));
		max-height: min(440px, calc(100dvh - 6rem));
		overflow: hidden;
		border-radius: 12px;
		background: #fff;
		box-shadow: 0 16px 48px -12px rgb(0 0 0 / 0.24);
		opacity: 1;
		transition: opacity 100ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	.palette[data-starting-style],
	.palette[data-ending-style] {
		opacity: 0;
	}
	.palette[data-ending-style] {
		transition: opacity 60ms ease-in;
	}

	.more-below {
		mask-image: linear-gradient(to bottom, #000 calc(100% - 20px), transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.scrim,
		.palette {
			transition: none;
		}
	}
</style>
