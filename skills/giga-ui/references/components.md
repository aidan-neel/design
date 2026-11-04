# Components, motion, states

Open this for a button, input, menu, dialog, toast, tag, or any motion detail that `SKILL.md` only names. View **at most two** stills from the table at the bottom. Sidebar layout is `sidebars.md`. Landing layout is `landing.md`.

Snippets assume `import { motion, AnimatePresence, MotionConfig } from "motion/react"` and a `cn()` helper. Tokens live in `SKILL.md`.

## Button [seen]

30px tall, radius 10px, 14px medium. Secondary is a vertical gradient `#FFFFFF → #F7F7F7` and two shadows: `0 1px 2px rgb(40 40 40 / .08)` plus a 1px spread `#ECECEC`. No border. Primary is the accent, white text, `--shadow-btn-primary`. Press scale 0.97.

```tsx
export function Button({ variant = "secondary", className, ...props }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", visualDuration: 0.15, bounce: 0 }}
      className={cn(
        "inline-flex h-[30px] items-center gap-1.5 rounded-[10px] px-3 text-[14px] font-medium select-none",
        "transition-[background,box-shadow,color] duration-150 ease-out outline-none",
        "focus-visible:shadow-[var(--shadow-focus),var(--shadow-btn)]",
        variant === "secondary" && "bg-gradient-to-b from-white to-[#F7F7F7] text-[#171717] shadow-[var(--shadow-btn)] hover:to-[#F2F2F2]",
        variant === "primary" && "bg-[var(--accent)] text-white shadow-[var(--shadow-btn-primary)] hover:bg-[var(--accent-hover)]",
        className
      )}
      {...props}
    />
  );
}
```

```css
.btn { height: 30px; padding: 0 12px; border: 0; border-radius: 10px; font: 500 14px/1 var(--font-sans);
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;
  transition: transform 150ms var(--ease-out), box-shadow 150ms var(--ease-out), background 150ms var(--ease-out); }
.btn:active { transform: scale(0.97); }
.btn:focus-visible { outline: none; box-shadow: var(--shadow-focus), var(--shadow-btn); }
.btn--secondary { background: linear-gradient(#fff, #f7f7f7); color: var(--fg); box-shadow: var(--shadow-btn); }
.btn--primary { background: var(--accent); color: var(--accent-fg); box-shadow: var(--shadow-btn-primary); }
@media (hover: hover) { .btn--primary:hover { background: var(--accent-hover); } }
```

A mobile primary is `height: var(--h-cta-mobile); width: 100%; border-radius: 999px`, pinned with 16px side inset and a fade into the page behind it. Active scale 0.98.

## Input

Bare field: height 40px, radius 10px, `--shadow-btn`, placeholder `#A3A3A3`. Focus replaces the shadow with `0 0 0 1px var(--accent), 0 0 0 4px var(--ring)`. Invalid uses `--danger` and `rgb(220 38 38 / .15)`.

Once the input sits in a visible box (search, composer, icon, button), the **box** gets the ring and the input gets `outline: none`. See Focus.

## Focus: one ring, on the shape you see [expert]

- Composite fields use `:focus-within` or `:has(textarea:focus)` on the wrapper. The classic bug is two rounded rectangles, a few pixels apart.
- A global `:focus-visible` outline must not hit inputs, which match `:focus-visible` on click. Use `:focus-visible:not(input, textarea, [contenteditable])`.
- `outline` follows `border-radius`. Offset 2px on buttons, −2px (inset) on rows inside a scroller so the ring is not clipped.
- Unlayered CSS beats Tailwind layers. Check the computed `outline` and `box-shadow`.
- Menu items show focus with the hover background (`[data-highlighted]`), not a second ring.
- `aria-invalid` changes the ring color. It does not add a ring.

```css
.composer { border-radius: 16px; box-shadow: 0 0 0 1px var(--border); transition: box-shadow 150ms var(--ease-out); }
.composer:has(textarea:focus) { box-shadow: 0 0 0 1px var(--accent), 0 0 0 4px var(--ring); }
.composer textarea { outline: none; }
.app :focus-visible:not(input, textarea) { outline: 2px solid var(--accent); outline-offset: 2px; }
```

## Field errors [expert]

Validate on blur or submit, not on each key. Once a field is invalid, clear the error as they type when it becomes valid. The message opens with `grid-template-rows: 0fr → 1fr`, opacity, and translateY −4px, about 200ms, so the layout does not jump. Keep the text mounted while it closes. One line, danger color, 14px alert icon. On a failed sign-in, shake the form once (`translateX` ±6px, ~320ms) and select the password; skip the shake under reduced motion. Focus the first invalid field. `aria-invalid`, `aria-describedby`, `aria-live="polite"`.

