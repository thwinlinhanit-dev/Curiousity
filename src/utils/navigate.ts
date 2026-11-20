import { flushSync } from "react-dom";

// SPA navigation with a View Transition when the browser supports it.
// flushSync makes React commit the URL-derived state inside the transition
// callback so the old/new snapshots are taken at the right moment.
export function navigate(url: string, update: () => void): void {
  const run = () => {
    window.history.pushState({}, "", url);
    flushSync(update);
    window.scrollTo(0, 0);
  };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (doc.startViewTransition && !reduce) doc.startViewTransition(run);
  else run();
}
