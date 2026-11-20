import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";

// All 14 tools are code-split: the hub and the learner flow never download
// their JavaScript until the tool is opened.
const DailyWord = lazy(() => import("./DailyWord"));
const Connections = lazy(() => import("./Connections"));
const PuzzleApp = lazy(() => import("./PuzzleApp"));
const Games = lazy(() => import("./Games"));
const DebateTools = lazy(() => import("./DebateTools"));
const MealPlanner = lazy(() => import("./MealPlanner"));
const TestPrep = lazy(() => import("./TestPrep"));
const LifeSkills = lazy(() => import("./LifeSkills"));
const ReadingPaths = lazy(() => import("./ReadingPaths"));
const MusicTools = lazy(() => import("./MusicTools"));
const SchoolApp = lazy(() => import("./SchoolApp"));
const LanguageLab = lazy(() => import("./LanguageLab"));
const OfflineApp = lazy(() => import("./OfflineApp"));
const Library = lazy(() => import("./Library"));
const ScienceSims = lazy(() => import("./ScienceSims"));
const Gallery = lazy(() => import("./Gallery"));
const MusicExtras = lazy(() => import("./MusicExtras"));
const Daily = lazy(() => import("./Daily"));
const Scripts = lazy(() => import("./Scripts"));
const MemoryStudio = lazy(() => import("./MemoryStudio"));
const MusicCourses = lazy(() => import("./MusicCourses"));

const loaders: Record<string, LazyExoticComponent<ComponentType<any>>> = {
  word: DailyWord, connections: Connections, puzzles: PuzzleApp, games: Games,
  debate: DebateTools, meals: MealPlanner, testprep: TestPrep, life: LifeSkills,
  paths: ReadingPaths, "music-tools": MusicTools, school: SchoolApp,
  languages: LanguageLab, offline: OfflineApp, markets: OfflineApp, library: Library, sims: ScienceSims, gallery: Gallery, "music-extras": MusicExtras, daily: Daily, scripts: Scripts, memory: MemoryStudio, courses: MusicCourses,
};

export function AppView({ id }: { id: string }) {
  const Comp = loaders[id];
  if (!Comp) return (
    <section className="app-section" aria-labelledby="not-found-title">
      <p className="eyebrow">NOT FOUND</p>
      <h2 id="not-found-title">That tool doesn’t exist</h2>
      <p style={{ color: "var(--ink-2)", maxWidth: 620 }}>
        The address may be mistyped or the tool may have moved. Everything that is available is listed in the tool hub.
      </p>
      <a className="btn-primary" href={`${window.location.pathname}?app=hub`}>Back to all tools</a>
    </section>
  );
  return (
    <Suspense fallback={<p className="app-muted" role="status">Loading tool…</p>}>
      {id === "markets" ? <Comp initialTab="online" /> : <Comp />}
    </Suspense>
  );
}
