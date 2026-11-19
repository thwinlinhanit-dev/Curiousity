import { getLang, setLang, t, useT } from "../i18n";
import { getTheme, toggleTheme, useTheme } from "../state/theme";

export default function SiteHeader() {
  useT();
  useTheme();
  return (
    <div className="site-header" role="toolbar" aria-label="Site preferences">
      <label className="pref">
        <span>{t("lang.label")}</span>
        <select value={getLang()} onChange={(e) => setLang(e.target.value as "en" | "es")} aria-label={t("lang.label")}>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </label>
      <button className="btn" onClick={toggleTheme} aria-pressed={getTheme() === "instrument"}>
        {getTheme() === "instrument" ? "☾ Instrument" : "☀ Lab Notebook"}
      </button>
    </div>
  );
}
