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

Install only the release tarball from this repository's GitHub releases,
checked against the `.sha256` file published with it, or the Git tag (see the
README). The SHA-256 shows that your download is complete and unchanged. It
comes from the same release as the tarball, so it does not independently show
that Totem built the file: whoever could replace the tarball could replace the
checksum too.

The SDK is not published to the npm registry yet: a package named
`@totemstudioai/sdk` on npm is not Totem's until the README links it, so never
give it a key. When the SDK is published there, the release workflow publishes
it with npm provenance, which links each version to the workflow run in this
repository that built it. Provenance will then be the check of authenticity
(`npm audit signatures` verifies it for installed packages).

Error messages name only the HTTP status, error code and parameter name. An
error's `problem`, `cause` and `retryAfterMs` come from the response or the
network and can carry response text: do not log whole error objects where
records must not appear.

The API and SDK are Beta. Report bugs with the HTTP status, machine-readable
error code, request ID and contract hash (`CONTRACT_SHA256`). Security reports
receive private handling; no response-time guarantee is implied.
