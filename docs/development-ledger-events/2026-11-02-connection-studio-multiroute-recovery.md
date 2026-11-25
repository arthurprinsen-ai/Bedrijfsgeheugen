# 2026-11-02 — AI Koppeling Studio multi-destination and recovery
Obligation: `portal-connection-studio-multiroute-recovery-20261102-v1`  
Fingerprint: `portal|connection-studio|single-destination-and-sample-vs-ingestion-gap|20261102-v1`  
Owner: existing Portal V2, canonical connector store/runtime, ONE BRAIN, Heartbeat and protected release writer.

Observed source failure: one template, one target, no per-page selection. Example test `TEST_PASSED` proves mapping only, not external provider auth, persisted customer records, direct KPI, Brain/Powerhouse ingestion or customer value.

Candidate repair: reusable multiple independent saved drafts, multi-field and multi-page allowlist, no extra data processing by default, explicit Brain AI consent, server validation, metadata-only tenant projections, bounded one-retry safe-test after transient transport error and human-readable recovery help. All original OAuth, sovereignty, entitlements, CI and writer boundaries remain.

Evidence: `tests/brain-connection-studio-multipage-recovery-20261102.test.mjs`; semantic validation of target/field allowlist and tenant-scope API, preserved existing connector recovery and evidence tests. Manual screenreader/mobile verification, real provider source read, real target persistent data record, page metrics, Brain/Powerhouse ingestion and actual business outcome are **UNPROVEN**, not falsely green.

Learning: error class + exact connector/failure stage, one original idempotent fingerprint, real provider receipt, protected release SHA, independent readback, root cause, prevention test and later recurrence check. Self-heal may only retry idempotent safe tests; no unauthorized OAuth, provider permission, consent or data location route. Next original datahub-owner work requires source→storage→readback→Brain and Portal with tenant/RLS and revocation controls; the UI read-only card is not data-storage fulfillment.

System Map: `aiConnectionStudioMultiRouteV1`; skill: `.agents/skills/portal-living-interface/SKILL.md`; runbook: `docs/changes/2026-11-02-connection-studio-multiroute-recovery.md`. Status until protected merge and exact Netlify/browser/tenant proof: `CANDIDATE`. 

## Exact-head admission recovery (2026-11-02)
Original PR #5324 first Required preflight on the candidate failed `SYSTEM_MAP_INTEGRITY_FAIL`, although hygiene / canonical learning passed. The source-derived Portal Explanation inventory generator calculated hash `636ceec08abdb66b25a092f9417eccba431957cb4087fce83f84c2110033d73d`; candidate had stale `explanationInventory.contentHash` and `portal-v2/index.html?bg_explain` (old `948d8c...`). The original generator showed exactly these two diffs. Both are updated to the observed hash on the same candidate branch; no branch protection or generator rule changed. Fresh exact-head Required, CodeQL, portal/browser and full BRAIN plus postmerge provider proof are still required.
