# Integration seams in the current app

For planning the corpus expansion, these are the exact files that must become subject-agnostic.

| Current file | Job today | Change needed for expansion |
|---|---|---|
| `scripts/ingest.mjs` | Reads only `data/physics/**`, emits physics bundles + graph | Split into a corpus ingest with per-ladder adapters; emit all subjects into `content/<ladder>/…`; build one unified `graph.json` with `ladder` tags |
| `content/courses/*.json`, `content/topics/*.json` | Physics-only bundles | Namespace by ladder; add `subject`, `ladder`, `type` (lesson/page/practice/reference) fields |
| `src/App.tsx` | Physics course selector + topic list + labs | Add subject hub (ladder selector); skill map becomes multi-ladder; keep review/idea/progress panels |
| `src/pages/TopicPage.tsx` | Physics lesson shell with figure routing | Keep shell; figure registry becomes subject-aware; support non-ladder content types (Page, Reference, Procedure) |
| `src/figures/MotionFigure.tsx` etc. | Physics archetypes | Add new archetypes per subject; keep registry in TopicPage (or extract to `figures/registry.ts`) |
| `src/components/RepoViz.tsx` + `src/viz/loadViz.ts` | Loads physics viz kits | Already loads all physics kits; extend to math/basic/adv and other subject viz JS if needed |
| `src/state/progress.ts` | Wraps repo engine, hardcodes `setLadder('physics')` and `setCourse('phys1')` | Make ladder/course dynamic; read from URL or subject hub; keep shared `trb-math-v1` key |
| `src/components/SkillMap.tsx` | 11 physics course nodes | Use unified graph; colour nodes from engine status; click navigates to subject/course |
| `src/components/PracticePanel.tsx` | Uses `ML.makeProblem` with topic id | Works unchanged for any ladder **if all generators are loaded** — extend vendor copier to all `static/*/gen/*.js` |
| `src/components/ReviewSession.tsx` | Uses `ML.engine.reviewSet()` | Works across ladders if graph includes all topics and `setLadder` is set to the active ladder |
| `src/i18n/index.ts` | en/es UI strings + physics overlay loader | Generalise overlay path to `content/i18n/<lang>/<ladder>/topics/<slug>.json`; run scaffold per ladder |
| `src/styles/tokens.css` | Warm paper + dark instrument | Add subject accents (optional) without breaking the shared palette |
| `scripts/copy-vendor.mjs` | Copies physics engines/viz/gens | Extend to all `static/*/gen`, `static/*/viz` and math core; keep dynamic script loading |
| `.github/workflows/ci.yml` | Test + build + upstream check hook | Add content validation across all ladders |

## Recommended refactor order
1. Extract `figures/registry.ts` from `TopicPage.tsx` so subjects/archetypes are declarative data.
2. Generalise `progress.ts` (ladder/course from state, not hardcoded).
3. Generalise `ingest.mjs` into adapters, keeping the physics adapter first (regression check).
4. Add subject hub in `App.tsx`; keep physics as the first ladder.
5. Add new ladders one at a time, each with its own adapter + figure set.
