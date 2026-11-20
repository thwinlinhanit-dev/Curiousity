# Accessibility statement

Curiousity targets **WCAG 2.2 AA**.

- Text is never smaller than 12px; interactive targets in the app tools are at least 44×44px.
- Text colour contrast meets 4.5:1 (3:1 for UI components) in both themes.
- Every view has a skip link and a `main` landmark. Focus is visible; dialogs move focus and return it.
- Figures and visual blocks require written alt text (`npm run alt-text` reports gaps).
- Motion respects `prefers-reduced-motion`; animations and the theme swap are disabled when requested.
- Keyboard paths exist for lessons, practice, review and all app tools. Drag-based figure controls have keyboard alternatives.
- Preferences: theme, text size, background sound, high contrast and reduced spacing are stored locally.

Automated checks: `npm run axe` (static a11y gate), `npm run alt-text`, `npm test` (axe on audited routes in dev).

Known limits: some legacy figure kits predate the alt-text field; the report lists them. 200% zoom and 320px width are checked manually on the primary flows.

If you find a barrier, open an issue with the page, browser and assistive technology used.
