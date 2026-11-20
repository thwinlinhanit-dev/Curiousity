import { useEffect, useRef, useState } from "react";
import index from "../../content/music/index.json";
import { loadMusic } from "../music/loadMusic";

type SongInfo = typeof index[number];
type Player = { destroy?: () => void; setTempo?: (n: number) => void; setHands?: (h: "both" | "rh" | "lh") => void; setWait?: (on: boolean) => void; setLetters?: (on: boolean) => void; setClick?: (on: boolean) => void; setCountIn?: (on: boolean) => void; play?: () => void; pause?: () => void; stop?: () => void };

const CHORD_NOTES: Record<string, string> = {
  C: "C E G", G: "G B D", D: "D F# A", A: "A C# E", E: "E G# B", F: "F A C",
  Bb: "Bb D F", "B♭": "Bb D F", Eb: "Eb G Bb", Am: "A C E", Em: "E G B", Dm: "D F A",
  G7: "G B D F", C7: "C E G Bb", F7: "F A C Eb", B7: "B D# F# A", E7: "E G# B D",
  Am7: "A C E G", Em7: "E G B D", Fmaj7: "F A C E", Dm7: "D F A C", Gmaj7: "G B D F#",
};

const instrumentOf = (slug: string) => /ukulele/.test(slug) ? "Ukulele" : /banjo|clawhammer|three-finger/.test(slug) ? "Banjo" : /guitar/.test(slug) ? "Guitar" : "Piano";

function chordCards(chords: string) {
  const out: string[] = [];
  for (const part of chords.split("|")) {
    for (const token of part.trim().split(/\s+/)) {
      const name = token.trim();
      if (name) out.push(name);
    }
  }
  return out.slice(0, 40);
}

export default function MusicLab({ slug, onSelect, compact }: { slug: string; onSelect: (slug: string) => void; compact?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<Player | null>(null);
  const [ready, setReady] = useState(false);
  const [song, setSong] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const info = index.find((s) => s.slug === slug) as SongInfo | undefined;

  useEffect(() => { loadMusic().then(() => setReady(true)).catch((e) => setError(String(e))); }, []);

  useEffect(() => {
    if (!slug) { setSong(null); return; }
    let alive = true;
    setSong(null); setError("");
    fetch(`${import.meta.env.BASE_URL}content/music/songs/${slug}.json`)
      .then((r) => r.json()).then((s) => { if (alive) setSong(s); })
      .catch(() => alive && setError("Song not found"));
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (!ready || !song || !host.current) return;
    const TRB = (window as unknown as {
      TRBMusic?: {
        player?: { mount: (root: HTMLElement, src: unknown, opts: unknown) => Player };
        fret?: { player?: { mount: (root: HTMLElement, src: unknown, opts: unknown) => Player } };
      };
    }).TRBMusic;
    player.current?.destroy?.();
    host.current.innerHTML = "";
    // Tab songs (guitar, ukulele, banjo) play through the fretted-instrument
    // player; notated piano pieces through the kit score player.
    const isTab = !song.staves && !!song.tab;
    const mount = isTab ? TRB?.fret?.player?.mount : TRB?.player?.mount;
    if (!mount) { setError("Music kit unavailable"); return; }
    try {
      player.current = mount(host.current, song, isTab ? { storageKey: "trb-music-player-v1" } : { keyboard: true, maxScoreHeight: "520px" });
      (window as unknown as { __musicPlayer?: Player }).__musicPlayer = player.current;
    }
    catch (e) { setError(String(e)); }
    return () => { player.current?.destroy?.(); player.current = null; };
  }, [ready, song]);

  const songs = index.filter((s) => `${s.title} ${s.composer}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="music-lab">
      {!compact && <>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-3)", marginTop: "var(--sp-4)" }}>Music lab · playable sheet music</h2>
      <p style={{ color: "var(--ink-2)", maxWidth: 700 }}>
        Public-domain scores from the Teddy Rook corpus. The score scrolls with the music, the keys light up by hand,
        and the Web Audio piano plays it — tempo, hands, count-in, metronome and "wait for me" practice mode are in the player controls.
      </p>
      </>}
      {!compact && <div className="course-bar">
        <label>Song
          <select value={slug} onChange={(e) => onSelect(e.target.value)}>
            <option value="">Choose a song…</option>
            {index.map((s) => <option key={s.slug} value={s.slug}>{s.title} — {instrumentOf(s.slug)} · {s.level} · {s.key}</option>)}
          </select>
        </label>
        <label>Find<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search songs…" /></label>
      </div>}
      {!compact && !slug && <div className="music-list">
        {songs.map((s) => <button key={s.slug} className="ladder-chip" onClick={() => onSelect(s.slug)}>
          <b>{s.title}</b><span>{instrumentOf(s.slug)} · {s.composer.slice(0, 28)} · {s.level} · {s.key}</span>
        </button>)}
      </div>}
      {slug && info && <>
        <p style={{ color: "var(--ink-3)", fontSize: "var(--fs-0)" }}>
          {info.composer} · {info.key} · {info.time} · suggested ♩ = {info.tempo} · source: {info.source.slice(0, 110)}
        </p>
        {info.about && <p style={{ color: "var(--ink-2)", maxWidth: 700 }}>{info.about}</p>}
      </>}
      {error && <p style={{ color: "var(--danger)" }} role="alert">{error}. Try choosing another song.</p>}
      {slug && !error && <div ref={host} className="music-player-host" />}
      {slug && song && Boolean(song.chords) && <div className="chord-cards">
        <h3>Chord map</h3>
        <div>{chordCards(String(song.chords)).map((c, i) => <div key={i} className="chord-card"><b>{c}</b><span>{CHORD_NOTES[c] ?? "—"}</span></div>)}</div>
      </div>}
      {!compact && <p style={{ color: "var(--ink-3)", fontSize: "var(--fs-0)" }}>
        Public-domain scores from the corpus, so the notes and audio can be shipped legally.
      </p>}
    </div>
  );
}
