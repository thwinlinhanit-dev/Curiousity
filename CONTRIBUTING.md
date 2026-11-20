# Contributing

Curiousity is free forever, with no accounts, ads or tracking. Contributions are welcome and credited.

## Ten-minute path: add a lesson

1. Fork and clone; `npm install`.
2. Read [docs/add-a-lesson.md](docs/add-a-lesson.md) and [docs/architecture.md](docs/architecture.md).
3. Copy `schema/example-lesson.json` (or an existing topic bundle) and edit.
4. Validate: `npx curiousity-validate path/to/lesson.json`.
5. Open a pull request describing the source and licence of any content you added.

## Rules

- Code is MIT. The corpus is CC BY-NC 4.0; Marble data is ODbL/CC BY-SA and stays isolated.
- No runtime AI generation of lesson prose. Generated practice from the checked generators is fine.
- No new runtime dependency without a written justification in the PR.
- Every visual block needs `alt` text. Every lesson needs sources and at least one worked example.
- Never add analytics, accounts or paid tiers.

## Good first issues

- Fix a lesson link reported by `npm run links`.
- Add alt text to one of the blocks reported by `npm run alt-text`.
- Translate one lesson into Spanish and add it under `content/i18n/es/topics/`.

## Checks before a PR

`npm test`, `npm run build`, `npm run links`, `npm run coverage`, `npm run alt-text`.
