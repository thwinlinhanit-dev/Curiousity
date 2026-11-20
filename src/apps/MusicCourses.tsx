import { useEffect, useMemo, useState } from "react";
import { topicStatus } from "../state/progress";
import { plural } from "../utils/plural";

type Topic = { id: string; slug: string; title: string; short: string; unit: string };
type Course = { key: string; title: string; short: string; units: { key: string; title: string }[]; topics: Topic[] };
type Song = { slug: string; title: string; composer: string; instrument: string; level: string; key: string };

const COURSES = [
  { key: "pb", label: "Piano Basics", icon: "🎹", instrument: "piano" },
  { key: "gtr", label: "Guitar", icon: "🎸", instrument: "guitar" },
  { key: "uke", label: "Ukulele", icon: "🎶", instrument: "ukulele" },
  { key: "bjo", label: "Banjo", icon: "🪕", instrument: "banjo" },
  { key: "rm", label: "Reading Music", icon: "🎼", instrument: "" },
];

export default function MusicCourses() {
  const [courseKey, setCourseKey] = useState("pb");
  const [course, setCourse] = useState<Course | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [q, setQ] = useState("");
  const [openUnit, setOpenUnit] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/music/courses/${courseKey}.json`).then((r) => r.json()).then(setCourse).catch(() => setCourse(null));
  }, [courseKey]);
  useEffect(() => { fetch(`${import.meta.env.BASE_URL}content/music/index.json`).then((r) => r.json()).then(setSongs).catch(() => undefined); }, []);

  const instrument = COURSES.find((c) => c.key === courseKey)!.instrument;
  const courseSongs = useMemo(() => songs.filter((s) => !instrument || s.instrument === instrument || s.instrument.includes(instrument)).slice(0, 24), [songs, instrument]);
  const topics = (course?.topics ?? []).filter((t) => !q || `${t.title} ${t.short}`.toLowerCase().includes(q.toLowerCase()));
  const units = [...new Set(topics.map((t) => t.unit))];

  return <section className="app-section" aria-labelledby="mc-title">
    <p className="eyebrow">MUSIC · FULL COURSES</p>
    <h2 id="mc-title" className="app-heading">Learn an instrument from the first note</h2>
    <p className="app-lead">Four instrument courses and a reading-music course from the corpus, with every chapter laid out in order and the songs that belong to it. The existing Music Lab plays the scores with the keys lighting up.</p>
    <div className="app-toolbar" role="group" aria-label="Instrument">{COURSES.map((c) => <button key={c.key} className={courseKey === c.key ? "chip active" : "chip"} aria-pressed={courseKey === c.key} onClick={() => { setCourseKey(c.key); setOpenUnit(null); }}>{c.icon} {c.label}</button>)}</div>

    {!course ? <p className="app-muted">Loading course…</p> : <>
      <div className="app-panel"><h3 style={{ marginTop: 0 }}>{course.title}</h3>
        <p className="app-muted">{plural(course.units.length, "unit")} · {plural(course.topics.length, "chapter")}</p>
        <input aria-label="Search chapters" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chapters…" style={{ width: "100%", margin: "var(--sp-3) 0" }} />
        <div className="mc-units">{units.map((unit) => {
          const list = topics.filter((t) => t.unit === unit);
          const open = openUnit === unit;
          return <div key={unit} className="mc-unit">
            <button className="mc-unit-head" aria-expanded={open} onClick={() => setOpenUnit(open ? null : unit)}>
              <b>{unit}</b><span className="app-muted">{plural(list.length, "chapter")}</span><span>{open ? "−" : "+"}</span></button>
            {open && <ol>{list.map((t) => {
              const st = topicStatus(t.id);
              const link = `?s=music&c=${encodeURIComponent(courseKey)}&t=${encodeURIComponent(t.slug)}`;
              return <li key={t.id}><a href={link}>{t.title}</a> {st.passed && <span className="status-chip status-mastered">mastered</span>}
                <span className="app-muted"> — {t.short}</span></li>;
            })}</ol>}
          </div>;
        })}</div>
      </div>

      {courseSongs.length > 0 && <div className="app-panel"><h3 style={{ marginTop: 0 }}>Songs for {instrument || "this course"}</h3>
        <div className="music-list">{courseSongs.map((s) => <button key={s.slug} className="app-card" onClick={() => { window.location.href = `?music=${encodeURIComponent(s.slug)}`; }}>
          <b>{s.title}</b><span className="app-muted">{s.composer} · {s.key} · {s.level}</span><span className="app-card-cta">Play in Music Lab →</span>
        </button>)}</div></div>}
    </>}

    <p className="app-attribution">Course structure from <a href="https://teddyrookbook.com/music/" target="_blank" rel="noreferrer">Teddy Rook Book — Music</a> · CC BY-NC 4.0 · songs public domain</p>
  </section>;
}
