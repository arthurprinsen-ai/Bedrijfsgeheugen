# 30 October 2026 — ONE BRAIN guard-causes in the original Powerhouse / Heartbeat portal

## Original source verification
The sole authoritative public Supabase sources remain `powerhouse_loop_assurance_state_v1` (15 loops) and `powerhouse_loop_assurance_receipts_v1` (stage receipts). At 20:59 UTC the original assurance reported 8 GREEN, 1 AMBER, 6 RED. Six red loops already have 8/8 stage evidence, but their original `guard` receipts contain `pass=false`, so **fresh stage counts do not prove success**. The amber outreach loop is still missing action/provider readback. Never rewrite or weaken statuses.

## Root cause / precise repair
Fingerprint: `powerhouse|one-brain|failed-guard-cause-hidden-by-aggregate|20261030-v1`.
Previously the original admin-only portal and CRO one-loop panels displayed only `ORIGINAL_GUARD_FAILED`, leaving agents and humans without a bounded, source-linked recovery explanation. The original receipt documents distinct causes:
- Content Closed Loop: original duplicate/fresh-story gate, exact Instagram daily winner/media evidence, explicit channels without authorized execution. Independently confirmed provider posts are absent from that record.
- Daily Compound Learning and Revenue Flywheel: real forecast-resolution/calibration debt (1,867 due forecasts in observed sample); no independently proven revenue.
- Data Spine: two unhealthy source integrations in original guard record.
- ONE BRAIN Reconcile: runtime errors plus sparse required evidence and blocked content lane.
- Full Cycle Production: original source health=false.
- Outreach: action/readback stages missing.

## Source-preserving fix
The existing `brain/observability/one-loop-assurance-readback.mjs` still defines the 15-loop status. The new pure `one-loop-guard-diagnostics.mjs` wraps that exact read-only source with **one additional bounded, admin-only GET** of the original stage='guard' receipts. It maps only a fixed allowlist of guard codes to human-readable recovery steps; no raw provider payload, token, email, comment, message, credentials or private record leaves the server. Each source/receipt has a 20-minute freshness bound. Missing, stale, duplicate or invalid evidence is clearly UNAVAILABLE; parent assurance remains RED/AMBER, never artificial green. No second scheduler, writer, data table or social executor.

Existing authorized `/api/powerhouse-one-loop-assurance` and `/api/powerhouse-cro-other-data` reuse the wrapper. The existing Portal V2 ONE BRAIN observability and `Andere data` pages display the per-loop original guard reason and next action. These are **diagnostics**; agents use the existing authorized channel owner, cadence, duplicate-gate, OAuth/identity and provider-confirmed readbacks to attempt repairs. Never bypass human authorization boundaries.

## Closed-loop learning standard
Original receipt → identified cause → owner skill → safe repair within same lineage → independent provider/run result → original guard receipt → next natural run regression → ONE BRAIN promotion. Record repair and recurrence with exact provider evidence before upgrading maturity. Do not convert frontend source-based diagnostic status into proven publication/revenue/positive KPI growth.

## Regression and release
`node --test tests/brain-one-loop-original-guard-diagnostics-20261030.test.mjs tests/brain-one-loop-assurance-readback-20261030.test.mjs`. Check original tenant/admin permission, 15-loop fail-closed population, guard receipt freshness, no PII, duplicate receipt rejection, no extra writer, 8/1/6 unchanged. Required/BRAIN/CodeQL, exact Netlify merge SHA and authenticated production browser/tenant readback must pass for technical live claim. No direct provider publication, CMS-draft promotion or revenue correction in this PR.
