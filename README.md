# Totem Studio TypeScript SDK · Beta

The official server-side SDK for the [Totem API](https://totemstudio.ai/developers).
It covers every operation of the read-only API: leads, boards, activities,
calls, conversations, bookings, notifications, teams, members, services and the changes feed.

Requires **Node.js 22.12 or later** (the first release line where `require()`
of an ES module works without a flag). Built and checked with **TypeScript
7.0.2**. Zero runtime dependencies. ESM, with `require()` supported.

## Install

This checkout prepares **0.2.0-beta.1, which is not published yet**. The
commands below become usable after that release is published. The last
published release is
[0.1.0-beta.2](https://github.com/kiketordera/totem-studio-typescript/releases/tag/v0.1.0-beta.2),
which does not include notification methods.

Install the release tarball. It contains the built package, so it needs no
Git, no build step and no install scripts, and it works with `ignore-scripts`.
Download the tarball and its checksum, check it, then install the file you
checked:

```sh
curl -fLO https://github.com/kiketordera/totem-studio-typescript/releases/download/v0.2.0-beta.1/totemstudioai-sdk-0.2.0-beta.1.tgz
curl -fLO https://github.com/kiketordera/totem-studio-typescript/releases/download/v0.2.0-beta.1/totemstudioai-sdk-0.2.0-beta.1.tgz.sha256
shasum -a 256 -c totemstudioai-sdk-0.2.0-beta.1.tgz.sha256
npm install ./totemstudioai-sdk-0.2.0-beta.1.tgz
```

`sha256sum -c` works as well as `shasum -a 256 -c`. The checksum shows that
your download is complete and unchanged. It does not prove who built the file,
because it is published on the same
[GitHub release](https://github.com/kiketordera/totem-studio-typescript/releases)
as the tarball. npm records the dependency as a `file:` path to that tarball,
so keep the tarball where you installed it from: later installs such as
`npm ci` read it from there. Import the package by its name,
`@totemstudioai/sdk`.

Alternatively, install the Git tag. This builds the package with TypeScript
through its `prepare` script, so it **needs lifecycle scripts**: with
`ignore-scripts=true`, pnpm's build-script allowlist or npm's `allowScripts`,
allow `@totemstudioai/sdk`, or the install succeeds without a `dist/` and the
import fails.

```sh
npm install github:kiketordera/totem-studio-typescript#v0.2.0-beta.1
```

The SDK is **not published to the npm registry yet**, so a package named
`@totemstudioai/sdk` on npm is not Totem's until this README links it. Never
give your secret key to a package installed any other way than the ones above.

TypeScript projects need `module`/`moduleResolution` `nodenext` (or
`bundler`). A CommonJS project compiled with `nodenext` can import the SDK;
`node16` cannot, so use `nodenext` or a dynamic `import()`.

## First request

Create an API integration in Totem Settings → Developers. Keep the secret on
**your server**, in a secret manager or environment variable. Never put it in
frontend code, mobile bundles, public runtime configuration, logs or source control.
The SDK refuses to construct a client in a browser page or browser worker.

The examples are ES modules and use `await` at the top level. In a CommonJS
project, put them inside an `async` function.

```ts
import { TotemClient, TotemApiError } from '@totemstudioai/sdk';

const client = new TotemClient({
  apiKey: process.env.TOTEM_API_KEY!,
  // Required for collection routes only when the key grants multiple teams:
  team: process.env.TOTEM_TEAM_ID,
});

const integration = await client.me.get();
const teams = await client.teams.list();
const leads = await client.leads.list({ limit: 100, status: 'new' });
const matches = await client.leads.search({ email: 'example@example.com' });
```

Search takes exactly one of `email` or `phone` in the JSON body. Collection
filters support at most one of `board`, `stage` and `status`. The server remains
the authority for request validation and access control. A `baseUrl` on
`api.totemstudio.ai` must end in `/v1`, and an empty `team` is refused.

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
| `client.notifications.list(query?)`, `client.notifications.get(id)` | `GET /notifications`, `GET /notifications/{id}` |
| `client.sync.changes(query?)` | `GET /sync/changes` |
| `client.health()` | `GET /health` |

Each method takes optional request settings as its final argument:
`{ signal, timeoutMs }`, plus `team` on collection routes (the ones that read
the `Totem-Team` header). Detail routes such as `client.leads.get(id)` take the
team from the record's id, so they do not accept `team`: when you expect a
record of a particular team, compare its `team` field with the one you expect.
Optional settings and query values accept `undefined`, and a cursor accepts
`null`, so `client.leads.list({ cursor: page.next_cursor })` works as written.

## Types

All wire types are generated from the checked-in `openapi.json`, with each
field's documentation. Every schema has a named type: `Lead`, `LeadDetail`,
`LeadAttribution`, `LeadResponse`, `Team`, `Board`, `Member`, `BookingService`,
`Activity`, `Call`, `Conversation`, `Booking`, `Notification`, `Me`, `Health`, `Problem`, the
`…List` envelopes, `FeedItem` and `FeedPage`. `Schemas` is the full catalogue.
The SDK adds `Stage` (one board stage), `FeedUpsert`, `FeedRemoval`,
`FeedObjectOf<'lead'>` (the record a feed kind carries) and `isFeedRemoval`.

`Lead.date_of_birth` is a `YYYY-MM-DD` calendar string, or `null` when no valid
birthday is stored. It is included in lead lists, detail, search and lead
changes. Keep it as a date-only string; converting it to a timestamp can shift
the birthday across time zones. The public API and SDK remain read-only.

**Enums can grow.** Totem can add a value to any response field with a fixed
set of values, such as `Lead['status']` or `Call['outcome']`, in any version.
Their types are open (`'new' | 'contacted' | … | (string & {})`): your editor
still completes the known values, and your code must keep a default branch.
The fields that tell union variants apart (`FeedItem['kind']`,
`Activity['type']`) stay closed so narrowing works, and so do request filters
such as the `status` query, where an unknown value is a mistake.

Generic operations are fully typed too:

```ts
const result = await client.requestWithResponse('leads.get', {
  path: { id: 'lead_...' },
});
console.log(result.requestId, result.status);
const lead = result.data;
```

## Notifications in an external CRM

Read team notifications just like leads. `notifications.list` accepts `limit`,
`cursor`, and at most one of `lead` or `status` (`new`, `read`, `archived`):

```ts
for await (const notification of client.items('notifications.list', {
  query: { limit: 100, status: 'new' },
})) {
  await upsertCrmAlert(notification.id, notification.summary, notification.lead);
}
const notification = await client.notifications.get('ntf_...');
```

The notification's public `ntf_…` id is a stable external deduplication key;
store its `version` to apply later updates. Use the changes feed's
`kind: 'notification'` records for incremental polling alongside leads, and
apply notification removals to your copy too. `status` is Totem's team-wide
state; reading the API does not mark it read or acknowledge the alert in Totem.
An external CRM tracks its own acknowledgement state.

When a lead, call or conversation is removed, immediately delete its linked
notification copies and summaries too. Retain a removal fence for that source
id: a later notification upsert that still links it must not restore the
summary. Reset those fences with the team's versions when a full resync starts.

[`examples/notifications.ts`](examples/notifications.ts) shows a typed snapshot
import. Use [`examples/sync.ts`](examples/sync.ts) for subsequent status changes
and removals too.

`summary` is notification text intended for the team, including a request to
call a lead. It can contain personal information. The API excludes personal
notes and technical error alerts; it does not export conversation messages or
call transcripts. Notification links (`lead`, `call`, `conversation`) are public
ids when the related record can be exported, otherwise `null`.

## Pagination and synchronization

```ts
for await (const lead of client.items('leads.list', {
  query: { limit: 100, status: 'new' },
})) {
  await saveLead(lead);
}
```

`pages` and `items` stop when `has_more` is false. A missing or repeated cursor
raises `TotemProtocolError`. `timeoutMs` applies to each page request; to bound
a whole traversal, pass `signal: AbortSignal.timeout(ms)`.

The changes feed must be read with `pages`, never `items`, so you can save each
page's `next_cursor` together with its changes (`items('sync.changes')` does not
compile). A feed page always carries `next_cursor`, including the final empty
page: save it and resume on your next poll (typically every 1–5 minutes). The
SDK does not poll in the background.

```ts
import { TotemApiError, isFeedRemoval } from '@totemstudioai/sdk';

// Each team has its own cursor and copy: sync one team at a time.
const team = 'team_...';
try {
  for await (const page of client.pages('sync.changes', {
    team,
    query: { limit: 100, cursor: await loadCursor(team) },
  })) {
    for (const item of page.data) {
      // The feed can deliver a record more than once: apply only a newer version.
      if (item.version <= (await heldVersion(team, item.kind, item.id) ?? 0)) continue;
      // Check for a removal before reading `object`.
      if (isFeedRemoval(item)) await deleteCopy(team, item.kind, item.id, item.version);
      else if (item.kind === 'lead') await saveLead(team, item.object, item.version); // item.object is a Lead
      else await saveRecord(team, item.kind, item.object, item.version);
    }
    // Atomically save the cursor AFTER applying the whole page.
    await saveCursor(team, page.next_cursor);
  }
} catch (error) {
  if (!(error instanceof TotemApiError)) throw error;
  switch (error.action) {
    case 'resync': await fullResync(team); break;     // resync_required, sync_cursor_expired
    case 'wait_capture':                               // capture_not_ready
    case 'keep_and_retry': break;                      // e.g. 403 team_state_restricted: keep data and cursor, retry later
    case 'drop_team': await recheckTeams(team); break; // team_not_accessible
    default: throw error;
  }
}
```

- `409 resync_required` and `410 sync_cursor_expired` (`action: 'resync'`)
  both need the documented full resync: forget the team's stored versions and
  cursor (keep the records), re-read the feed without a cursor while marking
  every record it delivers, then delete the team's records that were not
  marked. Forgetting the versions matters: after a restore the feed can deliver
  lower versions than the ones you held, and the version check above would
  skip them.
- `409 capture_not_ready` (`action: 'wait_capture'`) means Totem is still
  preparing the team: keep your data and cursor and retry in a few minutes.
  Never resync for it. A `403` with `action: 'keep_and_retry'` (for example
  `team_state_restricted`) is handled the same way.
- `404 team_not_accessible` (`action: 'drop_team'`): re-read `GET /teams`, and
  delete the team's copy and cursor only if the team is no longer listed.

The [full synchronization guide](https://totemstudio.ai/developers/sync) explains
versions, removals and mark-and-sweep. [`examples/sync.ts`](examples/sync.ts)
is a minimal typed feed loop for one team: it leaves the full resync to your
store. The guide's
[tested reference client](https://totemstudio.ai/developers/sync#tested-reference-client)
does every step, including the full resync, the board, member and service
lists, and every team of a key.

Cursors are opaque strings. They are encoded as query data, never followed as
URLs. HTTP redirects are refused, so credentials never follow redirect targets.

## Errors, retries and cancellation

```ts
try {
  await client.calls.list({}, { signal: AbortSignal.timeout(5_000) });
} catch (error) {
  if (error instanceof TotemApiError) {
    console.error(error.status, error.code, error.action, error.param, error.requestId);
  }
  throw error;
}
```

Every error the SDK raises extends `TotemError`:

- `TotemApiError`: a non-success response. `status`; `code` (a `TotemErrorCode`,
  or a newer code you handle by `status`); `action`, what to do, from the
  contract's catalogue (`fix_request`, `check_credentials`, `resync`,
  `wait_capture`, `drop_team`, `keep_and_retry`, `retry_after`, `backoff`,
  `contact_support`), or `null` for an unknown code or a response with no
  problem document; `param`, the parameter, header or field at fault; `title`;
  `requestId`; `retryAfterMs`; and `problem`, the RFC 9457 document. Its message
  is `Totem API request failed (400, invalid_request, param=limit)`: status,
  code and parameter name only, never a value or response text.
- `TotemProtocolError`: a response the contract does not allow, such as
  invalid JSON (with the parse error as `cause`) or a repeated cursor.
- `TotemTimeoutError`: the request's own `timeoutMs` deadline passed.
- `TotemConnectionError`: the network failed and retries could not recover;
  `cause` holds the last failure. A connection reset in the middle of a
  response body counts as a network failure and is retried.

When you cancel through `signal`, the SDK rethrows your signal's own reason
unchanged (for `AbortSignal.timeout`, its `TimeoutError`), never a `TotemError`.
`errorCatalogue` exposes `{ status, action, docUrl }` for every documented code.

Each request has a **30 second deadline** by default (`timeoutMs`, on the client
or per request). It covers every attempt, retry wait and body read, and holds
even when a custom `fetch` ignores its signal.

The client retries network failures and HTTP `408`, `429`, `500`, `502`, `503`
and `504` up to **two times** by default (`maxRetries`, 0–5). Its own backoff
doubles from 250 ms with jitter: 125–250 ms before the first retry, 250–500 ms
before the second. It waits out a server's `Retry-After` (whole seconds or an
HTTP date) exactly, and ignores a malformed one. `maxRetryDelayMs` (default
30 seconds) caps only the server's `Retry-After`: a longer one is returned to
you at once in `retryAfterMs`, never shortened. Whenever a wait would not
finish before the deadline, the SDK skips it and returns the error that caused
it at once, so you can reschedule. Authorization, validation, missing
resources, feed-state errors (`409`, `410`) and other `4xx` responses are never
retried. Set `maxRetries: 0` to manage retries yourself.

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

`health` checks reproducible generation, compiles the SDK, examples and type
assertions, builds, runs the generator and HTTP-boundary tests serially, packs
the actual npm artifact, installs it in isolated ESM and CommonJS consumers and
verifies TypeScript, ESM, `require()` and the `package.json` export. During
development, `npm run test:file -- tests/resilience.test.mjs` rebuilds and runs
one file. `npm run test:git-install` installs a commit of the working tree the
documented Git way, with `prepare`; it needs npm registry access, and CI runs
it on Node 22.12, 24.18 and the newest 24.x. Tests include negative controls
that deliberately drop authentication or swap tenant headers at the HTTP
boundary; the shared success oracle rejects both faults.

To update the contract, copy the authoritative API's generated
`public-api/kit/openapi.json` into `openapi.json`, then run `npm run generate`
and `npm run health`. The generator has no compiler-library peer dependency. It
fails with a named error instead of silently weakening types on any construct
it cannot translate: unknown keywords, type arrays combined with structure,
`required` names that are not properties, path-level or cookie parameters,
headers other than `Totem-Team`, non-scalar query values, optional or `$ref`
request bodies, and success responses other than one JSON `200`.
`CONTRACT_SHA256` identifies the exact contract, and `SDK_VERSION` the package
version, used to generate this release.

Releases: pushing a `v*` tag that matches `package.json` runs the release
workflow, which runs `health`, packs the tarball and publishes it with its
SHA-256 as a GitHub release (a prerelease for versions with a `-`). It stops
before the release when this README's download links name other files, and
fails when they do not resolve once the release exists. See
[CHANGELOG.md](CHANGELOG.md).

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
A key that is not a well-formed `tsk_live_` key stops the run with `key_invalid`
before any request. The `invalid credentials` check sends a key with your key's
lookup id and a different, random secret, so only the API's secret check can
refuse it. That counts as one failed attempt for your key and address on the
[failed-attempt limit](https://totemstudio.ai/developers/authentication#failed-attempts).
The script never prints or records that key.

The fixture JSON may contain `teamId`, `leadId`, `callId`, `conversationId`,
`bookingId`, `notificationId`, `searchEmail`, `foreignLeadId` and `foreignTeamId`; otherwise the
script selects the first captured record in each collection, and it needs
representative records for complete route coverage. `foreignLeadId` (a lead of
a team the key does not read) adds the cross-team `404 resource_missing` check;
`foreignTeamId` adds the `Totem-Team` isolation check (`404
team_not_accessible`). When the key reads more than one team, the script also
checks that a collection without `Totem-Team` answers `400 team_required`.
`TOTEM_API_BASE_URL` optionally selects another deployment.

Responses are validated against their OpenAPI schemas in closed-world mode: a
field the contract does not declare fails the run. The changes feed is walked
for up to five pages and resumed once from its saved cursor; a repeated page or
cursor fails. A run missing a tenant-isolation fixture lists it in
`skippedChecks` and fails, unless `TOTEM_SMOKE_ALLOW_PARTIAL=1` accepts a
partial run (recorded as `allowPartial`). A configuration problem prints
`FAIL smoke_configuration_failed <reason>` (for example `key_file_mode`) and
still writes a receipt when it can.

The receipt records the SDK version, contract hash, server release
(`Totem-Release`), covered operations, checks with HTTP status and request IDs,
skipped checks, the feed variants seen and, on failure, the failing operation
or check, schema rule and schema path, and request ID. It never contains the
key or record content. A failed or incomplete run exits nonzero. Local green
tests do not constitute live API verification.
