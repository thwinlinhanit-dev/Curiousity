import { useState } from "react";

type Opts = { mode?: string; task?: string; [k: string]: unknown };

const G = 9.8;
export default function EnergyFigure({ opts }: { opts: Opts }) {
  const [m, setM] = useState(2);
  const [v, setV] = useState(6);
  const [h, setH] = useState(4);
  const [k, setK] = useState(0);
  const [friction, setFriction] = useState(0);
  const [x, setX] = useState(0); // distance along the surface

  const K = 0.5 * m * v * v;
  const Ug = m * G * (h * (1 - x / 10));
  const Us = 0.5 * k * (x * 0.2) ** 2;
  const Eth = friction * m * G * x;
  const total = K + Ug + Us + Eth;
  const start = 0.5 * m * v * v + m * G * h;

  const max = Math.max(1, start) * 1.1;
  const bars = [
    { label: "K", value: K, color: "var(--velocity)" },
    { label: "Ug", value: Ug, color: "var(--mastered)" },
    { label: "Us", value: Us, color: "var(--review)" },
    { label: "Eth", value: Eth, color: "var(--accel)" },
  ];

  return (
    <div className="energy-figure">
      <p className="stage-prompt"><span aria-hidden>◉</span> {opts.task ?? "Watch the energy bars. The total stays the same unless friction does work."}</p>
      <svg viewBox="0 0 1000 420" width="100%" role="img" aria-label={`Energy: kinetic ${K.toFixed(0)} joules, gravitational ${Ug.toFixed(0)} joules, total ${total.toFixed(0)} joules`}>
        <rect x="8" y="8" width="984" height="404" rx="5" fill="var(--paper-2)" stroke="var(--rule)" />
        {/* track and object */}
        <line x1="80" y1="320" x2="920" y2="320" stroke="var(--rule)" strokeWidth="2" />
        <line x1="80" y1="100" x2="920" y2="100" stroke="var(--rule)" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx={120 + x * 60} cy={320 - (h * (1 - x / 10)) * 30} r="14" fill="var(--signal)" />
        <text x="40" y="34" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">energy bars · simplified · not to scale</text>
        {/* bars */}
        {bars.map((b, i) => {
          const bh = Math.max(0, (b.value / max) * 250);
          return (
            <g key={i}>
              <rect x={180 + i * 150} y={340 - bh} width="90" height={bh} fill={b.color} opacity="0.85" />
              <text x={225 + i * 150} y={356} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill={b.color}>{b.label}</text>
              <text x={225 + i * 150} y={340 - bh - 8} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-2)">{b.value.toFixed(0)} J</text>
            </g>
          );
        })}
        <line x1="170" y1={340 - (total / max) * 250} x2="790" y2={340 - (total / max) * 250} stroke="var(--ink)" strokeWidth="2" strokeDasharray="6 4" />
        <text x="800" y={340 - (total / max) * 250 + 4} fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink)">total {total.toFixed(0)} J</text>
      </svg>
      <div className="figure-controls">
        <label>mass {m.toFixed(1)} kg<input type="range" min="0.5" max="6" step="0.5" value={m} onChange={(e) => setM(Number(e.target.value))} /></label>
        <label>speed {v.toFixed(1)} m/s<input type="range" min="0" max="12" step="0.5" value={v} onChange={(e) => setV(Number(e.target.value))} /></label>
        <label>height {h.toFixed(1)} m<input type="range" min="0" max="8" step="0.5" value={h} onChange={(e) => setH(Number(e.target.value))} /></label>
        <label>spring k {k.toFixed(0)} N/m<input type="range" min="0" max="60" step="2" value={k} onChange={(e) => setK(Number(e.target.value))} /></label>
        <label>friction {friction.toFixed(1)} N<input type="range" min="0" max="8" step="0.5" value={friction} onChange={(e) => setFriction(Number(e.target.value))} /></label>
        <label>position x = {x.toFixed(1)} m<input type="range" min="0" max="10" step="0.2" value={x} onChange={(e) => setX(Number(e.target.value))} /></label>
        <span aria-live="polite">K + Ug + Us + Eth = {total.toFixed(0)} J · start {start.toFixed(0)} J {friction === 0 ? "(conserved)" : "(friction does work)"}</span>
      </div>
    </div>
  );
}
