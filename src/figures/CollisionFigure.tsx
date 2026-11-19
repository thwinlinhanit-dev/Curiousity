import { useState } from "react";

type Opts = { mode?: string; task?: string; [k: string]: unknown };

export default function CollisionFigure({ opts }: { opts: Opts }) {
  const [m1, setM1] = useState(2);
  const [m2, setM2] = useState(3);
  const [u1, setU1] = useState(6);
  const [u2, setU2] = useState(0);
  const [elastic, setElastic] = useState(true);
  const [t, setT] = useState(0);

  const p = m1 * u1 + m2 * u2;
  const v1 = elastic ? ((m1 - m2) * u1 + 2 * m2 * u2) / (m1 + m2) : p / (m1 + m2);
  const v2 = elastic ? (2 * m1 * u1 + (m2 - m1) * u2) / (m1 + m2) : p / (m1 + m2);
  const keBefore = 0.5 * m1 * u1 ** 2 + 0.5 * m2 * u2 ** 2;
  const keAfter = 0.5 * m1 * v1 ** 2 + 0.5 * m2 * v2 ** 2;

  const X = (i: number) => i === 0 ? 180 + t * 240 : 740 + t * 240;
  const Xafter = (i: number) => i === 0 ? 500 + t * v1 * 24 : 560 + t * v2 * 24;
  const x1 = t < 1 ? X(0) : Xafter(0);
  const x2 = t < 1 ? X(1) : Xafter(1);

  return (
    <div className="collision-figure">
      <p className="stage-prompt"><span aria-hidden>◉</span> {opts.task ?? "Set the masses and velocities, then scrub through the collision."}</p>
      <svg viewBox="0 0 1000 400" width="100%" role="img" aria-label={`Collision: momentum ${p.toFixed(1)} kilogram metres per second, conserved`}>
        <rect x="8" y="8" width="984" height="384" rx="5" fill="var(--paper-2)" stroke="var(--rule)" />
        <line x1="60" y1="250" x2="940" y2="250" stroke="var(--rule)" strokeWidth="2" />
        {[0, 1].map((i) => (
          <g key={i}>
            <circle cx={i === 0 ? x1 : x2} cy="250" r={22 + (i === 0 ? m1 : m2) * 3} fill={i === 0 ? "var(--velocity)" : "var(--accel)"} opacity="0.9" />
            <text x={i === 0 ? x1 : x2} y="256" textAnchor="middle" fontSize="13" fill="var(--paper)" fontFamily="var(--font-mono)">{i === 0 ? "A" : "B"}</text>
          </g>
        ))}
        {/* momentum arrows */}
        {[0, 1].map((i) => {
          const u = t < 1 ? (i === 0 ? u1 : u2) : (i === 0 ? v1 : v2);
          const x = i === 0 ? x1 : x2;
          const len = u * 12;
          return <g key={`v${i}`}>
            <line x1={x} y1="205" x2={x + len} y2="205" stroke={i === 0 ? "var(--velocity)" : "var(--accel)"} strokeWidth="2.5" />
            <path d={`M ${x + len} 205 l -8 -5 l 0 10 Z`} fill={i === 0 ? "var(--velocity)" : "var(--accel)"} />
            <text x={x + len / 2} y="192" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-2)">v = {u.toFixed(1)} m/s</text>
          </g>;
        })}
        <text x="40" y="36" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">{elastic ? "elastic collision" : "perfectly inelastic"} · simplified · not to scale</text>
      </svg>
      <div className="figure-controls">
        <label>m A {m1.toFixed(1)} kg<input type="range" min="0.5" max="6" step="0.5" value={m1} onChange={(e) => setM1(Number(e.target.value))} /></label>
        <label>m B {m2.toFixed(1)} kg<input type="range" min="0.5" max="6" step="0.5" value={m2} onChange={(e) => setM2(Number(e.target.value))} /></label>
        <label>u A {u1.toFixed(1)} m/s<input type="range" min="-4" max="10" step="0.5" value={u1} onChange={(e) => setU1(Number(e.target.value))} /></label>
        <label>u B {u2.toFixed(1)} m/s<input type="range" min="-4" max="10" step="0.5" value={u2} onChange={(e) => setU2(Number(e.target.value))} /></label>
        <button className="btn" onClick={() => setElastic((e) => !e)}>{elastic ? "Elastic" : "Inelastic"}</button>
        <label>t {t.toFixed(2)}<input type="range" min="0" max="1.5" step="0.02" value={t} onChange={(e) => setT(Number(e.target.value))} /></label>
        <span aria-live="polite">p = {p.toFixed(1)} kg·m/s before and after · KE {keBefore.toFixed(0)} → {keAfter.toFixed(0)} J</span>
      </div>
    </div>
  );
}
