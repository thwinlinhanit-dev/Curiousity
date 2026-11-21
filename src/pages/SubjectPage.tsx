import { useMemo, useState } from "react";
import catalog from "../../content/catalog.json";
import { getGraph, ladderProgress, nextInLadder, topicStatus } from "../state/progress";
import { hasStandards } from "../state/datasets";
import { t, useT } from "../i18n";
import { navigateTo } from "../utils/route";
import { plural } from "../utils/plural";
import { EmptyState, ErrorState, ListRow, ProgressBar, Skeleton } from "../components/ui";

// Subject page (plan §4.2): header with progress and Continue, then courses
// as a vertical list, each expanding to its lessons. One filter row.
export default function SubjectPage({ ladder, graphReady, graphError, onRetryGraph }: { ladder: string; graphReady: boolean; graphError: string; onRetryGraph: () => void }) {
  useT();
  const [query, setQuery] = useState("");
  const [stdOnly, setStdOnly] = useState(false);
  const meta = catalog.ladders.find((l) => l.key === ladder);
  const graph = getGraph();

  const courses = useMemo(() => {
    const keys = meta?.courseKeys ?? [];
    return keys.map((key) => ({
      key,
      title: graph.courses.find((c) => c.key === key)?.title ?? key,
      topics: graph.topics.filter((x) => x.ladder === ladder && x.course === key),
    }));
  }, [graph, ladder, meta, graphReady]);

  const q = query.trim().toLowerCase();
  const filtering = q.length > 0 || stdOnly;
  const matches = (x: { id: string; title: string }) =>
    (!q || x.title.toLowerCase().includes(q)) && (!stdOnly || hasStandards(x.id));
  const visibleCourses = courses
    .map((c) => ({ ...c, shown: c.topics.filter(matches) }))
    .filter((c) => (filtering ? c.shown.length > 0 : true));
  const stdCount = useMemo(() => graph.topics.filter((x) => x.ladder === ladder && hasStandards(x.id)).length, [graph, ladder, graphReady]);

  const progress = graphReady ? ladderProgress(ladder) : { total: meta?.topics ?? 0, mastered: 0, inProgress: 0 };
  const next = graphReady ? nextInLadder(ladder) : null;
  const nextCourse = next?.course;

  if (!meta) {
    return (
      <div className="screen screen-narrow">
        <ErrorState body={t("subject.unknown", { key: ladder })} onRetry={() => navigateTo({})} retryLabel={t("subject.backHome")} />
      </div>
    );
  }

  return (
    <div className="screen screen-narrow">
      <div className="subject-head">
        <p className="eyebrow">{t("subject.eyebrow")}</p>
        <h1>{meta.short}</h1>
        <p className="subject-count">{plural(meta.courses, "course")} · {plural(meta.topics, "lesson")}</p>
        {graphError && <ErrorState body={graphError} onRetry={onRetryGraph} />}
        {!graphReady && !graphError && <Skeleton rows={2} />}
        {graphReady && (
          <div className="subject-progress">
            <ProgressBar value={progress.mastered} max={Math.max(1, progress.total)} label={t("subject.masteredOf", { m: progress.mastered, n: progress.total })} />
            <span className="subject-count">{t("subject.masteredOf", { m: progress.mastered, n: progress.total })}</span>
            {next ? (
              <button className="btn-primary" onClick={() => navigateTo({ s: ladder, c: next.course, t: next.slug })}>{t("subject.continue")}</button>
            ) : (
              <span className="subject-count">{t("subject.allMastered")}</span>
            )}
          </div>
        )}
      </div>

      <div className="filter-row">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={t("subject.find")} aria-label={t("subject.find")} />
        {stdCount > 0 && (
          <button className="chip" aria-pressed={stdOnly} onClick={() => setStdOnly((v) => !v)}>
            {t("subject.standardsOnly")} ({stdCount})
          </button>
        )}
      </div>

      {graphReady && visibleCourses.length === 0 && (
        <EmptyState title={t("subject.noMatch")} body={t("subject.noMatchBody")}
          action={{ label: t("subject.clear"), onClick: () => { setQuery(""); setStdOnly(false); } }} />
      )}
      {graphReady && courses.length > 0 && courses.every((c) => c.topics.length === 0) && (
        <EmptyState title={t("subject.noLessons")} />
      )}

      {visibleCourses.map((c) => (
        <details key={c.key} className="course-block" open={filtering || c.key === nextCourse}>
          <summary>
            {c.title}
            <span className="course-count">
              {filtering ? `${c.shown.length} / ${c.topics.length}` : plural(c.topics.length, "lesson")}
            </span>
          </summary>
          {c.shown.length === 0 ? (
            <p className="state-body" style={{ padding: "var(--s-3) var(--s-4)" }}>{t("subject.noLessons")}</p>
          ) : (
            <ul className="list-rows">
              {c.shown.map((topic) => {
                const idx = c.topics.findIndex((x) => x.id === topic.id);
                return (
                  <ListRow key={topic.id} index={idx + 1} title={topic.title}
                    status={topicStatus(topic.id)} standards={hasStandards(topic.id)}
                    onClick={() => navigateTo({ s: ladder, c: c.key, t: topic.slug || topic.id.split(".").slice(1).join(".") })} />
                );
              })}
            </ul>
          )}
        </details>
      ))}
    </div>
  );
}