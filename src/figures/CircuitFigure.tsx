import { useEffect, useMemo, useState } from "react";
import { loadViz } from "../viz/loadViz";

type Comp = { type: string; label: string; value: number; a: string; b: string; closed?: boolean; off?: boolean };
type Tree = { kind: "series" | "par"; kids: Tree[] } | { kind: "leaf"; comp: Comp };
type CircuitOpts = { circuit?: string | Comp[]; mode?: string; edit?: boolean; task?: string; [k: string]: unknown };
type SolveResult = { V: Record<string, number>; I: number[] };

// Minimal parser for the repo's shorthand: V(12) series(R1:4, par(R2:6, R3:3))
function parseShort(src: string): { source: Comp; tree: Tree } {
  const s = src.replace(/\s+/g, " ").trim();
  const m = /^([A-Za-z]+)\(([-\d.]+)\)\s*([\s\S]+)$/.exec(s);
  if (!m) throw new Error("circuit: expected V(volts) then a network");
  const source: Comp = { type: "V", label: "V", value: Number(m[2]), a: "top", b: "ret" };
  let pos = 0;
  function splitItems(inner: string): string[] { const out: string[] = []; let d = 0, cur = ""; for (const ch of inner) { if (ch === "(") d++; if (ch === ")") d--; if (ch === "," && !d) { out.push(cur); cur = ""; } else cur += ch; } if (cur.trim()) out.push(cur); return out; }
  function parseTree(text: string): Tree {
    const local = text.trim(); const save = s.slice(pos); const oldPos = pos;
    // parse a standalone expression by temporarily reading from `local`
    const w = /^([A-Za-z][A-Za-z0-9]*)/.exec(local); if (!w) throw new Error("network expected");
    const kind = w[1];
    if (kind === "series" || kind === "par") {
      let i = kind.length; while (local[i] === " ") i++;
      let d = 0, st = i; for (; i < local.length; i++) { if (local[i] === "(") d++; else if (local[i] === ")") { d--; if (!d) break; } }
      const kids = splitItems(local.slice(st + 1, i)).map(parseTree);
      void save; void oldPos;
      return { kind, kids };
    }
    const rest = local.slice(w[1].length).replace(/^\(([^)]*)\)/, "$1").trim();
    const [name, val = "10"] = rest.split(":");
    const prefix = /^[A-Za-z]+/.exec(name)?.[0] ?? "R";
    const type = prefix.toLowerCase().startsWith("bulb") ? "bulb" : prefix.toUpperCase() === "S" ? "S" : prefix.toUpperCase();
    return { kind: "leaf", comp: { type, label: name, value: Number(val) || 10, a: "", b: "" } };
  }
  const tree = parseTree(s.slice(m[0].length - (m[3].length)));
  return { source, tree };
}

function netlist(tree: Tree, a: string, b: string, comps: Comp[]): void {
  if (tree.kind === "leaf") { comps.push({ ...tree.comp, a, b }); return; }
  if (tree.kind === "series") {
    let node = a;
    tree.kids.forEach((k, i) => { const next = i === tree.kids.length - 1 ? b : `n${comps.length}_${i}`; netlist(k, node, next, comps); node = next; });
  } else {
    // Parallel branches share both nodes — electrically correct; PM.solve handles it.
    tree.kids.forEach((k) => netlist(k, a, b, comps));
  }
}

