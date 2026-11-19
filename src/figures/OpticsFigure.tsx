import { useMemo, useState } from "react";

type Opts = { f?: number; doDist?: number; objH?: number; task?: string; [k: string]: unknown };
type Pt = [number, number];

export default function OpticsFigure({ opts }: { opts: Opts }) {
  const [f, setF] = useState(opts.f ?? 2);
  const [doDist, setDoDist] = useState(opts.doDist ?? 6);
  const [h, setH] = useState(opts.objH ?? 1.2);
  const lensX = 0;
  const objX = -doDist;
  const di = Math.abs(1 / f - 1 / doDist) < 1e-6 ? Infinity : 1 / (1 / f - 1 / doDist);
  const m = -di / doDist;
  const real = di > 0;

  const rays = useMemo(() => {
    const w = window as unknown as { MathLadder?: { physModels?: { paraxial?: (l: { x: number; f: number }[], y: number, u: number, x0: number) => { pts: Pt[] } } } };
    const fn = w.MathLadder?.physModels?.paraxial;
    const base = fn ? [fn([{ x: lensX, f }], h, 0, objX).pts, fn([{ x: lensX, f }], h, (0 - h) / (lensX - objX), objX).pts]
      : [
          [[objX, h], [lensX, h], [Math.min(di, 8), h + (0 - h) * ((Math.min(di, 8) - lensX) / f)]] as Pt[],
          [[objX, h], [lensX, 0], [Math.min(di, 8), -h * (Math.min(di, 8) / f)]] as Pt[],
        ];
    return base;
  }, [f, doDist, h, di]);

  const X = (x: number) => 500 + x * 62;
  const Y = (y: number) => 220 - y * 62;
  const maxX = 8;
  const imageX = Number.isFinite(di) ? Math.max(-maxX, Math.min(maxX, di)) : maxX;
  const imageH = Number.isFinite(di) ? m * h : 0;

  return (
    <div className="optics-figure">
      <svg viewBox="0 0 1000 460" width="100%" role="img" aria-label={`Convex lens: object at ${doDist} m, image at ${Number.isFinite(di) ? di.toFixed(2) : "infinity"} m`}>
        <rect x="8" y="8" width="984" height="444" rx="5" fill="var(--paper-2)" stroke="var(--rule)" />
        <line x1="40" y1={Y(0)} x2="960" y2={Y(0)} stroke="var(--ink-3)" strokeWidth="1.2" />
        {[-f, f].map((x, i) => <g key={i}>
          <circle cx={X(x)} cy={Y(0)} r="4" fill="var(--ink-3)" />
          <text x={X(x)} y={Y(0) + 20} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">F{i === 0 ? "₁" : "₂"}</text>
        </g>)}
        {/* lens */}
        <path d={`M ${X(0)} ${Y(-2.4)} Q ${X(0) + 16} ${Y(0)} ${X(0)} ${Y(2.4)} Q ${X(0) - 16} ${Y(0)} ${X(0)} ${Y(-2.4)} Z`} fill="var(--velocity)" opacity="0.16" stroke="var(--velocity)" strokeWidth="2" />
        <text x={X(0) + 20} y={Y(2.2)} fontSize="11" fontFamily="var(--font-mono)" fill="var(--velocity)">f = {f.toFixed(2)} m</text>
        {/* object */}
        <line x1={X(objX)} y1={Y(0)} x2={X(objX)} y2={Y(h)} stroke="var(--signal)" strokeWidth="4" />
        <path d={`M ${X(objX)} ${Y(h)} l -6 12 l 12 0 Z`} fill="var(--signal)" />
        <text x={X(objX)} y={Y(h) - 10} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--signal)">object</text>
        {/* rays */}
        {rays.map((pts, i) => <polyline key={i} points={pts.map(([x, y]) => `${X(Math.max(-maxX, Math.min(maxX, x)))},${Y(Math.max(-3, Math.min(3, y)))}`).join(" ")} fill="none" stroke={i === 0 ? "var(--velocity)" : "var(--accel)"} strokeWidth="2" opacity="0.85" />)}
        {/* image */}
        {Number.isFinite(di) && (
          <g>
            <line x1={X(imageX)} y1={Y(0)} x2={X(imageX)} y2={Y(imageH)} stroke={real ? "var(--mastered)" : "var(--review)"} strokeWidth="4" strokeDasharray={real ? undefined : "6 4"} />
            <text x={X(imageX)} y={Y(imageH) - 10} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={real ? "var(--mastered)" : "var(--review)"}>{real ? "real image" : "virtual image"}</text>
          </g>
        )}
        <text x="34" y="34" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">paraxial ray tracing · repo model · not to scale</text>
      </svg>
      <div className="figure-controls">
        <label>f {f.toFixed(2)} m<input type="range" min="1" max="5" step="0.1" value={f} onChange={(e) => setF(Number(e.target.value))} /></label>
        <label>object distance {doDist.toFixed(1)} m<input type="range" min="1" max="12" step="0.5" value={doDist} onChange={(e) => setDoDist(Number(e.target.value))} /></label>
        <label>height {h.toFixed(1)} m<input type="range" min="0.4" max="2" step="0.1" value={h} onChange={(e) => setH(Number(e.target.value))} /></label>
        <span aria-live="polite">1/f = 1/do + 1/di → di = {Number.isFinite(di) ? di.toFixed(2) + " m" : "∞"} · m = {m.toFixed(2)} · {real ? "real, inverted" : "virtual, upright"}</span>
      </div>
    </div>
  );
}
