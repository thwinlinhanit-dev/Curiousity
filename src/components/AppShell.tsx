import { useEffect, useRef, useState, type ReactNode } from "react";
import catalog from "../../content/catalog.json";
import { getLang, setLang, t, useT } from "../i18n";
import { toggleTheme, useTheme } from "../state/theme";
import { applyPreferences, cycleTextSize, getAmbience, getContrast, getSpacious, getTextSize, setAmbience, setContrast, setSpacious } from "../state/preferences";
import { hrefFor, navigateTo, routeParams } from "../utils/route";
import SearchSheet from "./SearchSheet";
import IdeaBox from "./IdeaBox";
import { IconButton } from "./ui";

// The app shell (plan §4.1): brand → home, one subject switcher, search,
// overflow. No other chrome on any screen.
export default function AppShell({ children }: { children: ReactNode }) {
  useT();
  const theme = useTheme();
  const [size, setSize] = useState(getTextSize());
  const [sound, setSound] = useState(getAmbience());
  const [contrast, setHi] = useState(getContrast());
  const [spacious, setWide] = useState(getSpacious());
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);
  const feedbackRef = useRef<HTMLDialogElement>(null);
  const initialQuery = routeParams().get("q") ?? "";

  useEffect(() => { applyPreferences(); }, []);
  // ?q= (a corpus link landing) opens the search sheet with its label.
  useEffect(() => { if (initialQuery) setSearchOpen(true); }, [initialQuery]);

  useEffect(() => {
    const d = menuRef.current;
    if (!d) return;
    if (menuOpen && !d.open) d.showModal();
    if (!menuOpen && d.open) d.close();
  }, [menuOpen]);
  useEffect(() => {
    const d = feedbackRef.current;
    if (!d) return;
    if (feedbackOpen && !d.open) d.showModal();
    if (!feedbackOpen && d.open) d.close();
  }, [feedbackOpen]);

  const s = routeParams().get("s");
  const goDoc = (param: string) => { setMenuOpen(false); navigateTo({ [param]: "1" }); };
  const sizePct = size === "normal" ? "100%" : size === "large" ? "115%" : "130%";

  return (
    <>
      <a href="#main-content" className="skip-link">{t("skip")}</a>
      <header className="app-shell-bar">
        <div className="app-shell-inner">
          <a className="shell-brand" href={hrefFor({})} aria-label={t("shell.home")}
            onClick={(e) => { e.preventDefault(); navigateTo({}); }}>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3.4" fill="var(--bg)" stroke="var(--accent)" strokeWidth="2" />
            </svg>
            <span className="brand-word">Curiosity</span>
          </a>
          <label className="shell-subject">
            <span className="sr-only">{t("shell.subject")}</span>
            <select value={s ?? ""} aria-label={t("shell.subject")}
              onChange={(e) => { if (e.target.value) navigateTo({ s: e.target.value }); }}>
              <option value="" disabled>{t("shell.subject")}</option>
              {catalog.ladders.map((l) => <option key={l.key} value={l.key}>{l.short}</option>)}
            </select>
          </label>
          <span className="shell-spacer" />
          <IconButton label={t("shell.search")} onClick={() => setSearchOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </IconButton>
          <IconButton label={t("shell.overflow")} onClick={() => setMenuOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="5" cy="12" r="1.8" fill="currentColor" /><circle cx="12" cy="12" r="1.8" fill="currentColor" /><circle cx="19" cy="12" r="1.8" fill="currentColor" />
            </svg>
          </IconButton>
        </div>
      </header>

      <main id="main-content">{children}</main>

      <footer className="shell-footer">{t("footer")}</footer>

      <SearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} initialQuery={initialQuery} />

      <dialog ref={menuRef} className="overflow-menu" aria-label={t("shell.overflow")} onClose={() => setMenuOpen(false)}
        onClick={(e) => { if (e.target === menuRef.current) setMenuOpen(false); }}>
        <div className="overflow-section" role="group" aria-label={t("shell.preferences")}>
          <div className="overflow-row">
            <span>{t("shell.theme")}</span>
            <button className="btn" onClick={toggleTheme} aria-pressed={theme === "instrument"}>
              {theme === "instrument" ? t("theme.dark") : t("theme.light")}
            </button>
          </div>
          <div className="overflow-row">
            <span>{t("shell.language")}</span>
            <select value={getLang()} onChange={(e) => setLang(e.target.value as "en" | "es")} aria-label={t("shell.language")}>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div className="overflow-row">
            <span>{t("shell.textSize")}</span>
            <button className="btn" onClick={() => setSize(cycleTextSize())} aria-label={`${t("shell.textSize")} ${sizePct}`}>AA {sizePct}</button>
          </div>
          <div className="overflow-row">
            <span>{t("shell.contrast")}</span>
            <button className="btn" onClick={() => setHi(setContrast(!contrast))} aria-pressed={contrast}>{contrast ? t("shell.on") : t("shell.off")}</button>
          </div>
          <div className="overflow-row">
            <span>{t("shell.spacing")}</span>
            <button className="btn" onClick={() => setWide(setSpacious(!spacious))} aria-pressed={spacious}>{spacious ? t("shell.on") : t("shell.off")}</button>
          </div>
          <div className="overflow-row">
            <span>{t("shell.sound")}</span>
            <button className="btn" onClick={() => setSound(setAmbience(!sound))} aria-pressed={sound}>{sound ? t("shell.on") : t("shell.off")}</button>
          </div>
        </div>
        <div className="overflow-section">
          <button className="overflow-link" onClick={() => { setMenuOpen(false); setFeedbackOpen(true); }}>{t("shell.feedback")}</button>
          <button className="overflow-link" onClick={() => goDoc("about")}>{t("shell.about")}</button>
          <button className="overflow-link" onClick={() => goDoc("plan")}>{t("shell.plan")}</button>
          <button className="overflow-link" onClick={() => goDoc("roadmap")}>{t("shell.roadmap")}</button>
        </div>
      </dialog>

      <dialog ref={feedbackRef} className="feedback-dialog" aria-label={t("shell.feedback")} onClose={() => setFeedbackOpen(false)}>
        <IdeaBox />
        <button className="btn" onClick={() => setFeedbackOpen(false)}>{t("shell.close")}</button>
      </dialog>
    </>
  );
}