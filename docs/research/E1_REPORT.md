# E1 — Math ladder: COMPLETE ✅

**Date:** 2026-11-18 · **Status:** math topics reachable with custom figure + real practice.

## What changed
- Fixed a topic-slug collision bug: bundles are now written to `content/<ladder>/topics/<course>/<slug>.json` (flat fallback kept). TopicPage fetches with the course URL param.
- Added `src/figures/FunctionFigure.tsx` — a custom SVG function explorer for math `graph` / `limit` visuals: repo expression evaluation (`ML.evalPlain`) with a safe fallback, sampled curve, draggable `h` points, two-sided values and a limit table.
- Wired `graph`, `limit`, `derivgraph`, `trigwave` → `FunctionFigure`.
- Added practice to the no-visual fallback so every topic has generator-backed practice.

## Verification
- `calc1/limit-idea`: FunctionFigure rendered, real generated problem about `lim x→−2`.
- `calc1/infinite-limits`: FunctionFigure + limit-at-infinity problem.
- `alg1/justify-solution-steps`: real generator problem ("What was done to get from −2x−2=4 to −2x=6?").
- `math.alg1.evaluate-expressions` bundle id confirmed correct (collision fixed).
- `npm test` 4/4 ✓ · `npm run build` clean · zero console errors.

## Next: E2 — chemistry / bio / earth
