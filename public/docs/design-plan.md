# Curiosity — UI/UX deep dive and design plan

_Audit of the shipped app (preview + `src/styles/tokens.css`, `src/styles/app.css`, component sources), then a plan for a clean, modern, professional interface._

This document is served at `/docs/design-plan.md` and rendered in the app at `?plan`.

---

## 1. Verdict

The product's soul is right: a paper-and-ink "lab notebook" palette, a serif display face for lesson titles, monospaced numerals for data, and a lesson that alternates figure, narrative and practice. That identity is worth keeping and sharpening — it is what makes this feel like a schoolbook rather than a dashboard.

What stops it feeling professional is not taste, it is **discipline**: one page carries five jobs, the type scale has six sizes below 14px, four different card treatments compete, the music lab ships its own palette, and internal identifiers leak into the interface. Every fix below is about removing things and making the remainder consistent.

Three sentences to design against:

1. **One screen, one job** — choose, learn, or practise. Never all three.
2. **Nothing below 12px, nothing louder than the content** — chrome is quiet, the lesson is loud.
3. **Every state is designed** — empty, loading, error, and success get as much care as the happy path.

---

## 2. Audit

### 2.1 Information architecture (the biggest problem)

`App.tsx` renders the entire product on `/`: hero, search, progress panel, two "lab prototype" cards, the music lab card, 15 library tiles, 22 subject tiles, a course `<select>`, a find box, a three-way view toggle, the topic list, the idea box, and the footer. At 393pt the first tappable lesson is **about five screens down**.

- No global navigation. `SiteHeader` is a preference strip (language + theme), not a way to move around. From a lesson the only exit is "← All topics", which returns to the whole homepage.
- Two competing ways to pick the same list: subject tiles *and* course dropdown, plus a third filter (Find) and a fourth (Standards only).
- Labs, library and music — three separate products — are sold as six cards in the middle of a catalogue page.
- The brand line is `PHYSICS FIGURES` while the app ships 22 subjects; the eyebrow appends `· CORPUS`, an internal word.

### 2.2 Typography

`tokens.css` sets a six-step scale: `13 / 15 / 18 / 24 / 34 / 48`. Components then add **8, 10, 11 and 12px** on top of it.

| Where | Size | Problem |
|---|---|---|
| `.pt-name` (periodic table element names) | 8px | illegible, ellipsised to "Berylli…" |
| `.status-chip`, `.idea-label`, `.std-badge` | 10px | reads as debug output |
| `.ladder-chip span`, `.pt-legend`, `.chord-card span` | 11px | below minimum comfortable size |
| `.dataset-detail dl`, `.limit-table`, `.classify-bins` | 12px | okay as data, but not a scale step |

Also:

- Three families are declared but only system fonts load. `--font-mono` names IBM Plex Mono, which is never fetched, so every "instrument" label falls back to whatever monospace the OS has. The identity is inconsistent per device.
- Body is 15px/1.6; lesson prose measures 320px in the rail on desktop — about 45 characters, narrower than a book and narrower than the figure beside it.
- `.narrative-rail h1` is 34px against a 13px eyebrow; there is no 26/28 step between title and body, so section headings collapse to 18px.

### 2.3 Colour

The base palette is good and slightly unusual: paper `#f5f1e8`, ink `#1a1d21`, brick signal `#a8321f`. Contrast is mostly healthy: ink-3 on paper ≈ 5.2:1, signal on paper ≈ 5.9:1, white on signal ≈ 6.7:1.

Problems are semantic, not numeric:

- **Six status colours** (`mastered`, `underway`, `review`, `notstarted` + ink-3 default) describe three real states. Purple "review due" beside amber "under way" beside green "mastered" is a legend the user has to learn.
- `--notstarted: #b9b3a6` on paper is ≈ 1.8:1 — invisible if it ever reaches text.
- **A nested theme**: `.ml-chapter` re-declares `--paper`, `--ink`, `--line`, `--acc` inside the music lab, with its own light *and* dark values. That single block is why the music lab looks like a different app.
- No elevation. Every surface is a 1px border at 5px radius, so panels, cards and inputs share one depth and the eye has no grouping cue.

### 2.4 Components