```css
.field-error { display: grid; grid-template-rows: 0fr; opacity: 0; transform: translateY(-4px);
  transition: grid-template-rows 200ms var(--ease-out), opacity 160ms var(--ease-out), transform 200ms var(--ease-out); }
.field-error[data-visible] { grid-template-rows: 1fr; opacity: 1; transform: none; }
.field-error > div { overflow: hidden; }
```

## Small components

- **Nav pill.** One `layoutId` span, `absolute inset-0`, white or `#EFEFEF`, `--shadow-btn` or a flat fill. Spring visualDuration 0.25, bounce 0.15. The full sidebar is `sidebars.md`. Without Motion, move one pill with `translateY` and skip the first paint.
- **Segmented control.** Track `bg-[#F4F4F4] p-1 rounded-[10px]`. Thumb is the same sliding pill. Inactive label `#737373`, 13px medium.
- **KPI.** 13px secondary label, 28px mono medium number, tabular, tracking −0.02em, then a tinted delta (`#16A34A` on `#ECFDF3`) and a 12px tertiary caption. Enter: opacity and y 8, 350ms ease-out.
- **Tag.** Height 22px, radius 6px, 12px medium. Success `#15803D` / `#ECFDF3`, danger `#B91C1C` / `#FEF2F2`, info `#1D4ED8` / `#EEF4FF`, each with an inset 1px tint border. Never white text on a saturated tag. [seen]
- **Popover.** From `opacity 0, scale .96, y -4` to rest, spring visualDuration 0.2, bounce 0, origin at the trigger. Exit opacity and scale .98 in 120ms ease-in. Never scale from 0. Command palette: radius 24px, `ESC` keycap, hovered row `#F5F5F5`. A palette opened from the keyboard does not animate, or fades in under 120ms. [expert]
- **Modal.** Scrim `rgb(0 0 0 / .4)` fades 200ms. Panel from scale .96 and y 8, spring visualDuration .3, bounce .1, radius 20–24, origin center. Sheet: `y: 100% → 0` on `--ease-drawer` in 400–500ms, radius 24–32 on the top, grabber 36×5 `#D4D4D4`, drag to dismiss.
- **Toast.** Dark pill on light UI: `#171717`, white text, radius 10px, height 36px, Undo in `bg-white/10`. Enter y 16 and scale .96, spring visualDuration .35, bounce .15. Exit 150ms. Stacked toasts scale down 0.05 and peek 8px. Destructive actions undo from the toast for ~5s; reserve a confirm dialog for what undo cannot reverse. Errors do not auto-dismiss.
- **Skeleton.** The final layout's heights, radii, and gaps. Shimmer `#F2F2F2 → #E9E9E9`, 1.4s. Crossfade real content in 200ms. Show a spinner only after ~300ms. In a button, keep the width and swap the label (`blur 2px → 0`, y 6 → 0). No shimmer under reduced motion.
- **Carousel dot.** The active dot widens into a pill.

## Motion system [expert unless marked]

His captions care about motion and do not publish curves. Numbers below are Emil Kowalski, Motion, and Apple HIG, tuned to stay calm.

**Principles.** Animate to show origin, confirm an action, or connect states. Things seen 100 times a day get little or none. Ease-out on enter. Ease-in-out for something moving across the screen. Never ease-in on enter. Springs for anything you can interrupt. CSS transitions or Motion, not one-shot keyframes, so they retarget. `transform` and `opacity` only, plus a little blur. Reduced motion is a fade.

**Easings.** `--ease-out` cubic-bezier(0.23, 1, 0.32, 1) for enter, hover, press, popovers. `--ease-in-out` (0.77, 0, 0.175, 1) for on-screen movement. `--ease-drawer` (0.32, 0.72, 0, 1) for sheets. Exit is ease-in, about 60–75% of the enter duration.

**Durations.** 100ms color. 150ms press, tooltip, focus, exits. 200ms popover, tab, toggle. 250–300ms modal, accordion. 350–500ms sheet and page. Marketing hero choreography can run 600–1200ms once. Cap everything else.

**Springs.**

```ts
export const spring = {
  snappy: { type: "spring", visualDuration: 0.2, bounce: 0 },
  smooth: { type: "spring", visualDuration: 0.3, bounce: 0.1 },
  gentle: { type: "spring", visualDuration: 0.45, bounce: 0.15 },
  bouncy: { type: "spring", visualDuration: 0.4, bounce: 0.3 }, // likes and success only
  sheet:  { type: "spring", stiffness: 400, damping: 40, mass: 1 },
  layout: { type: "spring", stiffness: 500, damping: 40 },
} as const;
```

Bounce ≤ 0.15 in product UI. If stiffness or damping is set, it overrides bounce.

