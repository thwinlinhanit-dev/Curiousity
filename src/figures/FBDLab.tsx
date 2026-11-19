import { useCallback, useState } from "react";
import { DraggableRenderer, param, translate, type Draggable } from "dragology";

type Vec = { x: number; y: number };
type FbdState = { f: Record<string, Vec> };
type Force = { key: string; label: string; color: string; expected: Vec };
type Scenario = { id: string; title: string; task: string; forces: Force[]; scale: number };

const V = (x: number, y: number): Vec => ({ x, y });
const scenarios: Scenario[] = [
  {
    id: "free-body-diagrams", title: "Box pushed at steady speed", scale: 0.55,
    task: "Draw the forces on a box being pushed to the right across a rough floor at a steady speed.",
    forces: [
      { key: "gravity", label: "weight", color: "var(--accel)", expected: V(0, -196) },
      { key: "normal", label: "normal", color: "var(--mastered)", expected: V(0, 196) },
      { key: "applied", label: "push", color: "var(--velocity)", expected: V(120, 0) },
      { key: "friction", label: "friction", color: "var(--review)", expected: V(-120, 0) },
    ],
  },
  {
    id: "forces-at-angles", title: "Rope at 30°", scale: 0.55,
    task: "Compare the normal force with the weight — the rope's upward part makes up the difference.",
    forces: [
      { key: "gravity", label: "weight", color: "var(--accel)", expected: V(0, -196) },
      { key: "normal", label: "normal", color: "var(--mastered)", expected: V(0, 171) },
      { key: "tension", label: "tension 50 N @30°", color: "var(--velocity)", expected: V(43.3, 25) },
      { key: "friction", label: "friction", color: "var(--review)", expected: V(-34.2, 0) },
    ],
  },
  {
    id: "inclined-planes", title: "Block on a 30° incline", scale: 1.1,
    task: "Draw the weight straight down and the normal perpendicular to the slope.",
    forces: [
      { key: "gravity", label: "weight", color: "var(--accel)", expected: V(0, -49) },
      { key: "normal", label: "normal", color: "var(--mastered)", expected: V(24.5, 42.4) },
    ],
  },
  {
    id: "mass-weight", title: "Hanging mass", scale: 1.1,
    task: "A mass hangs at rest. Draw the two forces acting on it.",
    forces: [
      { key: "gravity", label: "weight", color: "var(--accel)", expected: V(0, -49) },
      { key: "tension", label: "tension", color: "var(--mastered)", expected: V(0, 49) },
    ],
  },
  {
    id: "forces-intro", title: "Ball falling at terminal speed", scale: 6,
    task: "At terminal speed the forces balance. Draw weight and air resistance.",
    forces: [
      { key: "gravity", label: "weight", color: "var(--accel)", expected: V(0, -9.8) },
      { key: "drag", label: "air resistance", color: "var(--velocity)", expected: V(0, 9.8) },
    ],
  },
];

const CX = 400, CY = 210;
// Tips are parked ~26 px apart on screen (in model units that is 26/scale) so
// each one is grabbable; a parked tip reads as 0 N in the readout and grade.
const PARK_PX = 26;
const parkRadius = (s: Scenario) => PARK_PX / s.scale;
const zero = (s: Scenario): FbdState => ({
  f: Object.fromEntries(s.forces.map((f, i) => {
    const a = (i * 2 * Math.PI) / Math.max(1, s.forces.length);
    return [f.key, V(Math.cos(a) * parkRadius(s), Math.sin(a) * parkRadius(s))];
  })),
});
const magnitude = (v: Vec) => Math.hypot(v.x, v.y);
const shownMagnitude = (v: Vec, scale: number) => (magnitude(v) <= PARK_PX / scale + 1 ? 0 : magnitude(v));

