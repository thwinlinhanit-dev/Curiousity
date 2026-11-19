import { useMemo, useState } from "react";

type Opts = {
  f?: string; left?: string; right?: string; a?: number; fa?: string | number; h?: number;
  xmin?: number; xmax?: number; ymin?: number; ymax?: number; table?: boolean; trace?: boolean;
  task?: string; [k: string]: unknown;
};

function evaluator() {
  const ML = (window as unknown as { MathLadder?: { evalPlain?: (s: string, env: Record<string, number>) => number } }).MathLadder;
  if (ML?.evalPlain) return (expr: string, x: number) => ML.evalPlain!(expr, { x });
  return (expr: string, x: number) => {
    const js = expr.replace(/\^/g, "**").replace(/sqrt\(/g, "Math.sqrt(")
      .replace(/sin\(/g, "Math.sin(").replace(/cos\(/g, "Math.cos(");
    try { return Function("x", `return (${js})`)(x); } catch { return NaN; }
  };
}

export default function FunctionFigure({ opts }: { opts: Opts }) {
  const [h, setH] = useState(opts.h ?? 0.6);
  const a = opts.a ?? 0;
  const xmin = opts.xmin ?? a - 4, xmax = opts.xmax ?? a + 4;
  const ymin = opts.ymin ?? -8, ymax = opts.ymax ?? 8;
  const evalFn = useMemo(evaluator, []);
  const f = (x: number) => evalFn(opts.f ?? "x", x);
  const left = (x: number) => evalFn(opts.left ?? opts.f ?? "x", x);
  const right = (x: number) => evalFn(opts.right ?? opts.f ?? "x", x);
  const X = (x: number) => 70 + ((x - xmin) / (xmax - xmin)) * 850;
  const Y = (y: number) => 330 - ((Math.max(ymin, Math.min(ymax, y)) - ymin) / (ymax - ymin)) * 270;

  const curve = (fn: (x: number) => number) => {
    const pts: string[] = [];
    let prev: [number, number] | null = null;
    for (let i = 0; i <= 400; i++) {
      const x = xmin + ((xmax - xmin) * i) / 400, y = fn(x);
      if (!Number.isFinite(y) || Math.abs(y) > 1e5) { prev = null; continue; }
      const p: [number, number] = [X(x), Y(y)];
      if (prev && Math.hypot(p[0] - prev[0], p[1] - prev[1]) < 80) pts.push(`${p[0]},${p[1]}`);
      else if (pts.length) { const out = pts.join(" "); pts.length = 0; return out; }
      prev = p;
    }
    return pts.join(" ");
  };

  const nearL = f(a - h), nearR = f(a + h), atA = f(a);
  const rows = [h, h / 2, h / 4].filter((v) => v > 0.001).map((v) => ({ v, l: f(a - v), r: f(a + v) }));

  return (
    <div className="function-figure">
      <p className="stage-prompt"><span aria-hidden>◉</span> {opts.task ?? "Drag the slider to bring the points closer to the limit."}</p>
      <svg viewBox="0 0 1000 400" width="100%" role="img" aria-label={`Graph of ${opts.f ?? "x"} near x = ${a}`}>
        <rect x="8" y="8" width="984" height="384" rx="5" fill="var(--paper-2)" stroke="var(--rule)" />
        {[ymin, 0, ymax].map((v, i) => <line key={i} x1="70" y1={Y(v)} x2="920" y2={Y(v)} stroke="var(--rule)" strokeWidth="1" />)}
        {[xmin, a, xmax].map((v, i) => <line key={i} x1={X(v)} y1="60" x2={X(v)} y2="330" stroke={i === 1 ? "var(--ink-3)" : "var(--rule)"} strokeWidth="1" strokeDasharray={i === 1 ? "4 3" : undefined} />)}
        <text x="924" y={Y(0) + 4} fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">x</text>
        <text x={X(a) + 6} y="62" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">a = {a}</text>
        {opts.left && <polyline points={curve(left)} fill="none" stroke="var(--velocity)" strokeWidth="2.6" />}
        <polyline points={curve(f)} fill="none" stroke="var(--velocity)" strokeWidth="2.6" opacity={opts.left ? 0.35 : 1} />
        {opts.right && <polyline points={curve(right)} fill="none" stroke="var(--accel)" strokeWidth="2.6" />}
        <circle cx={X(a - h)} cy={Y(nearL)} r="6" fill="var(--velocity)" />
        <circle cx={X(a + h)} cy={Y(nearR)} r="6" fill="var(--accel)" />
        {Number.isFinite(atA) && <circle cx={X(a)} cy={Y(atA)} r="6" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />}
        <text x="34" y="34" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">repo graph model · simplified · not to scale</text>
      </svg>
      <div className="figure-controls">
        <label>h = {h.toFixed(3)}<input type="range" min="0.01" max={(opts.h ?? 0.6) * 2} step="0.01" value={h} onChange={(e) => setH(Number(e.target.value))} /></label>
        <span style={{ color: "var(--velocity)" }}>f(a−h) = {Number.isFinite(nearL) ? nearL.toFixed(4) : "—"}</span>
        <span style={{ color: "var(--accel)" }}>f(a+h) = {Number.isFinite(nearR) ? nearR.toFixed(4) : "—"}</span>
        <span aria-live="polite">f(a) = {Number.isFinite(atA) ? atA.toFixed(4) : "undefined"}</span>
      </div>
      {opts.table !== false && rows.length > 0 && (
        <table className="limit-table">
          <thead><tr><th>h</th><th>a − h</th><th>f(a − h)</th><th>a + h</th><th>f(a + h)</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.v}><td>{r.v.toFixed(3)}</td><td>{(a - r.v).toFixed(3)}</td><td>{Number.isFinite(r.l) ? r.l.toFixed(4) : "—"}</td><td>{(a + r.v).toFixed(3)}</td><td>{Number.isFinite(r.r) ? r.r.toFixed(4) : "—"}</td></tr>)}</tbody>
        </table>
      )}
    </div>
  );
}
