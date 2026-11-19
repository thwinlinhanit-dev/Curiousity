# Build Your Own Education App — Blueprint (based on the Sketchd teardown)

This is the "how to build it" companion to [`REVERSE_ENGINEERING_REPORT.md`](./REVERSE_ENGINEERING_REPORT.md). It converts the observed product into a concrete, buildable plan. Everything here is a **recommendation**, not a claim about Sketchd's actual stack.

---

## 1. Decide your wedge before writing code

The demo shows *breadth* (music, maths, code, circuits, history, languages). That breadth is the **result** of a mature engine, not a good starting point. Pick ONE of:

- **Subject wedge:** e.g. "GCSE/A-level Physics", "organic chemistry mechanisms", "K-8 fractions", "Python for beginners".
- **Artifact wedge:** e.g. "every lesson is an interactive graph", "every lesson is a circuit simulator", "every lesson is a sketched diagram".
- **Audience wedge:** exam revision, homeschool parents, corporate onboarding, language learners.

Recommendation: **subject wedge + one hero artifact type**. The hero artifact is where you will invest 80% of frontend quality. Sketchd's DAW and breadboard labs are the proof that one great interactive artifact sells the whole product.

---

## 2. Product scope for v1 (copy the shape, shrink the surface)

**Must have (v1):**
1. Prompt box with chips (seed 6–10 example prompts for your subject).
2. Streaming lesson generation: shell first → steps stream in → visual renders → narration plays.
3. **One** hero interactive lab (e.g. a graphing/sketch canvas) + one static "Page" block + one "Practice" block (multiple choice / match pairs).
4. Step navigation (Continue / progress counter).
5. Follow-up chat that **mutates the lab state** (this is the magic — do not skip it).
6. TTS narration with play/pause.
7. Save sessions to an account; show a simple history list.
8. Web image search + citation list for factual topics (optional in v1 if your subject doesn't need it).

**Defer:** course catalog, progress tree, spaced repetition, mobile app, 8 lab types, voice input, file attachments. Add them once the core loop is good.

---

## 3. Recommended tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | SSE/streaming route handlers, auth, DB integration, Vercel deploy |
| Styling | **Tailwind CSS + shadcn/ui** (Radix primitives) | Fast, accessible, matches the dark minimal aesthetic |
| Fonts | Serif display (e.g. `Newsreader` / `Fraunces`) + `Inter` | Reproduces the editorial + UI contrast in the demo |
| Icons | `lucide-react` | Matches the thin-line icon language |
| LLM calls | **OpenAI / Anthropic / Gemini / Groq via a thin provider layer** | Keep models swappable; use a fast/cheap model for planning + a stronger one for structured/code output |
| Structured output | JSON Schema / tool calling (strict mode) | The engine depends on parseable output, not prose |
| Streaming | **SSE** from a route handler → `ReadableStream` on client | First-paint in ~1 s; progressive lesson assembly |
| TTS | ElevenLabs or OpenAI TTS | Cheap, natural, streaming; store audio URL in step |
| Image search | SerpAPI / Brave / Tavily / Unsplash API | Real photos + source URLs for citations |
| DB | **Supabase (Postgres)** or Neon + Drizzle/Prisma | Sessions, steps, progress, auth in one place |
| Object storage | Supabase Storage / S3 | Generated images/audio payloads |
| Sandbox for generated visuals | **iframe with strict CSP + `sandbox` attr** (or a restricted component registry) | Isolate generated code from the app |
| Auth | Supabase Auth / NextAuth | "Saved to your account" |

---

## 4. The core decision: how to generate the interactive visual

Three options, from safest to most powerful:

### Option A — Declarative spec → component registry (recommended for v1)
The LLM never writes JS. It emits a JSON "visual spec"; your registry maps `kind` to a vetted React/SVG component.

```ts
type VisualSpec =
  | { kind: "xyPlot"; points: [number,number][]; curve?: "linear"|"quadratic";
      markers?: {x:number; label:string}[]; axes:{x:string;y:string} }
  | { kind: "barChart"; values:number[]; labels:string[]; highlight?:number[] }
  | { kind: "diagram"; shapes: Shape[]; annotations: Annotation[] }  // SVG scene graph
  | { kind: "annotatedImage"; imageUrl:string; boxes:{x,y,w,h,label}[] }
  | { kind: "steps"; frames: VisualSpec[]; current:number }
```

Pros: safe, fast, cheap, reliable. Cons: limited to components you built. **This is the right v1.**

### Option B — Hand-built "lab" components with a state API (recommended for your hero artifact)
Build the lab yourself (e.g. a graph/sketch canvas), expose a small state API, and have the LLM emit **state patches**:

```json
{ "op": "setPoints", "points": [[0,0],[1,1],[2,4]] }
{ "op": "highlight", "ids": ["vertexA"] }
{ "op": "annotate", "text": "slope = 2x", "at": [1,1] }
```

This is almost certainly how the DAW/breadboard/projectile labs in the demo work: a rich hand-built interactive, driven by model-generated state. Pros: high quality + model-driven. Cons: you must build the lab.

### Option C — LLM-generated code in a sandbox (max power, max risk)
Model emits a self-contained HTML/SVG/JS snippet rendered in a sandboxed iframe. Enables truly arbitrary visuals (closest to what Sketchd appears to do for long-tail topics). Requires strict CSP, timeouts, size limits, validation, and fallback handling. **Use only for topics your registry/labs don't cover, and only after v1 works.**

**Pragmatic hybrid:** A (registry) for 80% of steps + B (your hero lab) for depth + C as a guarded fallback.

---

## 5. Data model (Postgres / Supabase sketch)

```sql
create table profiles (
  id uuid primary key references auth.users,
  display_name text, avatar_url text, tutor_persona text default 'sketch',
  created_at timestamptz default now()
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  subject text, mode text check (mode in ('freeform','course')) default 'freeform',
  origin_prompt text, status text default 'generating',
  visual_kind text,               -- hero artifact used
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table steps (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  idx int not null,
  role text check (role in ('user','tutor')) default 'tutor',
  narration_md text,
  stage_prompt text,
  visual_spec jsonb,             -- VisualSpec or lab state patch
  tts_url text,
  created_at timestamptz default now(),
  unique (lesson_id, idx)
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  title text, url text, kind text  -- 'web' | 'image'
);

create table follow_ups (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  user_text text, created_at timestamptz default now()
);

-- Later: courses, units, nodes, progress_events, practice_attempts
```

`visual_spec` as `jsonb` is the key flexibility move: any artifact type can be stored/versioned, and a follow-up can append a new step with a patch that mutates the same artifact.

---

## 6. Generation pipeline (server)

### 6.1 Endpoint: `POST /api/lessons/stream` (SSE)
Events (NDJSON over SSE):

```
event: meta       data: {"lessonId":"…","title":"…","subject":"physics","visualKind":"xyPlot"}
event: step       data: {"idx":0,"role":"tutor","narration_md":"…","stage_prompt":"…","visual_spec":{…}}
event: source     data: {"title":"…","url":"…","kind":"web"}
event: audio      data: {"idx":0,"tts_url":"…"}
event: done       data: {"steps":6,"elapsedMs":17200,"costUsd":0.041}
```

Client renders `meta` immediately (shell + themed loading), then appends `step`s.

### 6.2 Stages

1. **Plan** (fast model, strict JSON):
   ```json
   {
     "title": "...", "subject": "...", "visualKind": "xyPlot",
     "needWebImages": false,
     "steps": [
       {"stage_prompt":"...", "goal":"...", "visualIntent":"..."},
       ...
     ]
   }
   ```
2. **Research** (if needed): web/image search → top 3–5 sources + image URLs. Put into context.
3. **Per-step generation** (model with strict JSON): `narration_md` (≤ 120 words), `stage_prompt`, `visual_spec` (validated against `VisualSpec` schema). Generate steps **in parallel** where possible.
4. **TTS**: send narration to TTS, get audio URL; stream `audio` event when ready.
5. **Persist** lesson + steps + sources; stream `done` with timing/cost telemetry.

**Latency tricks:** stream the first step before later steps finish; parallelize step generation and TTS; use the cheap model for planning; cap tokens; cache common topics.

### 6.3 Prompt templates (starting points)

**Planner system prompt**
```
You are the lesson planner for an interactive learning app. Given a learner's question,
output ONLY JSON matching the schema. Choose exactly one primary visualKind from the
registry: xyPlot, barChart, diagram, annotatedImage, steps, <yourHeroLab>.
Plan 4-8 steps that build understanding progressively. Each step's stage_prompt is a
short instruction the learner acts on in the visual ("Drag point A to (3,4)").
Prefer visuals that make the key idea visible; avoid walls of text.
```

**Step generator system prompt**
```
You write one step of an interactive lesson. Output ONLY JSON:
{ "narration_md": string, "stage_prompt": string, "visual_spec": object }.
narration_md: plain, warm, teacher-like markdown, <=120 words, no headings,
no mention of "the visual below". Explain the idea behind the current state.
visual_spec MUST validate against the supplied JSON schema for the chosen kind.
Use annotations/labels to highlight what matters. If a web image is provided,
return annotatedImage with boxes over the relevant regions.
```

**Follow-up interpreter**
```
The learner said: "<text>". Conversation so far: <steps>. Current visual state: <json>.
Output ONLY JSON: { "new_steps": [...], "visual_patch_ops": [...] }.
Mutate the existing artifact rather than replacing it unless asked. Keep narration short.
```

Validate every model output against its JSON schema; on failure, retry once with the validation error, then fall back to a safe default step.

---

## 7. Frontend structure

```
app/
  page.tsx                     # home/prompt
  lesson/[id]/page.tsx         # lesson workspace
  courses/page.tsx             # (later) catalog
  progress/page.tsx            # (later) tree
  api/lessons/stream/route.ts  # SSE generation
  api/followups/route.ts       # SSE follow-up
components/
  Shell/TopBar.tsx
  Home/PromptBox.tsx           # gradient border, attach, mic, persona switch
  Lesson/LessonHeader.tsx      # icon, title, audio toggle, step ring, Continue
  Lesson/NarrationRail.tsx     # markdown, TTS highlight, sources, notes
  Lesson/Stage.tsx             # stage_prompt + VisualRenderer
  Lesson/FollowUpBar.tsx       # composer + suggested chips
  Visuals/registry.ts          # kind -> component
  Visuals/XyPlot.tsx
  Visuals/BarChart.tsx
  Visuals/Diagram.tsx          # SVG scene graph renderer
  Visuals/AnnotatedImage.tsx
  Visuals/YourHeroLab.tsx
  Practice/MatchPairs.tsx
lib/
  schemas/visual.ts            # zod schemas for VisualSpec
  llm/provider.ts              # swappable provider
  stream/parse.ts              # SSE client
  tts/client.ts
  search/client.ts
```

**Visual renderer rule:** each registry component is pure and fully driven by `visual_spec` + patch ops. No hidden local state that the model can't control — otherwise follow-ups drift out of sync.

---

## 8. Cost & latency targets (from the demo's claims)

| Budget item | Target |
|---|---|
| Total per lesson | ≤ $0.05 |
| Planning call | ~500–1,500 tokens, cheap/flash model |
| Step generation | 4–8 × ~400–800 tokens, cheap/flash model |
| Strong model | only for complex visuals; ~1 call |
| Images | search results (free/cheap), not generation |
| TTS | ~$0.005–0.015 per lesson |
| Uncached latency | ≤ 20 s; first paint ≤ 1 s |
| Follow-up latency | ≤ 5 s (patch only, no full regeneration) |

Instrument `elapsedMs` and `costUsd` on every `done` event so you can enforce this.

---

## 9. Build roadmap (suggested, ~8–12 weeks solo)

| Phase | Weeks | Deliverable |
|---|---|---|
| 0. Wedge + prototype | 1 | Pick subject & hero artifact; paper the 5 screens; 3 example prompts |
| 1. Shell + generation | 2 | Home prompt, SSE backend, planner + step generator, streaming text into shell |
| 2. Visual registry | 2 | 3 visual kinds (diagram, chart, annotated image) with zod schemas |
| 3. Hero lab | 2 | Deep interactive artifact + state-patch API; 5 hand-authored demo lessons |
| 4. Conversation loop | 1 | Follow-up endpoint, patch ops, suggested chips, transcript UI |
| 5. Voice + sources | 1 | TTS, play/pause, web/image search with citations |
| 6. Persistence + auth | 1 | Supabase auth, save/load sessions, history sidebar |
| 7. Practice | 1 | One generated quiz type; page block |
| 8. Polish | 1 | Loading animations, theme, accessibility, telemetry, cost guardrails |
| Later | — | Course catalog, progress tree, spaced repetition, voice input, mobile |

---

## 10. Risks & mitigations

| Risk | Mitigation |
|---|---|
| LLM emits invalid visual specs | Strict JSON schema + zod validation + retry + safe fallback |
| Generated visuals look generic | Invest in the hero lab and a curated SVG style; limit palette/fonts |
| Follow-ups break the visual | Patch ops with versioned state; keep state in `visual_spec`, re-render from source of truth |
| Latency blows past 20 s | Parallel steps, streaming, cheap models, no image generation |
| Cost blows past 5¢ | Per-lesson budget guard; cache common topics; cap tokens |
| Sandboxed code is unsafe (Option C) | Strict CSP iframe, timeouts, resource limits, validation; prefer A/B |
| Content accuracy | Citations, "show your working" panels, teacher-review mode for courses |

---

## 11. How to use the evidence in this folder

- [`REVERSE_ENGINEERING_REPORT.md`](./REVERSE_ENGINEERING_REPORT.md) — full teardown with confidence labels.
- [`evidence/`](./evidence/) — 19 annotated full-resolution screenshots (numbered in the order they're discussed).
- [`sheets/`](./sheets/) — contact sheets covering every 5 seconds of the 14-minute demo.
- [`detail/`](./detail/) — all extracted 1920×1080 frames.

Suggested next step: pick your subject wedge, then I can turn phases 1–3 into a working starter repo (Next.js + Supabase + SSE + a visual registry), with the planner/step/follow-up prompts wired to your chosen LLM provider.
