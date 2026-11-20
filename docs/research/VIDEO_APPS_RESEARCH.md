# Video App Research Report — 7 AI-built interactive learning apps

**Date:** 2026-11-19  
**Source:** 7 MP4 screen recordings in `C:\Users\thwin\Downloads\`  
**Method:** OpenCV frame extraction (storyboards + full-resolution key frames), bundle teardown of the live deployments, web research on creators/models, video stream inspection.  
**Evidence files:** `video-research/storyboards/`, `video-research/frames/`, `video-research/live/`, scripts `extract.py`, `keyframes.py`, `analyze_bundles.py`.

---

## 1. Executive summary

The seven videos are **not seven unrelated apps** — they are demos of three distinct families of AI-generated interactive education apps:

| Family | Creator / origin | Apps in the videos | Build tool stated |
|--------|------------------|--------------------|-------------------|
| **A. Step-by-step 3D skill courses** | Dilum Sanjaya (`x.com/DilumSanjaya`, `dilum.dev`) | RoverKit, Backcountry 101, System Design ("Designed to Scale") | RoverKit: **Claude Fable 5.2** (earlier post Opus 5.5); Backcountry 101: **Claude Opus 5.5**; System Design: **Grok Build 0.1** (per Dropday listing) |
| **B. Sketch-style physics explainers** | `@thebuggeddev`, hosted on `wasmer.app` | How an Electric Motor Works, How Hydraulics Work | **Claude Opus 5.5** (tweet: "visualized in 3D by Claude Opus 5.5") |
| **C. Anthropic "How It Works" anatomy sheets** | Anthropic, using the `anatomy` skill (`wheresryan22/anatomy`) | Arbor 1 (bench lathe), Pulse 1 (solenoid actuator) | Claude generated **all geometry as code** — the page says "None of it is a recording. Claude wrote every part as code, the way you would model it in Blender" |

**The one-sentence verdict:** every video shows the same product idea — *a single-screen interactive explainer where a manipulable model, live numbers, and a short narrative step timeline are bound to one model* — executed with three different visual languages (polished product UI, hand-drawn sketch, and technical anatomy sheet) and two rendering strategies (three.js/WebGL 3D vs. SVG isometric).

### Naming / caption caveat
Two download filenames are misleading:
- **"Most devices fail certification over one metal part nobody saw near the antenna…"** — the actual video is the **Arbor 1 lathe** anatomy explainer; there is no antenna/EMC content.
- **"Si siempre quisiste entender como funciona la corriente…"** — the app is the **Pulse 1 solenoid** explainer; the title loosely describes the topic (electric current), not the app's name. The Chinese title for the interview video correctly describes "Designed to Scale".

---

## 2. Video production facts (what the recordings themselves are)

| Video | Duration | Resolution | FPS | Audio stream | Nature |
|-------|----------|-----------|-----|--------------|--------|
| Motor | 114.1 s | 2826×1774 | 57.8 | **none** | silent screen capture |
| Robot | 105.9 s | 3456×1990 | 57.2 | **none** | silent screen capture |
| Survival | 96.8 s | 3456×1990 | 57.4 | **none** | silent screen capture |
| Hydraulics | 50.9 s | 2826×1752 | 57.6 | **none** | silent screen capture |
| Arbor 1 (certification) | 24.2 s | 2160×3036 | 60.0 | present (not transcribed) | portrait 9:16 screen capture |
| Pulse 1 (current) | 24.1 s | 2160×3044 | 60.0 | present (not transcribed) | portrait 9:16 screen capture |
| System Design (interview) | 43.6 s | 2760×1458 | 54.1 | present (not transcribed) | screen capture |

- All are high-resolution, high-frame-rate **screen recordings with a moving cursor**, not edited films. No subtitles, no lower thirds, no digital presenter. The "content" is the app UI itself.
- Three videos have an audio track; no speech-to-text model was available in this environment, so their audio is **untranscribed**. Given the demo format, it is most likely background music, but this is **unconfirmed**.
- The `rea-video` decomposition CLI was not installed; ffmpeg was obtained via `imageio-ffmpeg`. All visual conclusions below come from my own frame-by-frame inspection.

---

## 3. Family A — Dilum Sanjaya's interactive courses

### 3.1 RoverKit (`roverkit.vercel.app`)
**What it is:** "Build and simulate a 3D robot car with Arduino or ESP32." A 10-step assembly course ending in a driveable simulator.

**UI architecture (frame `frames/robot_000s.png`, `robot_012s.png`, `robot_032s.png`, `robot_070s.png`, `robot_095s.png`):**
- Header: ROVERKIT brand, designer credit, board selector **Arduino UNO / ESP32**, language selector, settings.
- **Left "WORKBENCH" pane:** a large 3D rover on a green cutting-mat grid with zoom (+/−) and layer controls; a "PROGRAM FLOW" mini-diagram that expands.
- **Right instruction rail:** step number/category ("09 PROGRAM — STEP 9 OF 10 UPLOAD THE CODE"), prose, a **"DO THIS" numbered checklist with completion counter (0/4)**, a dark code editor with **sketch tabs (1 · Wiring test, 2 · Obstacle avoider)** and Copy/Download buttons, Back / step / Next.
- **Bottom step strip:** thumbnail cards for each step (05 Controller, 06 Sensor, 07 Power, 08 Wiring, 09 Code, …) — direct navigation.
- Later steps show a **flowchart builder** (diamond/box nodes) and an **arena** where the rover drives around cardboard walls, with live telemetry and obstacle-avoidance logic.
- Troubleshooting content is genuinely detailed ("A side turns backwards", "The distance is always 0.0 cm", "The UNO restarts when the motors start", each with a fix).

**Tech (bundle `live/roverkit.js`, 298 KB):** React + Vite, SVG, Web Audio; **localStorage** for progress; **WebSocket client** — strings include `URL must start with ws:// or wss://` and `Browsers block ws:// from an https:// page — run RoverKit on your computer (npm run dev) to reach the car`. Only one `BufferGeometry` hit, so the rover is most likely **pre-rendered/layered 3D imagery with CSS transforms**, not a real-time three.js scene. Bundle contains full parts lists and i18n labels including Chinese (Simplified/Traditional).

