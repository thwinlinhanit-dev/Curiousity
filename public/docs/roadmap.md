# Curiosity — open-source roadmap and idea book

_A free, permanently free, fully open project: every idea here assumes no paywall, no ads, no tracking and no account. Served at `/docs/roadmap.md`, rendered in the app at `?roadmap`._

---

## 1. The charter (and the one hard problem)

What "free and open source" has to mean in practice, in writing, so nobody has to guess later:

- **Software:** source available, permissively licensed, reproducible build from a clean clone, no phone-home.
- **Content:** redistributable and remixable by anyone who receives it.
- **Cost:** zero to use, zero to host yourself, zero to fork.
- **Data:** the learner's progress never leaves their device unless they export it.
- **Governance:** decisions in public, roadmap in the repo, contributors credited.

The hard problem is the second line. The app is MIT-shaped software wrapped around **CC BY-NC 4.0** corpus content (and ODbL 1.0 plus CC BY-SA 4.0 Marble data inside an isolated folder). That makes the *code* open source but the *content* non-commercial — perfectly legal to run and share for free, but not "open" in the OSI/Open Definition sense, and it blocks anyone from building a commercial product on it or reusing lessons in a differently-licensed course.

This must be stated plainly on an About page, because the fastest way to lose community trust is to call something "fully open" when a third of it is NC.

Three honest ways forward, and I recommend doing all three in this order:

| Path | What it means | Cost |
|---|---|---|
| A. Be free, say so precisely | Keep the NC corpus, ship it free forever, publish a LICENSING.md that separates code / corpus / Marble / vendor kits | Write one file |
| B. Grow an open corpus beside it | Add a second tier of lessons under CC BY 4.0 or CC0 from PD sources, clearly badged "fully remixable" | Content work |
| C. Ask upstream | A one-paragraph email to the corpus author asking whether a CC BY 4.0 subset (or a relicence of their own original work) is possible | Almost free, high upside |

Until B or C lands, the project's honest description is: **free and open-source software, with a non-commercial open-licensed corpus**. That is a fine thing to be. It is not the same thing as "open content", and the README should not blur it.

---

## 2. Principles that decide every argument

- **Free forever, structurally.** No feature may require a paid service. If something needs a server, it needs a self-hostable, free-as-in-beer way to do it, or it does not ship.
- **No accounts.** Progress lives in the browser; the save code is the account.
- **Offline is a feature, not a fallback.** A school phone with no data is the target environment.
- **The learner owns the data.** Export at any time in a documented JSON format.
- **No surveillance.** No third-party scripts, no cookies, no fingerprinting. If numbers are ever needed, they are aggregate, opt-in and self-hostable.
- **Small is a feature.** Every new dependency is a maintenance debt on an unpaid team.
- **Content is the product.** Rework the interface, never the lessons' substance without review.

---

## 3. Learning engine ideas

- **Misconception-aware feedback (highest value).** Marble payloads already carry `wrongAnswers` with `wrong`, `revealedBy` and `fix`. When a submitted answer matches an authored wrong answer, reply with that diagnosis instead of "Not quite." Extend the matcher to all lessons.
- **Today's 10 minutes.** One screen that composes 3 due reviews plus 2 new topics along the prerequisite chain, with a timer and a "done for today" state. The engine's `next()` and `reviewSet()` already expose everything needed.
- **A mastery model a learner can read.** Replace `correct 0/3 · streak 0/2 · reviews at 1·3·7·16·35·75·150 d` with three words and one popover: what mastery means, how it fades, and what to do next.
- **Hint ladders, not a single hint.** Three levels: nudge, first step, full working. Track which level was needed; that is the best signal you will ever have about where a lesson is too fast.
- **Worked-example fading.** Show the full worked example, then a faded one with the last step missing, then practice with no example. This is well-established in the learning-science literature and cheap to implement from existing `steps` arrays.
- **Error notebook.** Every wrong answer gets filed locally with the question, the learner's answer and the correct working; a screen to revisit them weekly. No server, real value.
- **Explain it back.** A free-text box asking "explain this in your own words", stored locally, with the authored answer revealed afterwards. No grading, just retrieval.
- **Confidence check.** One tap before checking: sure / not sure. It calibrates and it makes the review schedule smarter (high confidence plus wrong is the most urgent card).
- **Interleaved practice.** A "mixed" practice mode that pulls one question from each of the last five topics.
- **Prerequisites that unblock.** If a learner keeps failing a lesson, offer the specific earlier lesson that fixes it (the graph already stores `prereqs`), rather than "try again".
- **Printable worksheet generator.** Take N topics, emit a PDF-ready sheet with space for working and an answer key page. Teachers will use this before they use the website.
- **Study log.** A local timeline: what was practised, what was missed, what is next. Printable for a portfolio, which is an actual homeschool requirement in many places.

