# Release checklist

1. Update `CHANGELOG.md` with the version and date.
2. Run all gates: `npm test`, `npm run build`, `npm run links`, `npm run axe`, `npm run budget`.
3. Tag the commit: `git tag -a vX.Y.Z -m "vX.Y.Z" && git push --tags`.
4. Attach `dist/` to the GitHub release as a zip so the static build is archived.
5. Create a Zenodo deposit for the tag: import `.zenodo.json`, upload the same zip, publish, copy the DOI.
6. Add the DOI to the GitHub release notes and README.
7. Post the release to the OER directories listed in `docs/oer-listings.md`.

The DOI makes the exact build citable; without it the software can only be cited by repository URL.
