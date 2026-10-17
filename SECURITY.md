# Security

Report suspected vulnerabilities privately to **hello@totemstudio.ai**. Include
the SDK version (`SDK_VERSION`), a minimal reproduction using fictitious
credentials/data, and request IDs when available. Do not include live keys,
private client records or customer payloads in a GitHub issue.

This SDK uses administrator-level read-only secrets. Keep them on trusted
servers. A key can read private-channel metadata for its granted teams; scope
integrations to the teams they need and revoke exposed keys in Totem Settings.
The package has no runtime dependencies, refuses browser pages and browser
workers, encodes opaque cursors as data, rejects unsafe base URLs and does not
follow redirects. Custom `fetch` implementations receive the credential and
must be trusted.

Install only the release tarball from this repository's GitHub releases, and
check it against the SHA-256 published with the release, or the Git tag. The
SDK is not published to the npm registry: a registry package named
`@totemstudio/sdk` is not from Totem and must not be given a key.

Error messages name only the HTTP status, error code and parameter name. An
error's `problem`, `cause` and `retryAfterMs` come from the response or the
network and can carry response text: do not log whole error objects where
records must not appear.

The API and SDK are Beta. Report bugs with the HTTP status, machine-readable
error code, request ID and contract hash (`CONTRACT_SHA256`). Security reports
receive private handling; no response-time guarantee is implied.
