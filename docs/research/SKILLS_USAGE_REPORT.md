# Installed Skills — Research & Application Report

**Date:** 2026-11-19
**Scope:** all installed skills on this machine, then the relevant subset applied to current work.

---

## 1. What is installed

Parsed SKILL.md frontmatter from `C:\Users\thwin\.agents\skills` (240 folders) and `C:\Users\thwin\.claude\skills` (50 folders):

- **236 unique skills** (duplicates across the two roots merged).
- Machine-readable index: `SKILLS_INVENTORY.json`
- Human-readable catalog by domain: `SKILLS_CATALOG.md`

Domain distribution (overlapping, first-match grouping in the catalog):

| Domain | Skills |
|--------|--------|
| 3D / anatomy / technical illustration | 14 |
| Image & video generation (Scenario / treg) | 84 |
| UI / visual design & review | 64 |
| Animation & motion | 2 (plus ~20 tagged under other domains) |
| HTML / canvas / prototyping artifacts | 4 |
| Browser & GUI automation | 6 |
| Engineering quality (review/debug/security/test) | 14 |
| Agent workflow, planning & research | 27 |
| Tooling / config / hooks / rules / skills | 13 |
| Other | 8 |

The library is dominated by Scenario media-generation and UI-design skills; the app-relevant ones are a small, well-defined subset.

---

## 2. Skills actually applied this session, and what each produced

| Skill | Task it was applied to | Result |
|-------|------------------------|--------|
| **`agent-browser`** | Dogfood the app end-to-end and re-verify all 5 fixes | Found 5 issues; after fixes re-verified figure, breadcrumb, labels, language notice, periodic table; axe 0 violations. Report: `dogfood-output/report.md` |
| **`rea-video`** | Reverse-engineer the 7 downloaded showcase videos | Frame extraction + bundle teardown identified 3 app families, creators, models, and the upgrade roadmap. Report: `VIDEO_APPS_RESEARCH.md`. Note: the CLI itself was not installed; ffmpeg was obtained via `imageio-ffmpeg` and OpenCV did the frame work. |
| **`site-check`** | Verify the repaired app at desktop/tablet/phone widths in Chromium | **10 shots, 0 problems**, ~16.3 ms/frame (60 fps), ready <0.2 s, reduced-motion pass clean. Contact sheet: `video-research/site-check/sheet.jpg`. Workaround: the helper's `cached_chromium()` regex assumes POSIX paths (`r"-(\d+)/"`) and crashes on Windows; set `CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe`. WebKit was not installed, so Safari's engine was **not** checked. |
| **`impeccable`** | Mechanical design-detector pass over the changed UI files | `impeccable context` resolved the incumbent visual system (no PRODUCT.md/DESIGN.md — a documentation gap, not greenfield). `detect --json` found **3 "side-tab accent border" warnings** in `app.css` (lines 28, 165, 195), flagged as the most recognisable AI-UI tell. Also reported a newer version (v4.10.0) is available. |
| **`break-ui`** | Worst-case corpus title through global search | Found a **real horizontal-overflow bug** that `site-check` could not catch because it does not type into the UI. See §3. |
| **`anatomy`** | Source study for the "biggest visual leap" of the upgrade roadmap | Loaded and studied 8 reference figures + kit; identified it as the generator behind the Anthropic sheets. A concrete figure brief is in §4; full build not started. |

---

## 3. break-ui finding — reported, then corrected and fixed

**Important correction:** the first pass attributed the 320 px overflow to the global-search result row. Isolating the offending elements with Playwright showed that was wrong — the overflow exists **with or without** a search term. The real causes are:
- `.course-bar select, .course-bar input { min-width: 220px }` — the Course label/select extended to x=415 in a 320 px viewport.
- `.topic-list ol { columns: 2 }` plus `.status-chip { white-space: nowrap }` — chips extended to x=326–372.

