// Typed wrapper around the repo's PURE physics model: window.MathLadder.physModels.motion
// (from static/physics/viz/physics.js, PM.motion). We reuse the tested physics,
// but render our own SVG so the design system and pacing shell are fully ours.

export type MotionSample = { x: number; v: number; a: number; i: number };
export type MotionKnot = { t: number; x: number; v: number; a?: number };
export type MotionModel = {
  K: MotionKnot[];
  T: number;
  at: (t: number) => MotionSample;
  dist: (t: number) => number;
};

export type VizOpts = {
  vertical?: boolean;
  x0?: number;
  v0?: number;
  a?: number;
  tmax?: number;
  g?: number;
  segments?: { dur: number; a: number }[];
  graphs?: ("x" | "v" | "a")[];
  drag?: string;
  show?: string[];
  hide?: string[];
  cursor?: number;
  t?: number;
  task?: string;
  label?: string;
  units?: { x?: string; t?: string };
  [key: string]: unknown;
};

type VizGlobal = {
  MathLadder?: {
    physModels?: {
      motion: (x0: number, v0: number, segs: { dur: number; a: number }[]) => MotionModel;
    };
  };
};

function repoModel(): ((x0: number, v0: number, segs: { dur: number; a: number }[]) => MotionModel) | null {
  const w = window as unknown as VizGlobal;
  return w.MathLadder?.physModels?.motion ?? null;
}

// Fallback mirrors PM.motion exactly (used only if the vendor script failed to load).
function localMotion(x0: number, v0: number, segs: { dur: number; a: number }[]): MotionModel {
  const K: MotionKnot[] = [{ t: 0, x: x0, v: v0 }];
  segs.forEach((s) => {
    const p = K[K.length - 1];
    K.push({ t: p.t + s.dur, x: p.x + p.v * s.dur + 0.5 * s.a * s.dur * s.dur, v: p.v + s.a * s.dur, a: s.a });
  });
  const T = K[K.length - 1].t;
  const at = (t: number): MotionSample => {
    const tc = Math.max(0, Math.min(T, t));
    for (let i = 1; i < K.length; i++) {
      if (tc <= K[i].t + 1e-12 || i === K.length - 1) {
        const p = K[i - 1], a = K[i].a ?? 0, d = tc - p.t;
        return { x: p.x + p.v * d + 0.5 * a * d * d, v: p.v + a * d, a, i: i - 1 };
      }
    }
    return { x: x0, v: v0, a: 0, i: 0 };
  };
  const dist = (t: number): number => {
    let s = 0;
    for (let i = 1; i < K.length; i++) {
      const p = K[i - 1];
      if (t <= p.t) break;
      const d = Math.min(t, K[i].t) - p.t, a = K[i].a ?? 0, v1 = p.v, v2 = p.v + a * d;
      if (v1 * v2 >= 0) s += Math.abs(v1 + v2) / 2 * d;
      else { const tz = -v1 / a; s += Math.abs(v1) * tz / 2 + Math.abs(v2) * (d - tz) / 2; }
    }
    return s;
  };
  return { K, T, at, dist };
}

export function createMotionModel(opts: VizOpts, overrides?: Record<string, number>): MotionModel {
  const g = opts.g ?? 9.8;
  const x0 = overrides?.x0 ?? opts.x0 ?? 0;
  const v0 = overrides?.v0 ?? opts.v0 ?? (opts.vertical ? 14.7 : 2);
  const a0 = overrides?.a ?? opts.a ?? (opts.vertical ? -g : 0);
  let segs: { dur: number; a: number }[];
  if (Array.isArray(opts.segments) && opts.segments.length) {
    segs = opts.segments.map((s) => ({ dur: Math.max(0.05, s.dur), a: s.a }));
  } else {
    const tmax = overrides?.tmax ?? opts.tmax ?? (opts.vertical && v0 > 0 && a0 < 0 ? (-2 * v0) / a0 : 6);
    segs = [{ dur: tmax, a: a0 }];
  }
  const fn = repoModel() ?? localMotion;
  return fn(x0, v0, segs);
}

export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!(max > min)) return [min];
  const span = max - min;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) out.push(+v.toFixed(10));
  return out;
}

export function bounds(values: number[], pad = 0.1): [number, number] {
  let lo = Math.min(...values, 0), hi = Math.max(...values, 0);
  if (hi - lo < 1e-9) { hi = lo + 1; }
  const p = (hi - lo) * pad;
  return [lo - p, hi + p];
}
