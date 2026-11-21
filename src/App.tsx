import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import catalog from "../content/catalog.json";
import TopicPage from "./pages/TopicPage";
import PlanPage from "./pages/PlanPage";
import Home from "./pages/Home";
import SubjectPage from "./pages/SubjectPage";
import LibraryIndex from "./pages/LibraryIndex";
import LabsIndex from "./pages/LabsIndex";
import AppShell from "./components/AppShell";
import DatasetBrowser from "./components/DatasetBrowser";
import MusicLab from "./components/MusicLab";
import AppHub from "./apps/AppHub";
import { AppView } from "./apps";
import { ensureGraph, initProgress, resetGraph, setActiveLadder } from "./state/progress";
import { loadLadder } from "./viz/loadViz";
import { getLang, t, useT } from "./i18n";
import { navigateTo, routeParams } from "./utils/route";
import { DATASETS } from "./state/datasets";
import musicIndex from "../content/music/index.json";
import { APP_DEFS } from "./apps/registry";
import LabErrorBoundary from "./components/LabErrorBoundary";
import Tasl from "./components/Tasl";
import { Skeleton } from "./components/ui";

const BreadboardLab = lazy(() => import("./figures/BreadboardLab"));
const FBDLab = lazy(() => import("./figures/FBDLab"));

const ladderName = (key: string) => catalog.ladders.find((l) => l.key === key)?.short ?? key;
const firstCourse = (ladder: string) => catalog.ladders.find((l) => l.key === ladder)?.courseKeys[0];

