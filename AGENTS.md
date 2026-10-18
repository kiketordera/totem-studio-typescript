# Totem TypeScript SDK

Public server-side client for the Totem read-only API. Main branch: `main`.
Develop on Node `24.18.0` (`.nvmrc`); consumers need Node `>=22.12.0`
(`engines`), which CI also runs. Run `npm run health` before committing.
Never commit API keys, live response records, `.env` files or live receipts.

`openapi.json` is copied from Nuxt `public-api/kit/openapi.json`.
Edit `scripts/generate.mjs` or update that input; never hand-edit `src/generated`
(it also carries `SDK_VERSION` from `package.json`, so run `npm run generate`
after a version bump). The generator fails closed; `tests/generator.test.mjs`
holds one fixture per supported or refused construct.
The TypeScript compiler is pinned to the npm stable release verified at creation.
Runtime remains dependency free. No browser secret-key support and no redirects.

Tests exercise real modules over HTTP boundaries. They import `dist/`, so
`npm test` rebuilds first; for one file use `npm run test:file -- tests/<file>`,
which rebuilds too (a bare `node --test` runs against a stale build). Keep each
file under 600 lines with a contract docblock; no source-text assertions.
Auth/tenant controls need negative controls proving a deliberate boundary fault
fails the success oracle. The full workspace test-quality contract is
`../totem-studio-nuxt4/docs/TEST_QUALITY.md` when this repository is part of the
Totem workspace. Run individual test files serially during implementation. The
lead runs one final health gate. `npm run test:git-install` needs registry
access and is not part of health; CI runs it.

Releases: bump `package.json`, run `npm run generate`, add a CHANGELOG entry,
point the README's download links at the new version, then push a
`v<version>` tag; `.github/workflows/release.yml` publishes the tarball and its
SHA-256, and stops when the README links other release files. Workflow actions
are pinned by full commit SHA with the release in a comment: update both
together. Only the npm publish step may receive `NPM_TOKEN`. Commit completed
validated work automatically; stage only owned files. Publishing GitHub
releases, npm packages or deployments requires task authorization.
