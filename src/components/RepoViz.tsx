import { useEffect, useRef, useState } from "react";
import { loadLadder, mountViz } from "../viz/loadViz";

// Universal fallback: mount ANY of the repo's 100+ visual kits verbatim.
export default function RepoViz({ name, ladder = "physics", opts, task }: { name: string; ladder?: string; opts: Record<string, unknown>; task?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    loadLadder(ladder).then(() => { if (alive) setReady(true); }).catch(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, [ladder]);

  useEffect(() => {
    if (!ready || !host.current) return;
    host.current.innerHTML = "";
    const el = document.createElement("div");
    el.className = "ml-viz";
    el.setAttribute("role", "group");
    el.dataset.viz = name;
    el.dataset.opts = JSON.stringify({ ...opts, ...(task ? { task } : {}) });
    host.current.appendChild(el);
    mountViz(el);
  }, [ready, name, opts, task]);

  return (
    <div className="repo-viz">
      {task && <p className="stage-prompt"><span aria-hidden>◉</span> {task}</p>}
      {!ready && <p style={{ color: "var(--ink-3)" }}>Loading the visual kit…</p>}
      <div ref={host} />
    </div>
  );
}
