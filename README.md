# giga-ui

An installable design skill for coding agents: calm, precise, alive product UI — a complete visual language (design tokens, component recipes, a motion system and anti-slop rules) that turns a one-line UI request into a polished, production-quality interface.

```bash
npx skills add aidan-neel/design --skill giga-ui
```

## What it does

- **Removes before it adds.** If it can be removed, remove it. Typography does the heavy lifting: Inter, at most two weights, tracking tuned per size.
- **One accent per product.** Near-monochrome neutrals, soft layered shadows and hairlines instead of heavy borders, color only where it carries meaning.
- **Motion is mandatory.** Page-load stagger, hover and press, a moving active indicator, and sidebar expand/collapse. 150–300ms, ease-out or springs. Reduced motion fades; it does not skip.
- **Realistic content.** Believable names, amounts, dates and statuses. Tinted tags with dark text, tabular numbers, honest empty and loading states.
- **Anti-slop rules.** No default purple gradients, no emoji icons, no invented logos, no glow orbs, no fake testimonials — each with a "do" instead.
- **Verifies in pixels.** Screenshot, catch a mid-animation frame, fix, and re-shoot (max 2 rounds) before calling any UI done.

## Layout

```
skills/giga-ui/
  SKILL.md                core rules, tokens, motion mandate, routing table
  references/
    landing.md            landing-page recipe
    sidebars.md           inset sidebar recipe and the Northgate anti-example
    components.md         components, motion, states
    anti-slop.md          banned list
    verification.md       screenshot round, including a mid-animation check
    landing/              cropped marketing-page references
    sidebars/             sidebar references, including fintrack and anti-example
```

## Showcase app

This repo also holds a SvelteKit showcase: every screen here is built with the skill, and `/` is its landing page. See `AGENTS.md` for how the eval outputs (with and without the skill) are generated.

---

# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

```sh
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
bunx sv create --template minimal --types ts --install bun .
```

## Developing

```sh
bun install
bun run dev
```

## Building

```sh
bun run build
```

You can preview the production build with `npm run preview`.
