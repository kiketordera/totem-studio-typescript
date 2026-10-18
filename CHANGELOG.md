# Changelog

The SDK follows the Totem API Beta. Until 1.0, a minor or prerelease version
can change types or behaviour; each entry lists what to adapt.

## Unreleased

Not released. `main` still reports `SDK_VERSION` `0.1.0-beta.2`, but its
`CONTRACT_SHA256` differs from the published 0.1.0-beta.2 tarball: tell the two
apart by `CONTRACT_SHA256`. The next release bumps the version.

### Contract

- Generated from the API contract with SHA-256
  `f9eaf5a99fd7b78320d11ff97600092a0c0529124af56ff6bba70554cf4ea8e2` (`CONTRACT_SHA256`).
  Only documentation comments changed: no type, method or runtime behaviour.
- Error catalogue: `sector_restricted` is no longer reserved. Totem returns it
  for a team in a sensitive sector, such as health care, whose data it does not
  export. `invalid_request` also covers a conversations cursor whose
  conversation was erased. `quota_exceeded` says that every list counts toward
  the quota, including `GET /v1/teams`, `GET /v1/members`,
  `GET /v1/booking_services` and a lead's activities. `key_expired` no longer
  mentions an expiry date. `service_unavailable` is reserved: the API itself
  does not return it today.
- The fixes in `openapi.json` (`x-totem-errors`, not part of the package) now
  say that while `plan_not_entitled`, `team_state_restricted` or
  `sector_restricted` refuses access, the changes feed delivers nothing for the
  team, removals included, so delete your copy once that lasts longer than your
  retention policy allows.
- Descriptions now say that a member who leaves and a deleted bookable service
  drop out of their lists while records keep their ids; that activity pages are
  not in date order and that a stage or assignee change made on its own has an
  unknown actor; that a lead can have several conversations on one channel and
  business account, one per contact address; that a stage with no stored
  position is left out of its board; how a reschedule reads (`rescheduled` in
  place, or `cancelled` with `rescheduled_to`); what each `outcome_basis` value
  means; that a lead whose status this version does not know reads
  `status: null`; and that `Lead.phone` is validated without the team's default
  country.

## 0.1.0-beta.2

Install from the release tarball (see the README); the SDK is not on the npm registry yet.

### Renamed

- The package is now `@totemstudioai/sdk` (was `@totemstudio/sdk`), matching the
  `totemstudioai` npm organization it will be published under. Update your imports.

### Changed: adapt your code

- Response enums are open types (`'new' | … | (string & {})`), as the contract
  says enums can grow. An exhaustive `switch` or `Record<Lead['status'], …>`
  needs a default branch. Union discriminators (`FeedItem['kind']`,
  `Activity['type']`) and request filters stay closed.
- `items('sync.changes')` no longer compiles: read the feed with `pages()` and
  save each page's cursor with its changes.
- The `team` request option is accepted only by collection routes, where the
  API reads `Totem-Team`. Detail, `me`, `teams` and `health` calls take the team
  from the record id (the runtime still ignores a `team` passed to them).
- A retry wait that cannot finish before the request deadline is skipped: the
  `TotemApiError` (with `retryAfterMs`) or `TotemConnectionError` that caused it
  is returned at once, instead of a `TotemTimeoutError` when the deadline fires.
- `maxRetryDelayMs` caps only a server's `Retry-After`; it no longer disables
  the SDK's own backoff when set below 250 ms.
- A network failure that retries cannot recover is a `TotemConnectionError`
  with the original error as `cause`, instead of the raw `TypeError`. A
  connection reset mid-body is retried as a network failure, instead of a
  `TotemProtocolError` for invalid JSON.
- `TotemApiError.message` adds the parameter name: `Totem API request failed
  (400, invalid_request, param=limit)`.
- Construction refuses an empty or whitespace `team`, a `baseUrl` on
  `api.totemstudio.ai` without `/v1`, and browser workers. A request refuses a
  `signal` that is not an `AbortSignal`.

### Added

- `TotemError`, the base class of every SDK error, and `TotemConnectionError`.
- `TotemApiError.action`, `.param` and `.title`; `code` typed as
  `TotemErrorCode | (string & {})`.
- `errorCatalogue`, `TotemErrorCode` and `ErrorAction`, generated from the
  contract's `x-totem-errors`.
- A named type for every schema (`LeadAttribution`, `LeadResponse`, `Me`,
  `Health`, the `…List` envelopes, …), plus `Stage`, `FeedUpsert`,
  `FeedRemoval`, `FeedObjectOf<K>`, `OptionsOf<Id>`, `ItemsOperationId` and the
  `isFeedRemoval()` guard.
- Documentation comments on every method, parameter, schema and operation; the
  client's declarations name their response types.
- `SDK_VERSION`, used in the `User-Agent`, and the `@totemstudioai/sdk/package.json` export.
- A `null` or `undefined` query value is omitted, so `cursor: page.next_cursor`
  works; optional options and query fields accept `undefined` under
  `exactOptionalPropertyTypes`.

### Fixed

- The deadline holds when a custom `fetch` or a response body ignores its signal.
- `Retry-After` accepts only whole seconds or an IMF-fixdate; a malformed value
  no longer causes an immediate retry.
- The SDK's backoff has jitter (125–250 ms, then 250–500 ms).
- A refused `signal` no longer leaves the deadline timer running.
- `fetch` is called unbound. On Cloudflare Workers (workerd) the default
  `fetch` used to fail with `Illegal invocation`, because it was called as a
  method of the client.

### Contract

- Generated from the API contract with SHA-256
  `8c3475e071a77c9a450ce78b812903cb1d0e6bcc8811a8aa4d0eef4214b61f62` (`CONTRACT_SHA256`).
- `LeadAttribution.original_capture.origin.kind` is `'conversation' | 'call'`,
  and `original_capture.source` uses the same values as `Lead['source']`.
- `limit` documents its default of 25. Descriptions now say that a live call's
  `duration_seconds` is `null`, when a cross-team lead reference is `null`, and
  what `removed.reason` means for a lead, call or conversation deleted in Totem.

### Packaging

- `engines` is Node `>=22.12.0` (was `>=24.18.0`); CI runs Node 22.12, 24.18 and the newest 24.x.
- Releases attach the packed tarball and its SHA-256.

## 0.1.0-beta.1 (2026-10-17)

First Beta: a typed, dependency-free client for every operation of the
read-only Totem API, generated from `openapi.json`, with pagination, bounded
retries, a per-request deadline, redirect refusal and a live smoke runner.
