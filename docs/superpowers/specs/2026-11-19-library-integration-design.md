# Library integration design — connect, drill, then grow

Date: 2026-11-19 · Status: approved for planning · Owner: app-reverse-engineer / build/physics-app

## Problem

The app has two disconnected runtimes:

- **Curriculum runtime** — `content/<ladder>/` (20 subjects, 5,105 lessons): lesson payload
  (`blocks`, `viz`, `prereqs`, `xp`), graded practice via registered generators, and one shared
  progress engine (mastery, XP, spaced review, save codes).
- **Library runtime** — `content/data/*.json` (15 reachable datasets, ~2,000 items): a flat
  `{title, subtitle, body, meta}` list shown in a search-and-expand viewer, with no links to
  lessons, no practice, no progress, and several rendering bugs (recipes stub, 223 infographics
  never displayed, raw internal keys exposed).

The datasets are rich but dead-end. A learner who finishes "The Water Cycle" never discovers the
water-cycle explorer, the 96-event timeline it belongs to, or the memory drill that would make it
stick.

## Goals

1. Make every dataset item that relates to a lesson discoverable **from the lesson** and vice versa.
2. Turn machine-usable datasets (`memory`, `elements`, `timeline`) into **real graded practice**
   with zero new progress machinery.
3. Convert `music` into a first-class ladder (62 songs, existing player as the figure), then
   `trades`, `debate`, `greatbooks` with the same adapter pattern.
4. Never ship generated filler: a lesson is only created if it has a playable figure **or** a
   gradeable drill, plus real content.

## Non-goals

- No generic "dataset → ladder" converter.
- `resources`, `credits`, `garden`, `papers` stay browsers permanently.
- No changes to existing corpus lesson content.
- No microphone/audio-input grading.

## Data facts this design relies on

| Dataset | Items | Structure that makes it usable |
| --- | --- | --- |
| `science-lab` | 19 | `meta.topic: ['physics','chemistry']`, `kind: explorer/unit` |
| `trades` | 67 | `meta.course`, `systems[{key,lesson,view,…}]` — a course index |
| `memory` | 43 | `items[]` rows + `meta.prompts:[{ask:'book',from:['n']}]` — a generator spec |
| `elements` | 118 | full `meta` (z, symbol, name, weight, category, block, config, state) |
| `timeline` | 96 | `year`, `era`, `place`, `links` |
| `music` | 62 | `level` (30/27/5), `skills[]`, `key`, `time`, `tempo`, `pickup`, `chords`, `capo`, `about`, `work`, `source`, `draft` |
| `debate` | 176 | `resolution`, `background`, `formats`, `level`, `category` |
| `greatbooks`/`harvard` | 191/366 | `author`, `ideas`, `unit`, `short` |
| `infographics` | 223 | real SVGs at `content/data/infographics/<file>.svg`, never rendered |

---

## Phase 1 — Cross-links (satellites)

### Build

`scripts/library-map.mjs` (same architecture as `scripts/marble-map.mjs`) writes
`content/library/links.json`:

```jsonc
{
  "generated": "YYYY-MM-DD",
  "stats": { "items": 0, "linkedTopics": 0, "exact": 0, "strong": 0, "weak": 0 },
  "byTopic":  { "phys1.water-cycle": [{ "dataset": "science-lab", "index": 4, "slug": "…",
                                        "title": "…", "why": "meta.topic includes physics",
                                        "confidence": "exact" }, …] },
  "byItem":   { "science-lab:water-cycle-explorer": [{ "topicId": "phys1.water-cycle", "href": "?s=…&c=…&t=…" }] }
}
```

Item keys are `"<dataset>:<slug>"` when the item has a slug (or `meta.slug`), else
`"<dataset>:<index>"`. The same key is what `?data=<dataset>&item=<key>` uses, so the map,
the deep link and the viewer all agree on one identifier.

Matching rules, per dataset, declared in the script (not guessed at runtime):

| Dataset | Rule |
| --- | --- |
| `science-lab` | `meta.topic` narrows the ladder; fuzzy title against that ladder's topics |
| `trades` | `meta.course` → the matching ladder/course allowlist |
| `timeline` | `meta.place` → geography/history/egypt ladders; event title fuzzy match |
| `infographics` | `tags` → subject allowlist; title fuzzy match |
| `greatbooks`/`harvard` | book/essay title → writing, vocab, literature-adjacent topics |
| `elements` | element names → chemistry topics |
| `memory` | list title keywords → the subject the list belongs to |
| `debate` | `category` → civics/economics/logic ladders |
| others | no rule → never linked |

Confidence: `exact` (normalised-title equality), `strong` (token Jaccard ≥ 0.85 with ≥ 2 shared
tokens), `weak` (0.6–0.85). **Weak links appear only in the console/`links-report.txt`, never in
UI data.** The script prints per-dataset counts so coverage is reviewable before commit.

### Runtime

- `src/state/library.ts`: loads `links.json` once (cached promise), exposes
  `linksForTopic(id)` / `linksForItem(dataset, index)`. Missing file → empty maps, UI silent.
- `src/components/LibraryStrip.tsx` on the lesson page (below the Marble panel): grouped chips —
  "Go deeper · Explorer · 3 timeline events · Reader's map". Each chip is an `<a>` to the deep
  link below. No strip when no links.
- **Deep links**: `?data=<dataset>&item=<key>` (key format as defined above) opens
  `DatasetBrowser` with that item expanded and scrolled into view. This also fixes infographics:
  the detail renders `content/data/infographics/<file>.svg` inline (`<img>`).
- Mirror block in dataset detail: "Lessons this connects to" from `byItem`.

### Tests

