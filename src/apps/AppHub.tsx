import { APP_DEFS, APP_GROUPS } from "./registry";
import { navigate } from "../utils/navigate";
import { t, useT } from "../i18n";

const open = (id: string) => {
  const p = new URLSearchParams({ app: id });
  navigate(`${window.location.pathname}?${p.toString()}`, () => {
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
};

const GROUP_KEY: Record<string, string> = {
  "Daily & fun": "apps.group.daily",
  "Practical tools": "apps.group.practical",
  "Deep dives": "apps.group.deep",
};

export default function AppHub() {
  useT();
  return (
    <section aria-labelledby="apps-title">
      <p className="eyebrow">BEYOND THE LADDERS</p>
      <h1 id="apps-title" style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-3)" }}>
        {t("apps.hubTitle")}
      </h1>
      <p style={{ color: "var(--ink-2)", maxWidth: 660 }}>
        {t("apps.hubLead")}
      </p>
      {APP_GROUPS.map((group) => (
        <div key={group} className="app-group">
          <h2>{t(GROUP_KEY[group] ?? group)}</h2>
          <div className="app-card-grid">
            {APP_DEFS.filter((a) => a.group === group).map((a) => (
              <button key={a.id} className="app-card" onClick={() => open(a.id)}>
                <span className="app-card-icon" aria-hidden="true">{a.icon}</span>
                <b>{a.title}</b>
                <span>{a.desc}</span>
                <span className="app-card-cta">{t("apps.open")}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="app-attribution">
        Adapted from <a href="https://teddyrookbook.com/" target="_blank" rel="noreferrer">Teddy Rook Book</a> · CC BY-NC 4.0 · credit and link back required
      </p>
    </section>
  );
}

export { open as openApp };
