# Growth-drain indexed pointer partial failure — 25 October 2026

- Obligation-ID: `netlify|growth-drain|index-integrity-skip-with-evidence|20261025-v1`
- Owner: existing growth-drain scheduler, single writer
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4446
- Related commercial: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Production evidence: Netlify 15:21–15:37 UTC HTTP204 while `replayed=0,failed=1,indexedSeen=1` on multiple runs; adjacent runs persisted 2–4 per minute; Supabase new page-view rows since #4908
- Root cause: first malformed or missing source pointer aborts scan; status 204 masks genuine partial failure
- Implementation: retain pointer, continue through unrelated events, separate provider errors, classify counters, non-green HTTP503, no new scheduler
- Regression: `node --test tests/brain-growth-drain-time-budget-v1.test.mjs` and other Required checks; after release, independently verify real persisting events, count of persistent pointer integrity failures, and revenue truth
