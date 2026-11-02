# Original admin Portal source-label test regression — 2026-11-02

## Evidence and cause
Parent P0 [#4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439). Original postmerge BRAIN [run 41433667027](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41433667027), backend job 125238718390: **5400 total, 5397 pass, 1 failed, 2 skipped**. The sole failing original `tests/brain-portal-latest-original-backend-observation-20261102.test.mjs` asserted retired label `Laatste vastgelegde BRAIN-hertest`. Existing protected #5282 correctly distinguishes *first historical failures*, *latest failed full BRAIN run* and *later recorded 0-failure software recovery*. The test oracle was stale, not the production access gate.

## Original repair and protections
Change only the original test source so it requires all **three actual labels**, software recovery source guard, escaped absolute HTTPS GitHub evidence links, admin-only API, explicit failed/missing-proof behavior, no invented independent terminal result and no paid orders. Do not change UI product behavior, Supabase rows, provider status, permissions, RLS, original publisher or scheduler. Update existing postmerge agentskill, ONE BRAIN learning and append-only development ledger. Preserve both historical red and newer genuine zero-software observations.

## Required acceptance
Exact source head Required and CodeQL, historical/shadow/canary, complete Unified BRAIN 0-fail and terminal, protected merge, exact Netlify production/readback and authenticated owner-only Portal. Follow up on the next natural run before claiming non-recurrence. Two test skips remain explicitly documented; commercial 15-loop status is independent.