**Pedagogy:** learning by *assembling* — each step has a physical action, a checkable task list, real code, and a simulator that validates the build. Failure states are taught explicitly.

### 3.2 Backcountry 101 (`backcountry-101.vercel.app`)
**What it is:** "Survival skills, step by step, in 3D" — campfire, first aid, night-sky navigation, rope work, map/compass, shelter, tracking, weather, edible plants.

**UI architecture (`frames/survival_000s.png`, `010s`, `022s`, `045s`, `058s`, `075s`, `088s`):**
- Topographic-map background, dark green vertical icon rail (home, book, compass, kit, leaf…).
- **Left/main:** a beautifully illustrated isometric scene (campfire ring with logs, tinder, matchbox, pot, knife; a bleeding arm with bandage; star sky with constellations; a taut-line hitch on a post; a map and compass; a lean-to shelter; deer tracks).
- **Right rail:** tabs **INSTRUCTIONS / EXPLANATION / TIPS**, current step title ("LIGHT THE FIRE") and a **numbered checklist with green check marks and an active orange row**; module progress "FIRE BASICS 3/6".
- **Bottom:** "LESSON: MAKING FIRE" with 6 illustrated step cards (Gather materials ✓, Prepare fire ring ✓, Build the fire ✓, **Light it**, Keep it going, Put it out) and prev/next.
- Top controls: reset, compass, redo, layers, skip, pause, **1× speed** — playback controls for an animated demonstration.
- A **Lessons** modal shows a card grid of all modules (Making Fire, Stop the Bleeding, Finding Direction, Knots, Navigation, Shelter, Foraging, Tracking…).
- A frame reveals a Vite dev URL `192.168.1.105:5173/?lesson=fire#` — confirms local React/Vite development.
- In a public reply the maker confirmed **all visual assets were also made with Opus 5.5**, and said getting it performant/responsive across devices takes significant time and tokens.

**Pedagogy:** same "one scene, one step, one checklist" grammar as RoverKit, but for procedural knowledge; multiple representations (diagram, explanation, tips) for the same step.

