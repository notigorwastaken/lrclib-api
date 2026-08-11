# Security Policy

## Supported versions

Security fixes are provided for the latest release line.

| Version | Supported |
| ------- | --------- |
| 2.x     | Yes       |
| < 2.0   | No        |

## Reporting a vulnerability

Please use [GitHub's private vulnerability reporting form](https://github.com/notigorwastaken/lrclib-api/security/advisories/new). Do not open a public issue for an undisclosed vulnerability.

Include the affected version, a minimal reproduction, the expected impact, and any suggested mitigation. Never include real LRCLIB publish tokens or unrelated personal data.

You should receive an acknowledgement within seven days. Valid reports will be investigated privately, and a coordinated disclosure date will be agreed upon when a release is required.

## Security expectations for users

- Treat publish tokens as secrets and load them from a secret manager or environment variable.
- Use HTTPS whenever a publish token is configured.
- Do not construct `ClientOptions.url` from untrusted request input. A custom URL intentionally allows the client to contact another LRCLIB-compatible server.
- Keep this package and its runtime updated.
