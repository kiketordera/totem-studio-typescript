# Security

Report suspected vulnerabilities privately to **hello@totemstudio.ai**. Include
the SDK version, a minimal reproduction using fictitious credentials/data, and
request IDs when available. Do not include live keys, private client records or
customer payloads in a GitHub issue.

This SDK uses administrator-level read-only secrets. Keep them on trusted
servers. A key can read private-channel metadata for its granted teams; scope
integrations to the teams they need and revoke exposed keys in Totem Settings.
The package has no runtime dependencies, refuses browser contexts, encodes
opaque cursors as data, rejects unsafe base URLs and does not follow redirects.
Custom `fetch` implementations receive the credential and must be trusted.

The API and SDK are Beta. Report bugs with the HTTP status, machine-readable
error code, request ID and contract hash (`CONTRACT_SHA256`). Security reports
receive private handling; no response-time guarantee is implied.
