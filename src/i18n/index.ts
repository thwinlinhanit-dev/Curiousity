import { useSyncExternalStore } from "react";

export type Lang = "en" | "es";
const KEY = "pf-lang-v1";

const en: Record<string, string> = {
  "home.eyebrow": "PHYSICS FIGURES",
  "home.title": "Learn it by taking it apart.",
  "home.intro": "{subjects} subjects · {topics} topics from the Teddy Rook corpus. Figures you can play, pause and take apart — with real generators, answer checking and one shared progress engine.",
  "home.standardsA": "{count} lessons are cross-checked against curriculum standards (NGSS, UK NC, ACARA, Ontario…) — look for the",
  "home.standardsB": "tag in a topic list.",
  "home.search": "Search all {topics} topics and the library…",
  "progress.totalXp": "total XP", "progress.streak": "day streak", "progress.due": "reviews due", "progress.goal": "today's goal",
  "progress.reviewDue": "Review due today", "progress.nextUp": "Next up:",
  "progress.start": "Start review →", "progress.reasonNext": "next", "progress.reasonPrereq": "prerequisite", "progress.saveCode": "Save code / move progress",
  "progress.saveNote": "Progress is saved in this browser (shareable with the Teddy Rook engine).",
  "progress.export": "Export code", "progress.import": "Import", "progress.placeholder": "Paste a save code",
  "progress.exported": "Copy this code.", "progress.loaded": "Progress loaded.", "progress.bad": "That code wasn't recognised. Check the code and try again.",
  "catalog.course": "Course", "catalog.find": "Find a topic…", "catalog.noMatches": "No topics match.",
  "catalog.loadFailed": "Couldn't load this course — check your connection and reload.",
  "catalog.topics": "Topics", "catalog.none": "No topic here matches that search or filter.",
  "status.notStarted": "not started", "status.underWay": "under way", "status.mastered": "mastered", "status.reviewDue": "review due",
  "footer": "Content © Teddy Rook · CC BY-NC 4.0 · engine MIT · attribute + link back.",
  "lesson.back": "← All topics", "lesson.eyebrow": "LESSON", "lesson.commonMistake": "Common mistake:",
  "lesson.loadError": "Couldn't load this topic. Try again or return to subjects.",
  "lesson.tryAgain": "Try again", "skip": "Skip to content",
  "lesson.stageDefault": "Play the figure. Pause it and read the values.",
  "lesson.prev": "‹ Prev", "lesson.continue": "Continue ›", "lesson.narrate": "◎ Narrate this step", "lesson.stopNarration": "■ Stop narration",
  "lesson.practice": "Practice", "lesson.noGenerator": "No generator for this topic yet. Read the worked examples, or choose another topic.", "lesson.level": "Difficulty",
  "lesson.answer": "Your answer", "lesson.check": "Check", "lesson.another": "Another ↻",
  "lesson.correct": "Correct.", "lesson.notQuite": "Not quite.", "lesson.cantRead": "I couldn't read that answer.",
  "lesson.hint": "Hint:", "lesson.showWorking": "Show the working →", "lesson.working": "WORKING",
  "lesson.revealNext": "Reveal next step ›", "lesson.allShown": "All steps shown", "lesson.correctAnswer": "Correct answer:",
  "lesson.sources": "Sources & licence", "lesson.tryIt": "Try it — how high does the ball go? (m)",
  "lesson.clear": "Clear", "lesson.noFigure": "This topic has no interactive figure in the source yet — the full written lesson is shown below.",
  "lesson.onlyEnglish": "This lesson's text is only available in English — the menus and controls are translated.",
  "lesson.correctP": "correct", "lesson.streak2": "streak", "lesson.reviewSchedule": "reviews at 1·3·7·16·35·75·150 d",
  "pacing.play": "▶ Play", "pacing.pause": "❚❚ Pause", "pacing.step": "Step ›", "pacing.speed": "Speed", "pacing.time": "Time",
  "layers.title": "Figure layers", "layers.vectors": "v / a arrows", "layers.strobe": "motion map", "layers.curves": "curves", "layers.values": "values",
  "theme.toggle": "Theme", "lang.label": "Language",
  "idea.title": "What should exist next?", "idea.role": "You are", "idea.placeholder": "A topic, an app, a change, anything…",
  "idea.send": "Send", "idea.thanks": "Got it, thank you.", "idea.note": "This lands in this browser only — connect a backend to collect ideas.",
  "orbit.title": "3D orbit", "orbit.twoD": "2D figure", "orbit.threeD": "3D view",
  "apps.hubTitle": "More ways to use the corpus",
  "apps.hubLead": "The ladders are the core. These tools wrap around them: a daily habit, a way to plan the school day, and a set of small instruments for exploring how the subjects connect. All free, all local to your browser.",
  "apps.loading": "Loading tool…", "apps.back": "← All tools", "apps.home": "← Home",
  "apps.open": "Open →", "apps.group.daily": "Daily & fun", "apps.group.practical": "Practical tools", "apps.group.deep": "Deep dives",
  "apps.englishOnly": "These tools and the corpus content are in English for now. Navigation and translated lesson pages are in Spanish.",
  "theme.light": "☀ Light", "theme.dark": "☾ Dark", "theme.toDark": "Switch to the dark Instrument theme", "theme.toLight": "Switch to the light Lab Notebook theme",
  "progress.dayStreakOne": "day streak",
};

