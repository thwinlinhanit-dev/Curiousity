import { useState } from "react";
import catalog from "../../content/catalog.json";
import musicIndex from "../../content/music/index.json";
import { getGraph, ladderProgress, progressSummary } from "../state/progress";
import { overview, streak } from "../state/learning";
import { DATASETS } from "../state/datasets";
import { t, useT } from "../i18n";
import { navigateTo } from "../utils/route";
import { plural } from "../utils/plural";
import { ProgressBar, Skeleton } from "../components/ui";
import ReviewSession from "../components/ReviewSession";

// Home (plan §4.2): three blocks, nothing else — Continue, Subjects, Explore.
// A returning learner reaches their next lesson in one tap; a new learner in
// two (subject tile → lesson).
export default function Home({ graphReady, graphError, onRetryGraph }: { graphReady: boolean; graphError: string; onRetryGraph: () => void }) {
  useT();
  const [reviewing, setReviewing] = useState(false);
  const sum = progressSummary();
  const learn = overview();
  const due = sum.due + learn.due;

  const next = (() => {
    if (sum.next?.type !== "learn" || !sum.next.id) return null;
    const hit = getGraph().topics.find((x) => x.id === sum.next!.id);
    if (!hit) return null;
    return {
      title: hit.title,
      subject: catalog.ladders.find((l) => l.key === hit.ladder)?.short ?? hit.ladder,
      course: getGraph().courses.find((c) => c.key === hit.course)?.title ?? hit.course,
      href: { s: hit.ladder, c: hit.course, t: hit.slug || hit.id.split(".").slice(1).join(".") },
    };
  })();

  return (
    <div className="screen screen-narrow screen-home">
      <h1>{t("home.tagline")}</h1>

      <section aria-label={t("home.continue")}>
        <div className="continue-card">
          <p className="eyebrow">{t("home.continue")}</p>
          {!graphReady && !graphError && <Skeleton rows={2} />}
          {graphError && (
            <>
              <p className="state-body" role="alert">{graphError}</p>
              <div className="continue-actions"><button className="btn" onClick={onRetryGraph}>{t("states.retry")}</button></div>
            </>
          )}
          {graphReady && next && (
            <>
              <h2 className="continue-title">{next.title}</h2>
              <p className="continue-meta">{next.subject} · {next.course}</p>
              <div className="continue-actions">
                <button className="btn-primary" onClick={() => navigateTo(next.href)}>{t("home.resume")}</button>
                {due > 0 && <button className="btn" onClick={() => setReviewing(true)}>{t("home.startReview")} · {due}</button>}
              </div>
            </>
          )}
          {graphReady && !next && (
            <>
              <h2 className="continue-title">{t("home.fresh")}</h2>
              <p className="continue-meta">{t("home.freshBody", { subjects: catalog.ladders.length, topics: catalog.ladders.reduce((n, l) => n + l.topics, 0) })}</p>
              <div className="continue-actions">
                <button className="btn-primary" onClick={() => navigateTo({ s: "physics" })}>{t("home.startPhysics")}</button>
                {due > 0 && <button className="btn" onClick={() => setReviewing(true)}>{t("home.startReview")} · {due}</button>}
              </div>
            </>
          )}
          {graphReady && (
            <p className="continue-stats">
              <span><b>{learn.known}</b> {t("home.mastered")}</span>
              <span><b>{streak()}</b> {streak() === 1 ? t("progress.dayStreakOne") : t("progress.streak")}</span>
              <span><b>{due}</b> {t("progress.due")}</span>
            </p>
          )}
        </div>
      </section>

      <section aria-label={t("home.subjects")}>
        <h2 className="section-title">{t("home.subjects")}</h2>
        <div className="subject-grid">
          {catalog.ladders.map((l) => {
            const p = graphReady ? ladderProgress(l.key) : { total: l.topics, mastered: 0, inProgress: 0 };
            return (
              <button key={l.key} className="subject-tile" onClick={() => navigateTo({ s: l.key })}>
                <b>{l.short}</b>
                <span className="tile-meta">{plural(l.topics, "lesson")} · {plural(l.courses, "course")}</span>
                <ProgressBar value={p.mastered} max={Math.max(1, p.total)} label={`${l.short}: ${p.mastered} of ${p.total} mastered`} />
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label={t("home.explore")}>
        <h2 className="section-title">{t("home.explore")}</h2>
        <div className="explore-grid">
          <button className="explore-card" onClick={() => navigateTo({ library: "1" })}>
            <b>{t("home.libraryTitle")}</b>
            <span>{t("home.libraryBody", { n: DATASETS.length })}</span>
          </button>
          <button className="explore-card" onClick={() => navigateTo({ labs: "1" })}>
            <b>{t("home.labsTitle")}</b>
            <span>{t("home.labsBody")}</span>
          </button>
          <button className="explore-card" onClick={() => navigateTo({ music: "" })}>
            <b>{t("home.musicShort")}</b>
            <span>{t("home.musicBody2", { n: musicIndex.length })}</span>
          </button>
        </div>
        <p className="explore-more">
          <button className="btn-link" onClick={() => navigateTo({ app: "hub" })}>{t("home.moreTools")}</button>
        </p>
      </section>

      {reviewing && <ReviewSession onClose={() => setReviewing(false)} />}
    </div>
  );
}