| State (before fix) | scrollWidth / viewport | Cause |
|---|---|---|
| 320 px, 100% zoom | 415 / 320 | course select + status chips |
| 320 px, 200% zoom (`zoom:2`, ≈160 CSS px) | 830 / 320 | many fixed-size elements (extreme case) |
| 1440 / 768 px, 200% zoom | equal / equal | held |

**Applied fix (`src/styles/app.css`):** course-bar labels/selects use `min-width:0; width:100%` with `flex:1 1 240px`; topic list drops to one column below 640 px with wrapping rows, `min-width:0` on titles and `flex-shrink:0` on chips; search-result text uses `min-width:0`, `overflow-wrap:anywhere`, `max-width:45%` on the subtitle and `max-width:100vw` on the dropdown.

**After:** 320 px scrollWidth = 320 (fixed); 1440/768 at 200% zoom = no overflow; search subtitle now fits. Verified with `video-research/breakui_search.py` and `site-check` at 320/390/768/1440 (13 shots, 0 problems). The 320 px + 200% zoom combination (≈160 CSS px) remains beyond the fix — an extreme case beyond normal reflow requirements.

---

## 4. anatomy brief for the roadmap's flagship figure

Generated from the skill's workflow steps 1–4 (size → truth → object → parts list), ready to build:

- **Size:** Figure (one mechanism, 40–80 parts, SVG, at most one WebGL layer) — no time estimate needed.
- **Truth:** DC motor law `F = N·B·I·L` per coil side; torque `τ = N·B·I·A·cos θ`; split ring reverses current every half turn; back-EMF `ε = N·B·A·ω·cos θ`.
- **Object:** a split-ring commutator on a bench test rig — a hand-cranked armature between a red/blue horseshoe magnet on a slotted base, with brush holders on standoffs, a knurled voltage knob, a ruler strip and a dial gauge reading angular speed. The commutator physically swaps the brush contact every half turn; that click *is* the concept.
- **Parts (grouped):** base plate, feet, groove, label plate, ruler strip, corner screws; two magnet yokes with pole shoes, gaps and mounting feet; two posts, brush holders, springs, carbon brushes; armature shaft, laminated core, two coil sides, split ring with two segments and an insulating gap; knurled knob, thumb screw, pointer needle; dial gauge with bezel, ticks and needle; terminal pair and two wires with connectors.
- **Frame:** Fig 1 top-left, "Why it keeps turning" top-right, hint bottom-left, live readout bottom-right (`I`, `τ`, `rpm`).
- **Verification:** `node build.mjs --audit`, `scripts/lines.mjs`, 4× close-ups of the split-ring/brush junction in both themes, 390px pass.

This figure would replace the hand-authored hero on a flagship topic while keeping the corpus attribution; built art is yours, content stays CC BY-NC 4.0.

---

## 5. Recommended skill → task routing for this project

| Task | First skill to use | Supporting skills |
|------|--------------------|-------------------|
| New interactive figure / hero | **`anatomy`** (or `anatomy-reveal` for product reveal) | `threejs-scene`, `motion`, `site-check` |
| UI audit / redesign decision | **`impeccable`** (`audit`, `critique`, `shape`) | `better-interface`, `better-layout`, `unslop`, `web-design-guidelines` |
| Stress-test real data | **`break-ui`** | `agent-browser`, `site-check` |
| Dogfood / end-user flow | **`agent-browser`** (dogfood skill) | `axe` via browser, `site-check` |
| Cross-browser / responsive | **`site-check`** | `mobile-native`, `modern-web-guidance` |
| Copy / error messages | `better-writing` | `impeccable clarify` |
| Animation decisions | `motion-design` / `animate` | `animation-performance`, `review-animations` |
| Research question with sources | `research` / `web-access` | `treg` |
| Video/app reverse engineering | `rea-video` (or `leanrea` for binaries) | `ffmpeg`, OpenCV |
| Debug a hard regression | `diagnosing-bugs` | `code-review`, `review-security` |
| PR / code review | `code-review` | `review-bugbot`, `review-security`, `pr` |
| Planning a multi-step build | `planning-with-files` / `brainstorming` | `executing-plans`, `to-spec`, `to-tickets` |
| Create a reusable project skill/rule | `skill-creator` | `create-skill`, `create-rule`, `writing-for-agents` |
| Marketing/demo clip of the app | `frame-capture` or `scroll-film` | `treg` / Scenario video models |

