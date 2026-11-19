import { useEffect, useMemo, useRef } from "react";
import { useFigureStore } from "../state/figureStore";
import { bounds, createMotionModel, niceTicks, type VizOpts } from "./motionModel";

const W = 1000;
const SCENE_W = 286;
const GX = 314;
const GW = W - GX - 24;
const GH = 138;
const GAP = 26;

type Props = { opts: VizOpts; compact?: boolean };

export default function MotionFigure({ opts }: Props) {
  const { state, patch } = useFigureStore();
  const model = useMemo(() => createMotionModel(opts, state.params), [opts, state.params]);
  const graphList = (opts.graphs ?? ["x", "v", "a"]).filter((g) => g === "x" || g === "v" || g === "a");
  const H = Math.max(320, 60 + graphList.length * (GH + GAP) + 30);
  const t = Math.min(state.t, model.T);
  const sample = model.at(t);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);
  const svgRef = useRef<SVGSVGElement>(null);

  // Animation loop — driven by our own FigureState (speed, playing), not the kit's controls.
  useEffect(() => {
    if (!state.playing) { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; last.current = 0; return; }
    const tick = (now: number) => {
      if (!last.current) last.current = now;
      const dt = Math.min(0.05, (now - last.current) / 1000);
      last.current = now;
      const next = Math.min(model.T, t + dt * state.speed);
      patch({ op: "setTime", t: next });
      if (next >= model.T) patch({ op: "setPlaying", playing: false });
      else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; last.current = 0; };
  }, [state.playing, state.speed, model.T, t, patch]);

  const vertical = !!opts.vertical;
  const xn = vertical ? "y" : "x";
  const xu = opts.units?.x ?? "m";
  const tu = opts.units?.t ?? "s";
  const vu = `${xu}/${tu}`;
  const au = `${xu}/${tu}²`;
  const show = new Set(opts.show ?? []);
  const layers = state.layers;

  // Ranges from the model (sampled), matching the repo's niceRange intent.
  const xs: number[] = [], vs: number[] = [], as: number[] = [];
  for (let i = 0; i <= 240; i++) {
    const s = model.at(model.T * i / 240);
    xs.push(s.x); vs.push(s.v); as.push(s.a);
  }
  const RX = bounds(xs), RV = bounds(vs), RA = bounds(as);
  const rangeOf = (q: string) => (q === "x" ? RX : q === "v" ? RV : RA);
  const unitOf = (q: string) => (q === "x" ? xu : q === "v" ? vu : au);
  const colorOf = (q: string) => (q === "x" ? "var(--ink)" : q === "v" ? "var(--velocity)" : "var(--accel)");
  const fmt = (v: number) => (Math.abs(v) < 1e-9 ? "0" : v.toFixed(2).replace(/\.?0+$/, ""));

  // ---- scene geometry ----
  const sceneTop = 40, sceneBottom = H - 44;
  const yPix = (v: number) => sceneBottom - ((v - RX[0]) / (RX[1] - RX[0])) * (sceneBottom - sceneTop);
  const xPix = (v: number) => 26 + ((v - RX[0]) / (RX[1] - RX[0])) * (SCENE_W - 62);
  const strobeDt = model.T / Math.min(12, Math.max(4, Math.round(model.T / 0.2)));
  const strobeTimes: number[] = [];
  if (layers.strobe) for (let tt = strobeDt; tt < model.T - 1e-6; tt += strobeDt) strobeTimes.push(tt);
  const vmax = Math.max(1e-6, Math.abs(RV[0]), Math.abs(RV[1]));
  const amax = Math.max(1e-6, Math.abs(RA[0]), Math.abs(RA[1]));

  const objX = vertical ? 128 : xPix(sample.x);
  const objY = vertical ? yPix(sample.x) : 96;

  return (
    <div className="motion-figure" style={{ fontFamily: "var(--font-body)" }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${vertical ? "Ball on a vertical track" : "Cart on a track"} at ${xn} = ${fmt(sample.x)} ${xu}, velocity ${fmt(sample.v)} ${vu}, at time ${fmt(t)} ${tu}`}>
        {/* panel backgrounds */}
        <rect x={GX - 8} y={8} width={GW + 16} height={H - 16} rx="5" fill="var(--paper-2)" stroke="var(--rule)" />

        {/* ===== SCENE ===== */}
        {vertical ? (
          <g>
            <line x1="128" y1={sceneTop} x2="128" y2={sceneBottom} stroke="var(--rule)" strokeWidth="3" strokeLinecap="round" />
            {RX[0] <= 0 && RX[1] >= 0 && <line x1="70" y1={yPix(0) + 5} x2="190" y2={yPix(0) + 5} stroke="var(--ink-3)" strokeWidth="2" />}
            <path d={`M 174 ${sceneTop + 26} L 174 ${sceneTop} M 169 ${sceneTop + 7} L 174 ${sceneTop} L 179 ${sceneTop + 7}`} stroke="var(--ink-3)" strokeWidth="1.6" fill="none" />
            <text x="168" y={sceneTop + 2} textAnchor="end" fontSize="12" fontStyle="italic" fill="var(--ink-3)">+{xn}</text>
            {niceTicks(RX[0], RX[1], 5).map((v) => (
              <g key={v}>
                <line x1="122" y1={yPix(v)} x2="134" y2={yPix(v)} stroke="var(--ink-3)" strokeWidth="1.2" />
                <text x="116" y={yPix(v) + 4} textAnchor="end" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-2)">{fmt(v)}</text>
              </g>
            ))}
            {strobeTimes.map((tt, i) => <circle key={i} cx="128" cy={yPix(model.at(tt).x)} r="3" fill="var(--notstarted)" opacity={0.9} />)}
            <circle cx={objX} cy={objY} r="10" fill="var(--signal)" />
            {layers.vectors && Math.abs(sample.v) > 1e-6 && (
              <g>
                <line x1="154" y1={objY} x2="154" y2={objY - (sample.v / vmax) * 58} stroke="var(--velocity)" strokeWidth="3" />
                <circle cx="154" cy={objY - (sample.v / vmax) * 58} r="3.5" fill="var(--velocity)" />
                <text x="164" y={objY - (sample.v / vmax) * 58 + 4} fontSize="12" fontStyle="italic" fill="var(--velocity)">v</text>
              </g>
            )}
            {layers.vectors && Math.abs(sample.a) > 1e-6 && (
              <g>
                <line x1="180" y1={objY} x2="180" y2={objY - (sample.a / amax) * 46} stroke="var(--accel)" strokeWidth="2.5" />
                <circle cx="180" cy={objY - (sample.a / amax) * 46} r="3.5" fill="var(--accel)" />
                <text x="190" y={objY - (sample.a / amax) * 46 + 4} fontSize="12" fontStyle="italic" fill="var(--accel)">a</text>
              </g>
            )}
          </g>
        ) : (
          <g>
            <rect x="26" y="90" width={SCENE_W - 52} height="5" rx="2" fill="var(--rule)" />
            <line x1="30" y1="140" x2={SCENE_W - 30} y2="140" stroke="var(--ink-3)" strokeWidth="1.2" />
            {niceTicks(RX[0], RX[1], 5).map((v) => <text key={v} x={xPix(v)} y="156" textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-2)">{fmt(v)}</text>)}
            {strobeTimes.map((tt, i) => <circle key={i} cx={xPix(model.at(tt).x)} cy="80" r="3" fill="var(--notstarted)" />)}
            <g transform={`translate(${objX - 19}, ${objY - 22})`}>
              <rect x="0" y="0" width="38" height="19" rx="4" fill="var(--signal)" />
              <circle cx="10" cy="19" r="4" fill="var(--ink)" /><circle cx="28" cy="19" r="4" fill="var(--ink)" />
            </g>
            {layers.vectors && Math.abs(sample.v) > 1e-6 && (
              <g>
                <line x1={objX} y1="56" x2={objX + (sample.v / vmax) * 70} y2="56" stroke="var(--velocity)" strokeWidth="3" />
                <text x={objX + (sample.v / vmax) * 70 + 6} y="60" fontSize="12" fontStyle="italic" fill="var(--velocity)">v</text>
              </g>
            )}
            {layers.vectors && Math.abs(sample.a) > 1e-6 && (
              <g>
                <line x1={objX} y1="40" x2={objX + (sample.a / amax) * 54} y2="40" stroke="var(--accel)" strokeWidth="2.5" />
                <text x={objX + (sample.a / amax) * 54 + 6} y="44" fontSize="12" fontStyle="italic" fill="var(--accel)">a</text>
              </g>
            )}
          </g>
        )}
        <text x="20" y="24" fontSize="12" fontFamily="var(--font-mono)" letterSpacing="1" fill="var(--ink-3)">
          {vertical ? "BALL · VERTICAL" : "CART · TRACK"}
        </text>

        {/* ===== LINKED GRAPHS ===== */}
        {graphList.map((q, gi) => {
          const gy = 8 + gi * (GH + GAP) + 12;
          const range = rangeOf(q);
          const fx = (tt: number) => GX + 44 + (tt / model.T) * (GW - 72);
          const fy = (v: number) => gy + GH - 26 - ((v - range[0]) / (range[1] - range[0])) * (GH - 46);
          const pts: string[] = [];
          for (let i = 0; i <= 200; i++) { const tt = model.T * i / 200; pts.push(`${fx(tt)},${fy(model.at(tt)[q])}`); }
          const yt = niceTicks(range[0], range[1], 4);
          return (
            <g key={q}>
              <text x={GX + 12} y={gy + 18} fontSize="12" fontFamily="var(--font-mono)" letterSpacing="1" fill={colorOf(q)}>{q}–t</text>
              {yt.map((v) => (
                <g key={v}>
                  <line x1={GX + 44} y1={fy(v)} x2={GX + GW - 22} y2={fy(v)} stroke="var(--rule)" strokeWidth="1" />
                  <text x={GX + 38} y={fy(v) + 4} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-3)">{fmt(v)}</text>
                </g>
              ))}
              {[0, model.T / 2, model.T].map((tt) => <text key={tt} x={fx(tt)} y={gy + GH - 8} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-3)">{fmt(tt)}</text>)}
              {layers.trajectory && <polyline points={pts.join(" ")} fill="none" stroke={colorOf(q)} strokeWidth="2.4" strokeLinecap="round" />}
              {q === "v" && layers.readouts && (show.has("area") || opts.show?.includes("area")) && (
                <polygon points={`${fx(0)},${fy(0)} ${pts.join(" ")} ${fx(t)},${fy(0)}`} fill="var(--velocity)" opacity="0.16" />
              )}
              <line x1={fx(t)} y1={gy + 18} x2={fx(t)} y2={gy + GH - 26} stroke="var(--gold, #b8860b)" strokeWidth="1.4" strokeDasharray="4 3" />
              <circle cx={fx(t)} cy={fy(sample[q])} r="4.5" fill={colorOf(q)} />
              {layers.readouts && <text x={Math.min(fx(t) + 8, GX + GW - 80)} y={fy(sample[q]) - 10} fontSize="11" fontFamily="var(--font-mono)" fill={colorOf(q)}>{q} = {fmt(sample[q])} {unitOf(q)}</text>}
              {opts.drag === "v" && q === "v" && (
                <g>
                  {[0, model.T].map((tt, ki) => {
                    const vv = model.at(tt).v;
                    return (
                      <circle key={ki} cx={fx(tt)} cy={fy(vv)} r="8" fill="var(--paper)" stroke={colorOf(q)} strokeWidth="2.5" style={{ cursor: "ns-resize" }}
                        aria-label={ki === 0 ? "Drag to change initial velocity" : "Drag to change acceleration"}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          const move = (ev: PointerEvent) => {
                            const rect = svgRef.current?.getBoundingClientRect();
                            if (!rect) return;
                            const py = ((ev.clientY - rect.top) / rect.height) * H;
                            const val = range[0] + ((gy + GH - 26 - py) / (GH - 46)) * (range[1] - range[0]);
                            if (ki === 0) patch({ op: "setParam", key: "v0", value: val });
                            else patch({ op: "setParam", key: "a", value: (val - model.K[0].v) / model.T });
                          };
                          const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
                          window.addEventListener("pointermove", move);
                          window.addEventListener("pointerup", up);
                        }} />
                    );
                  })}
                  <text x={GX + GW - 22} y={gy + 18} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--ink-3)">drag the knots</text>
                </g>
              )}
              {state.feedback?.kind === "numeric" && typeof state.feedback.learner === "number" && (
                <g>
                  <line x1={GX + 44} y1={fy(state.feedback.learner)} x2={GX + GW - 22} y2={fy(state.feedback.learner)} stroke="var(--review)" strokeWidth="1.4" strokeDasharray="5 3" />
                  <text x={GX + GW - 20} y={fy(state.feedback.learner) - 4} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--review)">yours {fmt(state.feedback.learner)}</text>
                </g>
              )}
            </g>
          );
        })}

        {/* spatial feedback marker on the scene axis */}
        {state.feedback?.kind === "position" && typeof state.feedback.learner === "number" && (
          <g>
            <line x1={vertical ? 96 : xPix(state.feedback.learner)} y1={sceneTop} x2={vertical ? 96 : xPix(state.feedback.learner)} y2={sceneBottom} stroke="var(--review)" strokeWidth="1.4" strokeDasharray="5 3" />
            <text x={vertical ? 92 : xPix(state.feedback.learner)} y={sceneTop + 14} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--review)">yours</text>
          </g>
        )}
      </svg>

      <figcaption style={{ display: "flex", gap: "var(--sp-4)", alignItems: "baseline", flexWrap: "wrap", marginTop: "var(--sp-2)", color: "var(--ink-3)", fontSize: "var(--fs-0)" }}>
        <span>Simplified model · drawn to scale · shown at {state.speed}×</span>
        <span>t = {fmt(t)} {tu} · {xn} = {fmt(sample.x)} {xu} · v = {fmt(sample.v)} {vu} · a = {fmt(sample.a)} {au}</span>
        <span aria-live="polite" className="sr-only">{vertical && Math.abs(sample.v) < 0.05 && sample.a < 0 ? "At the top: velocity is zero but acceleration is still downward." : ""}</span>
      </figcaption>
    </div>
  );
}