---

## 4. Content ideas and tooling

- **Generator coverage report.** Walk every topic and call `makeProblem`; list the ones that throw. A lesson without practice is a dead end, and there is no way to know the number today.
- **One canonical corpus.** Topic bundles currently exist flat and course-scoped and drift. Pick one shape, delete the duplicates, document the schema.
- **Content contract in CI.** Every bundle: id, title, at least one non-empty block, balanced `$…$`, no `{"t":"try"}` stubs, no unrendered `\role{…}`, sources non-empty.
- **Link checker.** 500+ lesson files still link to upstream absolute paths. Rewrite at ingest, fail CI on regressions.
- **Open content schema.** Publish `schema/lesson.schema.json` plus a tiny validator CLI so anyone can author a lesson, run `npx curiousity-validate lesson.json`, and send a pull request. This is what makes "open" real for contributors.
- **Figure alt text.** Every `viz` block needs a written description for screen readers and for anyone whose device cannot render SVG. Make it a required field with a CI check.
- **Reading level.** Flag lessons above a grade band using a simple readability score, so writers know when an explanation has drifted into jargon.
- **Glossary and cross-lesson terms.** A small dictionary generated from the corpus, linked from any word that appears in it.
- **Audio pass.** The narration bar exists; extend it to whole lessons with a downloadable MP3 per lesson generated at build time, so offline listening works without a screen.
- **Translation workflow.** JSON per locale per lesson, a completeness report per subject, a review checklist, and a visible "translated by" credit. Hide a locale that is under 80% complete instead of shipping machine damage.
- **Open-corpus tier.** Seed twenty lessons under CC BY 4.0 from public-domain and CC BY sources (OpenStax, PhET, NASA, USGS, Project Gutenberg, LibriVox, Wikijunior) so the remixable tier exists and grows. Verify every licence at the source before importing — do not trust a summary.
- **Content style guide.** Voice, sentence length, when to use a figure, how to write a "Common mistake", how to name a topic. The corpus is better when it sounds like one author.

---

## 5. Offline, performance and reach

- **Service worker plus IndexedDB.** Cache the shell and the current course pack; add an install prompt; show a "works offline" badge. The pack format already exists, which makes this the cheapest big win available.
- **Whole-subject download.** "Save Physics for offline: 12 MB" as one tap.
- **Split `graph.json` per subject.** Two megabytes before search works is the current first-load cost. One file per ladder, preload the active one.
- **Search across lesson text.** Build a compact inverted index at build time and load it in a worker; today search only matches titles.
- **Print stylesheet.** Readable, ink-friendly lesson and worksheet output. Cheap, and it signals "school tool" rather than "web toy".
- **Static-first hosting.** GitHub Pages, Cloudflare Pages and Netlify free tiers, all documented in the README so a fork is one click. Add a Zenodo DOI per release so the exact build is citable.
- **Embeds.** A single-figure iframe widget so teachers can drop one interactive into their own page, with a link back.
- **Permalinks and metadata.** Stable `/lesson/<ladder>/<course>/<slug>` URLs, a sitemap, Open Graph cards, and an RSS feed of new lessons.

---

## 6. Accessibility (treat as a hard gate, not a nice-to-have)

- **Target: WCAG 2.2 AA.** Publish the conformance statement in the README and keep it true.
- **No text below 12px, no target below 44px, contrast 4.5:1 for text and 3:1 for UI.** These are testable, so test them.
- **axe in CI.** `axe-core` is already vendored; run it in jsdom over the main routes and fail on serious and critical findings.
- **Keyboard-only path.** Home → subject → lesson → practice → review must be completable without a pointer, with a visible focus ring throughout and focus returned when a sheet closes.
- **Screen-reader descriptions for every visual.** Figures, diagrams, the periodic table and the music staves all need text alternatives.
- **Preferences: high contrast, larger text, reduced motion, dyslexia-friendly spacing.** Store them locally like the theme.
- **200% zoom and 320px width with no horizontal scroll.** Both are currently broken on the periodic table and one lab.
- **Caption and transcript for anything with audio.**

---

## 7. Community and governance (what makes a free project survive)

