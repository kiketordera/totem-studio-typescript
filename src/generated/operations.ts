/** Generated from openapi.json and package.json. Do not edit; run npm run generate. */
import type { ErrorAction, TotemErrorCode } from './schema.js'

export const CONTRACT_SHA256 = '70d26579453fe0f21f70f79ee4ccf9fe2b83f1341b5aec0ba8a7794066883ca2'
export const SDK_VERSION = '0.2.0-beta.1'
export const DEFAULT_BASE_URL = "https://api.totemstudio.ai/v1"
export const operationDefinitions = {
  "me.get": {
    "method": "GET",
    "path": "/me",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "teams.list": {
    "method": "GET",
    "path": "/teams",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "teams.get": {
    "method": "GET",
    "path": "/teams/{id}",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "boards.list": {
    "method": "GET",
    "path": "/boards",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": [
      "limit",
      "cursor"
    ]
  },
  "members.list": {
    "method": "GET",
    "path": "/members",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": []
  },
  "booking_services.list": {
    "method": "GET",
    "path": "/booking_services",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": []
  },
  "leads.list": {
    "method": "GET",
    "path": "/leads",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": [
      "limit",
      "cursor",
      "board",
      "stage",
      "status"
    ]
  },
  "leads.get": {
    "method": "GET",
    "path": "/leads/{id}",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "leads.search": {
    "method": "POST",
    "path": "/leads/search",
    "authenticated": true,
    "body": true,
    "team": true,
    "query": []
  },
  "leads.activities": {
    "method": "GET",
    "path": "/leads/{id}/activities",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": [
      "limit",
      "cursor"
    ]
  },
  "calls.list": {
    "method": "GET",
    "path": "/calls",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": [
      "limit",
      "cursor",
      "lead"
    ]
  },
  "calls.get": {
    "method": "GET",
    "path": "/calls/{id}",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "conversations.list": {
    "method": "GET",
    "path": "/conversations",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": [
      "limit",
      "cursor",
      "lead"
    ]
  },
  "conversations.get": {
    "method": "GET",
    "path": "/conversations/{id}",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "bookings.list": {
    "method": "GET",
    "path": "/bookings",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": [
      "limit",
      "cursor",
      "lead"
    ]
  },
  "bookings.get": {
    "method": "GET",
    "path": "/bookings/{id}",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "notifications.list": {
    "method": "GET",
    "path": "/notifications",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": [
      "limit",
      "cursor",
      "lead",
      "status"
    ]
  },
  "notifications.get": {
    "method": "GET",
    "path": "/notifications/{id}",
    "authenticated": true,
    "body": false,
    "team": false,
    "query": []
  },
  "sync.changes": {
    "method": "GET",
    "path": "/sync/changes",
    "authenticated": true,
    "body": false,
    "team": true,
    "query": [
      "cursor",
      "limit"
    ]
  },
  "health": {
    "method": "GET",
    "path": "/health",
    "authenticated": false,
    "body": false,
    "team": false,
    "query": []
  }
} as const
/** The contract's error catalogue: HTTP status, recommended action and docs entry for each code. */
export const errorCatalogue = {
/** Something in the request is not valid: an unknown, repeated or out-of-range query parameter, a query string or body on an endpoint that takes none, a cursor issued for another endpoint, filter or team, a malformed `Totem-Team` header, or a body that is not the JSON this endpoint expects. `param` names the parameter, header or field at fault. A conversations cursor is also refused once the conversation it points at has been erased. */
"invalid_request": { status: 400, action: "fix_request", docUrl: "https://totemstudio.ai/developers/errors#invalid_request" },
/** The key reads more than one team and this endpoint reads one team's data, but the request does not say which team. */
"team_required": { status: 400, action: "fix_request", docUrl: "https://totemstudio.ai/developers/errors#team_required" },
/** The request carried a secret key together with an `Origin` header, which means it came from a browser. Totem refuses it before reading anything. */
"secret_key_in_browser": { status: 400, action: "fix_request", docUrl: "https://totemstudio.ai/developers/errors#secret_key_in_browser" },
/** The `Authorization` header is missing or malformed, or the key is unknown, wrong or revoked, or its integration is no longer active. */
"invalid_credentials": { status: 401, action: "check_credentials", docUrl: "https://totemstudio.ai/developers/errors#invalid_credentials" },
/** The key was rolled and its grace period is over. */
"key_expired": { status: 401, action: "check_credentials", docUrl: "https://totemstudio.ai/developers/errors#key_expired" },
/** The key lacks a permission this endpoint needs. Every v1.0a key holds the full read set, so this should not happen. */
"insufficient_scope": { status: 403, action: "contact_support", docUrl: "https://totemstudio.ai/developers/errors#insufficient_scope" },
/** The organization's plan does not include the Totem API at the moment. */
"plan_not_entitled": { status: 403, action: "keep_and_retry", docUrl: "https://totemstudio.ai/developers/errors#plan_not_entitled" },
/** The key is valid, but the request came from an IP address outside the integration's allowlist. */
"ip_not_allowed": { status: 403, action: "check_credentials", docUrl: "https://totemstudio.ai/developers/errors#ip_not_allowed" },
/** The team is restricted for now: it is disabled (for example, suspended for non-payment), archived or billing-only, or its API access is paused. `GET /v1/teams` still lists it. */
"team_state_restricted": { status: 403, action: "keep_and_retry", docUrl: "https://totemstudio.ai/developers/errors#team_state_restricted" },
/** Totem does not export this team's data through the API because the team works in a sensitive sector, such as health care, where its records can reveal health information. */
"sector_restricted": { status: 403, action: "keep_and_retry", docUrl: "https://totemstudio.ai/developers/errors#sector_restricted" },
/** Totem has temporarily switched this endpoint off for every key. */
"capability_disabled": { status: 403, action: "keep_and_retry", docUrl: "https://totemstudio.ai/developers/errors#capability_disabled" },
/** The record does not exist, was removed, belongs to a team this key does not read, or was created so recently that Totem has not prepared it yet. A `GET` or `POST` under `/v1/` that matches no endpoint also gets this code. Any other method, and any path outside `/v1/`, gets a plain `404` from the firewall in front of the API, with no problem body and no `Totem-Request-Id`. */
"resource_missing": { status: 404, action: "fix_request", docUrl: "https://totemstudio.ai/developers/errors#resource_missing" },
/** The `Totem-Team` header names a team this key does not read: one it never covered, one removed from the key or from the organization, or one that was deleted. Without the header, it means the key no longer reads any team. */
"team_not_accessible": { status: 404, action: "drop_team", docUrl: "https://totemstudio.ai/developers/errors#team_not_accessible" },
/** Totem cannot continue the feed from this cursor: the data was restored from a backup, or a gap was found in the team's changes. */
"resync_required": { status: 409, action: "resync", docUrl: "https://totemstudio.ai/developers/errors#resync_required" },
/** Totem is still preparing this team's data for the API. This happens once per team, after it is first added to any key; adding it to another key later does not repeat it. */
"capture_not_ready": { status: 409, action: "wait_capture", docUrl: "https://totemstudio.ai/developers/errors#capture_not_ready" },
/** The cursor is more than 30 days old, counted from the point in the feed it reached (or, while an initial sync is still running, from when that sync started). */
"sync_cursor_expired": { status: 410, action: "resync", docUrl: "https://totemstudio.ai/developers/errors#sync_cursor_expired" },
/** The key went over its rate limit (items per minute), or too many failed authentication attempts from this IP address or against this key have locked it out for a while. */
"rate_limited": { status: 429, action: "retry_after", docUrl: "https://totemstudio.ai/developers/errors#rate_limited" },
/** The key has spent its daily quota of items. Every item returned by the changes feed and by every list counts toward it, including `GET /v1/teams`, `GET /v1/members`, `GET /v1/booking_services` and a lead's activities. The quota resets at 00:00 UTC. */
"quota_exceeded": { status: 429, action: "retry_after", docUrl: "https://totemstudio.ai/developers/errors#quota_exceeded" },
/** Something went wrong inside Totem while answering this request. */
"internal_error": { status: 500, action: "backoff", docUrl: "https://totemstudio.ai/developers/errors#internal_error" },
/** Totem has temporarily switched the API off for every key. */
"api_disabled": { status: 503, action: "backoff", docUrl: "https://totemstudio.ai/developers/errors#api_disabled" },
/** Reserved: the API itself does not return this code today. A `503` from the load balancer or the hosting platform in front of the API arrives without a problem body; treat it like this code. */
"service_unavailable": { status: 503, action: "backoff", docUrl: "https://totemstudio.ai/developers/errors#service_unavailable" }
} as const satisfies Record<TotemErrorCode, { readonly status: number; readonly action: ErrorAction; readonly docUrl: string }>
