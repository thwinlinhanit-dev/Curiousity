// Load the repo's per-ladder visual kits and generators as classic scripts.
// Only the active ladder's assets are fetched, so the other 19 ladders cost nothing.
const promises = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}

// The kit JS emits SVG/classed elements whose fills, strokes and fonts are
// defined in a matching stylesheet. Without it, SVG shapes default to black.
function loadStyle(href: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`link[href="${href}"]`)) return resolve();
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    l.onload = () => resolve();
    l.onerror = () => resolve(); // a missing CSS must not block the kit
    document.head.appendChild(l);
  });
}

function orderNames(ladder: string, names: string[]): string[] {
  const main = names.find((n) => n === `${ladder}.js`) || names.find((n) => n === "physics.js");
  return main ? [main, ...names.filter((n) => n !== main)] : names;
}

export function loadLadder(ladder: string): Promise<void> {
  if (promises.has(ladder)) return promises.get(ladder)!;
  const p = (async () => {
    const base = import.meta.env.BASE_URL;
    const [vRes, gRes, cssRes] = await Promise.all([
      fetch(`${base}vendor/viz-manifest.json`),
      fetch(`${base}vendor/gen-manifest.json`),
      fetch(`${base}vendor/viz-css-manifest.json`),
    ]);
    const vizMap: Record<string, string[]> = vRes.ok ? await vRes.json() : {};
    const genMap: Record<string, string[]> = gRes.ok ? await gRes.json() : {};
    const cssMap: Record<string, string[]> = cssRes.ok ? await cssRes.json() : {};
    // Load stylesheets first so the SVG is styled from the first paint.
    await Promise.all((cssMap[ladder] ?? []).map((f) => loadStyle(`${base}vendor/viz/${ladder}/${f}`)));
    // core.js is already loaded statically in index.html as /vendor/core.js.
    // Re-loading it from a ladder folder creates a fresh registry and wipes
    // every visual registered so far — notably the math kit, where core.js sits
    // late in the manifest, after adv.js.
    for (const name of orderNames(ladder, (vizMap[ladder] ?? []).filter((n) => n !== "core.js"))) {
      try { await loadScript(`${base}vendor/viz/${ladder}/${name}`); } catch { /* skip a broken kit */ }
    }
    for (const name of genMap[ladder] ?? []) {
      try { await loadScript(`${base}vendor/gen/${ladder}/${name}`); } catch { /* skip a broken generator */ }
    }
  })();
  promises.set(ladder, p);
  return p;
}

// Backwards-compatible alias — physics is the first ladder and the shared model kit.
export function loadViz(): Promise<void> { return loadLadder("physics"); }

export function mountViz(el: HTMLElement): void {
  const w = window as unknown as { MathLadder?: { viz?: { mount: (e: HTMLElement) => void } } };
  w.MathLadder?.viz?.mount(el);
}
