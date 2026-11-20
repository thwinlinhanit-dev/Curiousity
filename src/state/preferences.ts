// Text size and background ambience — global preferences, no accounts.
export type TextSize = "normal" | "large" | "xlarge";

const KEY_SIZE = "trb-text-size";
const KEY_SOUND = "trb-ambience";

const sizes: TextSize[] = ["normal", "large", "xlarge"];
export const getTextSize = (): TextSize => {
  try {
    const v = localStorage.getItem(KEY_SIZE) as TextSize | null;
    return v && sizes.includes(v) ? v : "normal";
  } catch { return "normal"; }
};
export const cycleTextSize = (): TextSize => {
  const next = sizes[(sizes.indexOf(getTextSize()) + 1) % sizes.length];
  try { localStorage.setItem(KEY_SIZE, next); } catch { /* private mode */ }
  applyTextSize(next);
  return next;
};
export const applyTextSize = (s: TextSize) => {
  document.documentElement.dataset.text = s;
};

type Ambience = { stop: () => void } | null;
let ambience: Ambience = null;

export const getAmbience = (): boolean => {
  try { return localStorage.getItem(KEY_SOUND) === "on"; } catch { return false; }
};
export const setAmbience = (on: boolean): boolean => {
  try { localStorage.setItem(KEY_SOUND, on ? "on" : "off"); } catch { /* private mode */ }
  if (on) startAmbience(); else stopAmbience();
  return on;
};

// A quiet, slow drone made in the browser — no audio file, nothing downloaded.
// It never starts on its own: only the user's toggle calls setAmbience(true).
function startAmbience() {
  if (ambience) return;
  try {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new C();
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    const freqs = [110, 164.81, 220];
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = f;
      g.gain.value = i === 0 ? 0.5 : 0.18;
      o.connect(g); g.connect(gain); o.start();
      return o;
    });
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.06;
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain); lfoGain.connect(gain.gain); lfo.start();
    gain.gain.setTargetAtTime(0.035, ctx.currentTime, 1.5);
    ambience = { stop: () => { try { gain.gain.setTargetAtTime(0, ctx.currentTime, 0.2); } catch { /* noop */ }
      setTimeout(() => { oscs.forEach((o) => { try { o.stop(); } catch { /* noop */ } }); try { lfo.stop(); } catch { /* noop */ } void ctx.close(); }, 600); } };
  } catch { ambience = null; }
}
function stopAmbience() {
  ambience?.stop(); ambience = null;
}

// If the user had sound on before a reload, ask for a click to resume it rather
// than autoplaying. Call this from a user gesture.
export const resumeSavedAmbience = () => { if (getAmbience() && !ambience) startAmbience(); };
