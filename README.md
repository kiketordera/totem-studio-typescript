# Totem Studio TypeScript SDK · Beta

The official server-side SDK for the [Totem API](https://totemstudio.ai/developers).
It exposes all 18 operations of the read-only API: leads, boards, activities,
calls, conversations, bookings, teams, members, services and the changes feed.

Requires **Node.js 24.18.0 or later**. Built and checked with **TypeScript 7.0.2**,
the current stable release verified from the npm registry on 2026-10-17.
Zero runtime dependencies. ESM, with `require()` supported by Node 24.

## Install

Install the tagged GitHub release:

```sh
npm install github:kiketordera/totem-studio-typescript#v0.1.0-beta.1
```

The repository's `prepare` script builds the package during Git installation.
Import it by its package name, `@totemstudio/sdk`.

An npm registry release is a separate distribution step. Once that release is
published, its command is `npm install @totemstudio/sdk@beta`.

## First request

Create an API integration in Totem Settings → Developers. Keep the secret on
**your server**, in a secret manager or environment variable. Never put it in
frontend code, mobile bundles, public runtime configuration, logs or source control.
The SDK refuses to construct a client in a browser context.

```ts
import { TotemClient, TotemApiError } from '@totemstudio/sdk';

const client = new TotemClient({
  apiKey: process.env.TOTEM_API_KEY!,
  // Required for collection routes only when the key grants multiple teams:
  // team: 'team_...',
});

const integration = await client.me.get();
const teams = await client.teams.list();
const leads = await client.leads.list({ limit: 100, status: 'new' });
const matches = await client.leads.search({ email: 'example@example.com' });
```

Search takes exactly one of `email` or `phone` in the JSON body. Collection
filters support at most one of `board`, `stage` and `status`. The server remains
the authority for request validation and access control.

## Every endpoint

| SDK method | HTTP endpoint |
|---|---|
| `client.me.get()` | `GET /me` |
| `client.teams.list()` | `GET /teams` |
| `client.teams.get(id)` | `GET /teams/{id}` |
| `client.boards.list(query?)` | `GET /boards` |
| `client.members.list()` | `GET /members` |
| `client.bookingServices.list()` | `GET /booking_services` |
| `client.leads.list(query?)` | `GET /leads` |
| `client.leads.get(id)` | `GET /leads/{id}` |
| `client.leads.search({ email })` or `({ phone })` | `POST /leads/search` |
| `client.leads.activities(id, query?)` | `GET /leads/{id}/activities` |
| `client.calls.list(query?)`, `client.calls.get(id)` | `GET /calls`, `GET /calls/{id}` |
| `client.conversations.list(query?)`, `client.conversations.get(id)` | `GET /conversations`, `GET /conversations/{id}` |
| `client.bookings.list(query?)`, `client.bookings.get(id)` | `GET /bookings`, `GET /bookings/{id}` |
| `client.sync.changes(query?)` | `GET /sync/changes` |
| `client.health()` | `GET /health` |

Each method takes optional request settings as its final argument:
`{ team, signal, timeoutMs }`. Resource detail routes determine the team from the
resource ID. The SDK only sends `Totem-Team` where the API declares that header.

All wire types are generated from the checked-in `openapi.json`, including
response unions and enum values. Exported aliases include `Lead`, `LeadDetail`,
`Team`, `Board`, `Activity`, `Call`, `Conversation`, `Booking`, `FeedItem`,
`FeedPage`, `Problem`, and `Schemas` for the full schema catalogue.

Generic operations are fully typed too:

```ts
const result = await client.requestWithResponse('leads.get', {
  path: { id: 'lead_...' },
});
console.log(result.requestId, result.status);
const lead = result.data;
```

## Pagination and synchronization

```ts
for await (const lead of client.items('leads.list', {
  query: { limit: 100, status: 'new' },
})) {
  await saveLead(lead);
}

for await (const page of client.pages('sync.changes', {
  query: { limit: 100, ...(savedCursor ? { cursor: savedCursor } : {}) },
})) {
  // Apply upserts/removals only when their version exceeds the local version.
  // Atomically save the cursor AFTER applying the whole page.
  await applyAndSaveCheckpoint(page.data, page.next_cursor);
}
```

`pages` and `items` stop when `has_more` is false. A changes-feed page always
carries `next_cursor`, including the final empty page: save it and resume on
your next poll (typically every 1–5 minutes). The SDK does not poll in the background.
Use `pages` for durable synchronization so you can commit the checkpoint with
its changes. Apply removals, re-read team access on each sync, and follow the
[full synchronization guide](https://totemstudio.ai/developers/sync).
A `cursor_expired` response requires the documented full resync and mark-and-sweep.

Cursors are opaque strings. They are encoded as query data, never followed as
URLs. HTTP redirects are refused, so credentials never follow redirect targets.
Repeated or missing pagination cursors raise `TotemProtocolError`.

## Errors, retries and cancellation

```ts
try {
  await client.calls.list({}, { signal: AbortSignal.timeout(5_000) });
} catch (error) {
  if (error instanceof TotemApiError) {
    console.error(error.status, error.code, error.requestId);
    // error.problem: RFC 9457 document, or null for a firewall/non-JSON response
    // error.retryAfterMs: server retry delay, when provided
  }
  throw error;
}
```

The default **30 second total deadline** includes attempts, response parsing
and retry waits. Configure `timeoutMs` on the client or individual request.
`TotemTimeoutError` identifies the SDK deadline; explicit caller cancellation
preserves the caller's abort reason.

The client retries network failures and HTTP `408`, `429`, `500`, `502`, `503`,
`504` up to **two times** with exponential backoff (250ms, then 500ms).
It respects `Retry-After` seconds or HTTP dates. If the server's delay exceeds
`maxRetryDelayMs` (default 30 seconds), it returns the error immediately so the
caller can schedule a later attempt; it never shortens that delay. Authorization,
validation, missing resources and expired cursors are never retried.
Set `maxRetries: 0` to manage retries yourself; the maximum configurable value is 5.

`baseUrl` can target another HTTPS API deployment. HTTP is accepted only on
loopback for local tests. A custom `fetch` is available for trusted server
instrumentation and HTTP boundary tests; it receives the secret and must be
trusted accordingly. Successful responses are typed at compile time; live
response validation is performed by the smoke script rather than added to each
production request.

## Development and verification

```sh
nvm use
npm ci --ignore-scripts
npm run health
```

`health` checks reproducible generation, compiles SDK/examples/type assertions,
builds, runs HTTP-boundary tests serially, packs the actual npm artifact,
installs it in an isolated consumer and verifies TypeScript, ESM and Node24
`require()` imports. CI runs the same gate. Tests include negative controls
that deliberately drop authentication or swap tenant headers at the HTTP
boundary; the shared success oracle rejects both faults.

To update the contract, copy the authoritative API's generated
`public-api/kit/openapi.json` into `openapi.json`, then run `npm run generate`
and `npm run health`. The generator has no compiler-library peer dependency;
it fails on unsupported schema constructs instead of silently weakening types.
`CONTRACT_SHA256` identifies the exact contract used to generate this release.

### Live test

Use a **Totem-owned test team with fictitious contacts** and a dedicated API
key. This script performs read-only requests; it does not create, revoke or
rotate any credentials or mutate team data.

```sh
chmod 600 /secure/path/sdk-smoke.key
TOTEM_API_KEY_FILE=/secure/path/sdk-smoke.key \
TOTEM_TEAM_ID=team_... \
TOTEM_LIVE_FIXTURES_FILE=/secure/path/fixtures.json \
TOTEM_SMOKE_RECEIPT=/secure/path/receipt.json \
npm run test:live
```

The key file contains only the key. `TOTEM_API_KEY` is supported when a secret
manager injects it as an environment variable. Never pass keys on command lines.
The optional fixture JSON contains `leadId`, `callId`, `conversationId`,
`bookingId`, `searchEmail` and `foreignLeadId`; otherwise the script selects the
first captured record in each collection. It requires representative records
for complete positive route coverage. A foreign lead ID adds the cross-team
404 check. `TOTEM_API_BASE_URL` optionally selects another deployment.

The receipt records operation coverage, HTTP status, request IDs and contract
hash, with no key or record content. All 18 routes must pass against their
OpenAPI response schemas, along with invalid credentials, invalid limits,
malformed search and optional tenant-isolation checks. A failed or incomplete
run exits nonzero. Local green tests do not constitute live API verification.
