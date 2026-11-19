import { useState } from "react";

type Opts = { mode?: string; boxes?: unknown[]; f?: string; T?: number; eq?: string; sets?: number; value?: number; from?: string; to?: string; unit?: string; task?: string; [k: string]: unknown };

export default function ParticleFigure({ opts }: { opts: Opts }) {
  const [T, setT] = useState(opts.T ?? 25);
  const mode = opts.mode ?? "state";
  const colors = ["var(--velocity)", "var(--accel)", "var(--mastered)"];

  return (
    <div className="particle-figure">
      <p className="stage-prompt"><span aria-hidden>◉</span> {opts.task ?? "Watch how particles behave as conditions change."}</p>
      <svg viewBox="0 0 1000 420" width="100%" role="img" aria-label={`Particle model: ${mode}`}>
        <rect x="8" y="8" width="984" height="404" rx="5" fill="var(--paper-2)" stroke="var(--rule)" />
        {mode === "sort" && (opts.boxes as { f: string; n: number }[][] ?? [[{ f: "O2", n: 6 }]]).map((box, i) => (
          <g key={i}>
            <rect x={60 + i * 300} y="70" width="260" height="260" rx="8" fill="var(--paper)" stroke="var(--rule)" strokeWidth="2" />
            <text x={190 + i * 300} y="110" textAnchor="middle" fontSize="14" fontFamily="var(--font-mono)" fill="var(--ink)">{box[0]?.f}</text>
            {Array.from({ length: Math.min(20, box.reduce((s, p) => s + p.n, 0)) }, (_, j) => (
              <circle key={j} cx={90 + ((j * 47) % 190)} cy={140 + ((j * 61) % 160)} r="12" fill={colors[i % colors.length]} opacity="0.85" />
            ))}
          </g>
        ))}
        {mode !== "sort" && (
          <g>
            <rect x="120" y="70" width="760" height="260" rx="8" fill="var(--paper)" stroke="var(--rule)" strokeWidth="2" />
            <line x1="120" y1="330" x2="880" y2="330" stroke="var(--ink)" strokeWidth="3" />
            {Array.from({ length: 28 }, (_, j) => {
              const speed = Math.max(0.4, (T + 273) / 300);
              const y = 310 - ((j * 53) % 210) / speed;
              return <circle key={j} cx={150 + ((j * 71) % 700)} cy={Math.max(90, y)} r="9" fill={colors[j % 3]} opacity="0.8" />;
            })}
            <text x="150" y="60" fontSize="12" fontFamily="var(--font-mono)" fill="var(--ink-2)">{opts.f ?? "H₂O"} · T = {(T - 273).toFixed(0)} °C</text>
            <text x="150" y="360" fontSize="12" fontFamily="var(--font-mono)" fill="var(--ink-3)">{T > 100 ? "gas — particles spread out" : T > 0 ? "liquid — particles close, moving" : "solid — particles packed, vibrating"}</text>
          </g>
        )}
        <text x="34" y="34" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">particle model · simplified · not to scale</text>
      </svg>
      <div className="figure-controls">
        <label>Temperature {T} K<input type="range" min="200" max="500" step="5" value={T} onChange={(e) => setT(Number(e.target.value))} /></label>
        <span aria-live="polite">{mode === "state" ? `${opts.f ?? "H₂O"} at ${T} K` : mode === "react" ? (opts.eq ?? "reaction") : "classify each box"}</span>
      </div>
    </div>
  );
}
