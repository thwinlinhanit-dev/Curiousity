# Idea Synthesis — Sael, Atlas, Dilum Sanjaya, iamtechartist

Four sources studied, all pointing at the same thesis. This doc extracts the transferable ideas and what they mean for your app over the Teddy Rook corpus.

---

## 1. The four sources, distilled

### 1.1 sael.net (Ryan Sael) — *explorable worlds*
87 pieces, ~7.7M views. Titles are mundane objects and systems: *How a Zipper Works, How a Key Works, Where Sine Waves Come From, How the Internet Works, What Happens When You Send a Prompt, The Periodic Table in 3D, Flat Pack Step by Step*. Categories: Explainers (41), Worlds (12), Concept (9), Data (9), Play (5), Simulator (5), Virtual Tour (2), Design (2). Built with Three.js/WebGL; `dat.city` turns world data into a 3D city of living datasets.

**The ideas:**
- **Explain the inner mechanics of ordinary things** — the zipper's Y-shaped channel, the lock's pins. People will watch a million times if you reveal the hidden mechanism of something they've used daily.
- **"Simplified models... some of it may be wrong"** stated openly. Honesty about simplification is a trust move, not a weakness.
- **A feed of finished pieces + a "what should exist next?" box** — the audience drives the roadmap. Launch is "open source, soon."
- **Step-by-step for procedures** (flat-pack, tie a tie, change a tyre) vs. **explorable 3D for systems** — match the interaction to the content type.

### 1.2 Atlas Class (atlasclass.app, Nathan Liow) — *take it apart*
AP Physics/Calculus/Chemistry. Tagline: **"Learn it by taking it apart."** Fig. 1 instruction: *"Drag to turn · shift-drag to pan · click to break it down."*

**The ideas:**
- **Every page has ONE hero figure** you can turn, pause, and dissect. Not many widgets — one deep, canonical figure reused across the whole chapter.
- **A single canonical example** runs through the chapter ("one ball, thrown straight up at 9.80 m/s") — every concept is a different lens on the same object. This is enormous for coherence and production cost.
- **Wrong answers are drawn on the figure** — you see where your answer lands before the working plays out. Feedback is spatial, not a red ✗.
- **Each practice question sets the figure to its own numbers.** Same figure, parameterized.
- **Linked representations** — the ball, the strobe photograph, and the x–t / v–t / a–t graphs all show the *same* motion; click a graph to see slope and area.
- **Honest numbers and real scale** ("drawn 1:1", "¼ speed", "the figure runs at half speed"). Precision is part of the aesthetic.

### 1.3 Dilum Sanjaya — *narrow apps, shipped fast*
Electronics 101 (48 lessons, 13→20 languages, ~531K views), Learn Arduino (~900K views), ESP32, Protocol Explorer (14→~25 protocols, packet inspector, 21 languages, ~287K views), Backcountry survival. All **"Made with Opus 5.5"** (used as a build-time tool, not a runtime LLM).

**The ideas:**
- **One topic, done completely.** A single app owns electronics, or Arduino, or internet protocols. Depth beats breadth — the exact opposite of Sketchd's "anything" box.
- **Speed control + pause + step-by-step** explicitly requested by users ("for people who already know it and need a quick reference, and those who want to take their time"). The same content serves experts and beginners via pacing.
- **Schematic view added after feedback.** Offer paired representations (physical ↔ schematic, diagram-only view).
- **"Plenty of things to experiment with."** experiment/play is the hook, not reading.
- **Multilingual as a reach multiplier** — languages were chosen from comment requests and added cheaply because the app is built with an AI assistant. 13 → 20 → 21 languages.
- **Iterate in public, post when good** — "I usually spend a lot of time throwing ideas at Opus, trying different things, and only posting once I end up with something I actually enjoy."

### 1.4 iamtechartist (Techartist) — *high-fidelity 3D lessons*
"Experiments in code, form, light and motion. Building interactive 3D worlds, experiences and games." Notable repos: `every-joule-lesson1` (interactive 3D physics lesson with assets + audio), `coastal-simulation` (shallow-water solver + breaking swells + whitewater), `ocean-simulation` (FFT/JONSWAP waves, caustics, refraction), `human-cell-visualizer` (biology, particles, morphing, annotated anatomy), `tideglass-cove` (Three.js + TSL). Ships as static GitHub Pages with audio assets.

**The ideas:**
- **3D + shaders are now cheap enough for education**, and the bar for beautiful is very high. Physical simulation (real solvers) and visual beauty coexist.
- **Annotated anatomy in 3D** — click a part, get an info panel. Same as Atlas's "take it apart" but in a spatial, cinematic register.
- **Audio is a first-class asset** in a lesson (literal `audio/` folder in the repo) — narration is part of the artifact, not an afterthought.
- **Static delivery is fine** for heavy interactive 3D — no backend needed.

---

## 2. The convergence — the "hero figure" thesis

All four independently arrived at the same product shape:

> **One canonical, manipulable figure + a paced narrative + feedback drawn on the figure.**

