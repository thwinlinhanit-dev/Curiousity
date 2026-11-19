# Corpus Expansion Plan — full Teddy Rook integration

**Date:** 2026-11-18
**Status:** ALL PHASES E0–E5 COMPLETE — see E0_REPORT.md, E1_REPORT.md, E2_E3_REPORT.md, E4_E5_REPORT.md
**Goal:** expand the React physics app into a single **multi-ladder learning app** covering the entire Teddy Rook Book corpus, while preserving the qualities already built: figure-first lessons, deterministic generators/checkers, the repo's progress engine, no runtime LLM, static/offline delivery and attribution.

---

## 1. Verified inventory (facts, not estimates)

The repo contains **20 ladders** and a large set of standalone datasets. All numbers below were read from the actual files.

### 1.1 Ladder subjects (identical schema — `{course,units,topics}` + lessons keyed by topic id)

| Subject | Courses | Units | Topics | Generator JS | Viz prefix |
|---|---:|---:|---:|---:|---|
| **math** | 28 | 224 | **1,350** | 28 | — (uses core viz) |
| **physics** | 11 | 74 | **525** | 11 | `ph-` |
| civics | 8 | 70 | 406 | 8 | `cv-` |
| egypt | 6 | 64 | 306 | 6 | `eg-` |
| writing | 6 | 48 | 270 | 6 | `wr-` |
| bio | 4 | 42 | 262 | 4 | `bi-` |
| art | 5 | 44 | 244 | 5 | `ar-` |
| geog | 4 | 32 | 234 | 4 | `gg-` |
| chemistry | 3 | 32 | 219 | 3 | `ch-` |
| greatbooks | 9 | 37 | 191 | 9 | `gb-` |
| economics | 3 | 29 | 186 | 3 | `ec-` |
| earth | 3 | 36 | 180 | 3 | `es-` |
| logic | 3 | 23 | 156 | 3 | `lg-` |
| etiquette | 3 | 28 | 148 | 3 | `et-` |
| vocab | 2 | 17 | 140 | 2 | `vo-` |
| culinary | 12 | 31 | 89 | 12 | `cu-` |
| memory | 2 | 16 | 67 | 2 | `mm-` |
| scripts (Ancient Scripts) | 1 | — | 53 | 1 | `sc-` |
| robotics | 10 | 23 | 51 | 10 | `rb-` |
| inventors | 7 | 15 | 28 | 7 | `iv-` |
| **TOTAL** | **122** | **~820** | **~5,370** | **130** | — |

Lesson content is already pre-generated: **56,570 blocks** across all lessons, including 9,846 worked examples, 8,959 prose paragraphs, 7,738 visual blocks, 5,105 "try it" markers, 5,046 key facts, 4,980 common mistakes and 4,651 explanations.

**Important:** `try` blocks contain **no embedded problem** — interactive practice comes from the generator registry. All **130 generator JS files** are now available in the local checkout (`static/<subject>/gen/*.js`), so every ladder can have real, seeded, checked practice — not just physics.

### 1.2 Standalone datasets (high-value, simple schemas)

| Dataset | Path | Items |
|---|---|---:|
| Periodic elements | `data/elements/elements.json` | 118 elements × 32 fields |
| Memory flashcard lists | `data/memory/lists/*.yaml` | 43 lists / 924 items |
| Vocabulary | `data/vocab/list.json`, `roots.json`, `words/*.json` | 1,000 words / 100 topics / 111 roots |
| Great Books | `data/greatbooks/rungs.yaml`, `ideas.yaml`, `year.yaml` | 191 rungs / 60 ideas / 365-day plan |
| Harvard Classics | `data/harvard/guide.json`, `days/*.json` | 50 volumes / 366 day files |
| Meal Prep | `data/meals/recipes*.json`, `catalog.json`, `ingredients.yaml` | ~500 recipes / 532 catalog items / 126 ingredients |
| Music | `data/music/songs/*.yaml` | 62 songs |
| Trades | `data/trades/*.json` | 5 courses / 67 lessons / 49 system maps |
| Debate | `data/debate/` | 18 chapters / 50 resolutions / 126 glossary terms / 23 fallacies |
| Federalist & Anti-Federalist | `data/papers/` | 85 + 19 full texts |
| Science Lab | `data/science_lab.yaml`, `data/science_units/*.yaml` | 19 simulations; 6+5+17+14 chapter units |
| Garden | `data/garden/crops.json`, `animals.yaml` | 53 crops |
| Art catalog | `data/art/images.json` | 215 works / 56 periods / 137 cities |
| Adult life skills | `data/adult/*.json` | 4 areas / 34 guides |
| Egypt sites | `data/egypt/sites/*.yaml` | 19 site pages |
| Timelines / infographics | `data/timeline.yaml`, `data/infographics.yaml` | 96 events / 223 infographics |
| Guided schoolbooks | `data/hs_*.yaml` (30+), `data/rays_*.yaml` (5) | large guided lesson sets |
| Tests / AP maps | `data/testprep/*.yaml` (21) | SAT/ACT/CLT + 16 AP maps |
| Competition problems | `data/comp/*.yaml` (172) | Putnam 492 / Schweitzer 24 / Tripos 83 / original 48 |

