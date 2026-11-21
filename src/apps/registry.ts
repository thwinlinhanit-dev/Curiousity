// Metadata for every expansion in the app hub. Components live in ./index.ts
// so the hub can list planned features before their slice is implemented.
export type AppGroup = "Daily & fun" | "Practical tools" | "Deep dives";

export type AppDef = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  group: AppGroup;
};

export const APP_DEFS: AppDef[] = [
  { id: "word", icon: "🔤", title: "Daily word puzzle", desc: "Guess the Koine Greek or Latin word of the day in six tries.", group: "Daily & fun" },
  { id: "connections", icon: "🕸️", title: "Connections", desc: "All 31 places where music, maths, patterns, chemistry and physics meet.", group: "Daily & fun" },
  { id: "puzzles", icon: "🧩", title: "Brain puzzles", desc: "Number, logic, word, shape and code puzzles, generated with answer keys.", group: "Daily & fun" },
  { id: "games", icon: "🎲", title: "Games", desc: "Brain games and an ancient-world game you can play right here.", group: "Daily & fun" },

  { id: "debate", icon: "⚖️", title: "Debate tools", desc: "A format-aware timer, flow sheets and a case builder for 50 resolutions.", group: "Practical tools" },
  { id: "meals", icon: "🍽️", title: "Meal planner", desc: "Plan a week, scale recipes, and get one shopping list sorted by aisle.", group: "Practical tools" },
  { id: "testprep", icon: "⏱️", title: "Test prep", desc: "Timed SAT, ACT and CLT practice drawn from the Math Ladder.", group: "Practical tools" },
  { id: "life", icon: "🔧", title: "Being an Adult 101", desc: "34 guides to the things a good parent teaches before a kid leaves home.", group: "Practical tools" },
  { id: "paths", icon: "📚", title: "Reading paths", desc: "Seven curated routes through the library, with your place remembered.", group: "Practical tools" },
  { id: "music-tools", icon: "🎵", title: "Music tools", desc: "A metronome and a two-hand rhythm trainer for practice.", group: "Practical tools" },

  { id: "school", icon: "🗓️", title: "Homeschool planner", desc: "Children, subjects and time in — a week-by-week plan out.", group: "Deep dives" },
  { id: "languages", icon: "🏛️", title: "Language lab", desc: "Greek and Latin flashcards, a word-by-word reader and the alphabet.", group: "Deep dives" },
  { id: "offline", icon: "📴", title: "Offline & embeds", desc: "Keep sections on this device, and take snippet code for your co-op.", group: "Deep dives" },
  { id: "markets", icon: "📈", title: "Markets & economy", desc: "Live market dashboards — an optional online panel, outside the offline core.", group: "Deep dives" },
  { id: "library", icon: "📖", title: "Full-text library", desc: "AP maps, founding papers, Harvard readings, great ideas, phonics, cases and more.", group: "Deep dives" },
  { id: "sims", icon: "⚗️", title: "Science Lab sims", desc: "Trebuchet, orbits and ecosystems — real equations you can play with.", group: "Deep dives" },
  { id: "gallery", icon: "🎡", title: "Math Gallery", desc: "Galton board, Monty Hall, Buffon, Collatz and a double pendulum.", group: "Daily & fun" },
  { id: "music-extras", icon: "🎚️", title: "Tuner & chords", desc: "Microphone tuner, chord finder and ten reading-music drills.", group: "Practical tools" },
  { id: "daily", icon: "🏠", title: "Start here / Today", desc: "A five-question onboarding quiz, today's practice and family backups.", group: "Daily & fun" },
  { id: "scripts", icon: "𓋹", title: "Ancient script studio", desc: "A hieroglyph cartouche and your name in Linear B.", group: "Deep dives" },
  { id: "memory", icon: "🧠", title: "Memory studio", desc: "43 challenge lists with spaced cards, pairs and a memory palace.", group: "Daily & fun" },
  { id: "courses", icon: "🎼", title: "Music courses", desc: "Piano, guitar, ukulele, banjo and reading music, chapter by chapter.", group: "Practical tools" },
  { id: "export", icon: "📦", title: "Export & worksheets", desc: "Own your progress JSON, course packs and printable worksheets with answer keys.", group: "Practical tools" },
  { id: "translate", icon: "🌍", title: "Translation review", desc: "Review the machine-translated Spanish lessons and export approved versions.", group: "Practical tools" },
];

export const APP_GROUPS: AppGroup[] = ["Daily & fun", "Practical tools", "Deep dives"];