| Source | The figure | The manipulation |
|---|---|---|
| Sael | a zipper / key / chip fab / data city | orbit, zoom, step through |
| Atlas | one ball in free fall | drag to turn, pause, click to break down |
| Dilum | one circuit at a time | swap components, schematic view, experiment |
| Techartist | a cell / coastline / energy store | orbit, annotated anatomy, simulate |

This is *exactly* what Sketchd's best moments did (the Pythagorean lab, the breadboard, the DAW) — but Sketchd tried to generate a fresh figure for every question, while these four **author one deep figure per topic and make it excellent**. That difference is why their interactives feel better than the repo's current ones and more reliable than generated ones.

**The production lesson:** you do not need a generative engine to get Sketchd-level quality. You need a small number of *exceptional, reusable, parameterized figures*.

---

## 3. What this means for your app (over the Teddy Rook corpus)

### Replace "low-quality visuals" with a figure-per-concept strategy
The repo has ~1,305 math topics + many ladders. You cannot hand-craft a 3D figure for all of them. So:

1. **Classify topics by figure archetype.** Most will fall into a handful:
   - `motion` (projectile, pendulum, orbit) → one 3D/2D scene + vectors + graphs
   - `geometry` (Pythagoras, circles, solids) → draggable construction + readout
   - `function` (graph, derivative, integral) → linked plot + table + equation
   - `circuit` (electronics ladder) → breadboard + schematic paired view
   - `process` (chemistry, biology) → annotated 3D/cutaway + step timeline
   - `discrete` (logic, algorithms) → node/edge or bar/step visualization
   - `procedure` (trades, tying, cooking) → step-through with a manipulable object
2. **Build ONE outstanding renderer per archetype.** 6–8 hero figures, not 1,305. Each is parameterized by topic data (Atlas's trick: the figure takes its own numbers from the question).
3. **Port the repo's models as the simulation core** — its physics/chemistry models already run in Node and are tested. Wrap them in your beautiful figure. Correctness stays; quality jumps.

### Adopt these specific patterns immediately
- **Canonical example per chapter** — pick one concrete example and reuse it across the chapter, as Atlas does. The repo's lessons already have worked examples; anchor on one.
- **Linked representations** — figure + equation + graph + table, all driven by one state object (this is where Dragology shines: dragging the figure updates the others *mid-drag*).
- **Spatial error feedback** — draw the wrong answer on the figure before showing working (Atlas). Deterministic: your answer checker returns where the learner's value lands.
- **Pacing controls** — play/pause, speed (¼×, ½×, 1×), and step-by-step are non-negotiable. Dilum's users explicitly asked for them.
- **Paired views** — physical ↔ schematic, 3D ↔ 2D, diagram-only toggle. Cheap to add, high perceived quality.
- **Honesty** — "simplified model" notes and "drawn to scale / not to scale" labels build trust and mirror both Sael and Atlas.
- **Audio assets in the repo** — treat narration as part of the lesson artifact (techartist's `audio/` folder pattern), pre-generated/TTS, no runtime LLM.
- **Multilingual from day one** — structure all lesson strings as keys so community translations can be added cheaply (Dilum's 13→21 languages).
- **"What should exist next?"** input — let the community drive which topics get a hero figure next (Sael).
- **Static-first delivery** — all four ship as static sites. You don't need a backend for the visuals; progress can stay localStorage + save codes like the repo already does.

### Use AI at build time, not runtime
Dilum built all those apps "with Opus 5.5"; techartist and Sael hand-craft with code. None run a generative model at lesson time. Your pipeline:

```
repo data (correctness)  →  one-time authoring pass (you + AI tools)
                         →  parameterized figures + step scripts + narration audio
                         →  static app, deterministic, offline-capable, fast
```

This preserves the repo's no-account/no-ads/offline values and gives you Sketchd-like polish without Sketchd's runtime cost.

---

## 4. Updated build priority

1. **Pick ONE ladder** (Math Ladder or Physics) and **one figure archetype** (e.g. `function` or `motion`).
2. **Build one hero figure** to Atlas/Sael quality: parameterized, draggable (Dragology), linked views, spatial feedback, pacing controls, honest scale labels.
3. **Wrap 5–10 real topics from the repo** around it; port their checked models/generators.
4. **Add narration audio + speed control + step-through.**
5. **Measure against Sketchd** side by side; only then expand to the next archetype.

Quality is a depth game. Four independent creators prove a small number of excellent figures beats a large number of mediocre ones — and that's the exact weakness you identified in the repo.

---

## 5. Sources (revisit for inspiration)
- https://sael.net/ · https://www.ryansael.com/ · dat.city
- https://atlasclass.app/about · https://atlasclass.app/physics/kinematics/?samples=1
- https://x.com/tryatlasclass
- https://x.com/DilumSanjaya/status/2118386789169938562 (Electronics 101), plus learn-arduino-red.vercel.app, learn-esp32.vercel.app, protocol-explorer-alpha.vercel.app
- https://github.com/iamtechartist · https://github.com/iamtechartist/every-joule-lesson1 · https://iamtechartist.com
- Complementary: https://declarative-dragging.github.io/ (Dragology)
