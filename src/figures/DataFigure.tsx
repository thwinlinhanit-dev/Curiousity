import { useState } from "react";

type Series = { name: string; values: number[] };
type Opts = { kind?: string; x?: string[]; series?: Series[]; bins?: string[]; cards?: { text: string; bin?: number }[]; task?: string; [k: string]: unknown };

export default function DataFigure({ opts }: { opts: Opts }) {
  const [hidden, setHidden] = useState<number[]>([]);
  const colors = ["var(--velocity)", "var(--accel)", "var(--mastered)", "var(--review)"];
  const xs = opts.x ?? opts.bins ?? [];
  const series = opts.series ?? [];
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const W = 1000, H = 400, L = 80, B = 330, PW = 850, PH = 250;

  if (opts.cards) return (
    <div className="data-figure">
      <p className="stage-prompt"><span aria-hidden>◉</span> {opts.task ?? "Sort each statement into the right bin."}</p>
      <div className="classify-bins">
        {(opts.bins ?? []).map((b, i) => <div key={i}><b>{b}</b><ul>{opts.cards!.filter((c) => c.bin === i).map((c, j) => <li key={j}>{c.text}</li>)}</ul></div>)}
      </div>
    </div>
  );

  return (
    <div className="data-figure">
      <p className="stage-prompt"><span aria-hidden>◉</span> {opts.task ?? "Read the data: toggle a series to compare."}</p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Data chart">
        <rect x="8" y="8" width="984" height="384" rx="5" fill="var(--paper-2)" stroke="var(--rule)" />
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => <line key={i} x1={L} y1={B - v * PH} x2={L + PW} y2={B - v * PH} stroke="var(--rule)" strokeWidth="1" />)}
        {opts.kind === "bar" ? series.map((s, si) => hidden.includes(si) ? null : s.values.map((v, i) => (
          <rect key={`${si}-${i}`} x={L + 20 + i * (PW / Math.max(1, xs.length)) + si * 14} y={B - (v / max) * PH} width={Math.max(10, PW / xs.length / (series.length + 1) - 6)} height={(v / max) * PH} fill={colors[si % colors.length]} opacity="0.85" />
        ))) : series.map((s, si) => hidden.includes(si) ? null : (
          <polyline key={si} fill="none" stroke={colors[si % colors.length]} strokeWidth="2.8"
            points={s.values.map((v, i) => `${L + (i / Math.max(1, s.values.length - 1)) * PW},${B - (v / max) * PH}`).join(" ")} />
        ))}
        {xs.map((x, i) => <text key={i} x={L + (i / Math.max(1, xs.length - 1)) * PW} y={B + 20} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-3)">{x}</text>)}
        <text x="34" y="34" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">{opts.kind ?? "chart"} · repo data · not to scale</text>
      </svg>
      <div className="figure-controls">
        {series.map((s, i) => <button key={i} className="chip" aria-pressed={!hidden.includes(i)} onClick={() => setHidden((h) => h.includes(i) ? h.filter((x) => x !== i) : [...h, i])}>{hidden.includes(i) ? "○" : "◉"} {s.name}</button>)}
        <span aria-live="polite">{series.length} data series</span>
      </div>
    </div>
  );
}