Eleven interactive primitives with overlapping jobs: `.btn`, `.btn-primary`, `.btn-link`, `.chip`, `.segmented button`, `.ladder-chip`, `.lab-card` button, `.dataset-item`, `.idea-card > button`, `.topic-list li button`, `.marble-option`.

- Buttons are 13px with 8/12 padding — roughly 30px tall, under the 44px touch target, and several sit in rows of three on a phone.
- `.lab-card` uses a **dashed** signal border. Dashed means "placeholder", and the copy agrees: "Lab prototype · Free-body diagrams".
- `.status-chip` and `.std-badge` are both 10px pills but mean different things with no visual distinction beyond colour.
- Inputs, selects and the search field each define their own border/padding in four places.
- The practice difficulty control is three buttons labelled `L1 L2 L3`, with the word "Difficulty" only in an `aria-label`.

### 2.5 States

- Loading is the word "Loading…" in three places; no skeleton, no reserved space, so the page jumps.
- Errors exist on the lesson page and, since the last pass, on the course fetch and dataset 404. Search, review, and the labs have none.
- Empty states are missing almost everywhere: no "you're done for today", no "no reviews due", no "this subject has no lessons yet".
- Success is a coloured sentence; nothing acknowledges completion of a lesson or a course.

### 2.6 Motion

`fadein` on revealed steps and a 0.25s width transition on the step bar. `prefers-reduced-motion` is handled globally — a good foundation, but there is no deliberate motion language, and no state change is animated where it would help (chip selection, panel expansion, route change).

### 2.7 Accessibility

Stronger than most hobby apps: skip link, `aria-live` on results and mastery, `role="group"` on segmented controls, 44px minimum on periodic cells, visible focus ring, dialog via `showModal`.

Gaps: 8–10px text, 30px buttons, practice buttons with no accessible name beyond the group label, native `title` used for meaning (periodic cells), and no landmark structure beyond `<main>`/`<aside>`.

### 2.8 Voice

Learner-facing copy is good ("Learn it by taking it apart", "Common mistake:", "Not quite."). Developer copy leaks next to it: `LESSON · phys1.acceleration`, `correct 0/3 · streak 0/2 · reviews at 1·3·7·16·35·75·150 d`, `L1 L2 L3`, `STANDARDS`, `GO DEEPER`, "connect a backend to collect ideas", "Lab prototype · …".

---

## 3. Target design system (v2)

### 3.1 Tokens

```css
/* Type — five steps, nothing smaller */
--text-2xs: 12px;   /* labels, chips, table data        */
--text-xs:  13px;   /* meta, captions                   */
--text-sm:  14px;   /* secondary UI                     */
--text-md:  16px;   /* body default, inputs (no iOS zoom)*/
--text-lg:  20px;   /* section headings, stage prompt   */
--text-xl:  25px;   /* page titles                      */
--text-2xl: 32px;   /* lesson title, hero               */
--text-3xl: 40px;   /* home headline only               */

/* Spacing — 4pt grid, fewer stops */
--s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px;
--s-5: 24px; --s-6: 32px; --s-7: 48px;

/* Radius — two, plus pill */
--r-sm: 6px;    /* inputs, buttons, chips */
--r-md: 12px;   /* cards, panels          */
--r-pill: 999px;

/* Elevation — two */
--e-0: 1px solid var(--border);
--e-1: 0 1px 2px rgb(26 29 33 / .06), 0 4px 12px rgb(26 29 33 / .05);

/* Semantic colour (light) — components never use raw hex */
--bg:            #faf8f3;
--surface:       #ffffff;
--surface-sunk:  #f2eee4;
--border:        #e2dccd;
--border-strong: #cfc7b4;
--text:          #16181c;
--text-muted:    #565c63;
--text-subtle:   #6b7178;
--accent:        #a8321f;
--accent-quiet:  #f6e9e5;
--positive:      #2f6b4a;
--caution:       #8a6410;
--danger:        #8e1b12;

/* Semantic colour (dark) — same roles, re-pointed */
[data-theme="dark"] {
  --bg: #0f141b; --surface: #161d26; --surface-sunk: #1b2330;
  --border: #2a3441; --border-strong: #3a4657;
  --text: #eef1f4; --text-muted: #b3bcc6; --text-subtle: #94a0ad;
  --accent: #ff8a6b; --accent-quiet: #2a1a16;
  --positive: #6fd39d; --caution: #e8c464; --danger: #ff7a6a;
}
```

