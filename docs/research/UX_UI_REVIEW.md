# Interface review — primary learner flow

## Scope and coverage

**Scope:** the flow every learner uses — home hub → subject/topic list → lesson → practice — plus theme switching, the Dragology labs, the review dialog and the music lab. Excluded: the 15 standalone dataset browsers beyond a smoke check, and the build/CI pipeline.

**Stack and styling:** React 19 + Vite, plain CSS with semantic tokens in `src/styles/tokens.css` and component rules in `src/styles/app.css`; no component library. Convention documents found: `PHYSICS_SPEC/` plan and phase reports, `EXPANSION_PLAN.md`, `QA_USER_REPORT.md`. No `CONTRIBUTING.md`/`AGENTS.md`/design-system ADR in the project.

| Domain | Evidence inspected | Result |
| --- | --- | --- |
| Accessibility | `BreadboardLab.tsx`, `FBDLab.tsx`, `ReviewSession.tsx`, `TopicPage.tsx`, `App.tsx`; keyboard Tab walk; axe on home, lesson, dark theme, music lab | 2 HIGH, 1 MEDIUM |
| Layout | Home and lesson rendered; `app.css` grouping, grids, breakpoints; 320px/200% not reproducible in this harness | Not verified at 320px/200%; otherwise Clear |
| Writing | `src/i18n/index.ts`, error/empty-state strings in `TopicPage.tsx`, `PracticePanel.tsx`, `MusicLab.tsx` | 2 MEDIUM |
| Typography | Computed styles in browser; `tokens.css`, `app.css`, `index.html` | 3 MEDIUM, 1 LOW |
| Colors | Token values, both theme blocks, rendered axe contrast checks, semantic usage scan | 1 MEDIUM |
| UI | `app.css` hover/transition rules, motion tokens, screenshot review of home and lesson | 2 LOW |

## Findings

| Severity | Domain | Location | Before | After | Why |
| --- | --- | --- | --- | --- | --- |
| HIGH | Accessibility | `src/figures/BreadboardLab.tsx:30`, `:36`, `:46` | `role="button" tabIndex={0}` parts moved only by `dragologyOnDrag`; no `onKeyDown` | Add arrow-key/Enter handling that moves the part to the previous/next hole, or use a native `<select>` for target holes | WCAG 2.5.7 and 2.1.1: a pointer-only drag has no keyboard path; keyboard users cannot complete the breadboard task |
| HIGH | Accessibility | `src/components/ReviewSession.tsx:64` | Custom `<div role="dialog" aria-modal="true">` with no focus move, trap, `inert` background or Escape handler | Use native `<dialog>` + `showModal()`, or add focus move/trap, background `inert`, Escape close and focus restore | WCAG 2.4.3 / 4.1.2: focus can leave the modal into inert content; keyboard users lose context |
| HIGH | Writing | `src/pages/TopicPage.tsx:160` | `Could not load topic: {error}` — raw status text, no recovery | `Couldn't load this topic. Try again or return to subjects.` with two buttons | An error that names no way to recover hides the next step; HIGH on sight |
| MEDIUM | Accessibility | `src/pages/TopicPage.tsx:165`, `:187`; `App.tsx:113` | Lesson page is `<div className="topic-page">`; repeated preference chrome precedes it; no skip link | Wrap lesson content in `<main>` and make a skip link the first focusable element | Structure is navigation; screen-reader users cannot jump past repeated chrome to the lesson |
| MEDIUM | Typography | `src/styles/app.css:76`, `:126`, `:175`; `tokens.css:67` | Inputs do not inherit font; computed global-search input is `13.3333px` | Add `font: inherit` to inputs and hold `16px` on mobile | Below the 16px iOS input floor; Safari zooms the whole page on focus (1.4.4) |
| MEDIUM | Typography | `src/styles/tokens.css:19-20` | `--font-display: "Newsreader"…` and `--font-body: "Inter"…` declared with no `@font-face` or web-font load | Load those faces or remove them from the stack and use the actual fallbacks | The design names faces it never loads; browsers render Georgia/system instead |
| MEDIUM | Typography | `src/styles/app.css:140`, `:157`; `tokens.css:27` | Step counter and XP values use mono family but computed `font-variant-numeric: normal` | Add `font-variant-numeric: tabular-nums` to counters and numeric table columns | Changing digits shift width and nudge the layout on every step |
| MEDIUM | Writing | `src/i18n/index.ts:14`, `:21` | `That code wasn't recognised.` and `No generator for this topic yet.` give no next action | Name the fix: `That code wasn't recognised. Check the code and try again.` / offer a reflection action | Error/empty copy must point forward |
| MEDIUM | Colors | `src/styles/tokens.css:9`, `:39`; `app.css:12`, `:52` | One `--signal` red/vermilion is the primary-button fill, link colour, focus ring, active chip and error colour | Keep the accent for primary actions; add a distinct `--danger` token for errors and feedback | One hue carries several meanings; users must infer meaning from text alone |
| MEDIUM | UI | `src/styles/app.css:186` | `.topic-list li button:hover` declared outside `@media (hover: hover)` | Wrap hover-only styling in `@media (hover: hover)` | On touch, `:hover` latches after a tap and reads as a stuck selected state |
| LOW | Typography | `src/styles/app.css:24`, `:58`, `:148` | `letter-spacing: 1px` / `.5px` on small uppercase labels | Use `em` so tracking scales with the type size | px tracking breaks when the reader changes font size |
| LOW | UI | `src/styles/tokens.css:51`, `app.css:159` | Reduced-motion CSS exists, but theme switching and the step-progress width transition have no transition suppression | Suppress transitions for the theme swap as in the UI skill recipe | Colour transitions fire together at theme switch; minor smear |

