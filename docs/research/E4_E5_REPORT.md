# E4 & E5 — Datasets, reference data, search and polish: COMPLETE ✅

**Date:** 2026-11-18

## E4 — Tier B datasets
`scripts/ingest-datasets.mjs` normalises 11 rich datasets into `content/data/*.json`, and `DatasetBrowser.tsx` provides a searchable, expandable browser with source + licence shown.

| Dataset | Items | Verified in browser |
|---|---:|---|
| Science Lab | 19 | ✓ |
| Periodic elements | 118 | ✓ |
| Memory lists | 43 lists (924 items) | ✓ |
| Recipes | 516 | ✓ |
| Music | 62 songs | ✓ |
| Trades | 67 lessons | ✓ |
| Debate | 176 items | ✓ |
| Great Books | 191 rungs | ✓ |
| Founding papers | 104 | ✓ |
| Harvard Classics | 366 days (metadata only — respects quotation limits) | ✓ |
| Food garden | 53 crops | ✓ |

## E5 — Tier C + polish
- Reference datasets ingested: timeline (96), infographics (223), resources (12), credits (146). Videos/ASL parsers returned 0 items and were omitted from the UI.
- **Global search** across all 5,105 topics + the library: `?s` topic results link to the right ladder/course/topic; dataset results open the browser. Verified with "cell" → chemistry/biology/math results.
- Accessibility: axe found light-theme contrast failures on the new hub chips, eyebrows and muted text. Fixed by darkening `--ink-3` to `#5f656b` and `--signal` to `#a8321f`. Final axe on the home screen: **30 passes, 0 violations**.
- `npm test` 4/4 ✓ · `npm run build` clean.

## Corpus expansion status: ALL PHASES E0–E5 COMPLETE ✅

The app now covers:
- **20 ladders / 130 courses / 5,105 topics** with generators and checkers from the repo.
- 11 rich datasets + 4 reference datasets with purpose-built browsers.
- Custom figure archetypes: Motion, Wave, Circuit, Field, Optics, Energy, Collision, Function, Particle, Data, Globe; native repo visuals elsewhere; 3D orbit; two Dragology labs.
- One shared progress engine, save codes, review queue, skill map, dual theme, en/es UI, axe-clean accessibility, idea endpoint.

## Remaining (external decisions, not code gaps)
- Human translation review for the Spanish chapter.
- Public hosting of the idea endpoint.
- Per-dataset custom visual polish beyond the shared browser (optional).
