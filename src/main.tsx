import React from "react";
import { createRoot } from "react-dom/client";
import "katex/dist/katex.min.css";
import "./styles/app.css";
import "./styles/apps.css";
import App from "./App";

// Visual kits are loaded on demand by App (selected ladder) and PracticePanel,
// so the physics bundles are not fetched on tool-hub or offline routes.

// Offline support: a service worker caches the shell and any sections the
// learner explicitly saves in the Offline tool. Never registered in dev.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => undefined);
  });
}

// Optional a11y audit: open with ?audit=1 and read window.__axeResults.
if (new URLSearchParams(window.location.search).has("audit")) {
  const s = document.createElement("script");
  s.src = `${import.meta.env.BASE_URL}vendor/axe.min.js`;
  s.onload = () => {
    const axe = (window as unknown as { axe?: { run: (root: Element) => Promise<{ violations: unknown[]; passes: unknown[] }> } }).axe;
    if (axe) axe.run(document.body).then((r) => { (window as unknown as { __axeResults: unknown }).__axeResults = r; });
  };
  document.head.appendChild(s);
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
