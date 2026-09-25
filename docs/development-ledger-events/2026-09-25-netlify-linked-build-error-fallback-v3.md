# Development ledger — Netlify linked-build error fallback v3

- Date: 2026-09-25
- Incident: Git-linked Netlify build returned state=error after successful OIDC authentication and trigger_build.
- Existing exact-source fallback was present but unreachable for ordinary linked-build errors.
- Fix: log linked build failure, set linked_fallback=true, continue to canonical exact-source transport.
- Safety: provider-ready, exact production SHA, pricing content and production browser readback remain mandatory.
- Admission correction: canonical Delivery-Lane is automation.
- Terminal state: pending exact-head protected gates, merge and production readback.
