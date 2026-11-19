import { useEffect, useRef, useState } from "react";
import { loadMusic } from "../music/loadMusic";
import { sanitizeLesson } from "../utils/richtext";

// One chapter of the Teddy Rook music curriculum: the real lesson page, with
// its interactive widgets (playable keyboards, staff drills, checklists)
// mounted by the vendored lessons engine.
export default function MusicChapter({ html }: { html: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setError("");
    const clean = sanitizeLesson(html);
    loadMusic()
      .then(() => {
        if (!alive || !host.current) return;
        host.current.innerHTML = clean;
        const TRB = (window as unknown as {
          TRBMusic?: { lessons?: { ui?: { mount: (root: HTMLElement) => void } } };
        }).TRBMusic;
        if (TRB?.lessons?.ui) TRB.lessons.ui.mount(host.current);
        else if (host.current.querySelector("[data-ml]")) setError("The interactive widgets could not load.");
      })
      .catch((e) => {
        if (!alive) return;
        if (host.current) host.current.innerHTML = clean;
        setError(String(e));
      });
    return () => {
      alive = false;
      if (host.current) host.current.innerHTML = "";
    };
  }, [html]);

  return (
    <div className="ml-chapter">
      {error && <p role="alert" style={{ color: "var(--danger)" }}>{error}</p>}
      <div ref={host} />
    </div>
  );
}
