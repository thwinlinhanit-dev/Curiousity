import { t, useT } from "../i18n";
import { navigateTo } from "../utils/route";

// Labs index (plan §4.2): the two labs, no "prototype" language.
export default function LabsIndex() {
  useT();
  return (
    <div className="screen screen-narrow">
      <p className="eyebrow">{t("home.explore")}</p>
      <h1>{t("labs.title")}</h1>
      <p className="screen-lead">{t("labs.body")}</p>
      <div className="lab-index-grid">
        <div className="lab-card">
          <div><strong>{t("labs.fbd")}</strong><p>{t("labs.fbdBody")}</p></div>
          <button className="btn-primary" onClick={() => navigateTo({ lab: "fbd" })}>{t("labs.open")}</button>
        </div>
        <div className="lab-card">
          <div><strong>{t("labs.bread")}</strong><p>{t("labs.breadBody")}</p></div>
          <button className="btn-primary" onClick={() => navigateTo({ lab: "breadboard" })}>{t("labs.open")}</button>
        </div>
      </div>
    </div>
  );
}