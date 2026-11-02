# 2026-11-02 — Original Portal V2 Netlify challenge recurrence, no security bypass

Parent: #4547; original production UX PR #5297, protected main `75c4500a4e90afa1f001f748d7081a75e09aa803`; Netlify production deploy `6ae89037cf6564e024183391`.

## Observed occurrence
Original production DOM readback run `41453415237`, first job `125303998860`, failed on `waarde-financiering` with **HTTP 403**. Actual Playwright error-context showed Netlify's “We are verifying your connection” challenge (ID `01M6E7APG9ASVFSR91TC96BV33`). The second job `125306153752` independently succeeded with **15 passed / 1 skipped**, same immutable published SHA and visual source. No original security/Identity/SSO control was changed.

Original ONE BRAIN registry already contained fingerprint `powerhouse|portal-v2|first-browser-readback-403-then-pass|20261030-v1`; the 2026-11-02 occurrence was appended with `public.brain_observe_failure` and independently read back as `OBSERVED`, occurrence count **2**, not `PROVEN`. Related source-specific incident `portal|legacy-algorithm-parity|waarde-financiering-403|20261022-v1` is the same physical browser failure at a narrower test scope, not a new independent security event.

## Problem / cause / safe prevention
The browser assertion correctly failed but the exception lacked a machine-actionable provider/security challenge classification. Netlify's specific detection heuristic is **UNKNOWN**. Add a passive, deterministic classifier on the original test only, retaining the original HTTP <400 gate: only true HTTP 403 + original Netlify challenge markers maps to `NETLIFY_SECURITY_CHALLENGE_READBACK_BLOCKED`. Other 4xx/5xx still fail normally. No bypass, web-security relaxations, credential spoofing, disabled CI, repeated automatic challenge solver, new scheduler, business outcome claim, or fake all-green.

Original existing browser and portal skills, ONE BRAIN machine learning record and real regression test carry this rule. Original protected Required/CodeQL/BRAIN and merge remain compulsory, plus independent future natural readback; secure-browser test results cannot be assigned to all authenticated tenants.

## Outcome
V1 technical source + browser proof already LIVE; this is a candidate reliability/observability improvement. Original 403 recurrence is not declared prevented forever; only classification and safe recovery procedure can be regression-guarded. Real-user WCAG 2.2 AA, 8+ entrepreneur tasks/SUS, two-tenant journeys, 320–1440px and 200% zoom coverage, p75 web vitals and award-worthiness remain EVIDENCE_DUE. Keep issue #4547 open.

## Protected admission contract recovery (same PR #5303)
Original Required hygiene attempt `41456184469` correctly stopped with `unclassified delivery path: tests/integration/portal-readback-security-challenge.mjs`. This helper was outside the existing canonical Portal V2 test namespace; do not widen delivery classification or exempt the guard. Moved the identical pure classifier (no security/behavior change) to `tests/integration/portal-v2-readback-security-challenge.mjs`, which already belongs to the original Portal V2 lane, and rewired its Playwright and BRAIN regressions. Keep old failure evidence and require exact-HEAD protected CI proof.