- **Files that cost nothing and change everything.** `LICENSING.md` (code vs corpus vs Marble vs vendor), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`, `GOVERNANCE.md`, `ROADMAP.md`, issue and pull-request templates.
- **Good first issues that are genuinely good.** "Fix these 12 lesson links", "translate this one lesson", "add alt text to these five figures" — bounded, verifiable, credited.
- **A ten-minute contributor path.** `docs/add-a-lesson.md` plus the validator CLI: clone, add JSON, validate, open a pull request.
- **An architecture map.** One page explaining packs, the progress engine, vendor kits and where content ends and code begins. Most drive-by contributors bounce because they cannot find the seam.
- **Decision records.** Short ADRs for choices like "no backend", "NC content stays isolated", "no AI generation in the corpus". Future you will not remember why.
- **Content review rubric.** Factual accuracy, one worked example minimum, a stated common mistake, sources, and a reading level. Review is where an OER project lives or dies.
- **Credit everywhere.** Contributors in the README, translators in the lesson, reviewers in the changelog.
- **Maintainer rotation and a bus factor plan.** Write down who can cut a release, and how to hand it over.

---

## 8. Engineering quality without a budget

- **Testing pyramid that fits a static app.** Vitest for units (21 today), content contracts, figure contracts, a11y via axe, and Playwright screenshots on CI for visual regressions on four viewports.
- **Bundle budget in CI.** Fail the build if initial JS passes a threshold; a free project cannot afford to rot silently.
- **Error boundary with local diagnostics.** "Something broke · Copy details" instead of a white screen. No telemetry, just a report the user chooses to send.
- **Zod-validated content at build time.** Catch a malformed bundle before it ships, with a file and line in the error.
- **Dependency hygiene.** Dependabot, pinned versions, `npm audit` in CI, and a rule that a new runtime dependency needs a written justification in the pull request.
- **Content Security Policy.** No third-party origins, `script-src 'self'`, and subresource integrity on the vendored kits.
- **Reproducible releases.** Tag, build, archive, attach to the release, publish a DOI.

---

## 9. Growing a free project without spending money

- **Be findable where teachers look.** List in OER directories, Wikiversity, awesome-education lists and GitHub topics (`education`, `open-education`, `oer`, `homeschool`, `spaced-repetition`).
- **Lead with the offline claim.** "A full K–12 curriculum that works with the wifi off, free, no account" is a sentence nobody else can say.
- **Write the one post that travels.** A build-in-public post about shipping 5,105 lessons as static files with a 2,000-file host limit is a genuinely interesting engineering story.
- **Ask for translation before asking for money.** Translators are the most generous contributors in open education and they compound.
- **A "free forever" pledge in the README.** It builds trust and it binds future maintainers.
- **Never add analytics that identify a person.** If numbers are needed, self-host an aggregate counter, link the source and make it optional.
- **Sustainability without revenue.** GitHub Sponsors is optional and never gatekept; fiscal hosting via Open Source Collective if money ever appears; otherwise the project's currency is contributors and DOI credit.

---

## 10. Milestones

**v0.2 — honest and usable (2 weeks).** LICENSING.md and About page; design tokens v2 with the 12px floor; home rebuilt as Continue / Subjects / Explore; internal ids gone; lesson reading column; content contract and link checker green in CI.

**v0.3 — works offline (3 weeks).** Service worker plus IndexedDB packs; install prompt; graph split; whole-subject download; print stylesheet; misconception feedback on the 95 matched lessons.

**v0.4 — a community can contribute (3 weeks).** Published lesson schema and validator CLI; CONTRIBUTING, GOVERNANCE, ADRs; ten-minute add-a-lesson path; translation completeness gate; good-first-issue batch; alt text for all figures.

**v1.0 — citable release (4 weeks).** WCAG 2.2 AA statement with axe in CI; visual regression suite; PDF worksheets; SCORM/xAPI-light export of progress and a course export in a documented format; Zenodo DOI; OER directory listings; open-corpus tier of at least twenty CC BY lessons.

**Beyond 1.0.** Additional open-corpus subjects, per-lesson audio, teacher classroom packs from save codes, an LTI-lite embed for LMS pages, and a second locale reviewed end to end.

---

## 11. Measures of success that need no tracking

Stars and forks, unique contributors per quarter, translations completed, issues closed versus opened, release downloads and DOI citations, and the only metric that matters — someone telling you their kid finished a subject on a bus.

---

## 12. What this project should never do

- Ads, sponsorships inside lessons, or a paid tier of any content that exists today.
- Accounts, cloud sync that requires a server you have to pay for, or progress that cannot be exported.
- Third-party analytics, heatmaps, session recording or "essential" cookies.
- Unreviewed machine translation presented as a finished language.
- Unreviewed AI-written lessons in the corpus; generated practice inside the existing generators is fine, generated prose is not.
- Growing to fifty subjects while twenty-two have gaps.
- Calling the project "fully open" while the corpus stays non-commercial.

---

## 13. The first weekend

1. Write `LICENSING.md` and an About screen that states the three licences honestly.
2. Add the content contract test and the link checker, and fix what they report.
3. Ship the 12px floor and the tokens rename, so every later screen starts from the same type scale.
4. Build the generator coverage report; publish the number in the README.
5. Wire misconception feedback for the 95 lessons that already have the data.

Each of those is small, visible and improves the project for everyone who comes after — which is the whole point of building this in the open.
