# Shipping 5,321 lessons under a 2,000-file host limit

Draft for the build-in-public post.

The corpus has 11,000+ topic files. GitHub Pages allows about 2,000 published files. The obvious answer — put the corpus in the repo and let the static host serve it — does not work.

So the build does this instead: `fetch-corpus.mjs` restores the corpus from a pinned commit, then `publish-content.mjs` writes one JSON pack per course, each holding its index and every topic bundle that belongs to it. 5,321 lessons become 142 packs. A handful of single-file documents cover the skill graph, datasets, music scores, Marble standards, translations and the daily Harvard readings. The published set is a few hundred files.

The app fetches only the pack for the course the learner opens. The generator kits are vendored once and loaded per ladder. Progress lives in localStorage and exports as a save code, so there is no backend to pay for and no data to leak.

The result is a full K–12 curriculum that works with the wifi off, on a school phone, with no account. The code is MIT; the imported lessons stay CC BY-NC 4.0 with credit. That distinction matters and we say it plainly.

Lessons learned: file-count limits are a design constraint, not a hosting detail; a pinned corpus commit makes builds reproducible; and a content contract test is cheaper than debugging a malformed bundle in a learner's browser.
