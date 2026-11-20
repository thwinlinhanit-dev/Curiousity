import { useEffect, useState } from "react";
import { getLang, setLang, t, useT } from "../i18n";
import { toggleTheme, useTheme } from "../state/theme";
import { applyPreferences, cycleTextSize, getAmbience, getContrast, getSpacious, getTextSize, setAmbience, setContrast, setSpacious } from "../state/preferences";

export default function SiteHeader() {
  useT();
  const theme = useTheme();
  const [size, setSize] = useState(getTextSize());
  const [sound, setSound] = useState(getAmbience());
  const [contrast, setHi] = useState(getContrast());
  const [spacious, setWide] = useState(getSpacious());

  useEffect(() => { applyPreferences(); }, []);

  return (
    <div className="site-header" role="toolbar" aria-label="Site preferences">
      <label className="pref">
        <span>{t("lang.label")}</span>
        <select value={getLang()} onChange={(e) => setLang(e.target.value as "en" | "es")} aria-label={t("lang.label")}>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
      </label>
      <button className="btn" onClick={() => setSize(cycleTextSize())}
        aria-label={`AA ${size === "normal" ? "100%" : size === "large" ? "115%" : "130%"} — change text size`}>
        AA {size === "normal" ? "100%" : size === "large" ? "115%" : "130%"}
      </button>
      <button className="btn btn-sound" onClick={() => setSound(setAmbience(!sound))} aria-pressed={sound}
        aria-label={sound ? "♪ Sound on — stop background music" : "♪ Sound off — play background music"}>
        {sound ? "♪ Sound on" : "♪ Sound off"}
      </button>
      <button className="btn" onClick={() => setHi(setContrast(!contrast))} aria-pressed={contrast}
        aria-label={`High contrast: ${contrast ? "on" : "off"}`}>◐ Contrast</button>
      <button className="btn" onClick={() => setWide(setSpacious(!spacious))} aria-pressed={spacious}
        aria-label={`Roomy spacing: ${spacious ? "on" : "off"}`}>↔ Spacing</button>
      <button className="btn" onClick={toggleTheme} aria-pressed={theme === "instrument"}
        aria-label={`${theme === "instrument" ? t("theme.dark") : t("theme.light")} — ${theme === "instrument" ? t("theme.toLight") : t("theme.toDark")}`}
        title={theme === "instrument" ? t("theme.toLight") : t("theme.toDark")}>
        {theme === "instrument" ? t("theme.dark") : t("theme.light")}
      </button>
    </div>
  );
}