Rules that go with it:

- **One accent.** `--accent` means "the thing to press". Status never uses it.
- **Three statuses**, not six: neutral (not started), `--caution` (in progress / review due), `--positive` (mastered). Review-due is conveyed by a small dot, not a new hue.
- **No nested palettes.** Delete the `.ml-chapter` colour block; map the vendored music kit's variables to the app tokens through a small alias block.
- **Load one mono.** Either add IBM Plex Mono (two weights, ~30KB, self-hosted) or commit to system mono and remove the name from the stack. Do not declare a font that never loads.

### 3.2 Type rules

| Role | Spec |
|---|---|
| Lesson title | 32/1.15, serif, weight 600, max 2 lines |
| Section heading | 20/1.3, serif |
| Body | 16/1.65, sans, `max-width: 68ch` |
| UI label | 13/1.2, sans, weight 500, sentence case |
| Data / numerals | 13, mono, tabular numerals |
| Eyebrow (once per screen) | 12, mono, uppercase, `letter-spacing: .06em`, `--text-subtle` |

Consequences: the periodic table hides element names below 480px (symbol + Z only, name in the detail sheet); status chips become 12px neutral pills; `L1 L2 L3` becomes `Easy · Medium · Hard` at 13px.

### 3.3 Component set (replaces the current eleven)

| Component | Jobs it absorbs | Spec |
|---|---|---|
| `Button` (primary / secondary / ghost / destructive) | `.btn`, `.btn-primary`, `.btn-link` | 44px min height, 14px label, 10px radius, 1 accent CTA per screen |
| `IconButton` | narration, close, orbit toggles | 44×44, 20px glyph |
| `Field` (text, select, search) | 4 bespoke input rules | 44px, 16px text, label above, helper below |
| `Chip` (filter / toggle / choice) | `.chip`, `.segmented`, `.choice-grid` | 32px tall (44 on touch), `aria-pressed`, accent-quiet when on |
| `Card` (static / link / selected) | `.lab-card`, `.idea-card`, `.ladder-chip`, `.dataset-item` | `--surface`, `--r-md`, `--e-1`, no dashed borders |
| `ListRow` (topic, dataset entry, song) | `.topic-list li`, `.dataset-item` | 56px min, title 15, meta 13 muted, trailing status/chevron |
| `Badge` | `.status-chip`, `.std-badge` | 12px pill, neutral by default; standards becomes an icon + tooltip |
| `Panel` | `.progress-panel`, `.practice`, `.working-reveal` | surface or sunk + border, 16px padding, 12px radius |
| `EmptyState` / `ErrorState` / `Skeleton` | every "Loading…" | one-line message + one action; skeletons for lists |

---

## 4. Structure

### 4.1 App shell

```
┌───────────────────────────────────────────────┐
│ ⌂ Curiosity   [Subject ▾]      ⌕ Search  ⋯  │  sticky 56px
├───────────────────────────────────────────────┤
```

- **Brand** → home.
- **Subject switcher** (a select, not 22 tiles) — the single way to change subject.
- **Search** — a full-screen sheet on mobile, results grouped "Lessons · Library · Songs", with a real empty state.
- **Overflow** — theme, language, feedback, about/licences.

No other chrome on any screen.

### 4.2 Screens

**Home (`/`)** — three blocks, nothing else:

1. **Continue** — one card: next lesson title, its subject, Resume, and the due-review count with "Start review" when > 0. With nothing in progress: "Start with Physics →".
2. **Subjects** — a 2-column grid of 22 tiles (name, lesson count, thin progress bar).
3. **Explore** — Library, Labs, Music. Small, last.

Moved off home: hero paragraph, standards explainer, idea box, 15 dataset tiles, course dropdown, find box, view toggle, footer paragraph.

**Subject (`/?s=math`)** — header (subject, progress, Continue) then courses as a vertical list, each expanding to its lessons; status as a 12px neutral pill. One filter row: `[Find a lesson…] [Standards only]`.

**Lesson (`?s&c&t`)** — the core screen, rebuilt around reading:

- Mobile: title → figure (sticky, 40vh) → step text → Prev/Continue → "Practise this".
- Desktop: 68ch reading column + 420px figure column, aligned to the top.
- Header line: `Physics › Kinematics` (tappable), not `phys1.acceleration`.
- Progress: "Step 3 of 7" plus a segmented bar; raw `P` / `KEY` / `EX` codes become readable labels or are dropped.
- Mastery: one pill with an `i` popover that explains 3 correct / 2 in a row / spaced reviews once.
- Practice: a primary "Practise this →" that opens practice as its own view (`?practice=1`).

**Practice** — one question, one input, one primary action; difficulty as a labelled segmented control; result in a bordered panel with "Show the working" as a ghost button; after a correct answer, "Next question" is the only accent button.

**Review** — same layout inside a sheet; header shows the topic title and "2 of 5", not `phys1.acceleration · 1/12 · answer 1 of 2`.

**Library / Dataset** — 56px list rows, detail as a sheet on mobile; the periodic table keeps 18 columns above 640px inside a horizontal scroller with a sticky legend, and below 640px becomes grouped cards (Alkali metals, Noble gases…) instead of an 18-column squeeze.

**Labs, Music, Settings** — same shell and type; no "prototype" language.

### 4.3 Copy rules

- No internal ids, no `L1`, no `CORPUS`, no "connect a backend".
- Sentence case for buttons and labels ("Start review", "Show the working").
- Statuses use the same three words everywhere: Not started / In progress / Mastered.
- Every error says what happened and offers one action.

---

## 5. Plan

### Phase 0 — Design tokens and typography (0.5 day)

- Replace `tokens.css` with the v2 semantic set; keep the old names as aliases so nothing breaks mid-flight.
- Delete the `.ml-chapter` nested palette; alias the kit's variables to the app tokens.
- Add the mono font, or remove the unloaded family.
- Sweep every `font-size` under 12px.

**Done when:** no `font-size` under 12px remains in `src/styles`, and the music lab renders in the app palette in both themes.

### Phase 1 — Shell, home, subject (2 days)

- Add `AppShell` (top bar + overflow), search sheet, subject page.
- Rewrite home to Continue / Subjects / Explore.
- Move labs, library and idea box out of home.

**Done when:** a returning learner reaches their next lesson in one tap, a new learner in two, and nothing on home repeats another control.

### Phase 2 — Lesson and practice (2–3 days)

- Reading column with 68ch measure; sticky figure on mobile.
- Human breadcrumb and step labels; mastery popover; remove ids.
- Practice moves to its own URL and gets the new result panel.

**Done when:** the lesson reads top-to-bottom with no horizontal scroll at 320/393/768/1280, and practice is reachable in one tap from any step.

### Phase 3 — Library, labs, music (2 days)

- Convert dataset browser, periodic table and music lists to `ListRow` / `Card`.
- Rebuild the periodic table responsive behaviour and the free-body lab layout (it overflows right and shows 0.0 N readouts).
- De-duplicate the song list and fix the chord/fretboard dark-on-dark.

### Phase 4 — States, motion, accessibility (1–2 days)

- `Skeleton`, `EmptyState`, `ErrorState` components; apply to every fetch.
- Motion tokens (150/250ms, ease-out) for chip, panel and route transitions.
- Audit: axe on every screen, keyboard order, 44px targets, focus return after sheets.

### Phase 5 — Content voice (ongoing)

- Rewrite step labels and the `try`-block copy; fix the LaTeX leak in the Acceleration lesson; finish or hide Spanish (currently machine-damaged: `un = Δv/Δt`, "En Aceleración Aceleración fue cómo quickly Velocidad cambios").

### Acceptance criteria (test these, do not eyeball them)

1. No horizontal scroll at 320 / 393 / 768 / 1280.
2. No text below 12px; body and inputs ≥ 16px.
3. Every tap target ≥ 44×44.
4. Contrast ≥ 4.5:1 for text, 3:1 for UI borders and focus rings, in both themes.
5. Exactly one accent-coloured primary action per screen.
6. No internal identifier, code name or developer instruction visible.
7. Every fetch has loading, empty and error states.
8. A lesson is reachable in ≤ 2 taps from home.

### What to keep

The paper/ink palette, the serif display face, tabular numerals, the step counter with its progress hairline, "Common mistake:", the wrong-answer → hint → worked-steps loop, and the figure-first lesson. That is the product's character; the plan is meant to remove everything standing in front of it.
