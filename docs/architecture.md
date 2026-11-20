# Architecture map

- **`src/`** — React 19 app. `App.tsx` routes by URL param (`?s=&c=&t=` lessons, `?app=` tools, `?data=` library, `?lab=` prototypes, `?about`/`?roadmap` docs).
- **`src/apps/`** — 23 lazy-loaded expansion tools. Each fetches normalised JSON from `content/apps/`.
- **`src/state/`** — progress (thin wrapper around the vendored engine), local learning model (BKT + FSRS-style grades), preferences, theme, Marble data, content packs.
- **`src/utils/`** — sanitisation, navigation with View Transitions, pluralisation.
- **`scripts/`** — ingest/build pipeline. `fetch-corpus.mjs` restores `content/` from a pinned commit; `publish-content.mjs` packs it into `public/content/`; `split-graph.mjs`, `build-search-index.mjs`, `build-content-bundle.mjs` and the `build-*` scripts emit tool data.
- **`public/vendor/`** — vendored corpus JS: maths engine, TeX, checkers, visual kits and generators. Committed so a clone without `../trb` still builds.
- **`content/`** — corpus (fetched, not committed) plus the committed tool data in `content/apps/`, `content/harvard/` and `content/graph/`.

Where content ends and code begins: the app never invents an answer. Generators and checkers in `public/vendor/` produce and validate practice; lessons come from corpus packs; the learning model only schedules what to show next.
