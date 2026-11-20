import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import catalog from "../content/catalog.json";
import marbleIndex from "../content/marble/matched.json";
import TopicPage from "./pages/TopicPage";
import PlanPage from "./pages/PlanPage";
import ProgressPanel from "./components/ProgressPanel";
import { ensureGraph, getGraph, initProgress, setActiveLadder, topicStatus } from "./state/progress";
import { t, useT } from "./i18n";
import SiteHeader from "./components/SiteHeader";
import IdeaBox from "./components/IdeaBox";
import SkillMap from "./components/SkillMap";
import DatasetBrowser from "./components/DatasetBrowser";
import MusicLab from "./components/MusicLab";
import { loadLadder } from "./viz/loadViz";
import { loadCoursePack } from "./state/packs";
import type { CourseIndex } from "./state/courseTypes";

const BreadboardLab = lazy(() => import("./figures/BreadboardLab"));
const FBDLab = lazy(() => import("./figures/FBDLab"));

type Ladder = typeof catalog.ladders[number];

const DATASETS = [
  ["science-lab", "Science Lab"], ["elements", "Periodic table"], ["memory", "Memory lists"],
  ["recipes", "Recipes"], ["music", "Music"], ["trades", "Trades"], ["debate", "Debate"],
  ["greatbooks", "Great Books"], ["papers", "Founding papers"], ["harvard", "Harvard Classics"],
  ["garden", "Food garden"],
  ["timeline", "Timeline"], ["infographics", "Infographics"], ["resources", "Resources"], ["credits", "Credits & licences"],
];

// Lessons cross-checked against curriculum standards (Marble Skill Taxonomy).
const MARBLE_IDS = new Set(marbleIndex.ids);
const hasStandards = (id: string) => MARBLE_IDS.has(id);

const params = () => new URLSearchParams(window.location.search);
// Human-readable names for the raw keys the corpus uses internally.
const ladderName = (key: string) => catalog.ladders.find((l) => l.key === key)?.short ?? key;
const courseName = (key: string) => getGraph().courses.find((c) => c.key === key)?.title ?? key;
const courseShort = (key: string) => {
  const c = getGraph().courses.find((x) => x.key === key);
  return c?.short ?? c?.title ?? key;
};
const ladderFromUrl = () => params().get("s") || "physics";
const courseFromUrl = (ladder: string) => {
  const c = params().get("c");
  const l = catalog.ladders.find((x) => x.key === ladder);
  return c && l?.courseKeys.includes(c) ? c : l?.courseKeys[0] || "phys1";
};

