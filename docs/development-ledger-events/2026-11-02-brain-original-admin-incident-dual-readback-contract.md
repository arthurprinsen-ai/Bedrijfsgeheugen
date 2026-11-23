# 2026-11-02 — ONE BRAIN admin incident readback: two original requests, one outdated test

Parent incident **#4439** (34 historical, 32 most recent backend failures). Existing ONE BRAIN fingerprint `powerhouse|brain|postmerge-backend-suite-34-failures|20261102-v1` remains OPEN and not PROVEN.

## Original independently observed evidence
Exact original BRAIN backend workflow **#41409975773**, job **125160796452**, reported 5,358 tests, 5,324 passes, 32 failures, 2 skips. Failure index **2994**, `tests/brain-portal-failure-coverage-readback-20261029.test.mjs`, was **expected 1 read, actual 2**.

Source `brain/observability/failure-coverage-projection.mjs` intentionally calls the canonical original Supabase `brain_failure_registry` twice **server-side**, not browser-side. The first call counts up to 1,000 records using exact `content-range`. Only when the aggregate passes does the second query fetch one **allowlisted** predictive recovery fingerprint to prevent synthetic green. The original admin portal consumes the sanitized aggregate and `UNVERIFIED` recovery status. No new store, scheduler, writer, service credential in client, or alternative read endpoint.

## Correction, regression, non-claims
The failing **historical test**, not the safer source implementation, was corrected to require exactly both intended bounded reads, allowlisted exact fingerprint, missing additional count header, no leakage of raw incident fields/key, and fail-closed status when second read is rejected. It also asserts initial 403 stops after one request. Original test path remains the replay authority; one real test fixed is not evidence that the other 31 failures are solved.

Skill: `.agents/skills/powerhouse-post-merge-codeql/SKILL.md`. Machine learning: `brain/learning/2026-11-02-original-admin-incident-dual-readback-test-contract-v1.json`. No change to production function, UI source, auth or database schema; original portal already receives both sources. Protected Required, CodeQL, full original BRAIN and actual admin-readback still needed before any terminal GREEN. No fabricated revenue, contacts, conversion or customer outcome.
