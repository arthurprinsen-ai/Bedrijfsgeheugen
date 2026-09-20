# Development ledger — Powerhouse Control Center admin gate v1

Date: 2026-09-20
Obligation: `powerhouse-control-center-admin-gate-v1`

## Security change
- dedicated `/api/powerhouse-observability` endpoint;
- requires Netlify Identity bearer token;
- requires Powerhouse admin role or production admin allowlist;
- tenant resolution and object access policy remain active;
- private/no-store/noindex response headers;
- no fallback to the ordinary customer Brain endpoint;
- Control Center renders no runtime data before the admin endpoint succeeds;
- unauthenticated users see an explicit login state; authenticated non-admins receive no data.

The admin allowlist is configured as a secret Netlify environment variable and is not stored in Git.
