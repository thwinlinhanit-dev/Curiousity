import { getEngine, getGraph } from "../state/progress";

type Props = { courses: { key: string; title: string; short?: string }[]; selected: string; ladder?: string; onSelect: (key: string) => void };

export default function SkillMap({ courses, selected, ladder = "physics", onSelect }: Props) {
  const E = getEngine();
  const pos = courses.map((c, i) => ({
    ...c,
    x: 80 + (i % 6) * 150,
    y: 70 + Math.floor(i / 6) * 150 + (i % 2 ? 46 : 0),
  }));
  const mastery = (key: string) => {
    const ids = getGraph().topics.filter((t) => t.course === key && t.ladder === ladder).map((t) => t.id);
    const passed = ids.filter((id) => E?.isPassed(id)).length;
    return { passed, total: ids.length };
  };
  return (
    <svg viewBox="0 0 960 360" width="100%" role="img" aria-label="Physics skill map" className="skill-map">
      <rect x="8" y="8" width="944" height="344" rx="6" fill="var(--paper-2)" stroke="var(--rule)" />
      {pos.slice(1).map((c, i) => {
        const p = pos[i];
        return <path key={`p${c.key}`} d={`M ${p.x} ${p.y} C ${p.x + 60} ${p.y + 60}, ${c.x - 60} ${c.y - 60}, ${c.x} ${c.y}`} fill="none" stroke="var(--rule)" strokeWidth="2" />;
      })}
      {pos.map((c) => {
        const m = mastery(c.key);
        const pct = m.total ? m.passed / m.total : 0;
        const color = pct >= 0.99 ? "var(--mastered)" : pct > 0 ? "var(--underway)" : "var(--notstarted)";
        const isSel = c.key === selected;
        return (
          <g key={c.key} onClick={() => onSelect(c.key)} style={{ cursor: "pointer" }} tabIndex={0} role="button" aria-label={`${c.title}: ${m.passed} of ${m.total} mastered`} onKeyDown={(e) => e.key === "Enter" && onSelect(c.key)}>
            <circle cx={c.x} cy={c.y} r={isSel ? 30 : 26} fill="var(--paper)" stroke={color} strokeWidth={isSel ? 4 : 2.5} />
            <circle cx={c.x} cy={c.y} r="20" fill={color} opacity={0.12 + pct * 0.35} />
            <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill="var(--ink)">{m.passed}/{m.total}</text>
            <text x={c.x} y={c.y + 46} textAnchor="middle" fontSize="11" fontFamily="var(--font-body)" fill="var(--ink-2)">{(c.short ?? c.title).slice(0, 24)}</text>
          </g>
        );
      })}
    </svg>
  );
}
