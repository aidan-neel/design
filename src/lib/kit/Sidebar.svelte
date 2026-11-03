<!--
	Resizable, collapsible sidebar column.
	- Drag the right edge to resize; drag past the minimum to snap it shut, drag back out to reopen.
	- Double-click the edge to reset the width. With the edge focused: ←/→ resize, Enter toggles.
	- ⌘B / Ctrl+B toggles from anywhere.
	`collapsedWidth` 0 hides the sidebar; a positive value leaves an icon rail of that width.
-->
<script lang="ts">
	import './kit.css';
	import type { Snippet } from 'svelte';
	import { untrack } from 'svelte';

	type Props = {
		defaultWidth: number;
		minWidth: number;
		maxWidth: number;
		collapsedWidth?: number;
		collapsed?: boolean;
		class?: string;
		children: Snippet<[{ collapsed: boolean }]>;
	};

	let {
		defaultWidth,
		minWidth,
		maxWidth,
		collapsedWidth = 0,
		collapsed = $bindable(false),
		class: className = '',
		children
	}: Props = $props();

	/** How far past the minimum the edge has to travel before the sidebar snaps shut. */
	const SNAP_DISTANCE = 56;
	const KEY_STEP = 16;
	const KEY_STEP_LARGE = 64;

	let width = $state(untrack(() => defaultWidth));
	let drag = $state<{ startX: number; startWidth: number } | null>(null);

	const renderedWidth = $derived(collapsed ? collapsedWidth : width);
	const hidesContent = $derived(collapsed && collapsedWidth === 0);

	function clampWidth(value: number): number {
		return Math.min(maxWidth, Math.max(minWidth, value));
	}

	function startDrag(event: PointerEvent): void {
		if (event.button !== 0) return;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		drag = { startX: event.clientX, startWidth: renderedWidth };
		document.documentElement.classList.add('kit-resizing');
	}

	function moveDrag(event: PointerEvent): void {
		if (!drag) return;
		const next = drag.startWidth + event.clientX - drag.startX;
		if (next < minWidth - SNAP_DISTANCE) {
			collapsed = true;
			return;
		}
		collapsed = false;
		width = clampWidth(next);
	}

	function endDrag(): void {
		drag = null;
		document.documentElement.classList.remove('kit-resizing');
	}

	function resetWidth(): void {
		collapsed = false;
		width = defaultWidth;
	}

	function onHandleKeydown(event: KeyboardEvent): void {
		const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
		if (event.key === 'Enter') {
			collapsed = !collapsed;
		} else if (event.key === 'ArrowLeft') {
			if (collapsed) return;
			if (width <= minWidth) collapsed = true;
			else width = clampWidth(width - step);
		} else if (event.key === 'ArrowRight') {
			if (collapsed) collapsed = false;
			else width = clampWidth(width + step);
		} else {
			return;
		}
		event.preventDefault();
	}

	function onWindowKeydown(event: KeyboardEvent): void {
		const isToggle = (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'b';
		if (!isToggle) return;
		// ⌘B means bold inside rich text; leave it alone there
		if (event.target instanceof HTMLElement && event.target.isContentEditable) return;
		event.preventDefault();
		collapsed = !collapsed;
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div
	class="kit-sidebar {className}"
	style:width="{renderedWidth}px"
	data-collapsed={collapsed ? '' : undefined}
	data-resizing={drag ? '' : undefined}
>
	<div class="kit-sidebar-body" inert={hidesContent}>
		<div style:width={collapsedWidth === 0 ? `${width}px` : '100%'} style:height="100%">
			{@render children({ collapsed })}
		</div>
	</div>
	<!-- A focusable separator is the WAI-ARIA window-splitter pattern; svelte's lint treats every separator as static. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		class="kit-sidebar-handle"
		role="separator"
		tabindex="0"
		aria-label="Resize sidebar"
		aria-orientation="vertical"
		aria-valuenow={renderedWidth}
		aria-valuemin={collapsedWidth}
		aria-valuemax={maxWidth}
		onpointerdown={startDrag}
		onpointermove={moveDrag}
		onpointerup={endDrag}
		onpointercancel={endDrag}
		ondblclick={resetWidth}
		onkeydown={onHandleKeydown}
	></div>
</div>