---

## 6. Addendum — `anatomy-reveal` and the "dragging skill"

### `anatomy-reveal` (installed skill)
Loaded and executed: `node scripts/new-project.mjs` scaffolded `video-research\anatomy-reveal-scaffold`, installed 85 packages and built the reference project successfully:
- **82 parts, 44 assemblies**, `figure.html` + `figure-light.html` (631 KB each), `motion.html` (9:16, 1080×1920), build 0.5 s.
- The toolchain is verified on this machine; the template is ready to be replaced with an app object.
- Fit to the roadmap: unlike `anatomy` (a live explainer figure embedded in a page), `anatomy-reveal` delivers an **interactive dissection page you can drag/turn/take apart plus a product-reveal MP4**. Use it for a flagship "exploded view" upgrade (e.g., rover/motor/chloroplast) or a promo clip; it outputs geometry-only art, no user images.

### The "dragging skill" = Dragology / declarative dragging
There is no installed skill by that name; the user pointed to **https://declarative-dragging.github.io/** (Horowitz, Blinn, Heer — UIST 2026 Best Paper). Critically, **your app already depends on `dragology@^0.2.0`** — `BreadboardLab.tsx` uses `DraggableRenderer` + `d.closest(...)`. I read the site, paper page, and the library's LLM-facing API doc, then measured your lab's actual drag behaviour with Playwright (`video-research/drag_audit.py`):

- During the drag the LED's transform moved continuously (x = 92 → 132.8 → 159.4 → 191.6 → 227 → 232 → 281 → 339 → 406 px) while the committed hole label stayed `e12` until drop, then became `e17`. So Dragology already gives continuous visual feedback with discrete commit — good.
- **Keyboard alternative works** (`ArrowRight` moved e17 → e18), satisfying WCAG 2.5.7.
- Boundaries hard-clamp; no rubber-band. Acceptable for snap-to-hole, but note it.

**`apple-design` applied to the same interaction** (gesture/feel checklist):

| Gap | apple-design rule | Concrete fix |
|-----|-------------------|--------------|
| No press feedback on parts (only `cursor: grab`) | Feedback on pointer-down, continuous during gesture | Add `.pt-cell:active`-style highlight on `[role=button]` parts / use `draggedId` to change fill |
| Snap looks generic | `.withDropTransition("elastic-out")` for momentum-driven commits | Add to the `d.closest(...)` specs in `BreadboardLab.tsx` |
| Drop targets invisible until contact | `.withOverlay()` draws marks only while the spec is active | Render small circles on target holes during drag |
| `FBDLab.tsx` uses raw `pointermove`/`pointerup` listeners (lines 66–84, 126) | Declare future states instead of imperative handlers | Migrate force-arrow tips to Dragology `d.vary(state, [param("forces", key, "x"), param(...)])` with `inOrder` constraints |
| Readouts update only after drop | `onDragState` fires continuously with the preview state | Wire it to `useFigureStore.patch` so diagrams/graphs/readouts update **mid-drag** — this is the "parallel representations" pattern the paper highlights |

The last row is the important one: it turns the video-research roadmap's "live readout strip" from a static display into a genuinely coupled multi-representation interaction, with no new physics code.

---

## 7. Changes actually applied to the app (this turn)

