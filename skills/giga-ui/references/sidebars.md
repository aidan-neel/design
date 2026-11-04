# Sidebars

Open this for any app shell, dashboard nav, or settings rail. View **2–4** images, in this order:

1. `references/sidebars/fintrack.png` (the target)
2. `references/sidebars/anti-example.png` (Northgate Labs, the failure)
3. At most two older stills from the table at the bottom, and only if the product needs that pattern (a nested tree, an icon rail, a dark panel)

Do not open the rest of `sidebars/`, and do not open `landing/`.

| File | What to steal |
|---|---|
| `references/sidebars/fintrack.png` | Inset white card, soft shadow, sentence-case chevron groups, tree counts, color tiles, user card. |
| `references/sidebars/anti-example.png` | Northgate. Don't copy it: uppercase labels, gray type, a search box, a flat flush panel. |

Inter is the typeface. Do not swap it for a display face to make the nav "more designed".

## The anti-example

`anti-example.png` is a sidebar a model shipped from this skill: "Northgate Labs", a search box with a `/` key, tiny tracked uppercase labels (MONETIZATION, WORKSPACE), thin gray icons, gray text, and a flat flush gray panel. It is the ugliest, most generic result this skill produces. These are hard don'ts:

1. **No tiny uppercase tracked section labels by default.** Group headers are sentence case ("Transactions", "Accounts"), 13px, weight 500, near-black, with a chevron. They collapse. Uppercase 11px `#A3A3A3` labels are not the default. Use them only when the rest of that product is already the Monok/Acme mono voice, and never on a light app sidebar.
2. **No washed-out gray text or icons.** Resting labels and icons are `#171717`–`#262626`, weight 500. `#A3A3A3` and `#737373` are for counts, chevrons, emails, and placeholders. An icon that is lighter than its label is wrong.
3. **No default search box.** Do not add a search field, and do not add a `/` keycap, unless the prompt is an inbox, docs, or command palette with a real corpus. Northgate's search is filler.
4. **No flat flush panel.** The sidebar is not a gray slab from the top of the viewport to the bottom with a 1px line on its right. Default is the inset card below.

## Default: the fintrack inset card

`fintrack.png` is the shell to copy.

The page behind it is a neutral gray (`#E6E5E6`-class). The sidebar is a **white card**, inset about 12px from the top, left, and bottom, radius 20px, with a soft shadow (`0 0 0 1px rgb(0 0 0 / .06), 0 12px 32px -16px rgb(0 0 0 / .18)`). It is not full-bleed. The main content sits to the right on its own surface (white, or a second inset panel with radius 12–16 and an 8px outer gap). On a phone the card's margin and radius go to 0 and the nav becomes a drawer.

Anatomy, top to bottom:

- **Brand row.** A 16px mark and a 14px medium wordmark, near-black. Collapse control at the right, 28px hit target. No workspace chevron unless there is a second workspace.
- **Active row is a filled pill.** On this white card the pill is `#ECECEC`–`#F0F0F0`, radius 8–10px, height 32px. The label stays `#171717` medium. On a tinted (non-white) sidebar the pill can instead be white with `--shadow-btn`. Never a saturated pill, never a left accent bar.
- **Rows.** Height 32px, radius 8px, padding-inline 8–10px, gap 2px. Icon 16px, stroke 1.5, same ink as the label, vertically centered. Hover is `rgb(0 0 0 / .04)` in 120ms. No scale.
- **Groups collapse.** "Transactions", "Accounts", "Goals" are buttons with `aria-expanded` and a chevron that rotates 90° in 150ms. Opening animates height (grid `0fr` → `1fr` or Motion `height: auto`, 200ms `--ease-out`). Group gap is 16–20px, larger than the row gap.
- **Tree children.** Indent about 16–20px so the child icon sits under the parent label. A 1px guide (`#E5E5E5`) is optional. Counts are tabular, 12px, `#737373`, right-aligned, plain numbers (12, 8, 5), not pills. Fintrack's Income / Expenses / Pending.
- **Colored tiles only for accounts and projects.** 16px rounded squares (radius 4px), one solid color, a simple glyph. Cards & Bank, Savings, Investments, Loans. Ordinary destinations stay monochrome outline icons. Do not color every row.
- **Footer utilities, then a user card.** Help and Settings are normal rows, pinned to the bottom with the card. The user card is an inner white surface, radius 12px, hairline shadow, avatar 28px, name 13px medium, email 12px `#737373`. It does not scroll away. The sidebar is `height: 100%`, column flex, `margin-top: auto` on the footer.

