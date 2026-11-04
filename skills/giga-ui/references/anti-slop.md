# Anti-slop

Read this before calling any UI done. Each rule is a don't and a do. **[X]** comes from what people on X kept naming as "AI-built" through October and November 2026. **[seen]** / **[expert]** match `SKILL.md`.

1. **No default purple, indigo, or violet gradients** on the hero, buttons, text, or page. [X] *Do:* neutral UI plus one flat accent. A violet accent is fine when it is flat and intentional. A colored backdrop panel is fine only with the product UI on it (`landing.md`).
2. **No gradient text, and no one colored word in the headline.** [X] *Do:* solid `#171717` or white. Emphasis comes from size, weight, and tracking.
3. **No untuned type.** Default tracking at every size, random weights, or one size everywhere. [X] *Do:* Inter, the tracking rules, at most two weights, a clear step from title to body to meta.
4. **No emoji as icons, and no emoji status ("🟢 LIVE").** [X] *Do:* one outline set, 16/20px, stroke 1.5. Phosphor or Iconoir rather than reaching for Lucide by reflex.
5. **No default shadcn look** (stock zinc, stock radius, untouched components). [X] *Do:* the tokens and the button recipe.
6. **No "centered hero → three icon cards → testimonials → CTA".** [X] *Do:* the landing recipe. The product screenshot is the picture.
7. **No fake social proof** ("Sarah K., Founder", invented logos, "Trusted by 10,000+ teams") and no lorem. [X] *Do:* domain-specific data, labeled as sample when it is sample.
8. **No glow orbs, dot grids, neon, or glow cards.** [X] *Do:* a quiet canvas. Grain only when the art calls for it.
9. **No shadow on everything, and no hairline on every box.** [X][seen] *Do:* shadows on elevated layers. Separate regions with tone.
10. **No card inside a card inside a card.** [X] *Do:* one container, then whitespace and hairlines.
11. **No eyebrow above every heading, and no tracked uppercase everywhere.** [X] *Do:* one eyebrow per page at most. Small uppercase is for a mono brand's nav or announcement (`landing.md`), not for sidebar groups.
12. **No hover-scale on everything, and no fade-up on every scroll section.** [X] *Do:* the four mandatory motions in `SKILL.md`. Reveal on scroll once, for the hero only.
13. **No rainbow palettes and no two accents.** [X][seen] *Do:* one accent. Green and red only for deltas.
14. **No eyeballed spacing.** [X] *Do:* the 4px grid. Group gaps larger than inner gaps.
15. **No beige "AI warm" canvas, and no lifeless pure-white flatness, as a default.** [X] *Do:* `#F7F7F7` / `#FAFAFA` with white panels, or a deliberate brand tone.
16. **No buzzword copy** ("Build faster with AI", "Supercharge your workflow") and no em-dash marketing voice. [X] *Do:* concrete, plain, specific lines.
17. **No bento unless the content is actually heterogeneous.** [X] *Do:* let the content set the layout.
18. **No glassmorphism by default.** *Do:* solid surfaces. Blur only on a bar over a photograph.
19. **No twin filled CTAs, and no filler cards** (a fourth stat to complete the row, an icon tile on every card). [X] *Do:* one primary. As many cards as there are real figures.
20. **No "Welcome back, Alex! 👋" and no exclamation-mark UI copy.** [X] *Do:* lead with the work ("3 invoices are overdue").
21. **No "No data" empty states.** [X] *Do:* say what will appear, and give the action that creates it. Test zero items, one item, and a very long name.
22. **No dead UI.** [X] *Do:* every control does what it says (`components.md`). Click them.

Also banned, from the older list: white text on saturated pills, transitions over 600ms for ordinary UI, popovers that scale from 0, bouncy springs on everything, `1px #D1D5DB` on every box.

## Sidebar, from the Northgate anti-example

`references/sidebars/anti-example.png` is the failure. `references/sidebars/fintrack.png` is the correction. Full recipe in `sidebars.md`.

23. **No tiny uppercase tracked group labels** (MONETIZATION, WORKSPACE) on an app sidebar.
24. **No washed-out gray labels or icons.** Resting nav text is near-black, weight 500.
25. **No search box added by default,** and no `/` keycap decoration.
26. **No flat flush gray panel** as the sidebar. Inset white card, soft shadow.

## Sources

- https://x.com/shipper_now/status/2110637576935891122
- https://x.com/tomilola_ng/status/2114078495487729986
- https://x.com/future_coded/status/2111403845779931591
- https://x.com/denizdoingstuff/status/2114407641963237633
- https://x.com/tanujbuilds/status/2115834588551594431
- https://x.com/AnylancerInc/status/2114401436071043088
- https://x.com/erramix01/status/2113937292863602955
- https://x.com/lokidotdev/status/2117188486034063507
- https://x.com/_def/status/2115188253863071921
- https://x.com/Zephyr_hg/status/2117371426600784071
- https://x.com/preetsuthar17/status/2117540786791493802
- https://x.com/sinanyorulmazz/status/2116531845839851723
- https://x.com/equalworld_ai/status/2117349679700623510
- https://x.com/Mr_Buzzoni/status/2106320604634702070
- https://x.com/keviduk/status/2109645687176495258

Not found in those posts, so tagged [expert] instead: tooltip delays, double focus rings, sidebar collapse and resize.
