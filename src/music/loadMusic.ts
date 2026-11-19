let promise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export function loadMusic(): Promise<void> {
  if (promise) return promise;
  promise = (async () => {
    const base = `${import.meta.env.BASE_URL}vendor/music/`;
    const css = document.createElement("link");
    css.rel = "stylesheet"; css.href = `${base}kit.css`;
    document.head.appendChild(css);
    for (const f of ["audio.js", "song.js", "staff.js", "keyboard.js", "player.js"]) await loadScript(`${base}${f}`);
  })();
  return promise;
}
