# Landing pages

Open this when the screen is a marketing page, hero, or product site. View **2–4** images in `landing/`, not the folder. If the page has a light and a dark theme, open that pair (Harbor, Monok, or Acme) and one more page with a different backdrop. Do not open the sidebar folder for this task.

The job is a real product page: a short hero, the product UI as the picture, then one proof row and one feature band. It is not a centered headline, three icon cards, testimonials, and a closing CTA.

## Hero, top to bottom

Build it in this order. Spacing is on the 4px grid. The column is about 1120–1200px wide.

**Nav, 56–64px.** Logo mark (16–20px) and wordmark on the left. Three to six quiet text links, 13–14px, `#525252` on light or `rgb(255 255 255 / .72)` on dark. On the right: an optional text "Log in", then one solid button (the accent, or black). Links are not pills. No hamburger on desktop. Harbor (`harbor-light.png`) is the plain version. Monok and Acme put the links in a small mono face; see below.

**Announcement, one only.** A pill above the headline: height 28px, full radius, 12–13px medium, hairline or a soft tint, sometimes a trailing chevron. Copy is specific ("New · Ask Harbor anything about your team", "Update · See what's new", "Meet Your AI Workforce"). One page may use a full-width mono bar instead of a pill (Monok's yellow strip). Do not stack a pill and a bar. Do not write "Introducing the future of X".

**Headline, two lines.** 48–64px, weight 500–600, tracking −0.03em to −0.045em, line-height 1.02–1.08, max-width about 16–18ch so it breaks into exactly two lines. Color is solid `#171717` or white. No gradient fill, no one word in the accent color. "Run people operations. / With confidence." "Turn overdue invoices / into cash, faster." "Your books, reconciled / before you ask."

**Subhead, one or two lines.** 15–16px, secondary ink, max-width about 46ch, directly under the headline (12–16px gap). It says what the product does, in plain words.

**Actions, one or two.** Primary is 36–40px tall, radius 8–999px, the single accent or near-black, 14px medium. Secondary, if it exists, is a ghost button or a text link, not a second filled button. Harbor is one blue pill. Tidewell is a black pill plus "Watch the film". Acme is one orange control. Press scale 0.98.

**The product is the picture.** Under the actions (or beside them, on a split hero), a backdrop panel holds a real app UI:

- Panel radius 16–24px, overflow hidden, min-height about 420px on desktop.
- The backdrop is one of: a soft gradient field (Harbor pink in light, Harbor blue in dark, Zesty violet, Lattice green edge), a painting (Acme's landscape, Tidewell's river), or a photograph (Veridical's coast, Xenora's sky).
- The app mock sits inside, also rounded (12px), with a quiet window chrome, about 80–92% of the panel width, centered or bleeding off the bottom edge (Veridical, Xenora). Give it a soft shadow so it sits on the art, not in it.
- Split alternative (Zesty, Pivot): copy in the left 5 columns, the panel in the right 7. The headline stays left-aligned. Do not center a split.
- Tidewell alternative: the painting is full-bleed and fades to the page color, and the type sits in the fade. Use this only when the art is the brand. Still use the same headline, subhead, and one primary.

A gradient panel is allowed when the product mock is clearly the subject. A purple gradient with no product in it is the slop tell (`anti-slop.md`). Grain is fine when the art already has it (a painted sky, a photo). Do not add blur orbs beside the panel.

## Below the hero

**Logo strip, one row.** 24–40px below the panel. Six to eight wordmarks, grayscale, about 18px tall, gap 28–40px, centered or aligned to the column. Optional 12px caption ("Trusted with $10M+ in delivered work"). No "10,000+ teams", no testimonial quotes, no faces. Pivot, Veridical, and Softox.

**One feature band, not a card grid.** Asymmetric: a 2-line sentence-case heading and a short paragraph on one side, a different piece of the product on the other (Pivot's second screenshot, Xenora's department flows). If you use a row of three, each cell is a different UI fragment (a chart, a list, a board), as in Softox, never an icon in a rounded square plus a heading plus a sentence. At most one eyebrow on the page, 12px, and only if the brand already speaks in small caps (Monok, Softox). No second eyebrow on the next section.

Stop there unless the prompt asks for pricing, FAQ, or a footer. A footer is a hairline, a wordmark, and a few text links.

## Light and dark of the same page

Harbor, Monok, and Acme each ship both. Open the pair together.

- Same nav, same two-line headline, same subhead, same CTA labels, same mock layout. Do not redesign the dark page.
- Swap surfaces, ink, and the backdrop (Harbor's panel goes from pink to blue; Acme's painting goes from day to night; Monok's page goes from white to near-black). The accent does not change: Harbor blue, Monok chartreuse, Acme orange.
- The mock UI flips theme with the page. Charts, pills, and type inside the window follow the same tokens.
- Dark text is `#FAFAFA` / `#A1A1A1`. Borders are `rgb(255 255 255 / .08)`. The panel stays the only saturated region.

## Mono and one accent

**Mono / uppercase is an accent, not the voice.** Acme and Monok set nav links, method chips (`GET`, `POST`), and the announcement bar in a 12px mono, often uppercase with +0.04em tracking. The headline stays a normal grotesk (Inter), sentence case, tight tracking. Xenora's nav is the same idea on a photo. Do not set the headline, the subhead, or button labels in tracked uppercase.

**One restrained accent.** It paints the primary button and, if needed, the panel tint or a single chip. It does not paint icons, illustrations, and headings.

| Page | Accent | Where it appears |
|---|---|---|
| Harbor | blue `#2F6BFF`-class | the one pill, and the panel hue |
| Monok | chartreuse `#D6F25C`-class | announcement bar, "Get a demo", chart bars |
| Acme | orange `#FF5A1F`-class | nav sign-in, the small chips, nothing else |
| Lattice | green | the frame behind the board, one CTA |
| Zesty | violet | the panel and the one primary button, flat |
| OpenBot | purple light | the beam behind the headline; buttons stay white |
| Tidewell | none | black pill, warm gray text link, the painting |

Inside the product mock, semantic colors (green up, red down, a status dot) are allowed. They are not a second brand accent.

## Motion on a landing page

The four mandatory motions from `SKILL.md` still apply: load stagger on nav, headline, subhead, actions, then the panel; hover and press on the button and the links; no tab pill unless you built tabs. The hero moment is the panel itself, already visible, not a looping gradient. A headline may rise 12px once. Do not fade-up every section on scroll. Honor reduced motion with an opacity fade and no translate.

## Do not

- Centered hero, three icon features, logos, quotes, CTA. That template is banned even with these tokens.
- Gradient text, or one colored word in the headline.
- Two filled CTAs side by side.
- A search box, a dashboard, or a sidebar in the hero chrome. The sidebar lives inside the mock.
- Fake customers, fake metrics, lorem, or "Welcome to the future".
- A second accent "to make the dark mode pop".

## What to steal

View two to four of these. Paths are relative to `skills/giga-ui/`.

| File | What to steal |
|---|---|
| `references/landing/harbor-light.png` | Pill announcement, two-line headline, one blue CTA, app window centered on a pink rounded panel. |
| `references/landing/harbor-dark.png` | The same page in dark: blue panel, same type, same single accent. |
| `references/landing/monok-light.png` | Full-width mono announcement bar, chartreuse CTA, invoice app on a quiet stage. |
| `references/landing/monok-dark.png` | That layout on near-black; lime stays the only color. |
| `references/landing/acme-light.png` | Mono nav, one orange accent, prompt card sitting on a landscape panel. |
| `references/landing/acme-dark.png` | Same structure at night: orange chips, dark painting, no second color. |
| `references/landing/lattice-deck.png` | One green CTA and a board mock framed by a green gradient edge. |
| `references/landing/zesty.png` | Split hero: two-line headline left, app mock on a violet panel right. |
| `references/landing/rakazo.png` | Centered two-line headline, one filled and one quiet button, dark product windows as the picture. |
| `references/landing/tidewell.png` | Painting as a full-bleed backdrop fading to white; black pill plus a text link. |
| `references/landing/softox.png` | Dark hero, "Update" pill, dashboard mock, then a grayscale logo strip and UI fragments. |
| `references/landing/pivot.png` | Split headline and a real screenshot, proof line, grayscale logo row. |
| `references/landing/veridical.png` | Photo hero, one white pill, logo strip, app UI overlapping the bottom of the photo. |
| `references/landing/xenora.png` | Headline on a photograph, one black CTA, product UI breaking the photo's lower edge. |
| `references/landing/openbot.png` | Dark hero, availability pill, white primary plus a ghost button, one purple light. |
