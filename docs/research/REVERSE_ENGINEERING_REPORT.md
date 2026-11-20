# Sketchd — Deep Reverse-Engineering Report

**Source:** 13m52s, 3840×2160, 30fps screen-demo video — Dev Ed's launch demo of **Sketchd** (X post, 15 Nov 2026, @developedbyed).
**Method:** 167 sampled frames + 36 full-resolution frames inspected; contact sheets for flow mapping; source post text for product claims.
**Confidence legend:** ✅ observed in video · 🧠 inference from strong UX patterns · ❓ unknown / needs confirmation.

> ⚠️ Everything about *how it was built internally* is **inference** — I had no access to source, repo, network traffic, or the creator's technical write-up (none published at time of analysis). The product is unreleased (private beta). Where I state a stack, it is a reasoned recommendation for your clone, not a verified fact about Sketchd.

---

## 0. What the product actually is (one paragraph)

Sketchd is a **browser-based AI tutor that turns any question into a self-contained, narrated, interactive "lesson" in ~20 seconds for ~$0.05**. Instead of a chat window full of text, you get a two-pane studio: a **conversational narration** on the left and a **living visual on the right** — an interactive diagram, simulation, or slideshow that updates as the tutor talks. You can talk back mid-lesson ("can you add drums to this?"), and the tutor **modifies the visual live** and continues the explanation. It also has structured **courses** (maths, science, code, music) with a visual progress tree, saved lesson history, web image search with citations, voice narration, and generated practice quizzes.

---

## 1. Observed screens & features (with evidence)

All frames referenced below are in [`evidence/`](./evidence/) (numbered screenshots).

### 1.1 Home / prompt screen — `01-home.png`
- Global top bar: **Progress** link (left), **?** help, **search** with `⌘ K`, **moon** (theme), **avatar** with green presence ring (right).
- Centered **hand-drawn ink illustration** (figure at a window/wheel) and a large **serif** headline: *"What would you like to learn today?"*
- Gradient-bordered prompt box: *"Ask anything — a question, a curiosity, a place you got stuck"*, with **paperclip** (upload), **microphone** (voice input), **↑ send**.
- Under the box: green dot + **"Sketch tutor ⇄"** — a switcher for the tutor persona/mode.
- Two chip rows: **Try** (e.g. "Tricks for dividing in your head", "How a circuit lights a bulb", "Reading notes on a staff") and **Pick up** (e.g. "Practise Romanian Greetings and Thanks", "Your courses and progress").
- Dotted-grid background on some surfaces; near-black bg, off-white text.

**Takeaway:** the entire product is entered through a single free-text box. Chips are the "empty state" UX: inspiration + resume + navigation to courses.

### 1.2 Generation / loading states — `02-generating.png`, `10-sidebar-finding-photos.png`
- Distinct, topic-themed **animated loading states** with progress text: "Setting up the studio…" (music-note illustration), "Finding photos" (radar/target illustration), "Preparing your lesson".
- Loading happens **inside the finished layout shell** (top nav, lesson title, follow-up box already visible) — i.e. the client knows the lesson type before the content arrives. 🧠 This implies a fast "plan" response followed by streaming content.

### 1.3 Lesson studio (the core) — `03-studio-setup.png`, `04-music-studio.png`, `05-keyboard-annotation.png`, `06-chord-strip.png`, `07-followup-drums.png`
Layout:
- **Header:** lesson icon (changes by subject: ♪ music, `{}` code, teal split math, 💡 electrical), `LESSON` label, lesson title, **audio on/off** toggle, **step counter with progress ring** (e.g. `8`), green **Continue →** button, `…` menu.
- **Left rail (~380px):** the narration/chat transcript. Original user prompt in small green text, then tutor prose with **markdown** (bold, bullet lists), collapsible **"Lesson notes"**, and sometimes **web Sources** with clickable citations. A **"Speaking [Pause]"** control drives TTS playback; active paragraph is highlighted grey and the transcript **auto-scrolls**.
- **Center stage:** the generated interactive visual, with a **prompt line above it** ("Drag a corner…", "Step the sort and watch the comparisons add up.").
- **Bottom:** persistent **"Ask a follow-up…"** input with the same gradient border, persona switcher, attach, mic, send. Suggested follow-up chips pop up above it ("How is B harmonic minor different?", "Can I practise finding the half steps?").
- **Interaction:** user follow-ups appear as new messages in the left transcript; the tutor answers in prose **and mutates the visual** (added a drum track; swapped a chord; placed components).

