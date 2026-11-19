import { useEffect, useMemo, useRef, useState } from "react";
import { useFigureStore } from "../state/figureStore";

type Mode = "travel" | "pulse" | "superpose" | "standing-string" | "standing-pipe" | "beats";
type WaveOpts = {
  mode?: Mode; A?: number; lambda?: number; f?: number; v?: number; L?: number; n?: number;
  boundary?: "fixed" | "free" | "junction"; mu2?: number; waves?: { A: number; w?: number; lambda?: number; x0?: number; dir?: number }[];
  f1?: number; f2?: number; graphs?: string[]; task?: string; long?: boolean;
  [k: string]: unknown;
};

const W = 1000, H = 430, LEFT = 42, RIGHT = 24, MID = 150, SCALE = 105;

export default function WaveFigure({ opts }: { opts: WaveOpts }) {
  const { state, patch } = useFigureStore();
  const [A, setA] = useState(opts.A ?? 0.8);
  const [lambda, setLambda] = useState(opts.lambda ?? 2.5);
  const [f, setF] = useState(opts.f ?? 0.5);
  const [n, setN] = useState(opts.n ?? 3);
  const mode: Mode = opts.mode ?? "travel";
  const raf = useRef<number | null>(null);
  const last = useRef(0);
  const tRef = useRef(0);
  const v = opts.v ?? lambda * f;
  const span = mode === "travel" ? Math.max(8, 4 * lambda) : opts.L ?? 10;
  const T = 8;

  useEffect(() => {
    if (!state.playing) { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; last.current = 0; return; }
    const tick = (now: number) => {
      if (!last.current) last.current = now;
      const dt = Math.min(0.05, (now - last.current) / 1000);
      last.current = now;
      const next = (tRef.current + dt * state.speed) % T;
      tRef.current = next; patch({ op: "setTime", t: next });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; last.current = 0; };
  }, [state.playing, state.speed, patch]);
  useEffect(() => { tRef.current = state.t; }, [state.t]);
  const t = state.t;

  const yAt = useMemo(() => {
    const waves = opts.waves ?? [{ A: 1, w: 0.7, x0: 2, dir: 1 }, { A: 0.7, w: 0.7, x0: 8, dir: -1 }];
    return (x: number, tt: number): number => {
      switch (mode) {
        case "travel": return A * Math.sin(2 * Math.PI * (x / lambda - f * tt));
        case "standing-string": return 2 * A * 0.5 * Math.sin(n * Math.PI * x / span) * Math.cos(2 * Math.PI * 0.4 * tt);
        case "standing-pipe": return A * Math.sin(n * Math.PI * x / span) * Math.cos(2 * Math.PI * 0.4 * tt);
        case "beats": {
          const f1 = opts.f1 ?? 8, f2 = opts.f2 ?? 9;
          return 0.5 * A * (Math.sin(2 * Math.PI * f1 * tt) + Math.sin(2 * Math.PI * f2 * tt));
        }
        case "superpose": return waves.reduce((s, w) => {
          if (w.lambda) return s + w.A * Math.sin(2 * Math.PI * (x - (w.dir ?? 1) * v * tt) / w.lambda);
          const dx = x - (w.x0 ?? 2) - (w.dir ?? 1) * v * tt;
          return s + w.A * Math.exp(-(dx * dx) / ((w.w ?? 0.7) ** 2));
        }, 0);
        case "pulse": {
          const xb = opts.boundary === "junction" ? span / 2 : span;
          const g = (s: number) => A * Math.exp(-(s * s) / 0.36);
          const x0 = 1.2, r = opts.boundary === "free" ? 1 : -1;
          return x <= xb ? g(x - x0 - v * tt) + r * g(2 * xb - x - x0 - v * tt) : 0;
        }
        default: return 0;
      }
    };
  }, [mode, A, lambda, f, n, span, v, opts]);

  const X = (x: number) => LEFT + (x / span) * (W - LEFT - RIGHT);
  const amp = mode === "superpose" ? A * 2 : A;
  const Y = (y: number) => MID - (y / Math.max(0.2, amp * 1.2)) * SCALE;
  const particles: number[] = [];
  for (let i = 0; i <= 60; i++) particles.push((span * i) / 60);
  const plot = particles.map((x) => `${X(x)},${Y(yAt(x, t))}`).join(" ");
  const isTimePlot = mode === "beats";
  const timePlot = isTimePlot ? Array.from({ length: 300 }, (_, i) => {
    const tt = (T * i) / 299;
    return `${LEFT + (tt / T) * (W - LEFT - RIGHT)},${Y(yAt(0, tt))}`;
  }).join(" ") : null;

  return (
    <div className="wave-figure">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${mode} wave figure`}>
        <rect x="8" y="8" width={W - 16} height={H - 16} rx="5" fill="var(--paper-2)" stroke="var(--rule)" />
        <line x1={LEFT} y1={MID} x2={W - RIGHT} y2={MID} stroke="var(--rule)" strokeWidth="1" strokeDasharray="4 4" />
        {mode === "standing-string" && <g>
          {[1, 2, 3, 4, 5, 6].map((k) => <line key={k} x1={X((span * k) / 6)} y1={MID - 90} x2={X((span * k) / 6)} y2={MID + 90} stroke="var(--rule)" strokeWidth="1" />)}
          <text x={LEFT} y={MID + 120} fontSize="12" fontFamily="var(--font-mono)" fill="var(--ink-3)">nodes every λ/2 · {n} harmonics</text>
        </g>}
        {timePlot ? <polyline points={timePlot} fill="none" stroke="var(--velocity)" strokeWidth="2.8" /> : (
          <>
            <polyline points={plot} fill="none" stroke="var(--velocity)" strokeWidth="2.6" />
            {particles.filter((_, i) => i % 4 === 0).map((x) => <circle key={x} cx={X(x)} cy={Y(yAt(x, t))} r="3.5" fill="var(--signal)" />)}
          </>
        )}
        {mode === "pulse" && <line x1={X(span)} y1={MID - 80} x2={X(span)} y2={MID + 80} stroke="var(--accel)" strokeWidth="4" />}
        <text x={LEFT} y="30" fontSize="12" fontFamily="var(--font-mono)" letterSpacing="1" fill="var(--signal)">{mode.toUpperCase()} · t = {t.toFixed(2)} s</text>
        <text x={W - RIGHT} y={H - 18} textAnchor="end" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">simplified model · transverse scale exaggerated</text>
      </svg>
      <div className="figure-controls">
        {(mode === "travel" || mode === "pulse" || mode === "standing-string") && <label>A {A.toFixed(2)} m<input type="range" min="0.2" max="1.2" step="0.05" value={A} onChange={(e) => setA(Number(e.target.value))} /></label>}
        {mode === "travel" && <label>λ {lambda.toFixed(2)} m<input type="range" min="0.8" max="6" step="0.1" value={lambda} onChange={(e) => setLambda(Number(e.target.value))} /></label>}
        {mode === "travel" && <label>f {f.toFixed(2)} Hz<input type="range" min="0.1" max="2" step="0.05" value={f} onChange={(e) => setF(Number(e.target.value))} /></label>}
        {(mode === "standing-string" || mode === "standing-pipe") && <label>harmonic {n}<input type="range" min="1" max="6" step="1" value={n} onChange={(e) => setN(Number(e.target.value))} /></label>}
        <span style={{ color: "var(--ink-3)", fontSize: "var(--fs-0)" }}>v = {v.toFixed(2)} m/s · T = {f ? (1 / f).toFixed(2) : "—"} s</span>
      </div>
    </div>
  );
}