### 1.3 Reusable engines (all vanilla JS, `window.MathLadder` + Node exports)

- `static/math/core/tex.js` — TeX→MathML typesetter (`ML.typeset`, `ML.tex`, `\role{}` colouring). **Already in use.**
- `static/math/core/check.js` — answer checker (`ML.check`, `answerText/Show/Value`) built on `window.CAS`. **Already in use.**
- `static/math/core/gen.js` — generator registry, seeded RNG, exact rationals, anti-repetition. **Already in use.**
- `static/math/core/engine.js` — mastery / spaced review / XP / save codes, shared key `trb-math-v1`, multi-ladder aware. **Already in use.**
- `static/homeschool/calc/cas.js` — dependency-free CAS (fractions, simplify, derivatives, integrals, solving). **Already in use.**
- `static/math/viz/core.js` + `basic.js` / `adv.js` + 28 course kits — ~170 visuals. **Partially in use** (core + basic).
- `static/<subject>/viz/*.js` — per-ladder visual kits (physics 36 `ph-` visuals + 11 course kits). **Physics in use; others available.**
- `static/math/app/session.js`, `map.js`, `runner.js`, `input.js` — behavioural references for practice sessions, skill maps, problem cards and answer inputs.

### 1.4 Licence constraints (must be preserved)

- Ladder engine code: **MIT**.
- Lessons / offered content: **CC BY-NC 4.0** with credit + link back.
- Some language data non-commercial; Greek NT CC BY 4.0; PROIEL CC BY-NC-SA 3.0; Perseus CC BY-SA 3.0; Collatinus GPLv3.
- **ESV Scripture verses: quotation allowance only — do not reuse beyond that.**
- Putnam/IMO problems: © MAA/IMO — **not reproduced**, only linked.
- `data/credits.yaml` contains **103 credited items**; attribution must be rendered per item.
- Therefore: **non-commercial only**, attribution everywhere, no re-hosting of infographic images.

---

## 2. Architecture: one app, many ladders

The repo already models subjects as ladders with one shared engine. Mirror it exactly:

```
App shell (theme, i18n, progress, search, idea box)
  └─ Subject hub (ladder selector)
       └─ Course (unit → topic list / skill map)
            └─ Topic lesson (figure + paced narration + practice)
                 └─ ONE shared progress engine (trb-math-v1)
```

Why:
- `engine.js` already supports `setLadder(k)`, `setGraph(g)`, cross-ladder prerequisites and shared XP — progress can span math → physics → chemistry from day one.
- Expansion is **repeating a proven pattern per subject**, not new architecture.
- A single search, single review queue and single save code serve the whole corpus.

---

## 3. Generalised ingestion pipeline

```
repo data/** + content/** + static/*/gen/** + static/*/viz/**
   │
   ├─ scripts/ingest-corpus.mjs — per-ladder adapters
   │     → content/<ladder>/courses/<key>.json
   │     → content/<ladder>/topics/<slug>.json
   │     → content/graph.json       (all ladders, one graph)
   │     → content/catalog.json     (standalone datasets)
   │
   ├─ scripts/copy-vendor.mjs — ALL 130 generators + viz kits + core engines
   │
   └─ app registry: ladder → subject → figure archetype → component
```

Non-negotiable rules:
1. **Never invent answers** — repo generators/checkers or build-time precomputation only.
2. **Attribution always** — `source_url`, `license`, `credit` on every item; render in UI.
3. **Offline static** — JSON + classic scripts; no server required.
4. **No runtime LLM** — narration/translation are build-time assets.
5. **Validate in CI** — `check-course.js` and `check-gen.js` run for each ladder.

See [`INTEGRATION_SEAMS.md`](./INTEGRATION_SEAMS.md) for the exact files to refactor.

---

## 4. Content tiers

| Tier | Subjects / data | Treatment |
|---|---|---|
| **A — Full ladders** | math, physics, chemistry, bio, earth, economics, logic, civics, etiquette, egypt, writing, geog, art, greatbooks, vocab, memory, culinary, scripts, robotics, inventors | Full lesson pipeline: topics + generators + checkers + figures; shared progress |
| **B — Rich datasets** | science lab, music, meals, trades, debate, adult, garden, jerome, papers, harvard, family, testprep, puzzles | Purpose-built browsers/renderers; generators where present |
| **C — Reference** | timeline, infographics, resources, videos, sets, paths, credits, ASL, phonics, outdoor skills | Read-only pages + global search integration |

---

## 5. Subject-by-subject rollout

### E1 — Math (highest leverage)
- 28 courses / 1,350 topics / 28 generators.
- Reuse `MotionFigure`'s `ph-graph` mode for `x → v → a` and function plotting.
- Cross-ladder prerequisites already point into physics — immediate payoff.
- First slice: `alg1` and `calc1` (5 topics each), then generalize.

