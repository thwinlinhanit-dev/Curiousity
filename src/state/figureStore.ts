import { create } from "zustand";
import { applyPatch, initialState, type FigurePatch, type FigureState } from "../figures/contract";

type FigureStore = {
  state: FigureState;
  patch: (p: FigurePatch) => void;
  reset: (opts?: Record<string, unknown>) => void;
};

export const useFigureStore = create<FigureStore>((set) => ({
  state: initialState(),
  patch: (p) => set((s) => ({ state: applyPatch(s.state, p) })),
  reset: (opts) => set({ state: initialState(opts) }),
}));
