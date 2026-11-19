import { describe, it, expect } from "vitest";
import { applyPatch, initialState } from "./contract";

describe("figure contract (PHYSICS_SPEC/02)", () => {
  it("starts at teaching defaults", () => {
    const s = initialState({ vertical: true, v0: 14.7 });
    expect(s.speed).toBe(0.5);
    expect(s.scenario).toBe("vertical-throw");
    expect(s.params.v0).toBe(14.7);
    expect(s.playing).toBe(false);
  });

  it("applies patches immutably", () => {
    const s0 = initialState();
    const s1 = applyPatch(s0, { op: "setTime", t: 1.25 });
    expect(s0.t).toBe(0);
    expect(s1.t).toBe(1.25);
  });

  it("toggles layers", () => {
    const s = applyPatch(initialState(), { op: "toggleLayer", layer: "strobe" });
    expect(s.layers.strobe).toBe(false);
  });

  it("carries spatial feedback", () => {
    const fb = { kind: "numeric" as const, learner: 3, expected: 4.9, label: "apex height", unit: "m" };
    const s = applyPatch(initialState(), { op: "showFeedback", feedback: fb });
    expect(s.feedback?.expected).toBe(4.9);
  });
});