A second inset, where the sidebar has **no fill of its own** and shares the gray canvas while the content is the rounded white panel, is the same family (Minto, Uniops). Use it when the nav should disappear and the content should float. The row, type, pill, and group rules do not change. When you are unsure, build the fintrack card.

**Flush is opt-in**, for a dense tool that needs every pixel. Flush means the content panel loses its margin, radius, and shadow, and gains one hairline. The sidebar component is the same one: same tint or same card interior, same rows, same pill. Flush is never a reason to rebuild a gray column. The shell test: screenshot inset and flush, crop to the sidebar, and the crops match except at the right edge.

Write one `<Sidebar />`. No `inset` prop and no conditional classes inside it. Only the wrapper around the content changes.

## Measurements

| Token | Value |
|---|---|
| Card inset | 8–12px from the viewport; radius 16–20px |
| Expanded width | 240–264px |
| Collapsed rail | 56–64px, icon centers fixed |
| Row | 32px tall, 8px radius, 8–10px padding, 8px icon gap |
| Icon | 16px, stroke 1.5, same color as the label |
| Group label | 13px / 500 / `#171717`, chevron on the right |
| Section gap | 16–20px; row gap 2px |
| User card | radius 12, padding 8, avatar 28 |

## Behavior

- **Two columns.** Switcher, rows, help, and the user card share one icon column and one text column. With 12px of card padding, 16px icons and 28px avatars share a center line. Measure `getBoundingClientRect().left`. Collapsing hides text; it does not move icons.
- **Triggers are rows.** A workspace or account control is a full-width row of the same height and inset, `text-align: start`. A short centered button whose label misses the column is the usual misalignment.
- **Active pill.** One element, moved with `layoutId` (spring, visualDuration 0.25, bounce 0.15) or with `transform` on a single absolutely positioned pill. Skip the transition on first paint. Rows are `position: relative`.
- **Collapse.** Width 248→60 in 220ms `--ease-out`. Labels `white-space: nowrap; overflow: hidden`, opacity 120ms. Persist in localStorage. Toggle sits on the brand row when expanded and at the start of the top bar when collapsed. `⌘B` / `Ctrl+B` toggles, except in a rich-text field.
- **Resize.** Optional. 8px hit area on the right edge, `col-resize`, a 2px line only after ~150ms of hover. Clamp 200–320px. Drag past the minimum snaps to the rail. Double-click resets. No width transition while dragging. `role="separator"` with arrow keys.
- **Keyboard.** `<nav aria-label>`. Items are links with `aria-current="page"`. Group toggles are buttons with `aria-expanded`. Focus ring is 2px, inset so `overflow` does not clip it.
- **Mobile.** Hide the sidebar under 768px. Drawer is ~85vw, max 320px, scrim `rgb(0 0 0 / .3)`, 280ms `--ease-drawer`. Close on scrim, Esc, or swipe. Row height 44px. Consumer apps can use a floating pill tab bar of 4–5 items instead.

## Mistakes

1. Northgate: uppercase groups, gray type, a search box, a flat flush panel.
2. A colored active row, or a 3px accent bar on the left.
3. Icons of mixed sizes, emoji as icons, icons lighter than the label, icons off the text's center.
4. Labels that wrap. Truncate with ellipsis.
5. Equal gaps everywhere, so groups do not read, or 48px rows.
6. A footer that floats halfway down because the column is not stretched.
7. Collapse that reflows icons or wraps labels.
8. No hover, no focus, no `aria-current`.
9. Fifteen top-level rows. Three or four groups of a few items, utilities in the footer.
10. A flush sidebar that is a different component from the inset one.

## Code

Tokens from `SKILL.md`. The card is the default shell. Groups are collapsible. There is no search.