**Enter / exit.** Section: opacity and y 12, optional blur 4px, 400ms. List row: y 6, spring.smooth; exit scale .98 in 150ms. Popover: as above. Toast: as above. Tooltip: first delay 400–600ms, then neighbors open instantly for ~400ms; only the first one animates (120ms, 2px). Sheet: 450ms `--ease-drawer`. Number: per-digit roll, 250ms, masked. Text swap: `AnimatePresence mode="popLayout"`, blur 2px and y 6, about 200ms.

**Layout.** `layout` when size or position changes. `layoutId` for a shared pill, underline, or card-to-detail. `layout="position"` on text. Height `0 → auto`, or `grid-template-rows: 0fr → 1fr`. During a route change, prefer a CSS transition; shared layout animation drops frames while the main thread is busy.

**Gestures.** `whileHover` only under `(hover: hover)`. `whileTap` scale 0.97. Drag sheets dismiss past 120px or velocity 500, otherwise spring.sheet. Press feedback starts on pointer-down.

**Scroll.** Reveal once, `viewport amount 0.3`, y 16, 500ms, stagger 0.06, and only for a hero-level block. Parallax under ±40px, never on body text. Sticky header goes to `bg/80` plus `backdrop-blur(12px)` and a hairline after 8px. Pause looped hero art offscreen and under reduced motion.

**Stagger.** 40–60ms, cap ~300ms, first ~8 items, then the rest together. Do not stagger a data refresh. This stagger is required on first load (`SKILL.md`), not optional.

**Reduced motion.** `<MotionConfig reducedMotion="user">`. Motion then drops transform and layout and keeps opacity. Custom code swaps `x: "-100%"` for a fade. CSS:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  .fade-ok { transition: opacity 150ms linear !important; }
}
```

The default document, with no preference set, still animates. Writing this media query does not count as shipping motion.

**Performance.** No width, height, top, or box-shadow in a loop (sidebar collapse is the exception). `will-change: transform` only while a layer is animating. `backdrop-filter` on small surfaces only.

## States every control needs

- Hover, press, focus-visible, disabled (50% opacity, no pointer events beyond `not-allowed`), loading (width held, no double submit).
- Success and error inline, or a toast with Undo. Empty states say what will appear and offer the action that creates it. Not "No data".
- Toggles slide with spring.snappy. Tabs use the sliding pill. Inputs validate on blur. OTP boxes advance and accept a paste.
- Numbers are tabular and roll on change, not on every render.
- Tooltips on icon-only buttons. Open ~500ms, then neighbors skip the delay. Close on scroll and pointer-down. None on touch. None when focus returns from a menu that just closed.
- Every control does something. Filters filter, search searches, Share copies a real link, Export downloads a file, nav changes the view. A toast that claims a fake success is a dead control. Menus, popovers, and tooltips use a real primitive (bits-ui, Radix, Base UI, Ariakit).
- Table row hover `#FAFAFA`. Row actions fade in. Copy becomes a check for ~1.6s, and the tooltip stays open on "Copied". Await the clipboard; on failure show "Copy failed". `role="status"`.
- Touch targets ≥ 44px. Hit area may exceed the visual size.

## Stills

At most two.

| File | What to steal |
|---|---|
| `references/2026-10-30_2116131638916854067_1.png` | The secondary button: 30px, 10px radius, two shadows, exact values. |
| `references/2026-10-11_2109273659038650501_1.png` | Tracking at display size: −6% vs −3% vs 0. |
| `references/2026-10-13_2110066751866089488_1.png` | SF Pro Rounded at +1%, mobile only. |
| `references/2026-10-06_2107619825719910460_2.png` | Command palette, 24px radius, keycap footer. |
| `references/2026-11-03_2117435880021561852_1.png` | Split auth card, one violet CTA, hairline fields. |
| `references/2026-10-29_2115949035009814905_1.png` | Tinted tags with dark text. |
| `references/2026-10-26_2114761395946311853_1.png` | KPI numbers, delta pills, quiet table. |
| `references/2026-10-03_2106500278157795628_1.png` | Mobile: gray canvas, inset white cards, pill CTA. |
| `references/2026-10-03_2106500391672393990_1.png` | Dark surfaces stepping up, mono prices. |
| `references/2026-10-31_2116628486571938143_1.png` | Black pill CTAs, one coral accent. |
| `references/2026-10-25_2114315909817065784_1.png` | Onboarding rows with circle checks, one pill CTA. |
| `references/2026-11-01_2116933228481433739_1.png` | Grain and a ribbon illustration, used once, on purpose. |

## Sources

Motion transitions: https://motion.dev/docs/react-transitions (tween 0.3s, spring bounce default 0.25, `visualDuration`, inertia). Emil Kowalski, "Great Animations": https://emilkowal.ski/ui/great-animations (ease-out, under 300ms, transform and opacity, reduced motion, no animation on keyboard-triggered actions). Apple HIG: purposeful motion, Reduce Motion, 44pt targets.
