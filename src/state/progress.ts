// Typed wrapper around the repo's standalone progress engine (ML.engine,
// static/math/core/engine.js). Exact rules: mastery = 3 right with last 2
// consecutive; reviews at 1/3/7/16/35/75/150 days; shared key trb-math-v1.
import catalog from "../../content/catalog.json";
type GraphData = { courses: { key: string; ladder: string; title?: string; short?: string; slug?: string }[]; topics: { id: string; slug?: string; course: string; ladder: string; title: string }[] };
let graphData: GraphData = { courses: [], topics: [] };
let graphPromise: Promise<GraphData> | null = null;

function loadGraph(): Promise<GraphData> {
  if (!graphPromise) graphPromise = fetch(`${import.meta.env.BASE_URL}content/graph.json`)
    .then((r) => r.json()).then((g: GraphData) => { graphData = g; return g; });
  return graphPromise;
}
export async function ensureGraph(): Promise<void> {
  await loadGraph();
  applyGraph();
}
export function getGraph(): GraphData { return graphData; }
// A failed graph fetch caches a rejected promise; retry needs a clean slate.
export function resetGraph(): void { graphPromise = null; graphData = { courses: [], topics: [] }; initialized = false; }

type Rec = { s: 0 | 1 | 2; p: number; st: number; n: number; c: number; iv: number; due: number; last: number; lap: number };
type AnswerResult = { xp: number; passed?: boolean; extra?: boolean; p?: number; st?: number; need?: number; done?: boolean; step?: number; due?: number };

type Engine = {
  KEY: string; STEPS: number[];
  setGraph: (g: unknown) => Engine;
  setLadder: (k: string) => Engine;
  setCourse: (k: string) => Engine;
  ladder: () => string;
  rec: (id: string) => Rec;
  status: (id: string) => string;
  isPassed: (id: string) => boolean;
  startLearn: (id: string) => Rec;
  climb: (id: string) => { p: number; st: number; need: number; passed: boolean };
  learnAnswer: (id: string, ok: boolean, o?: { hint?: boolean }) => AnswerResult;
  due: () => string[];
  dueCount: () => number;
  dueAll: () => string[];
  reviewSet: (ids?: string[]) => { id: string; k: number }[];
  reviewAnswer: (id: string, ok: boolean) => AnswerResult;
  next: () => { type: string; items?: { id: string }[]; id?: string; reason?: string | null };
  recordResult: (id: string, ok: boolean) => AnswerResult;
  exportCode: () => Promise<string>;
  exportJSON: () => string;
  readCode: (code: string) => Promise<{ ok: boolean; msg?: string; state?: unknown }>;
  replace: (state: unknown) => boolean;
  state: () => unknown;
  on: (fn: () => void) => () => void;
  streak: () => number;
  totalXP: () => number;
  xpToday: () => number;
  goal: () => number;
  checkpointDueIn: () => number;
  dateOf: (day: number) => Date;
};

const engine = (): Engine | null =>
  (window as unknown as { MathLadder?: { engine?: Engine } }).MathLadder?.engine ?? null;

let initialized = false;
// The engine is available synchronously (vendor script) but graph.json is not.
// Never latch initialization with the empty placeholder graph — applyGraph is
// called again once the real graph has loaded (via ensureGraph).
function applyGraph(): void {
  if (initialized || graphData.topics.length === 0) return;
  const E = engine();
  if (!E) return;
  E.setGraph(graphData);
  initialized = true;
}
export function initProgress(ladder = "physics", course?: string): Engine | null {
  const E = engine();
  if (!E) return E;
  applyGraph();
  E.setLadder(ladder);
  if (course && graphData.courses.some((c) => c.key === course)) E.setCourse(course);
  return E;
}

export function setActiveLadder(ladder: string, course?: string): void {
  initProgress(ladder, course);
}

// Reads must never change the engine's global active ladder. initProgress()
// calls setLadder() (a global mutation in the vendor engine), so only calls
// that really need a ladder switch may use it.
function readEngine(): Engine | null {
  const E = engine();
  if (E) applyGraph();
  return E;
}

export function recordAnswer(topicId: string, ok: boolean): AnswerResult | null {
  // A write: scope the engine to the topic's own ladder before answering.
  const ladder = graphData.topics.find((t) => t.id === topicId)?.ladder ?? "physics";
  const E = initProgress(ladder);
  if (!E) return null;
  return E.learnAnswer(topicId, ok);
}

export function topicStatus(id: string): { status: string; p: number; st: number; need: number; passed: boolean; due: number } {
  const E = readEngine();
  if (!E) return { status: "new", p: 0, st: 0, need: 3, passed: false, due: 0 };
  const c = E.climb(id);
  return { status: E.status(id), p: c.p, st: c.st, need: c.need, passed: c.passed, due: E.rec(id).due };
}

export function progressSummary() {
  const E = readEngine();
  if (!E) return { xp: 0, today: 0, streak: 0, due: 0, next: null as null | { type: string; id?: string; reason?: string | null }, goal: 40 };
  return { xp: E.totalXP(), today: E.xpToday(), streak: E.streak(), due: E.dueCount(), next: E.next(), goal: E.goal() };
}

export async function exportSaveCode(): Promise<string> {
  const E = readEngine();
  return E ? await E.exportCode() : "";
}
export async function importSaveCode(code: string): Promise<{ ok: boolean; msg?: string }> {
  const E = readEngine();
  if (!E) return { ok: false, msg: "Engine unavailable." };
  const r = await E.readCode(code);
  if (r.ok && r.state) E.replace(r.state);
  return { ok: r.ok, msg: r.msg };
}
export { engine as getEngine };

// Subject-level progress for the home tiles and subject header. Reads only —
// never switches the engine's active ladder.
export function ladderProgress(ladder: string): { total: number; mastered: number; inProgress: number } {
  const E = readEngine();
  const topics = graphData.topics.filter((x) => x.ladder === ladder);
  let mastered = 0, inProgress = 0;
  if (E) for (const x of topics) {
    if (E.isPassed(x.id)) mastered++;
    else { const r = E.rec(x.id); if (r.n > 0 || r.p > 0) inProgress++; }
  }
  return { total: topics.length, mastered, inProgress };
}

// The first not-yet-mastered lesson in curriculum order — the subject page's
// Continue target. Course order comes from the catalogue (the graph is not
// sorted pedagogically); falls back to the first lesson when no engine.
export function nextInLadder(ladder: string): { id: string; slug: string; course: string; title: string } | null {
  const E = readEngine();
  const order = catalog.ladders.find((l) => l.key === ladder)?.courseKeys ?? [];
  const topics = graphData.topics
    .filter((x) => x.ladder === ladder)
    .sort((a, b) => order.indexOf(a.course) - order.indexOf(b.course));
  for (const x of topics) {
    if (!E || !E.isPassed(x.id)) {
      return { id: x.id, slug: x.slug || x.id.split(".").slice(1).join("."), course: x.course, title: x.title };
    }
  }
  return null;
}