### 3.3 System Design / "Designed to Scale" (`designed-to-scale.vercel.app`)
**What it is:** "An interactive system design course with animated diagrams" — 40 lessons in 9 modules (Foundations, Scaling, Data & Storage, Communication, Reliability, Architecture, Security, Shipping, Whole Systems), with full-system designs (URL shortener, news feed, chat).

**UI architecture (`frames/interview_000s.png`, `012s`, `018s`, `030s`):**
- Top nav: **Learn / Practice / Design Lab / Cheatsheets**, search (⌘K), EN, dark mode, maker credit.
- **Left:** collapsible syllabus tree with per-section progress (e.g. `03. Data & Storage 0/11`).
- **Center:** lesson header "Replication", badges (12 min, Beginner, 11 steps), live metric cards (**DATABASE CPU 32%, READ CAPACITY 2×, REPLICA LAG 2 s, WRITES ok**), Replay/Pause, a large **isometric animated diagram** (app server → leader/follower DBs with coloured packets moving along edges, data labels like "name: Alice Kim"), a legend, and a bottom "IN THIS LESSON" 11-step timeline (One DB → Copies → Read replicas → Lag → **Read your writes** → Leader dies → Failover → Reports → Not a backup → Styles → Recap).
- **Right:** step card "STEP 5 / 11 — TECHNIQUE — Read your own writes", prose, a green **GOOD TO KNOW** callout, Back/Next, keyboard hints (← → step, R replay, Space pause), and a "YOU'LL LEARN" checklist with ticked/unticked outcomes.
- **Tech (bundle `live/systemdesign.js`, 790 KB, 1,308 readable UI strings):** React + Vite + SVG + localStorage; no three.js. The diagrams are **code-drawn SVG with scripted animation**, with the lesson text bundled as data. Web research confirms Practice/Design Lab/Cheatsheets are "coming soon" in the original app, and progress is per-browser localStorage.

**Pedagogy:** concept → animation → metric consequence → reflective checklist. This is the most "textbook-like" of the seven; it teaches by *watching a system behave* and reading the numbers that change.

---

## 4. Family B — Physics Interactive (wasmer.app), by @thebuggeddev

### 4.1 How an Electric Motor Works (`electric-motor.wasmer.app`)
**UI architecture (`frames/motor_000s.png`, `025s`, `044s`, `070s`, `105s`):**
- Cream paper background, hand-written display font with **yellow highlighter strokes**, orange/blue/red accents.
- **Top:** "Show:" toggles — Field lines, Current flow, Force arrows, Part labels (independently switchable representation layers).
- **Left:** title, subtitle, tabs **Motor / Parts / Principle**, and a "Live diagrams" card: a coil-in-field vector sketch with legend (current coming out / going in, push on each side, magnetic field) and a **live graph "Turning push at each angle"** with a moving marker and "split ring: never backwards" note.
- **Center:** a hand-drawn 3D motor (red/blue horseshoe magnet, coil, split ring, brushes, battery) with rotation arrow; playback controls (spin other way, pause, reset); readouts **Speed (turns/s), Current in coil (other way), Turning push (small)**; a "Hold the coil" toggle and coil-angle slider (e.g. 214°).
- **Right:** "The Core Idea" card with a Fleming's-left-hand-rule sketch (F↑, B→, I) and a "Controls" card: switches **Current / Flip magnets / Flip battery**, sliders **Battery voltage 1.5 V / Magnet strength medium / Coil turns 5 / Turn speed 70%**, and a **Ring on the axle: Split ring | Slip rings** segmented choice with an explanation line.
- The live page text notes: *"The motor turns in 3D in a recent Chrome, Edge or Safari. The controls still work here."*

**Tech (`live/motor.js`, 1.45 MB):** **React + three.js + Vite**. Signatures: `WebGLRenderer`, `BufferGeometry`, `MeshStandardMaterial`, `THREE.` ×136. SVG is used for the 2D diagrams. Google Fonts: **Caveat, Kalam, Patrick Hand** (from the hydraulics HTML) produce the sketch typography. The "cross-hatched" hand-drawn look of the 3D model is a styled/shaded three.js material, not a flat image.

**Pedagogy:** manipulation-first — the learner changes physical parameters and *sees and measures* the effect; multiple synchronized representations (3D model, vector diagram, graph, numeric readout) all derive from one simulation state.

