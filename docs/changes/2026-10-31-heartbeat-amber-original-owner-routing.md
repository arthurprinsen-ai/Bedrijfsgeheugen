# 31 October 2026 — ONE BRAIN AMBER recovery must stay with the original loop owner

## Incident, source and measurable baseline
Fingerprint `powerhouse|heartbeat|amber-recovery-cross-owner-misroute|20261031-v1`.
The authoritative Supabase `powerhouse_loop_assurance_state_v1`, checked 2026-10-31 08:45:03 UTC, had **8 GREEN / 3 AMBER / 4 RED**. AMBER owners are (1) `autonomous-outreach`: missing `action,readback`; (2) `content-closed-loop`: missing `action,guard,learning,measurement,outcome,readback`; and (3) `data-spine-watchdog`: missing `action,guard,learning,outcome`. RED: daily-compound-learning, full-cycle-production-proof, one-brain-reconcile, revenue-flywheel, all with original failed guard evidence. Forecast resolution debt: 2,213; independent realized revenue: €0; ONE BRAIN reconcile 3 current runtime errors and 2 evidence-sparse layers. Original CMS still has six drafts and no published items.

## Root cause
In the prior live `brain/observability/one-loop-guard-diagnostics.mjs`, `collectGuardCodes()` returned `OUTREACH_ACTION_READBACK_DUE` **for every AMBER** when its original guard receipt was absent or did not contain `pass`. There was also an inappropriate common AMBER fallback at the bottom. Because guard receipts are freshness-gated (20 min), the Content Closed Loop and Data Spine amber failures would be directed to Outreach rather than their actual canonical agents.

## Precise source-preserving fix
Replace both cross-owner fallbacks with a deterministic `missingStageAction(row)` mapping from the *original* `loop_key` and `missingStages` only: Outreach → existing outreach owner; Content Closed Loop → original publisher/content executor; Data Spine → original data-health watchdog. A future unknown AMBER loop receives only a generic stage-evidence remedy, and an AMBER with no missing stages receives an evidence-due action—not an invented Outreach incident. RED still reads original guard receipts and reports the verified source-specific failure. If guard readback is stale, source remains `NOT_READ_BACK`, never a fabricated provider status or proof. No new scheduler, DB, API, source, auth route, or status writer.

Update both already-authorized Portal V2 observability and CRO views to label remediation as action of the *original loop owner*. This is a repair to routing and operator decisions, not automatic proof of actual publication, calibrated predictions or paid orders. Agents may safely follow the cause only within their existing lineage, consent and duplicate gates.

## Reproduction, regression and release
`node --test tests/brain-amber-original-owner-routing-20261031.test.mjs tests/brain-one-loop-original-guard-diagnostics-20261030.test.mjs tests/brain-one-loop-assurance-readback-20261030.test.mjs`.
Shadow and canary run the same fail-closed source tests under ONE BRAIN security-sensitive learning evaluation. Confirm 8/3/4 remains unchanged and original readbacks use the same two authenticated Supabase GETs. Protected Required, CodeQL, exact main→Netlify→browser and original provider readback required before technical acceptance. Learning maturity cannot become PROVEN without an actual post-deploy admin readback and subsequent natural-runtime evidence.
