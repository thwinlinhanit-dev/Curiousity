// PHYSICS_SPEC/02 §2 — universal figure contract.
// A figure is a pure render of (FigureState, topicData). Patches are the only writes.

export type Speed = 0.25 | 0.5 | 1 | 2;

export type Layers = {
  trajectory: boolean;
  vectors: boolean;
  strobe: boolean;
  graphs: boolean;
  readouts: boolean;
  grid: boolean;
};

export type FigureState = {
  scenario: string;
  params: Record<string, number>;
  t: number;
  playing: boolean;
  speed: Speed;
  layers: Layers;
  selection: { objectId?: string; graph?: "x" | "v" | "a" };
  annotation?: string;
  feedback?: SpatialFeedback;
};

export type SpatialFeedback = {
  kind: "numeric" | "vector" | "position";
  learner: number | { x: number; y: number };
  expected: number | { x: number; y: number };
  label: string;
  unit?: string;
};

export type FigurePatch =
  | { op: "setTime"; t: number }
  | { op: "setParam"; key: string; value: number }
  | { op: "toggleLayer"; layer: keyof Layers }
  | { op: "selectGraph"; graph: "x" | "v" | "a" }
  | { op: "setScenario"; scenario: string }
  | { op: "showFeedback"; feedback: SpatialFeedback }
  | { op: "clearFeedback" }
  | { op: "setPlaying"; playing: boolean }
  | { op: "setSpeed"; speed: Speed };

export function initialState(opts: Record<string, unknown> = {}): FigureState {
  const params: Record<string, number> = {};
  for (const k of ["x0", "v0", "a", "tmax", "g", "vx"]) {
    if (typeof opts[k] === "number") params[k] = opts[k] as number;
  }
  return {
    scenario: (opts.vertical ? "vertical-throw" : "cart") as string,
    params,
    t: 0,
    playing: false,
    speed: 0.5, // teaching default (Atlas)
    layers: { trajectory: true, vectors: true, strobe: true, graphs: true, readouts: true, grid: true },
    selection: {},
  };
}

// The only write path. Pure reducer — unit-testable.
export function applyPatch(state: FigureState, patch: FigurePatch): FigureState {
  switch (patch.op) {
    case "setTime": return { ...state, t: patch.t };
    case "setParam": return { ...state, params: { ...state.params, [patch.key]: patch.value } };
    case "toggleLayer": return { ...state, layers: { ...state.layers, [patch.layer]: !state.layers[patch.layer] } };
    case "selectGraph": return { ...state, selection: { ...state.selection, graph: patch.graph } };
    case "setScenario": return { ...state, scenario: patch.scenario };
    case "showFeedback": return { ...state, feedback: patch.feedback };
    case "clearFeedback": return { ...state, feedback: undefined };
    case "setPlaying": return { ...state, playing: patch.playing };
    case "setSpeed": return { ...state, speed: patch.speed };
  }
}
