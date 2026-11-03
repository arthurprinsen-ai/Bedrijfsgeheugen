# Development ledger — portal-two-tenant-production-proof (29-10-2026)

Obligation-ID: `portal|authenticated-two-tenant-production-proof|20261029`. Owner: existing portal delivery lane / canonical Powerhouse writer.

Observed: Production Release Readback skipped authenticated portal proof when the change classification was only website; the existing synthetic deployment proof checked only one Identity tenant, insufficient to demonstrate independent cross-tenant isolation.

Change candidate: Run two distinct Identity JWT-authenticated HTTPS requests against immutable deployed portal API, require correct subjects/tenant claims, distinct response scopes, no opposing-tenant marker, and cleanup of both accounts. Widen exact readback applicability to this runtime path, require two-tenant assertions.

Prevention: Permanent fail-closed production gate: verify two tenant scopes and payload shapes with count=2, cleanup DELETED, exact source SHA and deploy ID; never claim real customer proof or independently tested isolation from synthetic evidence alone.

Files: `platform/api/portal-authenticated-production-proof-core.mjs`, `tests/portal-authenticated-production-proof.test.mjs`, `tools/delivery/netlify-deployment-applicability.mjs`, `.github/workflows/production-release-readback.yml`, `tests/brain-runtime-authenticated-production-readback-required-v1.test.mjs`, `brain/learning/2026-10-29-portal-two-tenant-production-proof.json`, `docs/changes/2026-10-29-portal-two-tenant-production-proof.md`, `docs/development-ledger-events/2026-10-29-portal-two-tenant-production-proof.md`.

Evidence status: source written to protected candidate, not yet independently accepted. GitHub Actions admission is currently limited by provider API rate limiting; only bounded existing watchdog recovery is permitted. Production readback and closure stay **PENDING**, never inferred from an open PR.