export default function CircuitFigure({ opts }: { opts: CircuitOpts }) {
  const [sourceV, setSourceV] = useState(12);
  const [openSwitch, setOpenSwitch] = useState(false);
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => { loadViz().then(() => setReady(true)).catch(() => setReady(true)); }, []);

  const { source, tree } = useMemo(() => {
    try {
      if (typeof opts.circuit === "string") return parseShort(opts.circuit);
    } catch { /* fall through */ }
    return {
      source: { type: "V", label: "V", value: 12, a: "top", b: "ret" } as Comp,
      tree: { kind: "series", kids: [{ kind: "leaf", comp: { type: "R", label: "R1", value: 4, a: "", b: "" } }] } as Tree,
    };
  }, [opts.circuit]);

  const comps = useMemo(() => {
    const list: Comp[] = [{ ...source, value: sourceV }];
    netlist(tree, "top", "ret", list);
    return list.map((c) => c.type === "S" ? { ...c, closed: !openSwitch } : c);
  }, [source, tree, sourceV, openSwitch]);

  const sol = useMemo<SolveResult | null>(() => {
    const w = window as unknown as { MathLadder?: { physModels?: { solve?: (c: Comp[]) => SolveResult } } };
    try { return w.MathLadder?.physModels?.solve?.(comps) ?? null; } catch { return null; }
  }, [comps, ready]);

  useEffect(() => {
    const w = window as unknown as { MathLadder?: { typeset?: (r: HTMLElement) => void } };
    const el = document.querySelector(".circuit-read");
    if (w.MathLadder?.typeset && el instanceof HTMLElement) w.MathLadder.typeset(el);
  }, [sol]);

  const put = (i: number) => {
    const c = comps[i];
    const I = sol?.I[i] ?? 0;
    const Vd = sol ? (sol.V[c.a] ?? 0) - (sol.V[c.b] ?? 0) : 0;
    return { I, Vd, c };
  };

  return (
    <div className="circuit-figure">
      <svg viewBox="0 0 1000 420" width="100%" role="img" aria-label="Circuit schematic with live currents and voltages">
        <rect x="8" y="8" width="984" height="404" rx="5" fill="var(--paper-2)" stroke="var(--rule)" />
        {/* source on the left */}
        <line x1="120" y1="330" x2="120" y2="90" stroke="var(--ink)" strokeWidth="2" />
        <circle cx="120" cy="210" r="26" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
        <line x1="110" y1="195" x2="110" y2="225" stroke="var(--accel)" strokeWidth="4" />
        <line x1="130" y1="203" x2="130" y2="217" stroke="var(--ink)" strokeWidth="2" />
        <text x="92" y="170" textAnchor="end" fontSize="12" fontFamily="var(--font-mono)" fill="var(--ink-2)">{sourceV} V</text>
        <line x1="120" y1="90" x2="860" y2="90" stroke="var(--ink)" strokeWidth="2" />
        <line x1="120" y1="330" x2="860" y2="330" stroke="var(--ink)" strokeWidth="2" />

        {/* series chain along the top, with branches below */}
        {comps.slice(1).map((c, j) => {
          const x = 200 + j * 140;
          const y = c.type === "S" ? 90 : 90;
          const { I, Vd } = put(j + 1);
          const on = Math.abs(I) > 1e-4;
          return (
            <g key={j} onClick={() => setSelected(j + 1)} style={{ cursor: "pointer" }}>
              <line x1={x - 62} y1={y} x2={x - 34} y2={y} stroke="var(--ink)" strokeWidth="2" />
              <line x1={x + 34} y1={y} x2={x + 62} y2={y} stroke="var(--ink)" strokeWidth="2" />
              {c.type === "S" ? (
                <g>
                  <circle cx={x - 30} cy={y} r="4" fill="var(--ink)" /><circle cx={x + 30} cy={y} r="4" fill="var(--ink)" />
                  <line x1={x - 30} y1={y} x2={x + (c.closed === false ? 14 : 30)} y2={c.closed === false ? y - 28 : y} stroke={c.closed === false ? "var(--accel)" : "var(--ink)"} strokeWidth="3" />
                </g>
              ) : (
                <g>
                  <rect x={x - 34} y={y - 18} width="68" height="36" rx="4" fill={selected === j + 1 ? "var(--paper)" : "var(--paper-2)"} stroke={selected === j + 1 ? "var(--signal)" : "var(--ink)"} strokeWidth={selected === j + 1 ? 2.5 : 1.5} />
                  <text x={x} y={y + 5} textAnchor="middle" fontSize="13" fontFamily="var(--font-mono)" fill="var(--ink)">{c.label}</text>
                  <text x={x} y={y + 32} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">{c.value}{c.type === "R" ? "Ω" : ""}</text>
                </g>
              )}
              {on && <path d={`M ${x - 60} ${y - 26} L ${x - 20} ${y - 26}`} stroke="var(--velocity)" strokeWidth="2" markerEnd="url(#arrowv)" />}
              <text x={x} y={y - 40} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--velocity)">I = {Math.abs(I).toFixed(2)} A</text>
              <text x={x} y={y + 54} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--accel)">ΔV = {Vd.toFixed(1)} V</text>
            </g>
          );
        })}
        <defs><marker id="arrowv" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="var(--velocity)" /></marker></defs>
        <text x="40" y="380" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">click a part to select · click the switch to open/close · solved with the repo's PM.solve</text>
      </svg>
      <div className="figure-controls">
        <label>source {sourceV} V<input type="range" min="1" max="24" step="1" value={sourceV} onChange={(e) => setSourceV(Number(e.target.value))} /></label>
        <button className="btn" onClick={() => setOpenSwitch((o) => !o)}>{openSwitch ? "Close switch" : "Open switch"}</button>
        <span className="circuit-read" style={{ color: "var(--ink-2)" }}>
          {sol ? `Total current ${Math.abs(sol.I[0] ?? 0).toFixed(2)} A · equivalent R = ${(sourceV / Math.max(1e-6, Math.abs(sol.I[0] ?? 0))).toFixed(1)} Ω` : "Solving…"}
        </span>
      </div>
    </div>
  );
}
