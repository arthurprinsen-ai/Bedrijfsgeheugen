# Development ledger: Mira exact-media diagnostic erasure

- Date (UTC): 2026-10-29.
- Incident owner: existing canonical Media Router + Reliability, linked to #4439.
- BEFORE: original job WAITING_PROOF with reject VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:start:face=0.900:openart=i6e9teMFpPH7YwZG4PMS; 15:09 UTC readiness poll regressed to WAITING_ASSET, last_error=null. No Meta post.
- ROOT CAUSE: readiness state recomputation used absent asset_url as an empty slot, overwrote evidence; historical recovery was narrowed to GENERATING only.
- CHANGE: source-controlled monotonicity fence, only immutable Brain history restores a demoted job using CAS, regression test and skill update.
- BASE: main SHA must be verified during protected PR admission, not inferred from this ledger.
- RELEASE: NOT_LIVE until protected main merge + exact Supabase production runtime and repeated same-job readback.
- IMPACT MEASURE: 0 rejected-proof erasures on repeated preflight; 0 added paid verification; attempts unchanged; publisher calls 0 for rejected bytes. Existing company LinkedIn provider proof preserved.
- NEXT: record PR, exact deploy and production readbacks; continue distinct-source LinkedIn and entirely new approved Mira candidate only within existing authorization, budget, facial and duplicate gates. Keep failed channels RED until Meta/LinkedIn IDs independently read.