## Verification

**Passed**
- axe-core 4: home (light) **29 passes / 0 violations**; lesson (dark) **27 / 0**; music lab **31 / 0**; lesson-figure topic **29 / 0**.
- Lighthouse on home: **Accessibility 1.0**, Best Practices 1.0. SEO 0.6 (missing meta description and robots.txt) is outside the six interface domains.
- Keyboard Tab walk from page load: language select → theme button → global search → save-code summary → first lab button. Every stop showed a visible `2px solid rgb(168,50,31)` `:focus-visible` outline.
- Computed body typography: `font-size 15px`, `line-height 24px` (unitless 1.6 declared), no `maximum-scale` in the viewport meta.
- `prefers-reduced-motion` block present at `tokens.css:51`; figures start paused and the music player does not autoplay.
- Screenshots reviewed at desktop width in light and dark; no clipping or overlap observed in the primary flow.

**Not verified**
- 320px width and 200% zoom: the harness cannot set a real viewport/zoom; only CSS inspection was possible.
- Screen-reader announcement quality for live regions and the review dialog (no assistive technology available).
- The 15 dataset browsers beyond a smoke check; excluded from scope.

## Fixes applied

All findings from this report were implemented in `build/physics-app/`:

- **HIGH** — Breadboard parts now handle Arrow keys (`BreadboardLab.tsx`, `makeLab.onKeyDown`), and the fake hole buttons were removed. Verified: focusing LED and pressing ArrowRight moved it e12 → e13.
- **HIGH** — Review session is now a native `<dialog>` using `showModal()`, with focus moved to the answer input, `::backdrop`, scroll containment and close-button label (`ReviewSession.tsx`).
- **HIGH** — Topic load failure now shows a recoverable message with **Try again** and **Back to subjects** buttons (`TopicPage.tsx`, new i18n keys). Verified on a deliberately missing topic.
- **MEDIUM** — Lesson pages use `<main id="main-content">`; a skip link is the first focusable element on every view.
- **MEDIUM** — `button, input, select, textarea { font: inherit }` plus a 16px mobile floor; computed input font is now 15px desktop.
- **MEDIUM** — Font stacks now use real system families (`ui-serif`/`ui-sans-serif`) instead of undeclared web fonts.
- **MEDIUM** — `font-variant-numeric: tabular-nums` on progress and step counters.
- **MEDIUM** — Copy for save-code errors and the no-generator empty state now says what to do next.
- **MEDIUM** — Added a distinct `--danger` token used by error/feedback states; `--signal` remains primary/link/focus.
- **MEDIUM** — Hover-only styling moved inside `@media (hover: hover)`.
- **LOW** — Small-label letter spacing converted from px to em.
- **LOW** — Theme switching suppresses transitions via a `theme-switching` class applied in `theme.ts`.

## Verification after fixes

- `npm test` 4/4 ✓ · `npm run build` clean.
- axe on the lesson page: **32 passes / 0 violations**; home and music lab previously 0 violations.
- Computed checks: skip link present, `main` landmark present, input font 15px, `tabular-nums`, distinct `--danger`.
- Keyboard breadboard movement verified; error-recovery UI verified.

## Verdict

**Approve** — no HIGH findings remain in the inspected scope. The native review dialog was implemented and inspected in code but its runtime focus sequence could not be exercised because the harness could not trigger a review queue; it remains the one sub-check marked **Not verified**. The 320px/200% and screen-reader sub-checks also remain Not verified.
