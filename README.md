# giga-ui

An installable design skill for coding agents: calm, precise, alive product UI — a complete visual language (design tokens, component recipes, a motion system and anti-slop rules) that turns a one-line UI request into a polished, production-quality interface.

```bash
npx skills add aidan-neel/design --skill giga-ui
```

## What it does

- **Removes before it adds.** If it can be removed, remove it. Typography does the heavy lifting: Inter, at most two weights, tracking tuned per size.
- **One accent per product.** Near-monochrome neutrals, soft layered shadows and hairlines instead of heavy borders, color only where it carries meaning.
- **Motion with a cause.** 150–300ms, ease-out or springs, sliding indicators, origin-aware popovers, press scale — never decoration.
- **Realistic content.** Believable names, amounts, dates and statuses. Tinted tags with dark text, tabular numbers, honest empty and loading states.
- **Anti-slop rules.** No default purple gradients, no emoji icons, no invented logos, no glow orbs, no fake testimonials — each with a "do" instead.
- **Verifies in pixels.** A built-in screenshot → check → fix round: render, look, measure, fix, re-shoot (max 2 rounds) before calling any UI done.

## Layout

```
skills/giga-ui/
  SKILL.md                philosophy, observed style, tokens, component recipes, motion, QA
  references/             style-reference images from public design posts
    sidebars/             36 sidebar and nav-rail examples
```

## Showcase app

This repo also holds a SvelteKit showcase: every screen here is built with the skill, and `/` is its landing page. `/evals` compares what a model produces for the same prompt with and without the skill — see `AGENTS.md` for how those outputs are generated.

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
