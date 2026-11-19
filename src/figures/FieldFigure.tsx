import { useEffect, useMemo, useRef, useState } from "react";

type Charge = { x: number; y: number; q: number };
type Opts = { charges?: Charge[]; mode?: string; task?: string; [k: string]: unknown };
type FieldSample = { Ex: number; Ey: number; E: number; V: number };
const K = 9e9;

function localField(qs: Charge[], x: number, y: number): FieldSample {
  let Ex = 0, Ey = 0, V = 0;
  for (const q of qs) {
    const dx = x - q.x, dy = y - q.y, r2 = dx * dx + dy * dy, r = Math.sqrt(r2);
    if (r < 1e-9) continue;
    const e = (K * q.q) / r2;
    Ex += (e * dx) / r; Ey += (e * dy) / r; V += (K * q.q) / r;
  }
  return { Ex, Ey, E: Math.hypot(Ex, Ey), V };
}

export default function FieldFigure({ opts }: { opts: Opts }) {
  const charges: Charge[] = opts.charges ?? [{ x: -1.3, y: 0, q: 1e-9 }, { x: 1.3, y: 0, q: -1e-9 }];
  const [probe, setProbe] = useState({ x: 2.2, y: 1.4 });
  const host = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const field = useMemo(() => {
    const w = window as unknown as { MathLadder?: { physModels?: { efield?: (q: Charge[], x: number, y: number) => FieldSample } } };
    const fn = w.MathLadder?.physModels?.efield ?? localField;
    return (x: number, y: number) => fn(charges, x, y);
  }, [charges]);

  const sample = field(probe.x, probe.y);
  const X = (x: number) => 500 + x * 120;
  const Y = (y: number) => 240 - y * 120;
  const arrows: { x: number; y: number; a: number; m: number }[] = [];
  for (let gx = -3.5; gx <= 3.5; gx += 0.7) {
    for (let gy = -2.1; gy <= 2.1; gy += 0.7) {
      const s = field(gx, gy);
      if (s.E < 1e-4) continue;
      arrows.push({ x: gx, y: gy, a: Math.atan2(-s.Ey, s.Ex), m: Math.min(1, Math.log10(s.E + 1) / 5) });
    }
  }
  // Field lines by integrating from seeds around each charge.
  const lines: string[] = [];
  for (const q of charges) {
    for (let k = 0; k < 10; k++) {
      const th = (k / 10) * Math.PI * 2;
      let x = q.x + 0.14 * Math.cos(th), y = q.y + 0.14 * Math.sin(th);
      const pts: string[] = [`${X(x)},${Y(y)}`];
      for (let i = 0; i < 140; i++) {
        const s = field(x, y);
        if (s.E < 1e-5) break;
        const sign = q.q > 0 ? 1 : -1;
        const nx = x + (sign * s.Ex / s.E) * 0.045;
        const ny = y + (sign * s.Ey / s.E) * 0.045;
        if (Math.abs(nx) > 4 || Math.abs(ny) > 2.6) break;
        x = nx; y = ny; pts.push(`${X(x)},${Y(y)}`);
      }
      lines.push(pts.join(" "));
    }
  }

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging.current || !host.current) return;
      const r = host.current.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 1000;
      const py = ((e.clientY - r.top) / r.height) * 480;
      setProbe({ x: (px - 500) / 120, y: (240 - py) / 120 });
    };
    const up = () => { dragging.current = false; };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, []);

  return (
    <div className="field-figure">
      <svg ref={host} viewBox="0 0 1000 480" width="100%" role="img" aria-label={`Electric field: E at probe ${sample.E.toExponential(2)} newtons per coulomb`}>
        <rect x="8" y="8" width="984" height="464" rx="5" fill="var(--paper-2)" stroke="var(--rule)" />
        {arrows.map((a, i) => <g key={i} transform={`translate(${X(a.x)},${Y(a.y)}) rotate(${a.a * 180 / Math.PI})`}>
          <line x1={-8 * a.m} y1="0" x2={8 * a.m} y2="0" stroke="var(--ink-3)" strokeWidth="1.2" opacity={0.3 + a.m * 0.5} />
          <path d={`M ${8 * a.m} 0 L ${5 * a.m} -3 L ${5 * a.m} 3 Z`} fill="var(--ink-3)" opacity={0.3 + a.m * 0.5} />
        </g>)}
        {lines.map((pts, i) => <polyline key={i} points={pts} fill="none" stroke={charges[i % charges.length]?.q > 0 ? "var(--velocity)" : "var(--accel)"} strokeWidth="1.1" opacity="0.55" />)}
        {charges.map((q, i) => <g key={i}>
          <circle cx={X(q.x)} cy={Y(q.y)} r="16" fill={q.q > 0 ? "var(--velocity)" : "var(--accel)"} />
          <text x={X(q.x)} y={Y(q.y) + 6} textAnchor="middle" fontSize="16" fill="var(--paper)" fontFamily="var(--font-mono)">{q.q > 0 ? "+" : "−"}</text>
        </g>)}
        <g onPointerDown={(e) => { e.preventDefault(); dragging.current = true; }} style={{ cursor: "grab" }}>
          <circle cx={X(probe.x)} cy={Y(probe.y)} r="12" fill="var(--paper)" stroke="var(--signal)" strokeWidth="2.5" />
          <circle cx={X(probe.x)} cy={Y(probe.y)} r="4" fill="var(--signal)" />
          <text x={X(probe.x) + 16} y={Y(probe.y) - 10} fontSize="11" fontFamily="var(--font-mono)" fill="var(--signal)">probe · drag me</text>
        </g>
        <text x="28" y="34" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">E-field lines · simplified · not to scale</text>
      </svg>
      <div className="figure-controls">
        <span>probe ({probe.x.toFixed(2)}, {probe.y.toFixed(2)}) m</span>
        <span style={{ color: "var(--velocity)" }}>Ex = {sample.Ex.toExponential(2)} N/C</span>
        <span style={{ color: "var(--accel)" }}>Ey = {sample.Ey.toExponential(2)} N/C</span>
        <span>|E| = {sample.E.toExponential(2)} N/C</span>
        <span>V = {sample.V.toFixed(1)} V</span>
      </div>
    </div>
  );
}
