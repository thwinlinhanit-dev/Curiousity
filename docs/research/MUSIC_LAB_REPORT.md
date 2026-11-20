# Music Lab — playable sheet music: COMPLETE ✅

**Date:** 2026-11-18

## What the two videos showed
- **My Heart Will Go On** tutorial: chord cards (C, G, F, Am, Em) with note letters, a subtitle line, and a real hand on a lit MIDI keyboard. Left/right-hand colouring.
- **Proud of you** sheet video: scrolling grand-staff sheet music, finger numbers, a falling chord bar (D → A → F), and a lit keyboard at the bottom synced to the music.

## What was built
A **Music Lab** that reproduces those interaction patterns using the Teddy Rook corpus's own music engine — no runtime LLM and no copyrighted audio.

- Reused the repo's music kit verbatim: `song.js` (notation parser + timing model), `staff.js` (SVG score renderer), `audio.js` (6-partial Web Audio piano, no samples), `keyboard.js` (lit piano with computer-key and MIDI input), `player.js` (play/pause/stop, tempo %, hands, count-in, metronome, loop, letters, **wait-for-me** practice mode).
- `scripts/ingest-music.mjs` converted the repo's public-domain song YAML into **20 playable songs** (fully notated, non-draft): Amazing Grace, Canon in D, Für Elise, Greensleeves, Gymnopédie No. 1, Bach inventions/preludes, Moonlight Sonata, Ode to Joy, The Entertainer, Clementi sonatina, etc.
- `MusicLab.tsx`: song picker + search, synced score, lit keyboard, player controls, song info/source, and a **chord-map card strip** (chord name + triad notes) like the first video's chord cards.
- Route: `?music=<slug>` (or `?music=` for the song list), linked from a dedicated card in **Library & datasets**.

## Verification
- `npm test` 4/4 ✓ · `npm run build` clean.
- Browser: player mounts with score SVG, keyboard, buttons (Play/Stop, tempo, Both/Right/Left, Wait for me, Letters, Count-in, Click, Loop).
- Playback verified: AudioContext running, player `playing = true`, **4 keys lit** during playback.
- Patched the upstream keyboard's duplicate label text so axe reports **0 violations** on the music page.

## Copyright decision
The two videos use copyrighted pop arrangements, so their melodies were **not** extracted into the app. The lab ships public-domain scores from the corpus instead. If you later supply a licensed MIDI/MusicXML file, it can be added as another song through the same parser.

## Next options
- Sync the chord cards to the playhead (needs a small callback hook in the player).
- Add a "falling chord bar" strip like the second video.
- Add user-owned MIDI upload (local file only, no redistribution).
