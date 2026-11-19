import { useFigureStore } from "../state/figureStore";
import { t, useT } from "../i18n";
import type { Layers } from "../figures/contract";

const LAYERS: { key: keyof Layers; labelKey: string; hintKey: string }[] = [
  { key: "vectors", labelKey: "layers.vectors", hintKey: "layers.vectors" },
  { key: "strobe", labelKey: "layers.strobe", hintKey: "layers.strobe" },
  { key: "trajectory", labelKey: "layers.curves", hintKey: "layers.curves" },
  { key: "readouts", labelKey: "layers.values", hintKey: "layers.values" },
];

export default function LayerToggles() {
  useT();
  const { state, patch } = useFigureStore();
  return (
    <div role="group" aria-label={t("layers.title")} style={{ display: "flex", gap: "var(--sp-2)", flexWrap: "wrap" }}>
      {LAYERS.map((l) => (
        <button key={l.key} className="chip" aria-pressed={state.layers[l.key]} title={t(l.hintKey)} onClick={() => patch({ op: "toggleLayer", layer: l.key })}>
          {state.layers[l.key] ? "◉" : "○"} {t(l.labelKey)}
        </button>
      ))}
    </div>
  );
}