### E2 — Chemistry, Biology, Earth & Space
- 219 / 262 / 180 topics; identical schema → **zero new ingest code** beyond a subject key.
- New figure candidates: `MoleculeFigure`, `CellFigure` (annotated 3D), `RockCycleFigure`.
- Reuse `FieldFigure` styling for fields/gradients; native `ch-`/`bi-`/`es-` visuals as baseline.
- Elements dataset (118) becomes a standalone periodic-table explorer linked from chemistry.

### E3 — Civics, Economics, Logic, Etiquette, Writing, Geography, Art, Egypt, Great Books, Vocab, Memory, Culinary, Robotics, Inventors, Scripts
- All full ladders with generators — same adapter.
- New figure candidates: `TimelineFigure`, `MapFigure`, `SentenceTree`, `ProcedureFigure`, `FlashcardDeck`.
- Memory flashcards (924 items), vocab (1,000 words), great books (191 rungs), trades (67 lessons) become dedicated browsers.

### E4 — Tier B datasets
- Science lab (19 sims), music (62 songs with synced score/keyboard kit), meal prep (~500 recipes), debate (50 resolutions), Federalist (104 papers), Harvard (366 days), garden (53 crops), adult (34 guides).
- Each gets a lightweight, design-system-consistent browser; attribution rendered.

### E5 — Tier C + polish
- Global search across everything; reference pages; infographics as linked external content (no re-hosting).
- Full axe pass, i18n scaffold per subject, skill-map tree for all ladders, idea loop per subject.

---

## 6. Figure strategy per subject family

| Subject family | Reuse | New archetype candidates |
|---|---|---|
| Math / calculus | `ph-graph`, `MotionFigure` graph mode | `FunctionFigure`, `GeometryFigure` |
| Chemistry / biology / earth | native `ch-`/`bi-`/`es-`, `FieldFigure` | `MoleculeFigure`, `CellFigure`, `RockCycleFigure` |
| History / civics / great books | `Page` block, timeline | `TimelineFigure`, `MapFigure` |
| Music | `WaveFigure` + repo piano kit | `ScoreFigure` (synced score/keyboard) |
| Languages / vocabulary / memory | `Page` + match-pairs practice | `FlashcardDeck`, `SentenceTree` |
| Trades / robotics / culinary | native repo interactives | `ProcedureFigure` (step-through) |

Quality bar unchanged: one canonical figure per archetype, parameterised by data, linked representations, spatial feedback, keyboard + axe clean.

---

## 7. Progress, navigation, i18n

- Extend `content/graph.json` with all 20 ladders; keep `trb-math-v1` as the shared key.
- `progress.ts`: ladder/course from URL or hub state, not hardcoded to physics.
- `SkillMap.tsx`: multi-ladder tree, colours from engine status.
- `ReviewSession.tsx`: review queue spans all ladders through `E.setLadder()`.
- `i18n:scaffold`: run per ladder; overlays at `content/i18n/<lang>/<ladder>/topics/<slug>.json`; translation stays offline.

---

## 8. Phasing & exit criteria

| Phase | Scope | Exit criterion |
|---|---|---|
| **E0** | Generalise ingest + vendor copier + graph | All 20 ladders / ~5,370 topics reachable in catalog |
| **E1** | Math | 5 topics in `alg1` + 5 in `calc1`: figure practice + progress |
| **E2** | Chemistry / Bio / Earth | 5 topics each with custom figure + practice |
| **E3** | Remaining 15 ladders | Every ladder has at least one working lesson + practice |
| **E4** | Tier B datasets | 10 purpose-built browsers shipped |
| **E5** | Tier C + polish + global search | axe clean, attribution complete, i18n per ladder |

**Estimate:** E0–E1 is the critical path (~1–2 focused sessions with the existing adapters); E2–E3 are mostly mechanical repetition of the same adapter; E4–E5 are UX work.

---

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| ~5,370 topics / large JSON | Per-ladder bundles, lazy loading, build-time validation |
| Different schemas | Per-ladder adapters, not one monolithic schema |
| Licence constraints | Non-commercial only; per-item credit; no re-hosted images; respect ESV/MAA limits |
| Quality dilution | Custom figures only where warranted; native repo visuals elsewhere |
| Bundle growth | Lazy-load subjects/labs; share engines once |
| Progress collisions | Single shared `trb-math-v1`; test cross-ladder prereqs |
| Generator availability | All 130 generator JS now local; load dynamically like physics |

---

## 10. Immediate next step

Start **E0**: refactor `ingest.mjs` into a corpus ingest with a physics adapter first (regression check), then add the math adapter and verify 1,350 topics appear in the catalog with working generators. After that, E1 adds the first math figure slice.

No product decisions are blocked — the repo licence forces non-commercial + attribution, which the app already implements.
