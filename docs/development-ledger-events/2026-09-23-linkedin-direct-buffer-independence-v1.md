# 2026-09-23 — LinkedIn direct Buffer-independence

- Fingerprint: `linkedin-direct-buffer-independence-v1`
- Obligation: restore reliable daily personal LinkedIn delivery without duplicate risk.
- Observed failure: Buffer returned HTTP 429 with Retry-After; LinkedIn author-feed finder returned HTTP 403 because the connected application lacks that finder permission.
- Root cause: `linkedin_personal` used Buffer as a hard create/readback dependency instead of the already-active LinkedIn connection.
- Change: personal LinkedIn now writes directly through Composio/LinkedIn, persists the returned post URN, and verifies that exact URN using `LINKEDIN_GET_POST_CONTENT`.
- Safety: canonical single-writer claim and publication capability remain intact; uncertain provider truth is fail-closed and cannot fall back to a second Buffer write.
- Regression: `tests/brain-buffer-rate-limit-circuit-v1.test.mjs` now enforces Buffer independence for `linkedin_personal`.
- Remaining scoped dependency: organization publishing still requires the missing LinkedIn organization-admin scope; this is isolated from personal publishing.
- Production status: pending protected merge and production deployment/readback; do not mark LIVE_BEWEZEN before those gates complete.

- Hardened legacy compatibility: any personal LinkedIn `urn:li:ugcPost:*` or `urn:li:share:*` reference is routed to native exact readback even if historical provider evidence is missing.
