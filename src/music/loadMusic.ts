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
    for (const href of [`${base}kit.css`, `${base}lessons/lessons.css`, `${base}fret/fret.css`]) {
      const css = document.createElement("link");
      css.rel = "stylesheet"; css.href = href;
      document.head.appendChild(css);
    }
    for (const f of ["audio.js", "song.js", "staff.js", "keyboard.js", "player.js"]) await loadScript(`${base}${f}`);
    for (const f of ["pitch.js", "core.js", "chords.js", "sound.js", "draw.js", "player.js"]) await loadScript(`${base}fret/${f}`);
    for (const f of ["core.js", "widgets.js"]) await loadScript(`${base}lessons/${f}`);
  })();
  return promise;
}
