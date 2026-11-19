import { useEffect, useMemo, useState } from "react";
import { groupedLinks, loadLinks, type LibraryLink } from "../state/library";
import "./marble.css";
import "./library-strip.css";

// "Go deeper" — library items (explorers, maps, lists, events) that connect
// to this lesson. Built offline; silent when nothing matches.
export default function LibraryStrip({ topicId }: { topicId: string }) {
  const [rows, setRows] = useState<LibraryLink[] | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    setRows(undefined);
    loadLinks().then((d) => { if (alive) setRows(d ? d.byTopic[topicId] : null as never); });
    return () => { alive = false; };
  }, [topicId]);

  const groups = useMemo(() => groupedLinks(rows), [rows]);
  if (!rows || !groups.length) return null;

  const base = window.location.pathname;
  return (
    <section className="lib-strip" aria-label="Go deeper in the library">
      <h3 className="lib-strip-title">Go deeper</h3>
      <div className="lib-strip-groups">
        {groups.map((g) => (
          <div className="lib-group" key={g.dataset}>
            <span className="lib-group-label">{g.label}</span>
            {g.items.map((it, i) => (
              <a key={i} className="lib-chip" href={`${base}?data=${encodeURIComponent(g.dataset)}&item=${encodeURIComponent(it.key)}`}>
                {it.title}
              </a>
            ))}
            {g.extra > 0 && (
              <a className="lib-chip lib-chip-more" href={`${base}?data=${encodeURIComponent(g.dataset)}`}>
                +{g.extra} more
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
