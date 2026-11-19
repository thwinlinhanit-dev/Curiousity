import { useCallback, useState } from "react";
import { DraggableRenderer, translate, type Draggable } from "dragology";

type LabState = { led: number; resistor: number; wire: number };
type Part = keyof LabState;
const N = 8;
const holes = Array.from({ length: N }, (_, i) => ({ x: 92 + i * 70, y: 0 }));
const target: LabState = { led: 3, resistor: 5, wire: 6 };

function makeLab(onMove: (part: Part, delta: number) => void): Draggable<LabState> {
  return ({ state, d, draggedId }) => {
    const ledStates: LabState[] = holes.map((_, i) => ({ ...state, led: i }));
    const resStates: LabState[] = holes.map((_, i) => ({ ...state, resistor: i }));
    const wireStates: LabState[] = holes.map((_, i) => ({ ...state, wire: i }));
    const ledX = holes[state.led].x, resX = holes[state.resistor].x, wireX = holes[state.wire].x;
    // Declarative dragging: float the part under the pointer, preview the nearest
    // hole, mark every legal hole during the drag and snap with a tactile finish.
    const snap = (states: LabState[], row: number) => d.closest(states)
      .withFloating()
      .withSnapRadius(34)
      .withDropTransition("elastic-out")
      .withOverlay(
        <g id={`targets-${row}`}>
          {holes.map((h, i) => <circle id={`target-${row}-${i}`} cx={h.x} cy={row} r="13" fill="none" stroke="var(--signal)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.75" />)}
        </g>,
      );
    const keyMove = (part: Part) => (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); onMove(part, 1); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); onMove(part, -1); }
    };
    return (
      <g>
        <rect x="56" y="96" width={N * 70 + 40} height="244" rx="8" fill="var(--paper-2)" stroke="var(--rule)" />
        {holes.map((h, i) => (
          <g id={`hole-${i}`}>
            <circle cx={h.x} cy="158" r="6" fill="var(--paper)" stroke="var(--ink-3)" strokeWidth="1.5" />
            <circle cx={h.x} cy="236" r="6" fill="var(--paper)" stroke="var(--ink-3)" strokeWidth="1.5" />
            <circle cx={h.x} cy="308" r="6" fill="var(--paper)" stroke="var(--ink-3)" strokeWidth="1.5" />
            <text x={h.x} y="134" textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-3)">e{12 + i}</text>
          </g>
        ))}
        <text x="74" y="120" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">+ rail</text>
        <text x="74" y="354" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-3)">− rail</text>

        <g id="led" role="button" tabIndex={0} aria-label="LED — drag or use arrow keys to move between holes"
          transform={translate(ledX, 158)} dragologyOnDrag={() => snap(ledStates, 158)} onKeyDown={keyMove("led")}
          dragologyZIndex={draggedId === "led" ? "/1" : false}
          style={{ cursor: "grab", filter: draggedId === "led" ? "drop-shadow(0 2px 6px rgb(0 0 0 / 0.3))" : undefined }}>
          <circle r={draggedId === "led" ? 18 : 15} fill="var(--signal)" opacity="0.9" />
          <path d="M -7 -7 L 7 7 M 7 -7 L -7 7" stroke="var(--on-signal)" strokeWidth="2" />
          <text x="0" y="-22" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--signal)">LED</text>
        </g>
        <g id="resistor" role="button" tabIndex={0} aria-label="220 Ω resistor — drag or use arrow keys to move between holes"
          transform={translate(resX, 236)} dragologyOnDrag={() => snap(resStates, 236)} onKeyDown={keyMove("resistor")}
          dragologyZIndex={draggedId === "resistor" ? "/1" : false}
          style={{ cursor: "grab", filter: draggedId === "resistor" ? "drop-shadow(0 2px 6px rgb(0 0 0 / 0.3))" : undefined }}>
          <rect x="-20" y="-8" width="40" height="16" rx="3" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
          <path d="M -14 0 L -8 -6 L -2 6 L 4 -6 L 10 6 L 16 0" stroke="var(--accel)" strokeWidth="2" fill="none" />
          <text x="0" y="-16" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--accel)">220 Ω</text>
        </g>
        <g id="wire" transform={translate(wireX, 308)}
          dragologyZIndex={draggedId === "wire-handle" ? "/1" : false}>
          <path d="M 0 0 C 22 -18 42 18 64 0" stroke="var(--velocity)" strokeWidth="3" fill="none" />
          <circle r="5" fill="var(--velocity)" />
          <text x="30" y="30" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--velocity)">wire</text>
          <circle id="wire-handle" role="button" tabIndex={0} aria-label="Wire — drag or use arrow keys to move between holes" r="16" fill="transparent"
            dragologyOnDrag={() => snap(wireStates, 308)} onKeyDown={keyMove("wire")}
            style={{ cursor: "grab", filter: draggedId === "wire-handle" ? "drop-shadow(0 2px 6px rgb(0 0 0 / 0.3))" : undefined }} />
        </g>
      </g>
    );
  };
}

export default function BreadboardLab() {
  const [state, setState] = useState<LabState>({ led: 0, resistor: 1, wire: 2 });
  const correct = state.led === target.led && state.resistor === target.resistor && state.wire === target.wire;
  const move = useCallback((part: Part, delta: number) => {
    setState((s) => ({ ...s, [part]: Math.max(0, Math.min(N - 1, s[part] + delta)) }));
  }, []);
  const lab = useCallback(() => makeLab(move), [move]);

  return (
    <div className="breadboard-lab">
      <p className="stage-prompt"><span aria-hidden>◉</span> Drag the LED, resistor and wire onto the highlighted holes, or focus a part and use the arrow keys.</p>
      <DraggableRenderer draggable={lab()} state={state} onDropState={setState} width={760} height={380} />
      <div className="figure-controls">
        <span>LED e{12 + state.led} · resistor e{12 + state.resistor} · wire e{12 + state.wire}</span>
        <button className="btn" onClick={() => setState({ led: 0, resistor: 1, wire: 2 })}>Reset</button>
        <span aria-live="polite" style={{ color: correct ? "var(--mastered)" : "var(--ink-2)" }}>
          {correct ? "Loop closed — current can flow." : "The loop is open. Try the target holes."}
        </span>
      </div>
      <p style={{ color: "var(--ink-3)", fontSize: "var(--fs-0)" }}>
        Prototype archetype: model-driven dragging with snapping via Dragology, with a keyboard path.
      </p>
    </div>
  );
}
