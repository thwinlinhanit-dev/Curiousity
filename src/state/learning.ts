// Local learning model layered on top of the corpus engine.
// Evidence: BKT mastery posterior, FSRS-style graded stability, target retention,
// interleaved "mistakes practice", forgiving streaks. All offline, no runtime LLM.
export type Grade = "again" | "hard" | "good" | "easy";
export type Retention = 0.85 | 0.9 | 0.95;

type Entry = {
  n: number; correct: number; lapses: number;
  p: number; // BKT posterior probability of knowing the skill
  s: number; // FSRS-style stability in days
  due: number; last: number; level: number;
  grades: Grade[];
};
type Store = { entries: Record<string, Entry>; days: Record<string, number>; retention: Retention; freezes: number };
type Settings = { retention: Retention; freezes: number };

const KEY = "trb-learning-v1";
const PRIORS = { pL0: 0.25, pT: 0.15, pG: 0.2, pS: 0.1 };
const HORIZON: Record<Retention, number> = { 0.85: 0.7, 0.9: 1, 0.95: 1.5 };
const MULT: Record<Grade, number> = { again: 0.6, hard: 1.2, good: 2.2, easy: 3.6 };
const DAY = 86400000;

const empty = (): Store => ({ entries: {}, days: {}, retention: 0.9, freezes: 2 });
let cache: Store | null = null;
function load(): Store {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...empty(), ...JSON.parse(raw) } : empty();
  } catch { cache = empty(); }
  return cache!;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(load())); } catch { /* private mode */ } }
const today = () => new Date().toISOString().slice(0, 10);

export function getSettings(): Settings {
  const s = load(); return { retention: s.retention, freezes: s.freezes };
}
export function setRetention(r: Retention) { load().retention = r; save(); }
export function setFreezes(n: number) { load().freezes = Math.max(0, Math.min(7, n)); save(); }

// BKT update: P(known | response), then the learning transition.
export function bktUpdate(p: number, correct: boolean): number {
  const { pT, pG, pS } = PRIORS;
  const post = correct
    ? (p * (1 - pS)) / (p * (1 - pS) + (1 - p) * pG)
    : (p * pS) / (p * pS + (1 - p) * (1 - pG));
  return Math.min(0.99, post + (1 - post) * pT);
}

export function recordGrade(topicId: string, grade: Grade, level = 1): Entry {
  const s = load();
  const e: Entry = s.entries[topicId] ?? {
    n: 0, correct: 0, lapses: 0, p: PRIORS.pL0, s: 1, due: Date.now(), last: 0, level, grades: [],
  };
  const ok = grade !== "again";
  e.n++; e.last = Date.now(); e.level = level;
  if (ok) e.correct++; else e.lapses++;
  e.p = bktUpdate(e.p, ok);
  // Harder generator levels earn larger stability jumps.
  const difficulty = 1 + (level - 1) * 0.15;
  e.s = grade === "again" ? 1 : Math.max(1, e.s * MULT[grade] * difficulty);
  e.s = Math.min(365, e.s);
  e.due = Date.now() + e.s * HORIZON[s.retention] * DAY;
  e.grades.push(grade);
  s.entries[topicId] = e;
  s.days[today()] = (s.days[today()] ?? 0) + 1;
  save();
  return e;
}

export function mastery(topicId: string): { p: number; passed: boolean; stability: number; due: number } {
  const e = load().entries[topicId];
  return e ? { p: e.p, passed: e.p >= 0.95, stability: e.s, due: e.due } : { p: PRIORS.pL0, passed: false, stability: 0, due: 0 };
}

export function overview() {
  const s = load();
  const entries = Object.values(s.entries);
  return {
    known: entries.filter((e) => e.p >= 0.95).length,
    learning: entries.filter((e) => e.p >= 0.5 && e.p < 0.95).length,
    due: entries.filter((e) => e.due <= Date.now()).length,
    mistakes: entries.filter((e) => e.lapses > 0 && e.p < 0.95).length,
    attempts: entries.reduce((n, e) => n + e.n, 0),
  };
}

export function mistakeTopics(limit = 8): string[] {
  return Object.entries(load().entries)
    .filter(([, e]) => e.lapses > 0 && e.p < 0.95)
    .sort((a, b) => b[1].lapses - a[1].lapses)
    .slice(0, limit).map(([id]) => id);
}

export function dueTopics(limit = 8): string[] {
  return Object.entries(load().entries)
    .filter(([, e]) => e.due <= Date.now())
    .sort((a, b) => a[1].due - b[1].due)
    .slice(0, limit).map(([id]) => id);
}

// Forgiving streak: a day with at least one answer counts; unused freeze days
// cover a missed day instead of resetting the counter.
export function streak(): number {
  const s = load();
  let count = 0, freezes = s.freezes;
  const d = new Date();
  for (let i = 0; i < 400; i++) {
    const key = new Date(d.getTime() - i * DAY).toISOString().slice(0, 10);
    if (s.days[key]) { count++; continue; }
    if (i === 0) continue; // today is not over yet
    if (freezes > 0) { freezes--; continue; }
    break;
  }
  return count;
}

export function lastWeeks(days = 28): number[] {
  const s = load(); const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    out.push(s.days[key] ?? 0);
  }
  return out;
}

export function resetLearning() { cache = empty(); save(); }
