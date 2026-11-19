# Adapting the plan to the Teddy Rook Book corpus (with a completely different design)

You said: build an app over **all the education data** in [TeddyRookBookClub/TeddyRookBook](https://github.com/TeddyRookBookClub/TeddyRookBook), with a **completely different design** from Sketchd. This note updates the blueprint for that reality.

---

## 1. What that repo actually is (important)

It is **not** an app backend — it's a large **static content repository**:

- **Hugo + PaperMod**, plain JS/CSS, **no framework, no server**. GitHub Actions builds it to GitHub Pages at `teddyrookbook.com`.
- **Content as data**, which is exactly what you want:
  - `data/math/courses.yaml`, `data/math/topics/<course>.json` (units, topics, prerequisites, skill map), `data/math/lessons/<course>.json` (why it works, worked examples, common mistakes, visuals, try-it problem).
  - `data/ladders.yaml` — subject ladders (Physics, Chemistry, Earth & Space, Economics, Logic, Etiquette, Egyptology, Ancient Scripts, Vocabulary, Biology, Civics, Writing, Geography, Art, Robotics, Inventors, Culinary, Great Books, …) sharing one engine.
  - Generators `static/<subject>/gen/*.js` (three difficulty levels, full worked steps), visual kits `static/<subject>/viz/*.js`, core engine `static/math/core/` (TeX→MathML, answer checker, mastery & review engine), app pages `static/math/app/`.
  - `content/**`, `layouts/**`, plus large libraries of YAML/JSON (science units, music songs, meals, languages, trades, etc.).
- **Proven learning science built in**: mastery = 3 correct answers with the last 2 consecutive; spaced review at **1, 3, 7, 16, 35, 75, 150 days**; checkpoints; placement check; skill maps; per-topic answer variety. Progress in `trb-*` localStorage keys with save codes. No accounts.
- **Ready-made integration surface**: stable embed endpoints `/embed/practice/?topic=<id>` / `?course=<key>`, `/embed/word/`, `/embed/reading/`, with `?theme=light|dark|auto`; listed in `data/embed.json` and checked after every build. Plus a toolkit zip and a `/developers/` page.

**Strategic consequence:** your job is *not* to generate educational content from scratch. The repo already has thousands of vetted, generated-and-checked topics. Your app should be a **new front end + an AI teaching layer grounded in that corpus**.

---

## 2. License / ethics constraint (read before building)

From the repo's own README:
- Ladder engine **code is MIT**.
- Lessons and other offered content are **CC BY-NC 4.0** — credit + link back required.
- Some language data is **non-commercial only**; several "no sex education / no nudes" design choices; the site as a whole is **non-commercial**.
- Infographics and written content © Teddy Rook — link, don't re-host.

→ Your app must be **non-commercial / attribution-respecting** unless you get permission. Design your data layer to carry `source_url` + `license` + `credit` on every imported item, and surface them in the UI. This is non-negotiable and also builds trust.

---

## 3. The opportunity: Sketchd's engine + Teddy Rook's corpus

| Sketchd (the demo) | Your app with this repo |
|---|---|
| Generates lessons from scratch with an LLM | **Retrieves** a vetted lesson from the corpus, then the LLM *presents* it interactively |
| Interactivity invented per topic | Reuse the repo's **visual kits + generators** (already tested, mathematically correct) |
| No curriculum; freeform only | Full **ladders, prerequisites, mastery, spaced review** already defined |
| Dark studio design | **Completely different design** — you own the visual identity |

This is a stronger product than either alone: AI pedagogy grounded in a huge, checked curriculum instead of hallucinated explanations.

---

## 4. Architecture for your version

```
GitHub repo (content source of truth)
  data/** + content/** + static/*/gen + static/*/viz
        │  (ingest script — Python/Node, runs in CI)
        ▼
Normalized content store (JSON/Postgres)
  Course → Unit → Topic → { lesson_md, worked_examples, visuals,
                            generator_ref, answer_checker_ref,
                            prerequisites, skill_map, source_url, license }
        │
        ├──► New front end (your completely different design)
        │       • Ladder map / skill map navigation
        │       • Lesson workspace (narration + interactive visual)
        │       • Practice UI calling the repo's generators/checkers
        │       • Progress + spaced-review queue
        │
        └──► AI teaching layer (the "Sketchd-like" part)
                • RAG over the imported lessons (embeddings in pgvector)
                • Planner: pick topic → choose visual kit / generator
                • Step generator: turn the vetted lesson into paced steps
                • Follow-up interpreter: answer within topic boundaries,
                  using the checked generator/checker for any new problem
                • TTS narration
```

**Key rule:** the LLM explains and presents the *existing* lesson; it never invents the answer key. For practice, call the repo's generator/checker (ported to your app or embedded via the stable `/embed/practice/` endpoints) so answers stay correct.

Two implementation paths:

- **Fastest (weeks):** keep Hugo as the content host; build a new front end that consumes the repo's JSON + the stable embed endpoints. Add a thin AI "explain this topic" layer. Low risk, instant access to all content.
- **Full (months):** port the data into Postgres + pgvector, build native interactive components from the visual kits, own the progress/mastery engine, add the AI step/follow-up pipeline from `BUILD_BLUEPRINT.md`. More work, best product.

---

## 5. Design directions "completely different" from Sketchd

Sketchd = near-black studio, serif hero, mint accent, two-pane. Pick a distinct register and commit to it:

1. **Warm paper & ink** — cream `#F7F3EA`, charcoal ink, one vermilion accent, serif + marginalia, hand-drawn diagrams; feels like a beautiful public-domain schoolbook (fits the repo's public-domain spirit).
2. **Bright puzzle-box** — playful saturated palette, chunky rounded cards, a recurring animal mascot (a teddy rook!), sticker-like badges; great for the Pre-K / young-learner content.
3. **Calm focus** — soft off-white, deep forest green, generous whitespace, one sans family; a "quiet tutor" for adults and exam revision.
4. **Modernist grid** — high-contrast black/white, one electric accent, strict grid, big numerals, editorial typography; makes the 1,305-topic math ladder feel like a reference instrument.

Whichever you choose, keep a **single source of truth for design tokens** (colors, type scale, radius, spacing) and never mix registers. The "gradient border + dark studio" language is Sketchd's — avoid it entirely.

---

## 6. Concrete next steps (when you're ready to build)

1. **Ingest inventory**: script that walks `data/**` + `content/**`, outputs a manifest of courses/topics/lessons with `source_url` and `license`; count what's importable.
2. **Pick one ladder** (Math Ladder is the most complete) and import just that first: courses, topics, prerequisites, lessons, generators, checkers.
3. **Build one screen**: the ladder/skill map in your new design. Then one lesson page that renders a vetted lesson + one generator-backed practice widget.
4. **Add the AI layer**: embed the imported lessons, wire planner + step generator with strict JSON, ground answers in retrieval.
5. **Own progress**: implement the repo's mastery rule and 1/3/7/16/35/75/150-day review schedule in your DB.
6. **Attribute**: put credit + link + license on every imported item.

---

## 7. What to reuse vs. rebuild

| Reuse (don't reinvent) | Rebuild (this is your product) |
|---|---|
| Lessons, worked examples, generators, answer checkers, skill maps, prerequisites, spaced-review schedule, embed endpoints | Front end / design system, navigation, AI teaching layer, narration, progress DB, account & save experience |
| Visual kits (`static/*/viz/*.js`) as reference | Native interactive components (port or wrap them) |
| `data/embed.json` stable URLs as a bridge | Your own API/content store |

---

Bottom line: the repo gives you the **curriculum and correctness**; the Sketchd teardown gives you the **interactive lesson experience and engine pattern**. Combine them under a design language that's entirely yours, and keep the non-commercial attribution rules baked into the data model from day one.
