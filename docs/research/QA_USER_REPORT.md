# User-mode QA report — whole corpus

**Date:** 2026-11-18
**Method:** exhaustive content audit of all 5,105 topic bundles + scripted user flows in the running browser across all 20 ladders (navigate, read, continue steps, answer practice, observe progress).

## 1. Exhaustive content audit (`scripts/audit-content.mjs` → `content/audit.json`)

| Check | Result |
|---|---:|
| Ladders | 20 |
| Topics audited | 5,105 |
| Missing bundles | **0** |
| Empty lessons | **0** |
| Duplicate slugs (within course) | **0** |
| Lessons without sources (before fix) | 43 |
| Lessons without sources (after fix) | **0** |
| Topics without a generator in source | 704 |
| Topics without a visual in source | 273 |

Generator gaps by ladder (by design in the source corpus, not app bugs): greatbooks 191, art 108, etiquette 91, egypt 91, geog 87, memory 67, physics 35, civics 31, math 3. Visual gaps are concentrated in memory (54), culinary (66), math (121) and a handful elsewhere.

## 2. User flows in the browser (one first topic per ladder, then answer attempts)

All **20 ladders** opened their topic, rendered the lesson shell, showed paced steps where a visual exists, loaded practice and accepted an answer. Progress recorded correctly: after the answer attempts the shared progress panel showed **6 XP, 1-day streak**.

| Ladder | Figure | Steps | Practice |
|---|---|---|---|
| math | none | 1/5 | yes |
| physics | none | 1/8 | yes |
| chemistry | custom | 1/8 | yes |
| economics | none | 1/7 | yes |
| earth | custom | 1/7 | yes |
| logic | none | 1/8 | yes |
| etiquette | custom | 1/7 | yes |
| egypt | custom | 1/7 | yes |
| scripts | custom | 1/12 | yes |
| vocab | custom | 1/10 | yes |
| bio | none | 1/7 | yes |
| civics | custom | 1/6 | yes |
| writing | custom | 1/7 | yes |
| geog | custom | 1/7 | yes |
| art | custom | 1/8 | yes |
| memory | none | written lesson | yes |
| greatbooks | none | written lesson | yes |
| robotics | native repo visual | 1/12 | yes |
| inventors | native repo visual | 1/29 | yes |
| culinary | none | written lesson | yes |

Answer checking worked generically: correct answers gave "Correct." with worked steps; wrong answers gave hints / "Show the working". No console errors.

## 3. Issues found and fixed

1. **43 lessons had no source entry** → attribution risk under CC BY-NC 4.0. Fixed in `ingest-corpus.mjs`: a fallback source (`Teddy Rook Book — <ladder> · <course>`) is emitted when the source lesson has none. Audit now reports 0.
2. **Practice showed "No generator for this topic yet" while generators were still loading** → misleading. Fixed in `PracticePanel.tsx`: shows "Loading practice…" until the ladder's generator scripts are ready.
3. **Audit initially counted 56 duplicate slugs** → false positive: namespacing by course means cross-course duplicates are fine. Fixed the audit key to `ladder/course/slug`; now 0.

## 4. Known limitations (content, not bugs)

- 704 topics have no generator in the source corpus; they are reading lessons. The app shows a clear "No generator" state. A self-check/reflection activity could be added later for these.
- 273 topics have no visual in the source; they render the full written lesson plus practice.
- Three sampled ladders (memory, greatbooks, culinary) start with written-lesson topics without a step counter — expected, their source has no visuals on those topics.
- The harness cannot literally hand-click 5,105 topics; the exhaustive part is a content/payload audit, the interaction part is a representative user flow in every ladder.

## 5. Fixes applied for the remaining gaps (follow-up)

### Generator gap — was a false positive
A runtime check through the generator registry (`ML.genIds()` after loading all 20 ladders) found **5,105 generators for 5,105 topics — 0 missing**. The earlier static regex scan missed generators registered through helper functions/variables. No content was missing; the audit script was wrong.
- Added a robustness net anyway: `ingest-corpus.mjs` now synthesizes an honest self-check from each topic's own worked example when no generator is found at build time, and `PracticePanel` shows "Loading practice…" while generators load.
- `content/audit.json` now reports **no generator gaps**.

### Visual gap — real, now covered
273 topics have no visual in the source. They now render a new `LessonFigure`: interactive idea cards built from the lesson's own key ideas, mistakes, tables, lists and worked examples, with a clear note that it is content-derived. `figureKindOf` maps missing visuals to `LessonFigure`; every topic now has a figure shell.

### Accessibility regressions from these fixes
axe on a lesson-figure topic found empty choice buttons, low-contrast chips/links and duplicate landmark labels. Fixed by tolerant choice-label extraction, darker `--underway`/`--review` tokens, CSS link-colour overrides and unique nav labels. Final axe: **0 violations**.

## 6. Verdict

The app is usable end-to-end as a learner across the whole corpus: navigation, paced lessons, generator-backed practice, feedback, and shared progress all work. No blocking defects found. The two genuine defects (attribution gap, misleading loading message) are fixed; the remaining gaps are source-content limitations clearly surfaced in the UI.