// The router (plan §4): one screen, one job. Every route renders inside the
// same AppShell — brand, subject switcher, search, overflow, nothing else.
export default function App() {
  useT();
  const [route, setRoute] = useState(() => routeParams());
  const [, setTick] = useState(0);
  const [graphReady, setGraphReady] = useState(false);
  const [graphError, setGraphError] = useState("");
  const [graphAttempt, setGraphAttempt] = useState(0);

  const s = route.get("s");
  const c = route.get("c");
  const slug = route.get("t");
  const app = route.get("app");
  const lab = route.get("lab");
  const datasetId = route.get("data");
  const musicParam = route.get("music");
  const libraryParam = route.get("library");
  const labsParam = route.get("labs");
  const planParam = route.get("plan");
  const roadmapParam = route.get("roadmap");
  const aboutParam = route.get("about");

  useEffect(() => {
    const onPop = () => setRoute(routeParams());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Graph + progress engine: loaded once, retried on demand.
  useEffect(() => {
    let alive = true;
    let off: (() => void) | undefined;
    setGraphError("");
    void ensureGraph().then(() => {
      if (!alive) return;
      const E = initProgress(s || "physics", c ?? undefined);
      setGraphReady(true);
      setTick((n) => n + 1);
      off = E?.on(() => setTick((n) => n + 1));
    }).catch(() => {
      if (alive) { setGraphReady(false); setGraphError(t("catalog.loadFailed")); }
    });
    return () => { alive = false; off?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphAttempt]);

  // Keep the engine and the visual kit scoped to the subject on screen.
  useEffect(() => {
    if (!graphReady || !s) return;
    setActiveLadder(s, c ?? undefined);
    void loadLadder(s);
  }, [s, c, graphReady]);

  // One descriptive title per route.
  useEffect(() => {
    const brand = "Curiosity — learn anything by taking it apart";
    let title = brand;
    if (app !== null) {
      title = app === "hub" || app === "" ? `More tools · Curiosity` : `${APP_DEFS.find((a) => a.id === app)?.title ?? "Tool not found"} · Curiosity`;
    } else if (lab === "fbd") title = "Free-body diagram lab · Curiosity";
    else if (lab === "breadboard") title = "Breadboard lab · Curiosity";
    else if (musicParam !== null) {
      const song = musicIndex.find((x) => x.slug === musicParam);
      title = `${song?.title ?? "Music lab"} · Curiosity`;
    } else if (datasetId) title = `${DATASETS.find(([k]) => k === datasetId)?.[1] ?? "Library"} · Curiosity`;
    else if (libraryParam !== null) title = "Library · Curiosity";
    else if (labsParam !== null) title = "Labs · Curiosity";
    else if (planParam !== null) title = "Design plan · Curiosity";
    else if (roadmapParam !== null) title = "Roadmap · Curiosity";
    else if (aboutParam !== null) title = "About & licences · Curiosity";
    else if (slug) title = `${slug.replace(/-/g, " ")} · ${ladderName(s ?? "")} · Curiosity`;
    else if (s) title = `${ladderName(s)} · Curiosity`;
    document.title = title;
  }, [app, lab, musicParam, datasetId, libraryParam, labsParam, planParam, roadmapParam, aboutParam, slug, s]);

  const retryGraph = () => { resetGraph(); setGraphAttempt((n) => n + 1); };
  const langNotice = getLang() === "es" ? <p className="lang-notice" role="status">{t("apps.englishOnly")}</p> : null;

  let screen: ReactNode;
  if (app !== null) {
    const atHub = app === "hub" || app === "";
    screen = (
      <div className="screen app-view">
        <button className="btn-link" onClick={() => navigateTo(atHub ? {} : { app: "hub" })}>
          {atHub ? t("apps.home") : t("apps.back")}
        </button>
        {!atHub && <h1 className="sr-only">{APP_DEFS.find((a) => a.id === app)?.title ?? "Tool not found"}</h1>}
        {langNotice}
        {atHub ? <AppHub /> : <AppView id={app} />}
        <Tasl title="Teddy Rook Book" author="Teddy Rook" url="https://teddyrookbook.com/" note="Adapted into this app; wording and layout changed." />
      </div>
    );
  } else if (lab === "fbd" || lab === "breadboard") {
    const Lab = lab === "fbd" ? FBDLab : BreadboardLab;
    screen = (
      <div className="screen">
        <p className="eyebrow">{t("home.explore")}</p>
        <h1>{lab === "fbd" ? t("labs.fbd") : t("labs.bread")}</h1>
        {langNotice}
        <div className="figure-card" style={{ marginTop: "var(--s-4)" }}>
          <LabErrorBoundary>
            <Suspense fallback={<Skeleton rows={4} label={t("apps.loading")} />}><Lab /></Suspense>
          </LabErrorBoundary>
        </div>
      </div>
    );
  } else if (planParam !== null) {
    screen = <PlanPage />;
  } else if (roadmapParam !== null) {
    screen = <PlanPage src="docs/roadmap.md" />;
  } else if (aboutParam !== null) {
    screen = <PlanPage src="docs/about.md" />;
  } else if (musicParam !== null) {
    screen = (
      <div className="screen">
        <h1 className="sr-only">{t("home.musicShort")}</h1>
        {langNotice}
        <MusicLab slug={musicParam} onSelect={(x) => navigateTo({ music: x })} />
      </div>
    );
  } else if (datasetId) {
    screen = (
      <div className="screen">
        <h1 className="sr-only">{DATASETS.find(([k]) => k === datasetId)?.[1] ?? "Library"}</h1>
        {langNotice}
        <DatasetBrowser id={datasetId} itemParam={route.get("item")} />
      </div>
    );
  } else if (libraryParam !== null) {
    screen = <LibraryIndex />;
  } else if (labsParam !== null) {
    screen = <LabsIndex />;
  } else if (slug && s) {
    const course = c || firstCourse(s) || "phys1";
    screen = (
      <TopicPage key={`${s}/${course}/${slug}`} slug={slug} ladder={s} course={course}
        onBack={() => navigateTo({ s, c: course })} />
    );
  } else if (s) {
    screen = <SubjectPage ladder={s} graphReady={graphReady} graphError={graphError} onRetryGraph={retryGraph} />;
  } else {
    screen = <Home graphReady={graphReady} graphError={graphError} onRetryGraph={retryGraph} />;
  }

  return <AppShell>{screen}</AppShell>;
}