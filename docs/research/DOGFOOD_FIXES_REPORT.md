# Deep dogfood pass — fixes applied (2026-11-19)

Based on the 162-screenshot walkthrough report. All items below were implemented in `build/physics-app/` unless marked "remaining".

---

## 1. Critical — graph/review queue race ✅

**Cause confirmed:** `initProgress()` latched `initialized = true` while `graphData` was still the empty placeholder, because the engine script loads synchronously but `graph.json` resolves ~95 ms later. `ensureGraph()` then re-called `initProgress()` but the latch blocked `setGraph`.

**Fix (`src/state/progress.ts`):**
- `applyGraph()` only calls `E.setGraph(graphData)` when `graphData.topics.length > 0`.
- `ensureGraph()` calls `applyGraph()` after the fetch resolves; `initProgress()` calls it on every render path (cheap guard).

**Verified in a fresh browser:** graph = **5,105 topics / 130 courses**; `next()` = `sciexp.observe-question` (sensible first Phys 1 topic, not `chem.si-prefixes`); after 3 correct answers + `addReview`, `dueCount()=1` and the **Start review** button appears.

## 2. Figure mapping ✅

**Cause:** custom figures are single-purpose archetypes that ignore ~90% of the bundle `opts`; `figureKindOf` bucketed by name prefix only. The repo's native viz kits receive `opts` **verbatim** via `MathLadder.viz.mount`, so they are the reliable renderer.

**Fix (`src/pages/TopicPage.tsx`, `src/viz/loadViz.ts`):**
- `figureKindOf(name, opts)` now chooses a custom component only when it can honour the opts: `ph-motion`/`ph-projectile` → MotionFigure; `ph-wave` with `mode` in `travel|pulse|superpose|standing-string|standing-pipe|beats` → WaveFigure; `ph-circuit` with `opts.circuit` → CircuitFigure; `ph-efield` with `opts.charges` → FieldFigure; chemistry/biology/geography kits keep their custom figures. Everything else → `RepoViz` with the original name + opts.
- `vizBlockOf()` now picks the **richest** viz block instead of the first — fixes `thermal-radiation`, where the meaningful `ph-blackbody` block was dropped in favour of a thin `ph-thermal` block.
- `vizLadder` routes `graph|limit|derivgraph|trigwave|ftc` to the **math** kit.
- Stage prompt is suppressed for repo figures because the kit renders `opts.task` itself (no more duplicate prompts).
- `loadViz.ts` skips `core.js` from ladder manifests — loading `math/core.js` late created a **fresh registry** that wiped all physics registrations. Verified: after visiting a math-viz topic, `graph` and `ph-collision` are both still registered.

**Verified native mounts:** `ph-graph` (velocity-derivative), `ph-collision` (inelastic-collisions, with e=0 opts), `ph-thermal`, `ph-gas`, `ph-circuit` (kirchhoff-junction), `ph-rays`, `ph-wave` (polarization), `ph-fluids`, `ph-blackbody` (thermal-radiation), `graph` (standing-wave-math). All render canvas content with the correct task text.

## 3. Empty final "try" step ✅

`buildSteps()` now skips blocks whose `html/text/q` is empty after stripping tags. `vertical-launch` went from 9 to **8** steps; last step is now the Common Mistake block.

## 4. Multi-part practice ✅

`PracticePanel` now reads `a.t === "multi"` and renders one labelled input per `a.parts[]` entry, checks each part with the engine's own `check`, combines `ok`/`invalid`, and shows per-part failure messages. Verified on `phys1.rotation-translation` at L3: **2 inputs** with `$T_1$` / `$T_2$` labels, no console errors.

## 5. LaTeX in prompts + HTML sanitization ✅

- Added `src/utils/richtext.ts`: DOMPurify allow-list sanitizer + `renderMath()` that converts `$…$` with KaTeX **before** sanitizing, so the generated markup is safe.
- KaTeX CSS loaded in `src/main.tsx`.
- All **16** `dangerouslySetInnerHTML` sites in TopicPage, LessonFigure, PracticePanel, ReviewSession and WorkingReveal now pass through `renderMath()`, including `stage-prompt` and multi-part labels. Verified `.katex` nodes in lesson prompts and working steps.

## 6. Dataset viewers ✅

`src/components/DatasetBrowser.tsx` rewritten with structured detail rendering:
- **Recipes:** Ingredients list (item/amount/unit/prep) + numbered Method from `meta.steps`.
- **Founding papers:** full text from `meta.p` (sanitized HTML), salutation/signature; list titles now `Federalist No. 1` instead of `f01.json`.
- **Infographics:** description + `<img>` from `meta.file` with graceful fallback (the SVG assets are **not present in this build** — `public/content` contains 0 `.svg` files; add them at that path to display).
- **Food garden:** short keys humanised (`g→Group`, `fam→Family`, `cal→Calories`, …).
- **Resources:** links rendered; duplicate subtitle when equal to title removed.
- **Harvard:** intro paragraphs rendered; `[object Object]` bodies suppressed.
- **Unknown `?data=`:** explicit "Dataset not found" error with a Back button instead of infinite "Loading dataset…".
- Search now also matches string values in `meta`.

Verified each viewer in-browser; axe clean on elements and recipes.

## 7. Dev copy + idea server ✅

- Removed the MusicLab "two videos you showed…" note; replaced with a neutral public-domain note.
- Breadboard/FBD footers now give learner-facing instructions instead of "Prototype archetype…" / "Model-driven dragging with Dragology…".
- `scripts/idea-server.mjs`: origin allow-list (default localhost 4173/5173), `Vary: Origin`, optional bearer token via `IDEA_TOKEN`, fixed `at` server-side. `IdeaBox` sends `Authorization: Bearer <VITE_IDEA_TOKEN>` when configured.

## 8. Robust topic deep links ✅

`loadJson<T>()` now handles both the bundle and translation fetches: a preview server answering a missing `.json` with `index.html` (HTTP 200) no longer crashes JSON parsing, so `?s=physics&c=<wrong>&t=<slug>` correctly falls back to the root bundle.

---

## Verification summary

- `npm test` **9/9** · `npm run build` clean (only the pre-existing chunk-size warning).
- `site-check`: **13 shots at 320/390/768/1440**, 0 problems, ~16.2 ms/frame.
- axe: **0 violations** on home, FBD, breadboard, elements, recipes and a lesson (27–32 passes each).
- Playwright: review queue populates; multi-part inputs work; KaTeX renders; dataset details render; native viz mounts with correct names.

## Remaining / not verified

- **`pk.count-to-5`** viz opts `{to:5}` vs generator `{to:3}` — not changed (needs a generator/opts alignment decision).
- **ph-fluids buoyancy one-render-stale weight** and awkward field notation — now rendered by the native kit, which owns its own state/formatting; not separately re-measured.
- **Infographic SVG assets** absent from this build — the `<img>` path is wired, but the files must be added to `public/content/data/infographics/`.
- **WebKit (Safari engine)** not installed, so `site-check --browser both` was not run.
- The 320px + 200% zoom combination (≈160 CSS px) still overflows; 1440/768 at 200% and 320px at 100% are clean.
