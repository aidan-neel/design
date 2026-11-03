# AGENTS.md

SvelteKit + Tailwind v4 + bun. Showcase app comparing what an eval model produces for the same prompt **with** and **without** the design skill (`skills/giga-ui`).

- `bun install`, `bun run dev`, `bun run check`, `bun run build`. Use bun, never pnpm/npm.
- Components: use `bits-ui` (installed) for interactive primitives. Read its docs before use: `https://bits-ui.com/docs/components/<name>/llms.txt`.
- Cursor is `default` everywhere, never `pointer`.
- Prompts, models and output paths live in `src/lib/comparisons.ts`.

## Generating eval outputs (with / without skill)

An "eval model" (GLM 5.3, GLM 5.3 Flash, Qwen, whatever is picked in the Model select) generates each example. Outputs are **Svelte 5 components rendered inline in this app**, not iframes. They share the page, Tailwind v4 and the global `app.css` with everything else, so they must not leak styles or collide on ids.

### 1. Run each prompt twice, identical except for the skill

- Same model, same prompt text from `comparisons.ts`, same sampling settings (temperature, max tokens), fresh context each run.
- **without**: prompt only. No skill, no design hints, no extra system prompt.
- **with**: identical prompt, with `skills/giga-ui/SKILL.md` (and the files it references) loaded the way a real user would load it. Do not paste in extra instructions to "help" it.
- Do not cherry-pick. One run per variant per prompt; if you re-roll, re-roll both and keep the first completed pair. Record the model and date.

### 2. Constrain the output format, equally for both runs

Append the same suffix to both prompts:

> Output a single Svelte 5 component (runes: `$state`, `$derived`, `onclick`). Put markup in the template and styles in the component's scoped `<style>` block (Tailwind utility classes are also available). No `:global`, no `body`/`html`/`:root` selectors, no `min-height: 100vh`, no `id` attributes (other components share the page). Light mode only: no `prefers-color-scheme`, no dark styles, white/neutral surface. Render only the component itself (e.g. just the button, just the select trigger): no headings, field labels, captions, hints, helper text or page wrapper. The parent centers it. Return only the `.svelte` file, no commentary.

Do not hand-edit results afterwards. If it is broken, that is the result.

### 3. Save where the app reads them

```
src/lib/outputs/<model>/<comparison-id>/without.svelte
src/lib/outputs/<model>/<comparison-id>/with.svelte
```

`<model>` is the `value` in `models` (`glm-5.3`, `qwen-3.8-max`, ...). `<comparison-id>` is the `id` in `comparisons.ts` (`button`, `select`, `command`). Discovery is `import.meta.glob('/src/lib/outputs/*/*/*.svelte')`, so the path must be exactly this depth.

`static/outputs/` is the old iframe layout and is deprecated. Do not add to it.

### 4. Wire it up

In `src/lib/comparisons.ts`, `src` is the glob key (absolute path from the repo root):

```ts
outputs: {
	'glm-5.3': {
		without: { src: '/src/lib/outputs/glm-5.3/button/without.svelte', tokens: 15924 },
		with: { src: '/src/lib/outputs/glm-5.3/button/with.svelte', tokens: 9120 }
	}
}
```

`tokens` is the model's **output** token count for that run, taken from the API usage field (`completion_tokens`), including reasoning tokens if the provider bills them. Never estimate it. It is shown under each card as `Tokens  <count>`. Set `SKILL_STATUS` to `'ready'` once real skill-run outputs exist for all comparisons.

### 5. Verify it works in the Output section

- `bun run check` (it excludes `src/lib/outputs`, so generated code is not type-checked; add `lang="ts"` to `<script>` only if the file uses TS syntax), then `bun run dev` and open each tab. Both cards must render the component (not "No output yet") with no console errors.
- Open any dropdown/popup in a card: it must render past the card edge, not clipped. The card surface is `overflow: visible` outside fullscreen.
- Open fullscreen on each card (maximize button, Esc to close). The component must be centered with the close button on top.
- Remember outputs now inherit Tailwind preflight and the global `cursor-default`. Judge them as-is.
- Switch the Model select to each model you generated for and confirm the cards change. Models with no entry show "No output yet". Generate without and with as a pair for one model; a pair must never mix models.
