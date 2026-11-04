---
name: giga-ui
description: Use when building, redesigning, or polishing any user interface (a component, landing page, dashboard, app screen, mobile UI, onboarding or auth flow), especially from a short or vague prompt. Gives you a complete visual language, design tokens, component recipes, and a motion and micro-interaction system so the result looks and feels premium. The style is inspired by product designer @marcelkargul.
---

# GIGA UI

Calm, precise, alive product UI, inspired by @marcelkargul's public work (not affiliated). Quiet near-monochrome surfaces, type that does the work, soft layered shadows, one accent, and motion that explains a change. Any stack. Snippets are React + Tailwind + Motion; the tokens are plain CSS.

Tags used in the references: **[seen]** in his posts, **[inferred]** measured from them, **[expert]** from Motion, Emil Kowalski, or Apple HIG.

## Read one recipe, then 2–4 images

Do not read every reference, and do not open a folder of images. Classify the screen, open **one** recipe, and view **2–4** of the files that recipe names. A light/dark pair counts as two.

| You are building | Read | View |
|---|---|---|
| Landing page, marketing, hero | `references/landing.md` | 2–4 files it names under `references/landing/` |
| Sidebar, app shell, dashboard nav | `references/sidebars.md` | `references/sidebars/fintrack.png`, `references/sidebars/anti-example.png`, plus at most 2 older stills it names |
| A component, form, menu, toast, or motion detail | `references/components.md` | at most 2 stills it names under `references/` |
| Before you call any UI done | `references/anti-slop.md`, then `references/verification.md` | your own screenshots, plus 1 similar reference |

Landing and sidebar work still ends with the anti-slop list and the verification round.

## Philosophy

1. If it can be removed, remove it. [seen]
2. Type does the heavy lifting. One family, at most two weights on a screen. [seen]
3. White, black, and shadows. Color is for state, category, or the one action. [seen]
4. Depth is a soft layered shadow and a hairline, not a thick border. [seen]
5. Motion is part of the product. It is mandatory, and it explains a change. [seen][expert]
6. The last 10% is a screenshot pass. `references/verification.md`.
7. Clean beats clever. Dense data should still feel calm.

## Always

- **Font.** Inter is the default on the web. Geist is optional. SF Pro Rounded or `ui-rounded` only for an iOS-feel mobile UI. Mono for prices, KPIs, and code. Weights 400 and 500; 600 only for a title or a number.
- **Tracking.** ≤16px → 0. ~36px → −3%. 64px and up → −4% to −5.5%. Never tighten body text. [seen]
- **Sizes.** Body and tables 13–14px, meta 12–13px, page titles 18–24px, KPIs 24–32px, heroes 48–72px. Buttons 14px medium.
- **Ink.** Primary `#171717`, secondary `#737373`, tertiary `#A3A3A3` only for placeholders and disabled. Tags are dark text on a pale tint, never white on a saturated fill. [seen]
- **One accent** per product, in `--accent`. Green, red, and amber are for deltas and errors only.
- **4px grid.** Space inside a group is smaller than space between groups.
- **Radii.** Controls 8–10, inputs 10–12, cards 12–16, overlays 20–24, pills full.
- **Inset sidebar is the default. Flush is equally valid.** Inter, sentence-case groups, dark medium labels, a filled pill that slides. Flush adds a 1px border or a subtle tint, then the same type and motion. Northgate in `references/sidebars/anti-example.png` fails on styling (uppercase labels, gray type, a search box), not because it is flush. Build from `references/sidebars.md`.
- **Real content.** Believable names, amounts, and dates. No lorem, no invented logos, no "Trusted by 10,000+".
- **Light by default** for tools. Dark for trading, code, media, or the dark twin of a marketing page. Dark surfaces step `#0D0D0D → #141414 → #1C1C1C`.
- **One primary action** per view. A control that does nothing is left out.

## Motion is mandatory

Every screen ships all four of these. Include a `prefers-reduced-motion` branch, and do not use it as a reason to ship a static page. With no reduced-motion preference, the motion has to run.

1. **Page-load stagger.** First paint only. Opacity 0→1 and translateY 12→0, ease-out, 40–60ms apart, only the first ~8 items, total delay ≤300ms.
2. **Hover and press.** Hover changes color or background in 100–150ms, on `(hover: hover)` only. Press scales buttons to 0.97 and large CTAs to 0.98 from pointer-down.
3. **Active indicator.** One shared pill slides between nav items, tabs, or segments. Do not fade one pill out and another in.
4. **Sidebar expand and collapse,** whenever a sidebar exists. Width animates about 220ms on `--ease-out`. Labels fade. Icons stay in one column and do not jump.

Enter with `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`. Most UI motion is 150–300ms. Exits are shorter than enters. Popovers scale from 0.96 at the trigger, never from 0. Product UI keeps spring bounce ≤0.15. Animate `transform` and `opacity` only. Springs, overlays, and the reduced-motion swap (fade only, no travel) are in `references/components.md`. `references/verification.md` requires a mid-animation frame that differs from the settled screenshot, and a reduced-motion pass that calms the motion without deleting it.

## Tokens

Paste into the global stylesheet. Tailwind v4 maps these in `@theme`; v3 uses `theme.extend`.

