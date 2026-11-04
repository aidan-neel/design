# Verification round

Do this after building, before you call the UI done. Two rounds maximum. Each check passes or fails.

## 1. Render

`pip install playwright && playwright install chromium`, or use the project's Playwright. Start the dev server, or open the file directly.

```python
# python shots.py http://localhost:3000
import sys, asyncio
from playwright.async_api import async_playwright
URL = sys.argv[1]

PROBE = """() => {
  const texts = [];
  for (const sheet of document.styleSheets) {
    try { for (const rule of sheet.cssRules) texts.push(rule.cssText); }
    catch {}
  }
  document.querySelectorAll('[style]').forEach((el) => texts.push(el.getAttribute('style') || ''));
  const css = texts.join('\\n');
  const animated = [...document.querySelectorAll('body *')].filter((el) => {
    const s = getComputedStyle(el);
    const dur = s.transitionDuration.split(',').some((d) => parseFloat(d) > 0);
    const anim = s.animationName !== 'none' && parseFloat(s.animationDuration) > 0;
    return dur || anim;
  }).length;
  return {
    animated,
    hasTransition: /transition\\s*:/.test(css) || animated > 0,
    hasKeyframes: /@keyframes/.test(css),
    hasReduced: /prefers-reduced-motion/.test(css),
    hasPress: /:active/.test(css) || /whileTap/.test(document.documentElement.innerHTML),
  };
}"""

async def shoot(context, name, reduced=False):
    page = await context.new_page()
    await page.set_viewport_size({"width": 1440, "height": 900})
    await page.goto(URL, wait_until="networkidle")
    if name == "settled":
        await page.wait_for_timeout(800)
    else:
        await page.wait_for_timeout(120)  # mid page-load stagger
    await page.screenshot(path=f"shot-{name}.png")
    info = await page.evaluate(PROBE)
    if name == "settled" and not reduced:
        btn = page.locator("button, a").first
        await btn.hover(); await page.wait_for_timeout(200)
        await page.screenshot(path="shot-hover.png")
        await page.keyboard.press("Tab"); await page.wait_for_timeout(200)
        await page.screenshot(path="shot-focus.png")
        bad = await page.evaluate("""() => [...document.querySelectorAll('body *')].filter(e => {
          const r = e.getBoundingClientRect(), s = getComputedStyle(e);
          return r.width && (r.right > innerWidth + 1 || (e.scrollWidth > e.clientWidth + 1 && s.overflowX === 'visible'));
        }).slice(0, 20).map(e => e.tagName + ' ' + Math.round(e.getBoundingClientRect().right))""")
        print("overflow:", bad)
    await page.close()
    return info

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        normal = await browser.new_context(device_scale_factor=2)
        info = await shoot(normal, "mid")
        settled = await shoot(normal, "settled")
        print("motion:", info, "settledAnimated:", settled["animated"])
        mobile = await browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        page = await mobile.new_page()
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(800)
        await page.screenshot(path="shot-mobile.png", full_page=True)
        await page.close()
        reduced = await browser.new_context(reduced_motion="reduce", device_scale_factor=2)
        await shoot(reduced, "reduced-mid", reduced=True)
        await browser.close()
asyncio.run(main())
```

Diff the files. `shot-mid.png` must not match `shot-settled.png`. `shot-hover.png` must not match `shot-settled.png`.

## 2. Motion gate

This gate fails closed. A reduced-motion query does not satisfy it.

- [ ] **CSS is real.** `motion.hasTransition` is true and `settledAnimated > 0`. `hasKeyframes` is true when the page-load stagger is a CSS animation. A Motion-only page may have no `@keyframes`; then `animated > 0` and a changed mid frame are the proof.
- [ ] **It runs.** `shot-mid.png` differs from `shot-settled.png` by more than a cursor blink (mean absolute pixel difference clearly above noise, or a visible translate / opacity). If they match, the stagger is missing or already finished: lengthen nothing, add the stagger, and shoot again at ~120ms.
- [ ] **Hover and press exist.** `shot-hover.png` differs from settled. The stylesheet or the component has an active scale (0.97 / 0.98).
- [ ] **The active indicator moves** when the UI has tabs or a nav. Trigger the second item and confirm the pill translates instead of popping.
- [ ] **The sidebar animates** when there is one. Toggle collapse and grab a frame during the 220ms width change. Icons stay put.
- [ ] **Reduced motion is a fade, not a skip.** `shot-reduced-mid.png` does not show the same travel as `shot-mid.png`. The media query is present (`hasReduced`). The non-reduced page still animates. If the only motion in the project lives inside `prefers-reduced-motion`, the check fails.

## 3. Look

Open the PNGs. Compare the desktop shot with **one** similar reference (a landing file, or `fintrack.png` if there is a sidebar). Not a folder.

- [ ] **Alignment.** Shared left edges. Icons centered on their labels. Numbers right-aligned.
- [ ] **Rhythm.** Gaps are multiples of 4. Inner gaps smaller than group gaps.
- [ ] **Type.** One title. At most two weights. Display tracking is negative. Secondary text is `#737373`, not the primary.
- [ ] **Contrast.** Body ≥ 4.5:1. Nothing important is `#A3A3A3` on white. The focus ring is visible in `shot-focus.png`, one ring, on the outer box.
- [ ] **Overflow.** `overflow:` is empty. Nothing scrolls sideways at 390. Long text ellipsizes.
- [ ] **Sidebar, if present.** Matches `sidebars.md`, including the four Northgate don'ts. Inset card by default. Filled neutral pill. Sentence-case groups. Footer and user card pinned. Same sidebar component if a flush shell also exists.
- [ ] **Landing, if present.** Two-line headline, one accent, product mock on a backdrop panel, no three icon cards. `landing.md`.
- [ ] **Slop.** None of `anti-slop.md`. Squint for a purple gradient with no product in it, emoji, fake quotes, glow.
- [ ] **Mobile.** Targets ≥ 44px. The primary action is reachable. Sticky bars do not cover it.

## 4. Fix and stop

Fix every failure, run the script again, check again. Stop after **two** rounds. List anything still failing. Do not call the UI done.

**No vision.** Use the DOM. `overflow` must be empty. Cluster `getBoundingClientRect().left` for headings, buttons, and nav. Nav rows share a height (32). Gaps are multiples of 4. Distinct font-weights on screen ≤ 3. `letter-spacing` on the hero is negative. `animated > 0`. Byte-compare `shot-mid.png` and `shot-settled.png` so a difference is proven without looking. Byte-compare `shot-reduced-mid.png` against `shot-mid.png` so reduced motion is actually different.
