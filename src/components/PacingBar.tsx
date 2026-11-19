import { useFigureStore } from "../state/figureStore";
import { t, useT } from "../i18n";
import type { Speed } from "../figures/contract";

const SPEEDS: Speed[] = [0.25, 0.5, 1, 2];

export default function PacingBar({ duration }: { duration: number }) {
  useT();
  const { state, patch } = useFigureStore();
  return (
    <div className="pacing-bar" aria-label="Animation controls" style={{ display: "flex", gap: "var(--sp-3)", alignItems: "center", flexWrap: "wrap" }}>
      <button className="btn-primary" onClick={() => patch({ op: "setPlaying", playing: !state.playing })} aria-pressed={state.playing}>
        {state.playing ? t("pacing.pause") : t("pacing.play")}
      </button>
      <button className="btn" onClick={() => { patch({ op: "setPlaying", playing: false }); patch({ op: "setTime", t: Math.min(duration, state.t + 0.1) }); }} title={t("pacing.step")}>
        {t("pacing.step")}
      </button>
      <button className="btn" onClick={() => { patch({ op: "setPlaying", playing: false }); patch({ op: "setTime", t: 0 }); }} aria-label="↺ Start again" title="Start again">
        ↺
      </button>
      <div className="segmented" role="group" aria-label="Speed">
        {SPEEDS.map((s) => (
          <button key={s} aria-pressed={state.speed === s} className={state.speed === s ? "active" : ""} onClick={() => patch({ op: "setSpeed", speed: s })}>
            {s}×
          </button>
        ))}
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flex: 1, minWidth: 180 }}>
        <span className="sr-only">{t("pacing.time")}</span>
        <input type="range" min={0} max={duration} step={duration / 500} value={state.t} onChange={(e) => { patch({ op: "setPlaying", playing: false }); patch({ op: "setTime", t: Number(e.target.value) }); }} style={{ width: "100%", accentColor: "var(--signal)" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-0)", minWidth: 60 }}>{state.t.toFixed(2)} / {duration.toFixed(2)} s</span>
      </label>
    </div>
  );
}
