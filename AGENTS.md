# Totem TypeScript SDK

Public server-side client for the Totem read-only API. Main branch: `main`.
Use Node `24.18.0` (`.nvmrc`). Run `npm run health` before committing.
Never commit API keys, live response records, `.env` files or live receipts.

`openapi.json` is copied from Nuxt `public-api/kit/openapi.json`.
Edit `scripts/generate.mjs` or update that input; never hand-edit `src/generated`.
The TypeScript compiler is pinned to the npm stable release verified at creation.
Runtime remains dependency free. No browser secret-key support and no redirects.

Tests exercise real modules over HTTP boundaries. Keep them under 600 lines
with a contract docblock; no source-text assertions. Auth/tenant controls need
negative controls proving a deliberate boundary fault fails the success oracle.
The full workspace test-quality contract is `../totem-studio-nuxt4/docs/TEST_QUALITY.md`
when this repository is part of the Totem workspace. Run individual test files
serially during implementation. The lead runs one final health gate.

Commit completed validated work automatically; stage only owned files.
Publishing GitHub releases, npm packages or deployments requires task authorization.
