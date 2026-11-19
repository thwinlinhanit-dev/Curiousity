import { useSyncExternalStore } from "react";

export type Theme = "paper" | "instrument";
const KEY = "pf-theme-v1";

let current: Theme = (() => {
  try { return localStorage.getItem(KEY) === "instrument" ? "instrument" : "paper"; }
  catch { return "paper"; }
})();

const listeners = new Set<() => void>();

function apply() {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  root.setAttribute("data-theme", current === "instrument" ? "dark" : "light");
  void root.offsetWidth; // force style flush before restoring transitions
  requestAnimationFrame(() => root.classList.remove("theme-switching"));
  listeners.forEach((f) => f());
}
apply();

export function getTheme(): Theme { return current; }
export function setTheme(t: Theme) {
  current = t;
  try { localStorage.setItem(KEY, t); } catch { /* storage blocked */ }
  apply();
}
export function toggleTheme() { setTheme(current === "paper" ? "instrument" : "paper"); }
export function subscribeTheme(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
export function useTheme() {
  return useSyncExternalStore(subscribeTheme, getTheme);
}