### 4.2 How Hydraulics Work (`hydraulics.wasmer.app`)
**UI architecture (`frames/hydraulics_000s.png`, `010s`, `020s`, `030s`, `045s`):**
- Same design language as the motor app: grid-paper background, handwriting font, yellow highlighter, "Small force in / Big force out" speech bubble.
- **Center:** a hand-drawn yellow excavator with pump, hoses, cylinder and bucket; a blue handle you can drag; on-scene force arrows appear (**F₁ 250 N, F₂ 865 N, W 350 N**).
- **Top toggles:** Labels, Auto pump, View, dark theme. **Tabs:** Principle / Pressure / Force / Real Use.
- **Right clipboard card:** "The Idea" (Pascal's principle) with U-tube diagram and formula `F₂ = F₁ × A₂ / A₁ = 100 N × 25/5 = 500 N`; in the Force tab it becomes "Force Trade" with bar comparisons, `d₂ = d₁ × A₁/A₂`, and computed bullets (area ratio ×3.5, 1 cm of pump travel → 0.289 cm of cylinder, ~5 strokes for a full lift).
- **Bottom control bar:** sliders for **Input Piston Area A₁** (5→13 cm²), **Output Piston Area A₂** (25→45 cm²), **Input Force F₁** (100→250 N) and a live **Output Force F₂** badge (500 → 865 N, "5× / 3.5× your input"), plus a "Rocks in the bucket (W)" slider.

**Tech (`live/hydraulics.js`, 524 KB):** React + three.js (`WebGLRenderer` ×37, `MeshStandardMaterial` ×14) + Vite; same font stack. All displayed numbers are recomputed from the slider state.

**Pedagogy:** explicit **qualitative-to-quantitative bridge** — the cartoon promise ("small force in, big force out") is immediately backed by a formula panel and live arithmetic, and the "catch" (distance trade-off) is taught in a separate tab.

---

## 5. Family C — Anthropic "How It Works" anatomy sheets

### 5.1 Arbor 1 — bench engine lathe (`AN-026`)
**Frame `frames/certification_000s.png`, `006s`, `012s`, `018s`:** a portrait A4-format technical sheet.
- Header: Blender-icon × Anthropic-mark, `AN-026 ANTHROPIC · HOW IT WORKS`, `BENCH ENGINE LATHE, 250 × 550`, `LIVE 3D · 25 S LOOP`.
- Big title **Arbor 1**, material legend (enamel, steel, brass, carbide, chip, signal).
- Explanatory paragraph ends with the decisive line: *"None of it is a recording. Claude wrote every part as code, the way you would model it in Blender, after the community figure, and each number follows the cutting law of its step."*
- A **photoreal 3D lathe** with 8 numbered callouts; camera pushes in to the chuck, gauges, leadscrew, micrometer.
- **Live telemetry strip:** SPINDLE SPEED, CUTTING SPEED, FEED, CUTTING FORCE, POWER AT THE TOOL, DIAMETER (e.g. 0 min⁻¹ … 30.5 mm).
- Two instrument cards: "THE CUT, FROM THE SIDE" (section/ortho toggle, hatched cut faces) and a SPEED SELECTOR dial with numbered positions; an 8-item anatomy list (Chuck and jaws, Headstock, Gearbox and lead screw, Tool and cross slide, Apron and half-nut, Micrometer, Tailstock and centre, Stand/tray/coolant).
- Footer: `ANATOMY · A4 | CHUCK, SPEED, FEED, CUT, RETURN, MEASURE | AT REST · Ø 30.5 mm · 4 passes a bar`.

### 5.2 Pulse 1 — solenoid actuator (`AN-024`)
**Frame `frames/current_000s.png`, `006s`, `012s`, `016s`:** identical sheet template.
- `SOLENOID ACTUATOR ON A TEST BENCH`, `LIVE 3D · 25 S LOOP`; text: *"None of it is a recording. Claude wrote every part as code, the way you would model it in Blender, and solves the coil's equations to move it."*
- 3D test bench with bench supply (12.0 V), driver board, flyback diode, 600-turn coil, plunger and air gap, spring and stop, link and output wheel, sensor/scope — 8 numbered parts.
- Telemetry: COIL CURRENT, PLUNGER TRAVEL, PULL ON THE PLUNGER, COIL INDUCTANCE 32 mH, VOLTAGE AT THE SWITCH 12.0 V.
- **DRIVE CIRCUIT** schematic (L = 32.1 mH, N = 600, R = 12 Ω, MOSFET, diode) and a **REAL TIME oscilloscope** with "Coil current / Plunger travel" traces; the caption explains the back-EMF dip and diode decay — the chart is driven by the same coil ODE that moves the 3D plunger.
- Footer: `ANATOMY | CLOSE THE SWITCH, WATCH THE CURRENT, HEAR THE CLICK`.

**How they were built:** web research ties these to the **`anatomy` skill for Claude Code** (`skills.wheresryan.sh/anatomy`, repo `wheresryan22/anatomy`). The repo contains commits/PRs titled e.g. *"turn-build: give lathe ribs a radius so they are drawn"* and *"lathe: keep cut from repeating a point at a vertex boundary"*, authored with `Claude Opus 5.5`, and names examples like `arcade-cabinet.html`, `raptor-engine.html`, `turning-stress-light.html`. The skill's documented contract matches the videos exactly: *"name an idea in one line, Claude draws the machine that does it… every number it shows comes from the same model that moves them"*, with **SVG**, **WebGL** and **3D** tiers. The video frames' "community figure" phrasing and the `T.lathe` / `T.round` primitives in those PRs confirm the lathe was generated from that geometry runtime.

---

## 6. Cross-cutting design patterns (the reusable "interactive explainer" template)

All seven apps converge on the same information architecture:

1. **One hero model** in the centre, manipulable (drag a handle, flip a switch, move a step).
2. **A control surface** of sliders/toggles whose values feed a single model.
3. **Live readouts** — numbers, gauges, charts — recomputed from that model, never hard-coded.
4. **A short narrative layer** — checklist / step timeline / "The Core Idea" card — that explains what the manipulation means.
5. **Multiple synchronized representations** of the same idea: 3D object + 2D diagram + formula + graph + prose.
6. **Progress/state persistence** in `localStorage` (RoverKit, System Design, Hydraulics bundle).
7. **Direct step navigation** and playback controls (replay, pause, speed, scrub) — the lesson behaves like a video you can interrogate.
8. **i18n and light/dark themes** in the more polished apps (RoverKit: EN + Chinese; System Design: EN + theme toggle).
9. **Deliberate visual identity per family**: sketch paper (Caveat/Kalam/Patrick Hand + yellow highlighter) for physics; calm cream/green product UI for Dilum's courses; monochrome A4 technical sheet for Anthropic anatomy.

### Rendering strategies compared
| Strategy | Used by | Pros | Cost |
|----------|---------|------|------|
| three.js/WebGL procedural 3D | Motor, Hydraulics, Anthropic sheets (code-generated geometry) | real rotation, lighting, zoom, believable objects | heavy bundles (0.5–1.45 MB), WebGL dependency, long generation time |
| SVG isometric + scripted animation | System Design, Anatomy's default tier | crisp, accessible, tiny, themeable, works everywhere | faked depth; limited camera freedom |
| Pre-rendered/layered 3D imagery + CSS | RoverKit, Backcountry 101 (likely) | beautiful art with small runtime cost | no true camera; many assets to generate |
| Real hardware bridge (WebSocket) | RoverKit | connects learning to a physical robot | needs local dev server; HTTPS blocks `ws://` |

---

## 7. What this means for our project

Our app (`build/physics-app`) already shares the template: a corpus-backed lesson rail, interactive figures, practice, progress. The videos suggest concrete upgrades:

| Observed in videos | Opportunity for our app |
|--------------------|-------------------------|
| Multiple synced representations (3D + vector diagram + graph + readout) from one state | Our figure store already centralises state; add a "live diagrams" card beside each figure (force vectors + angle graph) for motion/field/circuit topics. |
| "Show:" layer toggles (field lines / current flow / force arrows / part labels) | Our `LayerToggles` exists for motion only; generalise the same pattern to circuit, field and energy figures. |
| A single "Core Idea" card with a small hand-rule sketch | We have `trouble`/`short`; add a concise one-line rule + glyph card as the first thing on a lesson. |
| Checklists with completion counters and explicit failure-state troubleshooting | Our practice panel gives right/wrong; add a "DO THIS" checklist and named failure modes ("distance always 0.0 cm" style) for lab topics. |
| Step timeline with replay/pause/speed and keyboard hints | Our step navigation and narration bar cover this; add replay/speed to the figure pacing for consistency. |
| Code-generated 3D anatomy (Anthropic) | The **`anatomy` skill** available in this environment generates exactly these live isometric/SVG/WebGL/3D figures from a one-line prompt — use it for new hero figures instead of hand-authoring SVG. |
| Design polish: highlighter titles, consistent 3-col grid, bottom step strip | Our dense hub could adopt a two-column workbench + step-strip layout for lesson pages, keeping the corpus's non-commercial attribution. |

---

## 8. Prioritized upgrade roadmap for `build/physics-app`

**Core insight:** the videos' advantage is *not* physics capability — your app already owns the engines (`tex.js`, `check.js`, `gen.js`, `engine.js`, CAS, 130 generators, 79 native viz kits, shared `trb-math-v1` progress). What they do better is wrap the model in a consistent **instrument-panel grammar**: representation toggles, a live readout strip, a one-idea card, checklists, transport controls and named failure modes. Most of the gap can be closed in the presentation layer.

**Enabler already landed:** `scripts/copy-vendor.mjs` + `src/viz/loadViz.ts` now load each ladder's viz CSS. Until the last fix, all 79 native kits rendered as black blocks; that entire asset library is now usable. Prefer surfacing those kits to re-authoring figures.

### Tier 1 — high impact, small code surface

| # | Upgrade | Video precedent | Concrete target in your code |
|---|---------|-----------------|------------------------------|
| 1 | **Universal readout strip + "Show:" toggles for every figure** | Motor's `Show: Field lines / Current flow / Force arrows / Part labels`; Anthropic's 6-number telemetry strip; Hydraulics' F₁→F₂ badge | `figures/contract.ts` `Layers` already has `vectors/graphs/readouts/grid`; add family-specific keys (`partLabels`, `fieldLines`, `currentFlow`, `forceArrows`). `components/LayerToggles.tsx` gains a `kind` prop + i18n label sets. `pages/TopicPage.tsx` line ~275 currently renders `PacingBar`/`LayerToggles` only for motion/wave — render for all kinds. Add one shared `<LiveReadout>` reading `state.params` + model output. |
| 2 | **"The Core Idea" card on every lesson** | All 7 videos open with one sentence + a glyph ("A current-carrying coil in a magnetic field…", "Pressure applied to a confined fluid…") | New `components/CoreIdeaCard.tsx`; optional `coreIdea` field in the ingest bundle (derive from `key` blocks or curate ~12 archetype rules). Pin above the narrative rail in `TopicPage.tsx`. Cheapest way to make 5,105 topics feel designed. |
| 3 | **Lesson transport + keyboard shortcuts** | System Design: `← → step · R replay · Space pause`, 11-step timeline with Replay/Pause | `components/PacingBar.tsx` exists but is motion/wave-only; generalise it, add replay/speed and a visible shortcut hint row in `TopicPage.tsx`. |
| 4 | **Task checklists + failure-mode troubleshooting** | RoverKit "DO THIS 0/4" + "A side turns backwards → swap the wires"; Backcountry 3-step checklists with green ticks | Extend `components/PracticePanel.tsx` with a `TaskChecklist` (checkable items, 0/N counter, persisted via the existing localStorage progress pattern) and a `FailureModes` accordion built from corpus `mistake`/`trouble` blocks. |
| 5 | **⌘K / Ctrl+K global search** | System Design's `Search lessons & concepts… ⌘K` | `App.tsx`: keydown listener focusing `.global-search input`, Arrow keys + Enter over results. Tiny cost, large polish signal. |

### Tier 2 — pedagogy depth

6. **"Live diagrams" mini-card for non-motion figures** — Motor shows a vector sketch *and* a live graph next to the 3D object. Add per-family companions: circuit → I–V curve + current arrows; field → field-line map + potential graph; energy → force–distance graph; collision → momentum bars. Mount the freshly-fixed native kits compactly through `components/RepoViz.tsx` instead of drawing new SVG.
7. **Scenario challenges** — System Design's "Case: a slow query / a user in Sydney". Add a "Try a scenario" strip using existing `setParam`/`setScenario` patches from `contract.ts`: "throw on the Moon", "double A₂", "reverse the battery"; check the prediction with the existing `SpatialFeedback` type.
8. **"You'll learn" outcomes + module rings** — System Design's right-rail outcome checklist. `components/SkillMap.tsx` currently shows only per-course mastery; add per-unit rings and derive per-lesson outcomes from `key` blocks.
9. **Expand Spanish beyond 12 topics** — `scripts/translate-es.mjs` scaffolding exists; expand at build time (keeps your no-runtime-LLM decision) and keep the untranslated notice added in `TopicPage.tsx`.
10. **PWA / offline** — the Backcountry thread explicitly asked for offline lessons; your corpus is static JSON, so a service worker makes it installable and usable without Wi-Fi.

### Tier 3 — bigger bets

11. **Generate 2–3 "anatomy"-style hero figures with the available `anatomy` skill** for flagship topics (electric motor, hydraulics/energy, chloroplast/mitochondrion). It produces exactly the Anthropic sheet look — live isometric SVG/WebGL/3D with every number from one model — and you already have the skill in this environment. This is the single biggest visual leap.
12. **Optional hardware bridge for the breadboard/FBD labs** — RoverKit's WebSocket-to-real-board idea, if you want a simulator→experiment handoff.
13. **AI-generated isometric scene art** for high-value lessons (Backcountry's campfire/first-aid scenes) — keep CC BY-NC 4.0 attribution and non-commercial constraints.

**Suggested order:** 1 → 2 → 3 → 5 (one sprint) then 4 → 6 → 7. Items 1–5 are mostly CSS/component work on existing state; they will make the app feel like the videos without changing the corpus or the engines.

---

## 9. Sources & evidence

**Live apps**
- `https://electric-motor.wasmer.app/` · `https://hydraulics.wasmer.app/`
- `https://roverkit.vercel.app/` · `https://backcountry-101.vercel.app/` · `https://designed-to-scale.vercel.app/`

**Creator/model evidence**
- `https://dilum.dev/` — list of primers (Protocol Explorer, Electronics 101, Backcountry 101, Learn ESP32, Learn Arduino).
- `https://www.whatpeoplemade.com/i/a-step-by-step-robot-building-app-with-simulator-and-cod-651085.html` — RoverKit, "Built with Fable 5.2", original tweet text.
- `https://www.promptshipped.com/maker/dilumsanjaya` — 6 apps, model attributions, dates.
- `https://nitter.gq/DilumSanjaya/status/2115488004425089201` — Backcountry 101 tweet ("made with Opus 5.5") and replies (assets by Opus 5.5, performance/token cost).
- `https://dropday.ai/c/system-design` — "Designed to Scale", Built with Grok Build 0.1.
- `https://ai.agentik-os.com/tools/hydraulics.wasmer.app` — hydraulics tweet by `@thebuggeddev`.
- `https://skills.wheresryan.sh/anatomy`, `https://github.com/wheresryan22/anatomy` — anatomy skill and the Claude-authored lathe geometry PRs.
- `https://rhombus.so/anatomy.html` — token accounting for the anatomy skill (system prompt/tool definitions dominate).

**Local evidence**
- `video-research/extract.py`, `keyframes.py`, `analyze_bundles.py`
- `video-research/*_storyboard.jpg`, `video-research/frames/*.png`
- `video-research/live/{motor,hydraulics,roverkit,systemdesign}.js`

**Uncertainties**
- Audio of the three videos with a track was not transcribed (no speech-to-text installed); content assumed to be music, not confirmed.
- RoverKit's rover rendering is inferred from bundle signatures (almost no three.js) as layered/pre-rendered 3D + CSS, not proven by a source map.
- No public URL was found for the two Anthropic sheets; their build mechanism is inferred from the skill repo and the on-screen statement, not from their deployed source.
