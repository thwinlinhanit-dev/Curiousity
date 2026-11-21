import { useEffect, useMemo, useRef, useState } from "react";
import catalog from "../../content/catalog.json";
import musicIndex from "../../content/music/index.json";
import { getGraph } from "../state/progress";
import { DATASETS } from "../state/datasets";
import { t, useT } from "../i18n";
import { hrefFor, navigateTo } from "../utils/route";
import { EmptyState, ListRow, Skeleton } from "./ui";

type Hit = { key: string; title: string; meta: string; href: string };

// Full-screen search sheet (plan §4.1): results grouped Lessons · Library ·
// Songs, with a real empty state. Lesson-text hits use the bundled search
// index; it is fetched lazily, only once someone actually searches.
export default function SearchSheet({ open, onClose, initialQuery = "" }: { open: boolean; onClose: () => void; initialQuery?: string }) {
  useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [textDoc, setTextDoc] = useState<{ entries: { id: string; title: string; ladder: string; course: string; slug: string; excerpt: string }[] } | null>(null);
  const [textLoading, setTextLoading] = useState(false);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) { d.showModal(); setQuery(initialQuery); requestAnimationFrame(() => inputRef.current?.focus()); }
    if (!open && d.open) d.close();
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open || query.trim().length < 2 || textDoc || textLoading) return;
    setTextLoading(true);
    fetch(`${import.meta.env.BASE_URL}content/search-index.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setTextDoc(d))
      .catch(() => setTextDoc({ entries: [] }))
      .finally(() => setTextLoading(false));
  }, [open, query, textDoc, textLoading]);

  const q = query.trim().toLowerCase();
  const groups = useMemo(() => {
    if (q.length < 2) return null;
    const graph = getGraph();
    const ladderName = (key: string) => catalog.ladders.find((l) => l.key === key)?.short ?? key;
    const courseName = (key: string) => graph.courses.find((c) => c.key === key)?.title ?? key;
    const lessons: Hit[] = graph.topics
      .filter((x) => x.title.toLowerCase().includes(q))
      .slice(0, 12)
      .map((x) => ({
        key: `t-${x.id}`, title: x.title, meta: `${ladderName(x.ladder)} · ${courseName(x.course)}`,
        href: hrefFor({ s: x.ladder, c: x.course, t: x.slug || x.id.split(".").slice(1).join(".") }),
      }));
    const seen = new Set(lessons.map((l) => l.title));
    const textHits: Hit[] = (textDoc?.entries ?? [])
      .filter((x) => !seen.has(x.title) && (x.excerpt.toLowerCase().includes(q) || x.title.toLowerCase().includes(q)))
      .slice(0, 5)
      .map((x) => ({ key: `x-${x.id}`, title: x.title, meta: `${x.excerpt.slice(0, 70)}… · ${ladderName(x.ladder)}`, href: hrefFor({ s: x.ladder, c: x.course, t: x.slug }) }));
    const library: Hit[] = DATASETS.filter(([, label]) => label.toLowerCase().includes(q)).slice(0, 6)
      .map(([k, label]) => ({ key: `d-${k}`, title: label, meta: t("search.library"), href: hrefFor({ data: k }) }));
    const songs: Hit[] = musicIndex.filter((s) => `${s.title} ${s.composer}`.toLowerCase().includes(q)).slice(0, 6)
      .map((s) => ({ key: `s-${s.slug}`, title: s.title, meta: `${s.composer} · ${t("search.songs")}`, href: hrefFor({ music: s.slug }) }));
    return { lessons: [...lessons, ...textHits], library, songs };
  }, [q, textDoc]);

  const total = groups ? groups.lessons.length + groups.library.length + groups.songs.length : 0;
  const go = (href: string) => { onClose(); navigateTo(Object.fromEntries(new URL(href, window.location.href).searchParams)); };

  return (
    <dialog ref={dialogRef} className="search-sheet" aria-label={t("shell.search")} onClose={onClose}>
      <div className="search-sheet-inner">
        <div className="search-bar">
          <input ref={inputRef} type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder")} aria-label={t("shell.search")} />
          <button className="btn" onClick={onClose}>{t("shell.close")}</button>
        </div>
        {q.length < 2 && <p className="search-hint">{t("search.hint", { n: catalog.ladders.reduce((n, l) => n + l.topics, 0), s: musicIndex.length })}</p>}
        {q.length >= 2 && textLoading && !groups?.lessons.length && <Skeleton rows={3} label={t("search.loading")} />}
        {q.length >= 2 && groups && total === 0 && !textLoading && (
          <EmptyState title={t("search.empty", { q: query.trim() })} body={t("search.emptyBody")}
            action={{ label: t("search.clear"), onClick: () => { setQuery(""); inputRef.current?.focus(); } }} />
        )}
        {groups && total > 0 && (
          <div className="search-groups">
            {groups.lessons.length > 0 && (
              <section className="search-group" aria-label={t("search.lessons")}>
                <p className="eyebrow">{t("search.lessons")}</p>
                <ul className="list-rows">
                  {groups.lessons.map((h) => <ListRow key={h.key} title={h.title} meta={h.meta} onClick={() => go(h.href)} />)}
                </ul>
              </section>
            )}
            {groups.library.length > 0 && (
              <section className="search-group" aria-label={t("search.library")}>
                <p className="eyebrow">{t("search.library")}</p>
                <ul className="list-rows">
                  {groups.library.map((h) => <ListRow key={h.key} title={h.title} meta={h.meta} onClick={() => go(h.href)} />)}
                </ul>
              </section>
            )}
            {groups.songs.length > 0 && (
              <section className="search-group" aria-label={t("search.songs")}>
                <p className="eyebrow">{t("search.songs")}</p>
                <ul className="list-rows">
                  {groups.songs.map((h) => <ListRow key={h.key} title={h.title} meta={h.meta} onClick={() => go(h.href)} />)}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}