- links.json invariants: every `byTopic` entry has a matching `byItem` entry and vice versa;
  no `weak` entries in the shipped file; hrefs parse into `?s=&c=&t=`.
- `DatasetBrowser` handles unknown `item` values (falls back to plain list, no infinite loading).

---

## Phase 2 — `library` ladder (graded drills)

### Registration

New ladder key `library` in `catalog.json` and `graph.json` (emitted by
`scripts/build-library-ladder.mjs`, idempotent; courses: `memory`, `elements`, `timeline`).
Topics:

- `mem.<list-slug>` — 43 (one per memory list)
- `el.facet-<name>` — ~8 generator topics (symbol→Z, Z→symbol, name→symbol, mass, category,
  block, state, electron config)
- `tl.order-<era>` — ~6 (order five events by year) + `tl.date-<era>` (event → year/when)

Each topic bundle carries a short lesson (`p` + `key` blocks from the dataset's own `description`
or list title), `xp`, and `viz` only where a figure exists (elements → periodic table view).
Because these are ordinary topic ids, **mastery, due queues, review sessions, XP and save codes
work unchanged** — a review session may mix a Grade-2 fraction with a water-cycle drill.

### Generators

`scripts/build-library-gen.mjs` emits `public/vendor/gen-library.js` (same vendored pattern as
existing per-ladder gens) registering `MathLadder` generators that read the dataset JSONs baked
into the file at build time:

- memory: for each list, for each `prompts` entry `{ask, from}` → question from the `from`
  fields, answer = `ask` field value; seeded pick of a row.
- elements: seeded pick of an element, facet question, exact/number check against `meta`.
- timeline: seeded pick of 5 events from one era → answer is the comma-separated ordered list of
  ids; checked as exact text (canonical order known at generation).

Determinism: `makeProblem(id, seed)` must be reproducible for a seed (contract test).

### Tests

- Every `library` topic id resolves in the graph and has a registered generator.
- Property: for every generator, `check(spec, answerText(spec))` passes.
- Ladder + gen builds are deterministic (byte-identical twice).

---

## Phase 3 — `music` ladder (first converted subject)

`scripts/build-music-ladder.mjs`:

- **Courses**: `beginner` / `intermediate` / `advanced` from `meta.level`.
- **Topics**: `mus.<slug>` per song, excluding `draft: true` items (they stay out until flipped).
- **Lesson payload**: `p`/`key` blocks from `about` + `work`; `table` block from `chords`;
  `list` block from `skills`; provenance from `source`; figure = the existing MusicLab player,
  embedded in the stage via the song `slug` (`?music=<slug>` behaviour reused, not rewritten).
- **Prereqs**: from `skills` tags. The script emits `content/music/skill-order.json` — for each
  skill, the first song (by level, then order) that introduces it; songs tagged with a skill
  depend on that introducer. This table is generated once and is hand-editable afterwards.
- **Generators** (`gen-music.js`): from `key`, `time`, `tempo`, `chords` — "what key is this in
  (which note ends it)", "time signature", "what chord follows `G:4 C:2` here", "how many bars
  is the pickup". Keyboard note events already exist in the player, so a future "play the C
  triad" check is possible without new input plumbing; not in scope for v1.

`trades`, `debate`, `greatbooks` follow the same adapter pattern in later cycles, each with its
own spec.

### Tests

- All `mus.*` topics have a figure route that loads (player mounts with the slug).
- Skill-order graph is acyclic (prereq edges never point "down" a level).
- Draft songs absent from catalog/graph/bundles.

---

## Rollout, licensing, risks

Order: **Phase 1 → 2 → 3**, each phase independently shippable and verifiable in the browser
before commit, and each phase gets its own implementation plan (this spec is the umbrella, not a
single work queue). Every phase is additive: new files under `content/library/`, `content/data/`
untouched, corpus `content/<ladder>/` untouched; new ladders are new directories plus catalog/
graph entries produced by scripts (never hand-edited JSON).

Licensing: library data is Teddy Rook corpus content — same CC BY-NC 4.0 credit footer already on
lessons; music items carry per-item `source`. Marble data stays in its own namespace (unchanged).

Risks and mitigations:
- **Bad links** → confidence tiers + a reviewable report before commit; weak never ships.
- **Filler lessons** → the figure-or-drill rule; Phase 3 only converts data that already has
  structure, prose and a player.
- **Graph size creep** → library + music add ~120 topics against 5,105; negligible for fetch.
- **Dataset viewer bugs** → Phase 1 fixes the two that block deep links (infographic SVG,
  unknown-item fallback); the rest stay tracked separately.

## Definition of done

1. Opening "The Water Cycle" shows a Go-deeper strip; opening the science-lab explorer shows the
   reverse links. (Phase 1)
2. A `library` lesson generates graded practice; answering it moves mastery and appears in the
   due queue and save code. (Phase 2)
3. `?s=music` lists 3 courses of real songs; a song page plays; a music question is gradeable.
   (Phase 3)
4. `npm test`, `npm run build`, and a browser verification pass per phase, committed with the
   change.

## Revision 2026-11-19 (Phase 3, as built)

The music ladder was re-scoped to mirror https://teddyrookbook.com/music/ directly:
97 interactive chapters (Piano basics 9 · Reading music 12 · Guitar 23 · Ukulele 24 ·
Banjo 23 · Continued-Fraction Suite 6) ingested from trb/content/music with their
data-ml widgets intact, rendered by MusicChapter.tsx on top of the vendored Teddy
Rook lessons engine (public/vendor/music/lessons + fret), plus all 60 playable songs
(staves pieces through the kit player, tab songs through the fretted-instrument
player). Practice comes from each chapter's own Remember bank (true/false + MC) and
from song facts (key, time, tempo, chord sequence, chord spelling). 157 lessons total.