```css
:root {
  --font-sans: "Inter", "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "Geist Mono", "SF Mono", Menlo, monospace;
  --font-rounded: "SF Pro Rounded", ui-rounded, "Google Sans Rounded", var(--font-sans);
  --text-xs: 12px; --text-sm: 13px; --text-base: 14px; --text-md: 16px;
  --text-lg: 18px; --text-xl: 24px; --text-2xl: 32px; --text-3xl: 48px;
  --text-4xl: 64px; --text-5xl: 96px;
  --tracking-body: 0; --tracking-tight: -0.01em; --tracking-title: -0.03em; --tracking-display: -0.055em;
  --weight-regular: 400; --weight-medium: 500; --weight-semibold: 600;

  --bg: #ffffff; --bg-subtle: #f7f7f7; --bg-muted: #f0f0f0; --bg-backdrop: #e8e8e8;
  --border: #ececec; --border-strong: #e0e0e0;
  --fg: #171717; --fg-secondary: #737373; --fg-tertiary: #a3a3a3; --fg-inverse: #ffffff;

  --accent: #7b3aec; /* one of: #255cd1 blue, #ff5a1f orange, #0a0a0a black, #d6f25c lime on dark */
  --accent-hover: color-mix(in oklab, var(--accent), black 8%);
  --accent-soft: color-mix(in oklab, var(--accent), white 90%);
  --accent-fg: #ffffff;
  --ring: color-mix(in oklab, var(--accent), transparent 65%);

  --success: #16a34a; --success-soft: #ecfdf3;
  --danger: #dc2626; --danger-soft: #fef2f2;
  --warning: #d97706; --warning-soft: #fff7e6;
  --info: #2563eb; --info-soft: #eef4ff;

  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
  --space-12: 48px; --space-16: 64px; --space-24: 96px;
  --radius-xs: 6px; --radius-sm: 8px; --radius-md: 10px; --radius-lg: 12px;
  --radius-xl: 16px; --radius-2xl: 20px; --radius-3xl: 24px; --radius-full: 9999px;
  --h-control-sm: 30px; --h-control: 36px; --h-control-lg: 44px; --h-cta-mobile: 52px;

  --hairline: 0 0 0 1px var(--border);
  --shadow-xs: 0 1px 2px rgb(40 40 40 / 0.08);
  --shadow-btn: 0 1px 2px rgb(40 40 40 / 0.08), 0 0 0 1px #ececec;
  --shadow-btn-primary: inset 0 1px 0 rgb(255 255 255 / 0.18), 0 1px 2px rgb(0 0 0 / 0.16), 0 0 0 1px color-mix(in oklab, var(--accent), black 12%);
  --shadow-card: 0 1px 2px rgb(0 0 0 / 0.04), 0 0 0 1px var(--border);
  --shadow-pop: 0 0 0 1px rgb(0 0 0 / 0.06), 0 8px 24px -4px rgb(0 0 0 / 0.10), 0 2px 6px rgb(0 0 0 / 0.04);
  --shadow-modal: 0 0 0 1px rgb(0 0 0 / 0.06), 0 24px 64px -12px rgb(0 0 0 / 0.18);
  --shadow-focus: 0 0 0 3px var(--ring);

  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --dur-instant: 100ms; --dur-fast: 150ms; --dur-base: 200ms;
  --dur-moderate: 250ms; --dur-slow: 350ms; --dur-page: 500ms;
}
[data-theme="dark"], .dark {
  --bg: #0d0d0d; --bg-subtle: #141414; --bg-muted: #1c1c1c; --bg-backdrop: #0a0a0a;
  --border: rgb(255 255 255 / 0.08); --border-strong: rgb(255 255 255 / 0.14);
  --fg: #fafafa; --fg-secondary: #a1a1a1; --fg-tertiary: #6b6b6b;
  --shadow-btn: inset 0 1px 0 rgb(255 255 255 / 0.06), 0 0 0 1px rgb(255 255 255 / 0.08);
  --shadow-card: 0 0 0 1px rgb(255 255 255 / 0.07);
  --shadow-pop: 0 0 0 1px rgb(255 255 255 / 0.08), 0 16px 40px -8px rgb(0 0 0 / 0.6);
}
html { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
body { font-family: var(--font-sans); font-size: var(--text-base); color: var(--fg); background: var(--bg); font-feature-settings: "cv11", "ss01"; }
.tabular { font-variant-numeric: tabular-nums; }
```

Line-height: body 1.5, UI labels 1.3, headings 1.1, display 1.02–1.05. A 64px+ headline uses `--tracking-display`. A 40–56px hero uses `--tracking-title`.

## Order of work

1. Classify the screen. Open the one recipe above and view 2–4 of its images.
2. Write the real content. Lay it out on the 4px grid with tokens only. One H1, one primary action.
3. Build from that recipe. Hairline shadows, tinted tags, tabular numbers.
4. Delete anything that is not earning its place.
5. Add the four mandatory motions, then overlay enter/exit. A landing page gets one hero moment (the backdrop panel, not a second animation system).
6. Cover loading, empty, error, disabled, truncation, and 360 / 768 / 1024 / 1280.
7. Read `references/anti-slop.md` and remove every hit.
8. Run `references/verification.md`. Two rounds maximum. If a check still fails, say so.

Brief to follow: "Build {thing} for {domain}. Light, accent {hex}, Inter, tracking from the size rules. Layout from {recipe}. Data: {real examples}. Motion: the four mandatory ones. States: loading, empty, error. Reduced motion fades; it does not skip."