const es: Record<string, string> = {
  "home.eyebrow": "FIGURAS DE FÍSICA",
  "home.title": "Apréndelo desmontándolo.",
  "home.intro": "{subjects} asignaturas · {topics} temas del corpus Teddy Rook. Figuras que puedes reproducir, pausar y desmontar — con generadores reales, corrección de respuestas y un motor de progreso compartido.",
  "home.standardsA": "{count} lecciones están contrastadas con estándares curriculares (NGSS, UK NC, ACARA, Ontario…) — busca la etiqueta",
  "home.standardsB": "en la lista de temas.",
  "home.search": "Buscar en los {topics} temas y la biblioteca…",
  "progress.totalXp": "XP total", "progress.streak": "días seguidos", "progress.due": "repasos pendientes", "progress.goal": "objetivo de hoy",
  "progress.reviewDue": "Repasos de hoy", "progress.nextUp": "A continuación:",
  "progress.start": "Empezar repaso →", "progress.reasonNext": "siguiente", "progress.reasonPrereq": "requisito previo", "progress.saveCode": "Código de guardado / mover progreso",
  "progress.saveNote": "El progreso se guarda en este navegador (compatible con Teddy Rook).",
  "progress.export": "Exportar código", "progress.import": "Importar", "progress.placeholder": "Pega un código de guardado",
  "progress.exported": "Copia este código.", "progress.loaded": "Progreso cargado.", "progress.bad": "No se reconoció ese código. Revísalo e inténtalo de nuevo.",
  "catalog.course": "Curso", "catalog.find": "Buscar un tema…", "catalog.noMatches": "Ningún tema coincide.",
  "catalog.loadFailed": "No se pudo cargar este curso — revisa la conexión y recarga.",
  "catalog.topics": "Temas", "catalog.none": "Ningún tema coincide con esa búsqueda o filtro.",
  "status.notStarted": "sin empezar", "status.underWay": "en curso", "status.mastered": "dominado", "status.reviewDue": "repaso pendiente",
  "footer": "Contenido © Teddy Rook · CC BY-NC 4.0 · motor MIT · atribución y enlace.",
  "lesson.back": "← Todos los temas", "lesson.eyebrow": "LECCIÓN", "lesson.commonMistake": "Error común:",
  "lesson.loadError": "No se pudo cargar este tema. Inténtalo de nuevo o vuelve a las asignaturas.",
  "lesson.tryAgain": "Intentar de nuevo", "skip": "Saltar al contenido",
  "lesson.stageDefault": "Reproduce la figura. Pausa y lee los valores.",
  "lesson.prev": "‹ Anterior", "lesson.continue": "Continuar ›", "lesson.narrate": "◎ Narrar este paso", "lesson.stopNarration": "■ Detener narración",
  "lesson.practice": "Práctica", "lesson.noGenerator": "Este tema aún no tiene generador. Lee los ejemplos resueltos o elige otro tema.", "lesson.level": "Dificultad",
  "lesson.answer": "Tu respuesta", "lesson.check": "Comprobar", "lesson.another": "Otro ↻",
  "lesson.correct": "Correcto.", "lesson.notQuite": "No exactamente.", "lesson.cantRead": "No pude leer esa respuesta.",
  "lesson.hint": "Pista:", "lesson.showWorking": "Ver el desarrollo →", "lesson.working": "DESARROLLO",
  "lesson.revealNext": "Mostrar siguiente paso ›", "lesson.allShown": "Todos los pasos", "lesson.correctAnswer": "Respuesta correcta:",
  "lesson.sources": "Fuentes y licencia", "lesson.tryIt": "Prueba: ¿a qué altura sube la pelota? (m)",
  "lesson.clear": "Limpiar", "lesson.noFigure": "Este tema aún no tiene figura interactiva — abajo está la lección escrita completa.",
  "lesson.onlyEnglish": "El texto de esta lección solo está disponible en inglés — los menús y controles están traducidos.",
  "lesson.correctP": "aciertos", "lesson.streak2": "racha", "lesson.reviewSchedule": "repasos a 1·3·7·16·35·75·150 días",
  "pacing.play": "▶ Reproducir", "pacing.pause": "❚❚ Pausa", "pacing.step": "Paso ›", "pacing.speed": "Velocidad", "pacing.time": "Tiempo",
  "layers.title": "Capas de la figura", "layers.vectors": "flechas v / a", "layers.strobe": "mapa de movimiento", "layers.curves": "curvas", "layers.values": "valores",
  "theme.toggle": "Tema", "lang.label": "Idioma",
  "idea.title": "¿Qué debería existir después?", "idea.role": "Eres", "idea.placeholder": "Un tema, una app, un cambio, lo que sea…",
  "idea.send": "Enviar", "idea.thanks": "Recibido, gracias.", "idea.note": "Esto se guarda solo en este navegador — conecta un backend para recoger ideas.",
  "orbit.title": "Órbita 3D", "orbit.twoD": "Figura 2D", "orbit.threeD": "Vista 3D",
  "apps.hubTitle": "Más formas de usar el corpus",
  "apps.hubLead": "Las escaleras son el núcleo. Estas herramientas las rodean: un hábito diario, una forma de planificar el día escolar y pequeños instrumentos para explorar cómo se conectan las materias. Todo gratis y en tu navegador.",
  "apps.loading": "Cargando herramienta…", "apps.back": "← Todas las herramientas", "apps.home": "← Inicio",
  "apps.open": "Abrir →", "apps.group.daily": "Diario y diversión", "apps.group.practical": "Herramientas prácticas", "apps.group.deep": "Exploraciones a fondo",
  "apps.englishOnly": "Estas herramientas y el contenido del corpus están en inglés por ahora. La navegación y las lecciones traducidas están en español.",
  "theme.light": "☀ Claro", "theme.dark": "☾ Oscuro", "theme.toDark": "Cambiar al tema oscuro Instrument", "theme.toLight": "Cambiar al tema claro Lab Notebook",
  "progress.dayStreakOne": "día seguido",
};

const dicts: Record<Lang, Record<string, string>> = { en, es };
let lang: Lang = (() => {
  try { const v = localStorage.getItem(KEY); return v === "es" ? "es" : "en"; } catch { return "en"; }
})();
const listeners = new Set<() => void>();

export function getLang(): Lang { return lang; }
export function setLang(l: Lang) {
  lang = l;
  try { localStorage.setItem(KEY, l); } catch { /* blocked */ }
  document.documentElement.setAttribute("lang", l);
  listeners.forEach((f) => f());
}
setLang(lang);

export function t(key: string, vars?: Record<string, string | number>): string {
  let s = dicts[lang][key] ?? dicts.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  return s;
}

export function useT() {
  return useSyncExternalStore((fn) => { listeners.add(fn); return () => { listeners.delete(fn); }; }, () => lang);
}
