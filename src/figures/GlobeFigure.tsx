import { useState } from "react";

type Opts = { mode?: string; date?: string; lat?: number; grid?: number; terminator?: boolean; points?: { lat: number; lon: number; label?: string }[]; task?: string; [k: string]: unknown };

export default function GlobeFigure({ opts }: { opts: Opts }) {
  const [day, setDay] = useState(80);
  const [spin, setSpin] = useState(0);
  const r = 150, cx = 500, cy = 210;
  const X = (lon: number, lat: number) => cx + r * Math.cos(lat * Math.PI / 180) * Math.sin((lon + spin) * Math.PI / 180);
  const Y = (lat: number) => cy - r * Math.sin(lat * Math.PI / 180);
  const tilt = 23.5 * Math.sin((day / 365) * 2 * Math.PI);

  return (
    <div className="globe-figure">
      <p className="stage-prompt"><span aria-hidden>◉</span> {opts.task ?? "Turn the globe and watch the grid, day and night line and marked places."}</p>
      <svg viewBox="0 0 1000 440" width="100%" role="img" aria-label="Earth globe with latitude and longitude">
        <rect x="8" y="8" width="984" height="424" rx="5" fill="var(--paper-2)" stroke="var(--rule)" />
        <circle cx={cx} cy={cy} r={r} fill="var(--velocity)" opacity="0.12" stroke="var(--velocity)" strokeWidth="2" />
        {[-60, -30, 0, 30, 60].map((lat) => <ellipse key={lat} cx={cx} cy={Y(lat)} rx={r * Math.cos(lat * Math.PI / 180)} ry="7" fill="none" stroke="var(--ink-3)" strokeWidth="1" opacity="0.6" />)}
        {[0, 1, 2, 3, 4, 5].map((i) => <ellipse key={i} cx={cx} cy={cy} rx={r * Math.abs(Math.cos((i * 30 + spin) * Math.PI / 180))} ry={r} fill="none" stroke="var(--ink-3)" strokeWidth="1" opacity="0.5" />)}
        {opts.terminator !== false && <path d={`M ${cx - r} ${cy - tilt} Q ${cx} ${cy - 3 * tilt} ${cx + r} ${cy + tilt} L ${cx + r} ${cy + r + 40} L ${cx - r} ${cy + r + 40} Z`} fill="var(--ink)" opacity="0.18" />}
        {(opts.points ?? []).map((p, i) => <g key={i}><circle cx={X(p.lon, p.lat)} cy={Y(p.lat)} r="6" fill="var(--signal)" /><text x={X(p.lon, p.lat) + 10} y={Y(p.lat) - 8} fontSize="11" fontFamily="var(--font-mono)" fill="var(--signal)">{p.label ?? `${p.lat},${p.lon}`}</text></g>)}
        <text x="34" y="34" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">Earth model · simplified · not to scale</text>
      </svg>
      <div className="figure-controls">
        <label>rotation {spin}°<input type="range" min="-180" max="180" step="5" value={spin} onChange={(e) => setSpin(Number(e.target.value))} /></label>
        <label>day {day}<input type="range" min="1" max="365" step="1" value={day} onChange={(e) => setDay(Number(e.target.value))} /></label>
        <span aria-live="polite">axial tilt {tilt.toFixed(1)}° · {opts.mode ?? "globe"}</span>
      </div>
    </div>
  );
}
