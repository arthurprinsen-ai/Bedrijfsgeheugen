# Skipped SEO blog recommendation must not reserve the daily candidate slot

Date: 2026-10-29
Status: SOURCE_CANDIDATE_NOT_LIVE
Obligation-ID: seo-blog-skipped-reservation-recovery-20261029

The already-deployed SEO Opportunity Resolver v100 produced HTTP 200, 0 new blog recommendations and five owner-first commercial actions at 2026-10-29 10:58 UTC. Its predecessor had generated 52 obsolete suggestions for Twinfield API and Twinfield bookkeeping. The canonical recommendations were corrected to status `skipped` in place with durable per-row evidence, preserving one already-skipped record. All 53 are now skipped and zero incorrect recommendations remain suggested.

The one-candidate slot readback still included skipped records. Change only the original function to count `suggested`, `accepted` or `done` recommendations as used capacity; a rejected/previously skipped item must not block the next independently evidenced candidate. Keep the original token check, existing cron, bounded DataForSEO, privacy rules, one canonical publisher, approvals and protected release gates.

Regression: `tests/brain-seo-blog-daily-decision-20261029.test.mjs` now asserts skipped exclusion. Retain the original runtime test.

Do not claim production until a protected merge plus native provider source parity and an independent authenticated post-release production canary. Source and governance only; no blog body, private tenant data, secret or unapproved copy in public Git.