### 1.4 The generated visuals (the "engine") — the heart of the app
Observed in the demo, each one custom-built for the topic:

| Topic | Visual | Evidence |
|---|---|---|
| B minor scale | Full **DAW**: transport (bar·beat, tempo, key, time sig), Arrangement / Piano roll / Drum grid / Chord strip / Score / Mixer tabs, tracks with M/S/fader, chord-strip presets, playhead | `04`, `05`, `06`, `07` |
| Pythagorean theorem | **Geometry lab**: draggable right triangle, squares on each side with live areas (a²=9, b²=16, c²=25), angles, and a "WORKING / TRIANGLE / ANGLE SUM / RIGHT ANGLE / AREA" readout | `08`, `09` |
| Bubble sort | **Algorithm lab**: bar chart, step/prev/play/scrubber controls, comparison & swap counters, adjacent `main.py` code tab | `11` |
| Mustang cars | **Photo slideshow**: timeline of years, real web photos, captions, source credits; player controls "See whole drawing / Pause / ← → / 1× / Narration on" | `12` |
| Breadboard LED wiring | **Circuit lab**: 5 V supply, breadboard hole grid, drag-in Wire / Resistor / LED / Button parts, contextual feedback ("The loop is open…") | `13`, `14` |
| Projectile motion | **Physics lab**: trajectory plot, velocity component vectors, live "WORKING" math, velocity-vs-time graph, Range/Peak/Flight-time cards, "All controls", trials table | `17` |

**Key inference 🧠:** there is no way a single hand-built component library covers a DAW, a breadboard simulator, a geometry applet, and a sorting visualizer. The most plausible architecture is: **an LLM generates interactive app code (SVG/DOM/React-like) at generation time, which is rendered in a sandboxed client runtime**, plus a library of reusable "lab" templates it can instantiate. The creator's phrasing "I've built this **engine** … capable of highlighting the visuals that matter … pull in relevant images, draw explanations on them" supports a generative/render-engine interpretation, and the 20 s / 5¢ cost rules out slow image/video generation or long agentic loops for most lessons.

### 1.5 Courses & progress — `15-course-catalog.png`, `16-progress-tree.png`
- **Catalog:** grid groups by subject (CHEMISTRY, BIOLOGY, COMPUTER SCIENCE, MATHS, PHYSICS…). Each item: title, breadcrumb (e.g. "Geometry · Maths lab · Geometry · about 2 min"), and a **▶ Watch** button. Lesson lengths "about 1–5 min". Lesson types named in breadcrumbs: **Sketchboard**, **Maths lab**, **Physics lab**, **Code lab**, **Data lab**, **Step-through**.
- **Progress map:** an organic **branching tree** with numbered nodes (1 Number & arithmetic, 2 Measurement & shape, 3 Pre-algebra 2%, …, 8 Calculus 1), leaf colors for status (**Not started / Under way / Mastered / Review due**), "for 98 units started · 1 lesson watched", and an **ON HOLD** section ("courses focus on maths, science, code and music … progress is kept").
- In course mode the lesson header adds **Review**, **Ask a question**, **Next lesson →**.

### 1.6 Practice & notes — `18-vocabulary-page.png`, `19-match-pairs-practice.png`
- **Page / WRITING block:** serif document with vocabulary entries, examples, pronunciation notes — a static-content step type.
- **PRACTICE block:** "Match the pairs" quiz, two-column tappable cards, progress bar "1 of 1", **Check** button, hint "Tap a word, then its meaning".

### 1.7 Session history — `10-sidebar-finding-photos.png`
- Left sidebar with **TODAY** list of past lessons, each with subject icon, title, time and "2 drawings" count; active lesson shows green **"Answering…"** status.
- Footer: **"Saved to your Sketchd account"** → persistence/auth exists. Sidebar tools: import/expand, sparkle (new), search.

---

