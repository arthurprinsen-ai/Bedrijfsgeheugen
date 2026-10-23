# 2026-10-22 — BRAIN company company-page source oracle

- Fingerprint: `ci|brain|company-editorial-retired-literal-oracle|20261022-v1`
- Obligation: `ci-brain-company-editorial-source-oracle-20261022-v1`
- Parent: [#3742](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742); related [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215).
- Source evidence: [Unified BRAIN run 39791707071](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071), candidate `8e665a86d2bb54712a34fd88bec0e1213df21dd2`, 355/3526 failed; this single stale assertion is in `tests/brain-commercial-daily-steering-positioning-v1.test.mjs`.
- Verified current canonical source path: `supabase/functions/powerhouse-content-orchestrator/index.ts`, editorial classifier `supabase/functions/_shared/company-linkedin-editorial-contract.mjs`.
- Exact-file repair: one existing test; preserve real editorial fail-closed, no fake publication claims.
- Non-owner changes: none in other writers' PR files; existing #4605/#4633 untouched.
- Verification pending: exact-head Required CI, CodeQL and full Unified BRAIN 0 fail; separately actual #3742/#4215.
- No change to release, production runtime, SQL, RLS, scheduler or publication.
