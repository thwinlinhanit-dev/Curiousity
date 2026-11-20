# Add a lesson in ten minutes

1. Copy an existing bundle from `content/<ladder>/topics/<course>/<slug>.json` (run `npm run dev` once to restore the corpus).
2. Edit `id`, `title`, `course`, `ladder`, `blocks` and `sources`.
3. Each block needs a `t`. Visual blocks need `alt` text. Keep `$…$` balanced.
4. Include at least one worked example (`steps`) and one "Common mistake".
5. Validate with `npx curiousity-validate path/to/lesson.json`.
6. Run `npm run alt-text` and `npm run links` to check your additions.
7. Open a pull request. Credit the source and its licence in `sources`.

Do not write lesson prose with a generative model at runtime or ship unreviewed machine translation.