export default function FBDLab() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const scene = scenarios[sceneIdx];
  const [state, setState] = useState<FbdState>(() => zero(scenarios[0]));
  const [preview, setPreview] = useState<FbdState | null>(null);
  const [checked, setChecked] = useState(false);
  const [showExpected, setShowExpected] = useState(false);

  const reset = (s: Scenario = scene) => { setState(zero(s)); setPreview(null); setChecked(false); setShowExpected(false); };
  const select = (i: number) => { setSceneIdx(i); reset(scenarios[i]); };

  const grade = (s: FbdState) => scene.forces.map((f) => {
    const v = s.f[f.key] ?? V(0, 0);
    const mag = shownMagnitude(v, scene.scale), exp = magnitude(f.expected);
    const mOk = Math.abs(mag - exp) <= Math.max(4, exp * 0.18);
    const cross = v.x * f.expected.y - v.y * f.expected.x;
    const dot = v.x * f.expected.x + v.y * f.expected.y;
    const angOk = mag < 1 || Math.abs(Math.atan2(cross, dot)) < 0.22;
    return { key: f.key, label: f.label, ok: mOk && angOk };
  });
  const live = preview ?? state;
  const liveGrade = grade(live);
  const allOk = grade(state).every((g) => g.ok);

  // Declarative dragging: describe which model states the tip can reach.
  // Dragology renders those states speculatively and interpolates the tip.
  const draggable = useCallback<Draggable<FbdState>>(({ state: s, d, draggedId }) => (
    <g>
      <rect x="40" y="40" width="720" height="340" rx="8" fill="var(--paper-2)" stroke="var(--rule)" />
      <line x1="120" y1={CY + 12} x2="680" y2={CY + 12} stroke="var(--ink-3)" strokeWidth="2" />
      <rect x={CX - 22} y={CY - 14} width="44" height="26" rx="4" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
      <text x={CX} y={CY + 5} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink)">m</text>
      {scene.forces.map((f) => {
        const v = s.f[f.key] ?? V(0, 0);
        const tx = CX + v.x * scene.scale, ty = CY - v.y * scene.scale;
        const ex = CX + f.expected.x * scene.scale, ey = CY - f.expected.y * scene.scale;
        const tipId = `tip-${f.key}`;
        return (
          <g id={`force-${f.key}`}>
            <line id={`line-${f.key}`} x1={CX} y1={CY} x2={tx} y2={ty} stroke={f.color} strokeWidth="3" />
            <circle id={`target-${f.key}`} cx={ex} cy={ey} r={showExpected ? 9 : 6} fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeDasharray="3 3" opacity={showExpected ? 1 : 0.4} />
            <circle
              id={tipId}
              role="button"
              tabIndex={0}
              aria-label={`${f.label} arrow tip — drag or use arrow keys`}
              transform={translate(tx, ty)}
              r={draggedId === tipId ? 14 : 11}
              fill={draggedId === tipId ? f.color : "var(--paper)"}
              stroke={f.color}
              strokeWidth="2.5"
              style={{ cursor: "grab" }}
              dragologyOnDrag={() => d.vary(s, [param("f", f.key, "x"), param("f", f.key, "y")])}
              onKeyDown={(e: React.KeyboardEvent) => {
                const step = e.shiftKey ? 10 : 2;
                const delta = e.key === "ArrowRight" ? V(step, 0) : e.key === "ArrowLeft" ? V(-step, 0)
                  : e.key === "ArrowUp" ? V(0, step / scene.scale) : e.key === "ArrowDown" ? V(0, -step / scene.scale) : null;
                if (delta) {
                  e.preventDefault();
                  setState((prev) => ({ f: { ...prev.f, [f.key]: V((prev.f[f.key]?.x ?? 0) + delta.x, (prev.f[f.key]?.y ?? 0) + delta.y) } }));
                }
              }}
            />
            <text x={tx + (v.x >= 0 ? 14 : -14)} y={ty - 12} textAnchor={v.x >= 0 ? "start" : "end"} fontSize="11" fontFamily="var(--font-mono)" fill={f.color}>{f.label}</text>
          </g>
        );
      })}
      <text x="60" y="64" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">drag arrow tips · {scene.scale} px per N</text>
    </g>
  ), [scene, showExpected]);

  return (
    <div className="fbd-lab">
      <div className="fbd-scenes" role="group" aria-label="Scenarios">
        {scenarios.map((s, i) => <button key={s.id} className={i === sceneIdx ? "chip active" : "chip"} aria-pressed={i === sceneIdx} onClick={() => select(i)}>{s.title}</button>)}
      </div>
      <p className="stage-prompt"><span aria-hidden>◉</span> {scene.task}</p>
      <DraggableRenderer
        draggable={draggable}
        state={state}
        onDropState={(s) => { setState(s); setPreview(null); setChecked(false); }}
        onDragState={(s) => { setPreview(s); setChecked(false); }}
        width={1000}
        height={420}
      />
      <div className="figure-controls" aria-live="polite">
        {scene.forces.map((f, i) => (
          <span key={f.key} style={{ color: f.color }}>
            {f.label}: {shownMagnitude(live.f[f.key] ?? V(0, 0), scene.scale).toFixed(1)} N {liveGrade[i].ok ? "✓" : "·"}
          </span>
        ))}
        <span style={{ color: "var(--ink-3)" }}>
          ΣFx = {scene.forces.reduce((a, f) => a + (live.f[f.key]?.x ?? 0), 0).toFixed(1)} N ·
          ΣFy = {scene.forces.reduce((a, f) => a + (live.f[f.key]?.y ?? 0), 0).toFixed(1)} N
        </span>
      </div>
      <div className="figure-controls">
        <button className="btn-primary" onClick={() => { setChecked(true); setShowExpected(true); }}>Check diagram</button>
        <button className="btn" onClick={() => reset()}>Reset</button>
        <span aria-live="polite" style={{ color: checked ? (allOk ? "var(--mastered)" : "var(--signal)") : "var(--ink-3)" }}>
          {checked ? (allOk ? "All forces are right." : `Check: ${grade(state).filter((g) => !g.ok).map((g) => g.label).join(", ")}`) : "Drag each arrow tip, then check."}
        </span>
      </div>
      <p style={{ color: "var(--ink-3)", fontSize: "var(--fs-0)" }}>
        Drag an arrow tip and watch the force readouts update as you go. You can also focus a tip and use the arrow keys.
      </p>
    </div>
  );
}
