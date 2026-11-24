# 2026-11-15 #5913 — personal LinkedIn identity and false-green prevention

## Input
User rejected nonsensical personal LinkedIn copy, with many views but no authentic personal story, despite previously documented identity contract. Original provider URN: `urn:li:share:7527762350779662336`.

## Evidence
- Original source was external news (NOS/AT5), not an Arthur-authored personal lived event.
- Original records contained simultaneous `review_status=422` and `pre_publish_gate=passed`, with differing text hashes and `LIVE_PROVEN`.
- Exact sequence of these writes is not established; **do not assert the 422 preceded provider create**. LinkedIn readback was permission-limited; the provider URN remains an immutable side-effect fence.

## Repair on original chain
1. Add hard source + exact hash + independent reviewer PASS recheck inside existing `publishLinkedInPersonalViaComposio` immediately before provider API create.
2. Replay news, business-style, Sunday, 422, stale-PASS, changed-hash and source-change cases in existing first-person tests.
3. Amend both original LinkedIn agent skills, explicitly superseding observational fallback.
4. Log incident, prevention, test, docs. Await exact-head protected CI, merge, native Edge deployment, source-parity and negative production test. No secondary scheduler/post writer and no automatic public-content deletion.

## Terminal evidence gate
Code committed and a PR opened are **not** LIVE_PROVEN. Consumer learning/Heartbeat closure remains open until independent production evidence. Existing public URN must never be replaced automatically.

## CI admission incident — 2026-11-15

Original PR #5914 hygiene admission (run 43762946554) was rejected before unit tests because the submitted PR body lacked mandatory delivery metadata: `Obligation-ID`, `Base-SHA`, `Delivery-Lane`, `Candidate-Type`, `Change-Scope`. This was an authoring/metadata error, not a failing regression test. Remediation: add exact original owner, canonical backend lane, main base SHA, recovery candidate type, scope budget and all eight changed paths to the original PR body; create an updated exact-head test run. Never bypass admission or silently claim Required green.