| Source skill | Change | Files | Verification |
|---|---|---|---|
| `break-ui` + `modern-web-guidance` (`single-line-overflow`) | Responsive course controls, single-column topic list at ≤640px, shrinkable search-result text, bounded dropdown | `src/styles/app.css` | 320px scrollWidth 415→320; site-check 13 shots / 0 problems at 320–1440; `npm run build` |
| `impeccable` (`detect`) | Removed all 3 "side-tab accent border" slop patterns — key blocks, working reveal and language notice now use full 1px borders + tinted backgrounds | `src/styles/app.css` | `impeccable detect --json` → `[]` |
| `apple-design` + `better-accessibility` | Drag press feedback (larger radius + fill + drop shadow + `/1` z-index), floating snap, 34px snap radius, `elastic-out` drop, dashed target-hole overlay during drag, keyboard path preserved | `src/figures/BreadboardLab.tsx` | Playwright: press `r`=18, 8 overlay targets during drag, snap e12→e14, ArrowRight still works |
| `apple-design` + Dragology declarative dragging | Replaced raw `pointermove` handlers with `d.vary` specs; `onDragState` patches a preview state so force magnitudes and ΣFx/ΣFy update **mid-drag**; parking ring so each tip is grabbable; keyboard fallback | `src/figures/FBDLab.tsx` | Playwright: dragging `tip-gravity` changed only weight (0→217.2 N ✓) while the readout changed during the drag |
| `site-check` | Re-ran with 320px added, FBD/breadboard/elements states | — | 13 shots, 0 problems, ~16.3 ms/frame |
| `anatomy` / `anatomy-reveal` | Verified both toolchains: reference Figure built (`dial-indicator.html`), scaffold built 82-part espresso figure + 9:16 film page | `video-research/anatomy-reveal-scaffold/` | build logs; figure brief in §4 remains for the production asset |
| `npm test` | Regression | — | 4/4 pass |

**Not applied:** the full anatomy Figure for a flagship topic (scoped in §4) and the anatomy-reveal dissection/film — both are multi-hour asset builds and were treated as separate tasks after toolchain verification. The remaining Tier 1 roadmap items (Core Idea card, transport, checklists, ⌘K search, PWA) are not skill-driven fixes and were left for a separate implementation pass.

**Final verification (after the last build):** `npm test` 4/4 · `npm run build` clean · `site-check` 9 shots at 320/390/768/1440 across FBD + breadboard, 0 problems, ~16.4 ms/frame · axe: home 0 violations/31 passes, FBD 0/28, breadboard 0/29 (fixed the `label-content-name-mismatch` by including the visible `220 Ω` in the resistor's aria-label) · Playwright: FBD mid-drag readout changes and only the grabbed force moves; breadboard snap + overlay + keyboard still work. Screenshots: `video-research/fbd-final.png`, `site-check-final/sheet.jpg`.

### Modern Web Guidance
- **`single-line-overflow`**: used `min-inline-size: 0` on the flex text children and kept the full title in the DOM with `overflow-wrap: anywhere` instead of slicing strings — prevented the long corpus title from forcing a 95px page overflow ("Items refuse to shrink below their content by default (`min-inline-size: auto`)").
- **`drag`**: kept a keyboard path (`role=button`, `tabIndex`, arrow keys) and clamped positions, so the pointer interaction has an accessible equivalent ("Clamp every pointer and keyboard position through the same helper").
- **`natural-interactions`**: made press visibly different from rest (larger radius, filled colour, drop shadow) and kept `:focus-visible` distinct ("Make each interaction state look different, including combinations").

## 8. Limits of this pass

- Only 7 of 236 skills were actually executed; the rest were catalogued and routed. Installing or configuring every tool (Scenario API keys, WebKit, paid generators) is out of scope.
- `site-check` did not run WebKit (Safari engine) because that browser build is not installed.
- `anatomy` was studied and scoped, not executed — a Figure build is a separate task.
- A newer Impeccable (v4.10.0) is available; it was **not** updated, per the skill's own instruction not to rewrite files mid-session.
