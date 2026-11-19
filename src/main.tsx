import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/app.css";
import App from "./App";
import { loadViz } from "./viz/loadViz";

// Preload the repo's visual kits so pure physics models (PM.*) and all visual
// registrations are available to both custom figures and the universal wrapper.
void loadViz();

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