```tsx
export function Sidebar({ active, onSelect }) {
  const [collapsed, setCollapsed] = useLocalStorage("sb-collapsed", false);
  const [open, setOpen] = useState({ transactions: true, accounts: true });
  return (
    <motion.aside
      animate={{ width: collapsed ? 60 : 248 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="m-3 hidden h-[calc(100dvh-24px)] shrink-0 flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_0_0_1px_rgb(0_0_0/.06),0_12px_32px_-16px_rgb(0_0_0/.18)] md:flex"
    >
      <div className="flex h-12 items-center gap-2 px-3">
        <span className="grid size-4 shrink-0 place-items-center text-[#171717]"><Mark /></span>
        {!collapsed && <span className="truncate text-[14px] font-medium text-[#171717]">Fintrack</span>}
        <button aria-label="Toggle sidebar" onClick={() => setCollapsed(!collapsed)} className="ml-auto grid size-7 place-items-center rounded-md text-[#525252] hover:bg-black/[.04]">
          <PanelLeft className="size-4" strokeWidth={1.5} />
        </button>
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-4 overflow-y-auto px-2">
        <NavItem id="dash" label="Dashboard" icon={Home} active={active} collapsed={collapsed} onSelect={onSelect} />
        {groups.map((g) => (
          <div key={g.id}>
            {!collapsed && (
              <button aria-expanded={open[g.id]} onClick={() => setOpen({ ...open, [g.id]: !open[g.id] })}
                className="flex h-8 w-full items-center px-2.5 text-[13px] font-medium text-[#171717]">
                {g.label}
                <ChevronRight className={cn("ml-auto size-3.5 text-[#737373] transition-transform duration-150", open[g.id] && "rotate-90")} strokeWidth={1.5} />
              </button>
            )}
            <AnimatePresence initial={false}>
              {open[g.id] && !collapsed && (
                <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }} className="overflow-hidden">
                  {g.items.map((it) => <li key={it.id}><NavItem {...it} active={active} onSelect={onSelect} child={it.child} /></li>)}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>
      <div className="mt-auto px-2 pb-2">
        <NavItem id="help" label="Help Center" icon={CircleHelp} active={active} collapsed={collapsed} onSelect={onSelect} />
        <NavItem id="settings" label="Settings" icon={Settings} active={active} collapsed={collapsed} onSelect={onSelect} />
        {!collapsed && (
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-white p-2 shadow-[var(--shadow-btn)]">
            <img alt="" src="/avatars/yasir.jpg" className="size-7 rounded-full" />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-medium text-[#171717]">Yasir Noori</div>
              <div className="truncate text-[12px] text-[#737373]">yasir@fintrack.io</div>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
```

`NavItem` is a 32px row. When `active === id`, render one shared `layoutId="sb-pill"` span, `bg-[#EFEFEF] rounded-lg`. Child rows add `pl-4`. A `swatch` renders a 16px colored square instead of an outline icon. Counts sit in `ml-auto text-[12px] tabular-nums text-[#737373]`.

Inset page:

```tsx
<div className="flex h-dvh overflow-hidden bg-[#E8E8E8]">
  <Sidebar />
  <main className="my-3 mr-3 flex-1 overflow-auto rounded-2xl bg-white shadow-[var(--shadow-card)] max-md:m-0 max-md:rounded-none">…</main>
</div>
```

Flush page, same sidebar: drop the main margin, radius, and shadow, and add `border-l border-black/[.06]`.

## Older stills

At most two, after fintrack and the anti-example.

| File | What to steal |
|---|---|
| `references/sidebars/2026-10-03_2106499785813360687_1.png` | Switcher, real search with a `/` key (only because this product searches), color swatches. |
| `references/sidebars/2026-10-03_2106500336081063986_1.png` | Nested children under a parent, gray canvas, white content. |
| `references/sidebars/2026-10-14_2110467790343737666_3.png` | Active row with a trailing chevron, pinned tools. |
| `references/sidebars/2026-10-22_2113384174924988778_1.png` | Content panel floating beside a quiet nav. |
| `references/sidebars/2026-10-07_2107869459142914419_1.png` | Icon rail plus a list column. |
| `references/sidebars/2026-10-06_2107505914345603127_1.png` | Dark panel. Uppercase labels here are the exception, not the default. |
| `references/sidebars/2026-10-04_2106852842342375894_1.png` | High-contrast active pill with a count. |