## 2. Information architecture & object model (reconstructed)

```
App
 ├─ Global shell (top bar: Progress · Help · Search ⌘K · Theme · Avatar)
 ├─ Home (single prompt + persona switcher + suggestion chips)
 ├─ Lesson workspace   ← the core
 │   ├─ Header (topic icon, title, audio toggle, step progress, Continue)
 │   ├─ Left rail: message[] + TTS controls + lesson notes + sources
 │   ├─ Stage: visual (current step's interactive artifact)
 │   ├─ Follow-up composer (text/voice/attach) + suggested chips
 │   └─ History sidebar (sessions by day, "N drawings", status)
 ├─ Courses
 │   ├─ Catalog by subject → lesson list (type, unit, duration, Watch)
 │   └─ Progress tree (nodes, status: not started/under way/mastered/review due)
 └─ Account (auth, saved lessons)
```

**Inferred data entities 🧠**

```
User { id, name, avatar, preferences }
Session/Lesson {
  id, userId, title, subject, type(lesson|page|practice),
  mode(freeform|course), originPrompt[], createdAt, status,
  steps: Step[], drawings: Drawing[], sources: Source[], progress
}
Step {
  id, index, narration(markdown), promptText, ttsAudioUrl,
  visual: VisualSpec | artifactRef, completed, noteRefs
}
VisualSpec { kind: svg|dom|chart|image-annotated|embedded-app,
             code/state, initialState, updateOps[] }
Drawing { id, kind, spec, revision }   // "2 drawings" in history
Practice { kind: match-pairs|..., items, answer, feedback }
Course { id, subject, units[], nodes[] }
ProgressEvent { lessonId, nodeId, status, reviewedAt }
```

---

## 3. Likely technical architecture (inference + build recommendation)

### 3.1 What is verifiable-ish from the video
- **Web app** (browser chrome hidden for recording; `⌘ K` command palette, web fonts, CSS gradients, SVG illustrations) — ✅
- **Server-generated content**: loading states say "Answering…", "Finding photos" → there is a backend doing LLM calls and web/image search. ✅
- **Text-to-speech** narration with play/pause and per-lesson audio. ✅
- **Persistence + accounts.** ✅
- **~20 s, ~$0.05 per lesson** — creator's claim ✅ → implies one or two cheap/fast LLM calls, not long agent runs; likely a small/flash model for planning + one for code/structured output; images from search rather than generation.

### 3.2 Reconstructed pipeline 🧠 (the "engine")

```
User prompt (+ optional attachment/voice transcript)
   │
   ├─ 1. ROUTE / PLAN (fast LLM, structured output / JSON schema)
   │     → identify subject, tone, lesson type, pick visual template(s),
   │       outline N steps, decide "visual that matters" for each step.
   │
   ├─ 2. RESEARCH (parallel, only when needed)
   │     → web search + image search for factual/visual topics;
   │       returns image URLs + page URLs → citations shown in UI.
   │
   ├─ 3. GENERATE PER STEP (structured output / code-generating LLM)
   │     → narration markdown + short on-stage prompt
   │     → visual program: SVG/DOM code + state, or annotated image ops
   │       (highlight regions, arrows, labels on searched photos)
   │     → TTS request (streamed audio) for the narration
   │
   ├─ 4. STREAM TO CLIENT (SSE or websocket)
   │     → progressive: shell → steps → narration → visual → audio
   │     → first paint in ~1 s; full interactive lesson < 20 s.
   │
   └─ 5. RENDER + INTERACT (frontend)
         → sandboxed renderer for generated visual code (iframe with
           strict CSP / Web Worker / restricted component registry)
         → step state machine; Continue advances; TTS syncs paragraph
         → follow-ups re-enter pipeline with lesson context as history,
           producing new steps and *mutations* of the existing visual.
```

**Why a restricted component registry is the sane version:** letting an LLM emit arbitrary JS is powerful but fragile/unsafe. The robust pattern is to have the model emit **declarative JSON** (e.g. `{kind:"barChart", values:[...], highlights:[0,1]}`) that maps to a library of vetted React/SVG components; optionally allow a small whitelisted expression language for dynamic labels. For the *breadboard / DAW / projectile lab* depth seen here, you likely need **hand-built lab components with a declarative state API** the model drives. This is the single most important build decision — see blueprint §4.

