import { useEffect, useRef, useState } from "react";
import { t, useT } from "../i18n";

// Step-by-step working reveal (Atlas / Sketchd pattern): one line appears at a time.
export default function WorkingReveal({ steps, answer }: { steps: string[]; answer?: string }) {
  useT();
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { setShown(0); }, [steps]);
  useEffect(() => {
    const w = window as unknown as { MathLadder?: { typeset?: (r: HTMLElement) => void } };
    if (w.MathLadder?.typeset && ref.current) w.MathLadder.typeset(ref.current);
  }, [shown]);
  if (!steps.length) return null;
  return (
    <div className="working-reveal" ref={ref}>
      <div className="working-head">
        <span className="eyebrow">{t("lesson.working")}</span>
        <button className="btn-link" onClick={() => setShown((n) => Math.min(steps.length, n + 1))}>{shown < steps.length ? t("lesson.revealNext") : t("lesson.allShown")}</button>
      </div>
      <ol className="working-steps">
        {steps.slice(0, shown).map((s, i) => <li key={i} className="working-step" dangerouslySetInnerHTML={{ __html: s }} />)}
      </ol>
      {shown >= steps.length && answer && <div className="working-answer" dangerouslySetInnerHTML={{ __html: `<strong>${t("lesson.correctAnswer")}</strong> ${answer}` }} />}
    </div>
  );
}