export default function App() {
  const [ladder, setLadder] = useState(ladderFromUrl);
  const [courseKey, setCourseKey] = useState(() => courseFromUrl(ladderFromUrl()));
  const [course, setCourse] = useState<CourseIndex | null>(null);
  const [courseError, setCourseError] = useState("");
  const [slug, setSlug] = useState<string | null>(() => params().get("t"));
  const [query, setQuery] = useState("");
  const [stdOnly, setStdOnly] = useState(false);
  // ?q= is how an in-lesson corpus link lands here: those links point at the
  // upstream site's own paths, so they open the app's search with their label.
  const [globalSearch, setGlobalSearch] = useState(() => params().get("q") ?? "");
  const [mapView, setMapView] = useState(false);
  const [, setTick] = useState(0);
  const [graphReady, setGraphReady] = useState(false);
  const lab = params().get("lab");
  const datasetId = params().get("data");
  const musicParam = params().get("music");
  const planParam = params().get("plan");
  const roadmapParam = params().get("roadmap");
  const aboutParam = params().get("about");
  useT();

  useEffect(() => {
    let alive = true;
    void ensureGraph().then(() => {
      if (!alive) return;
      const E = initProgress(ladder, courseKey);
      setGraphReady(true);
      setTick((n) => n + 1);
      const off = E?.on(() => setTick((n) => n + 1));
      (window as unknown as { __offProgress?: () => void }).__offProgress = off;
    });
    void loadLadder(ladder);
    const onPop = () => {
      const s = ladderFromUrl();
      setLadder(s); setCourseKey(courseFromUrl(s)); setSlug(params().get("t"));
    };
    window.addEventListener("popstate", onPop);
    return () => {
      (window as unknown as { __offProgress?: () => void }).__offProgress?.();
      window.removeEventListener("popstate", onPop);
    };
  }, [ladder, courseKey]);

  useEffect(() => {
    let alive = true;
    // loadCoursePack answers { index: null } when the fetch fails, so a missing
    // index is an error to show, not a heading stuck on "Loading…" for ever.
    void loadCoursePack(ladder, courseKey).then((p) => {
      if (!alive) return;
      setCourse(p.index);
      setCourseError(p.index ? "" : t("catalog.loadFailed"));
    });
    return () => { alive = false; };
  }, [ladder, courseKey]);

  const go = (next: string | null, opts?: { ladder?: string; course?: string }) => {
    const s = opts?.ladder ?? ladder, c = opts?.course ?? courseKey;
    const p = new URLSearchParams();
    p.set("s", s); p.set("c", c);
    if (next) p.set("t", next);
    window.history.pushState({}, "", `${window.location.pathname}?${p.toString()}`);
    setLadder(s); setCourseKey(c); setSlug(next);
    window.scrollTo(0, 0);
  };

  const selectLadder = (key: string) => {
    const c = courseFromUrl(key);
    setActiveLadder(key, c);
    void loadLadder(key);
    go(null, { ladder: key, course: c });
  };

  const topics = useMemo(() => (course?.topics ?? [])
    .filter((x) => x.title.toLowerCase().includes(query.toLowerCase()))
    .filter((x) => (stdOnly ? hasStandards(x.id) : true)), [course, query, stdOnly]);
  const courseStandards = useMemo(() => (course?.topics ?? []).filter((x) => hasStandards(x.id)).length, [course]);
  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (q.length < 2) return [];
    const topics = getGraph().topics.filter((x) => x.title.toLowerCase().includes(q)).slice(0, 12)
      .map((x) => ({ kind: "topic" as const, label: x.title, sub: `${ladderName(x.ladder)} · ${courseName(x.course)}`, go: () => go(x.slug || x.id.split(".").slice(1).join("."), { ladder: x.ladder, course: x.course }) }));
    const datasets = DATASETS.filter(([, label]) => label.toLowerCase().includes(q)).slice(0, 5)
      .map(([k, label]) => ({ kind: "dataset" as const, label, sub: "library", go: () => { window.location.href = `${window.location.pathname}?data=${k}`; } }));
    return [...topics, ...datasets];
  }, [globalSearch, ladder, courseKey, graphReady]);
  const currentLadder = catalog.ladders.find((l) => l.key === ladder) as Ladder;
  const catalogTopics = useMemo(() => catalog.ladders.reduce((n, l) => n + l.topics, 0), []);

  if (lab === "fbd") return (
    <main className="topic-list" id="main-content"><a href="#main-content" className="skip-link">{t("skip")}</a><SiteHeader />
      <button className="btn-link" onClick={() => { window.location.href = window.location.pathname; }}>← All topics</button>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-4)" }}>Free-body diagram lab</h1>
      <div className="figure-card" style={{ marginTop: "var(--sp-4)" }}><Suspense fallback={<p>Loading lab…</p>}><FBDLab /></Suspense></div>
    </main>
  );
  if (lab === "breadboard") return (
    <main className="topic-list" id="main-content"><a href="#main-content" className="skip-link">{t("skip")}</a><SiteHeader />
      <button className="btn-link" onClick={() => { window.location.href = window.location.pathname; }}>← All topics</button>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-4)" }}>Breadboard Lab · Dragology prototype</h1>
      <div className="figure-card" style={{ marginTop: "var(--sp-4)" }}><Suspense fallback={<p>Loading lab…</p>}><BreadboardLab /></Suspense></div>
    </main>
  );
  if (planParam !== null) return <PlanPage onBack={() => { window.location.href = window.location.pathname; }} />;
  if (roadmapParam !== null) return <PlanPage src="docs/roadmap.md" onBack={() => { window.location.href = window.location.pathname; }} />;
  if (aboutParam !== null) return <PlanPage src="docs/about.md" onBack={() => { window.location.href = window.location.pathname; }} />;
  if (musicParam !== null) return (
    <main className="topic-list" id="main-content"><a href="#main-content" className="skip-link">{t("skip")}</a><SiteHeader />
      <button className="btn-link" onClick={() => { window.location.href = window.location.pathname; }}>← All topics</button>
      <MusicLab slug={musicParam} onSelect={(s) => { window.location.href = `${window.location.pathname}?music=${encodeURIComponent(s)}`; }} />
    </main>
  );
  if (datasetId) return (
    <main className="topic-list wide" id="main-content"><a href="#main-content" className="skip-link">{t("skip")}</a><SiteHeader />
      <button className="btn-link" onClick={() => { window.location.href = window.location.pathname; }}>← All topics</button>
      <DatasetBrowser id={datasetId} itemParam={params().get("item")} />
    </main>
  );
  if (slug) return <TopicPage key={`${ladder}/${courseKey}/${slug}`} slug={slug} ladder={ladder} course={courseKey} onBack={() => go(null)} />;

  return (
    <main className="topic-list" id="main-content"><a href="#main-content" className="skip-link">{t("skip")}</a>
      <SiteHeader />
      <p className="eyebrow">{t("home.eyebrow")}</p>
      <h1>{t("home.title")}</h1>
      <p style={{ color: "var(--ink-2)", maxWidth: 620 }}>
        {t("home.intro", { subjects: catalog.ladders.length, topics: catalogTopics })}
      </p>
      <p style={{ color: "var(--ink-3)", fontSize: "var(--fs-0)", maxWidth: 620 }}>
        {t("home.standardsA", { count: marbleIndex.count })} <span className="std-badge">standards</span> {t("home.standardsB")}
      </p>
      <div className="global-search">
        <input value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder={t("home.search", { topics: catalogTopics })} aria-label="Search everything" />
        {searchResults.length > 0 && <ul>
          {searchResults.map((r, i) => <li key={i}><button onClick={r.go}><b>{r.label}</b><span>{r.sub} · {r.kind}</span></button></li>)}
        </ul>}
      </div>
      <ProgressPanel ladder={ladder} onGo={(s, opts) => go(s, opts)} />

      <div className="lab-card"><div><strong>Lab prototype · Free-body diagrams</strong><p>Five corpus scenarios with draggable force arrows.</p></div>
        <button className="btn-primary" onClick={() => { window.location.href = `${window.location.pathname}?lab=fbd`; }}>Open lab →</button></div>
      <div className="lab-card"><div><strong>Lab prototype · Breadboard</strong><p>Model-driven dragging with snapping.</p></div>
        <button className="btn-primary" onClick={() => { window.location.href = `${window.location.pathname}?lab=breadboard`; }}>Open lab →</button></div>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-3)", marginTop: "var(--sp-6)" }}>Library & datasets</h2>
      <div className="lab-card">
        <div><strong>Music lab · playable sheet music</strong><p>20 public-domain songs: synced score, lit keyboard, Web Audio piano, wait-for-me mode.</p></div>
        <button className="btn-primary" onClick={() => { window.location.href = `${window.location.pathname}?music=`; }}>Open music lab →</button>
      </div>
      <div className="ladder-grid">
        {DATASETS.map(([key, label]) => (
          <button key={key} className="ladder-chip" onClick={() => { window.location.href = `${window.location.pathname}?data=${key}`; }}>
            <b>{label}</b><span>open browser →</span>
          </button>
        ))}
      </div>

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-3)", marginTop: "var(--sp-6)" }}>Subjects</h2>
      <div className="ladder-grid">
        {catalog.ladders.map((l) => (
          <button key={l.key} className={l.key === ladder ? "ladder-chip active" : "ladder-chip"} onClick={() => selectLadder(l.key)}>
            <b>{l.short}</b><span>{l.topics} topics · {l.courses} courses</span>
          </button>
        ))}
      </div>

      <div className="course-bar">
        <label>{t("catalog.course")}
          <select value={courseKey} onChange={(e) => { const c = e.target.value; setActiveLadder(ladder, c); go(null, { course: c }); }}>
            {currentLadder?.courseKeys.map((k) => <option key={k} value={k}>{courseName(k)}</option>)}
          </select>
        </label>
        <label>{t("catalog.find")}<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("catalog.find")} /></label>
      </div>

      <div className="view-toggle" role="group" aria-label="View">
        <button className={!mapView ? "chip active" : "chip"} aria-pressed={!mapView} onClick={() => setMapView(false)}>List</button>
        <button className={mapView ? "chip active" : "chip"} aria-pressed={mapView} onClick={() => setMapView(true)}>Skill map</button>
        {courseStandards > 0 && (
          <button className={stdOnly ? "chip active" : "chip"} aria-pressed={stdOnly} onClick={() => setStdOnly((v) => !v)}>
            Standards only ({courseStandards})
          </button>
        )}
      </div>
      {mapView && <SkillMap ladder={ladder} courses={currentLadder?.courseKeys.map((k) => ({ key: k, title: courseName(k), short: courseShort(k) })) ?? []} selected={courseKey} onSelect={(c) => { setActiveLadder(ladder, c); go(null, { course: c }); }} />}

      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-3)", marginTop: "var(--sp-5)" }}>{course?.title ?? (courseError ? t("catalog.topics") : "Loading…")}</h2>
      {courseError && <p role="alert" style={{ color: "var(--danger)", fontSize: "var(--fs-0)" }}>{courseError}</p>}
      <ol>
        {topics.map((topic, i) => {
          const st = topicStatus(topic.id);
          const label = st.passed ? t("status.mastered") : st.status === "due" ? t("status.reviewDue") : st.status === "learning" ? t("status.underWay") : t("status.notStarted");
          return <li key={topic.id}>
            <span className="topic-label">
              <button onClick={() => go(topic.slug)}>{(course?.topics.findIndex((t) => t.id === topic.id) ?? i) + 1}. {topic.title}</button>
              {hasStandards(topic.id) && <span className="std-badge" title="Cross-checked against curriculum standards">standards</span>}
            </span>
            <span className={`status-chip status-${label.replace(/ /g, "-")}`}>{label}</span>
          </li>;
        })}
      </ol>
      {course && topics.length === 0 && <p role="status" style={{ color: "var(--ink-3)" }}>{t("catalog.none")}</p>}
      <IdeaBox />
      <p style={{ marginTop: "var(--sp-4)", marginBottom: 0, fontSize: "var(--fs-0)" }}>
        <button className="btn-link" onClick={() => { window.location.href = `${window.location.pathname}?plan`; }}>
          Design plan — how this interface should look next →
        </button>
        {" · "}
        <button className="btn-link" onClick={() => { window.location.href = `${window.location.pathname}?roadmap`; }}>
          Open-source roadmap and idea book →
        </button>
        {" · "}
        <button className="btn-link" onClick={() => { window.location.href = `${window.location.pathname}?about`; }}>
          About and licences →
        </button>
      </p>
      <footer style={{ marginTop: "var(--sp-6)", borderTop: "1px solid var(--rule)", paddingTop: "var(--sp-3)", color: "var(--ink-3)", fontSize: "var(--fs-0)" }}>{t("footer")}</footer>
    </main>
  );
}