### 3.3 Cost model (creator's claims as design targets)
- Target **≤ $0.05 / lesson**, **≤ 20 s**:
  - Cheap "flash" model for planning/routing and for JSON/visual specs (~1–3k tokens out).
  - One stronger model only when generating complex visual code; cache/limit it.
  - Search images instead of generating them; TTS is cheap per lesson.
  - Stream so perceived latency is ~1 s even if total is 15–20 s.
- Avoid: long tool-use loops, video generation, repeated full-page rewrites for small follow-ups (send **diff ops** instead).

---

## 4. Design system (extracted specs)

| Token | Observed value (approx, from frames) |
|---|---|
| Background | `#18191B`–`#1C1D20` (near-black, slightly warm) |
| Surface / card | `#212327`–`#26282D`, subtle 1px border `#33363C` |
| Primary text | `#EAEAEA`; secondary `#9A9DA4`; muted `#6E727A` |
| Accent green | `#34D399`–`#5EE6A8` (Continue, active states, status dot) |
| Accent purple | `#A78BFA`–`#C4B5FD` (music/creative theming) |
| Yellow / teal / orange / pink | used inside the generated labs for data series & parts |
| Headings | high-contrast **serif** (Didone/Georgia-like) — home hero, Page titles |
| Body / UI | clean **sans** (Inter/Geist-like), 14–16 px |
| Gradient border | green → blue → pink → orange on prompt boxes (focus/idle state) |
| Radius | pills `999px` for chips/buttons; cards `12–16px` |
| Dotted grid | faint dot pattern on course/history backgrounds |
| Illustration language | hand-drawn, monochrome ink, sketchy line art for empty/loading states |
| Motion | animated loading rings, progress ring on step counter, streaming text, TTS highlight |

---

## 5. UX patterns worth stealing explicitly

1. **Single-box entry, chips for empty state** — zero onboarding friction.
2. **Shell-first loading** — show the final chrome instantly, stream content into it.
3. **Two-pane "tutor + board"** — narration and visual are peers; the visual is never a screenshot.
4. **Step counter + Continue** — turns a generative artifact into a paced lesson (and controls cognitive load).
5. **Conversation mutates the artifact** — "add drums", "show me on a piano", "try F#m instead" — the differentiator vs chat.
6. **Topic-synced loading illustrations** — small delight that signals the engine understood the subject.
7. **Built-in sources** for factual topics (trust + verifiability).
8. **Course tree as a visual progress map** rather than a list — makes progress emotional.
9. **Persist everything** with session history and "N drawings" counts.

---

## 6. What I could NOT determine (and how to find out)

| Unknown | How to confirm |
|---|---|
| Exact LLM provider(s) & models | Network tab / API logs, or creator's future write-up |
| Whether visuals are generated code vs. template library + state | Inspect generated DOM in devtools; look for iframe/sandbox; test an out-of-distribution topic |
| Image search vendor, TTS vendor | Network requests during "Finding photos" / narration |
| Streaming protocol (SSE vs WS) | Network tab during generation |
| Framework (Next.js/Vite/React) | JS bundle names, `__NEXT_DATA__`, build artifacts |
| Auth/DB vendor | Cookies, network domains |
| Whether "drawings" are semantic objects or raw SVG | Count/inspect a saved lesson's payload |

**Note on the video itself:** the demo is a single continuous screen recording with a presenter webcam overlay; there are no cuts, so the whole feature map above comes from UI observation rather than editing. No source code, terminals, or devtools appear in the video.

---

## 7. Bottom line

Sketchd's moat is **not** "chat with an LLM" — it is the **lesson rendering engine**: a system that turns a question into a paced, narrated, *interactive* artifact, then lets conversation mutate that artifact in place, all fast and cheap enough to feel like magic. For your own education app, copy this **product shape** and **pipeline shape**, but own a narrow vertical (e.g. only physics labs, only math, only K-12 science) so you can build the high-quality lab components that make the experience real. See [`BUILD_BLUEPRINT.md`](./BUILD_BLUEPRINT.md) for the concrete plan.
