# Security Policy

## Supported versions

Only the latest commit on `main` is supported.

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Use GitHub's private reporting instead: **Security → Advisories → Report a vulnerability** on this repository. Include:

- A description of the issue and its impact
- Steps to reproduce, or a proof of concept
- Affected files or dependencies

You can expect an acknowledgement within **72 hours** and a status update within **7 days**.

## Scope

The decks are static client-side apps with no backend, no authentication and no user data collection. The most relevant classes of issue are:

- Vulnerable dependencies
- Cross-site scripting through URL parameters or user-entered demo input
- Supply-chain concerns in the build tooling
