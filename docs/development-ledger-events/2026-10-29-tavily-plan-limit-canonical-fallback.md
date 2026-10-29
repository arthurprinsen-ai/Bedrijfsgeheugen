# Learning ledger — Tavily 432 provider guard, 2026-10-29
Obligation `powerhouse|external-search|tavily-plan-limit-432|20261029` / issue #4215.
Cause: AUTH ACTIVE but search HTTP 432; repeated provider probes under concurrent topics. Existing DataForSEO was already fallback.
Fix candidate: gate only failed Tavily probes; preserve real DataForSEO organic receipts, existing Brain logging and source truth.
Evidence needed: protected PR Required/CodeQL, merged SHA, Supabase edge version, authenticated scheduler invocation, positive/negative source observation and portal readback. Before/after spent credits UNKNOWN. No false green.
 
## Subsequent release-blocker readback — 2026-10-29
First code PR #5127 protected-merged as `e93852af5cc3a4c68df925ddf33260a2504f4fcc`. Supabase Edge Production Authority failed `SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG:bg-externe-signalen`; deployed provider still v20 old source. Fix via same incident lineage, add only canonical function registration and regression in protected follow-up. Continue without bypass/forced deploy. Result unknown until provider version/source and authenticated scheduler readback.

## Observed source run and cost-prevention follow-up — 2026-10-29
V21 ACTIVE on protected main, authenticated pg_net request 15928 returned HTTP 207, 2 successes + 1 failed 40101, 19 results/1 eligible. Provider itself retries 40101 and may bill: prevent repeat client charges, never convert 40101 to 40102 zero or fake-green. Incident #4215; carry learning, test, code and readback in same lineage, no new scheduler.

## Verified post-release operator batch, evidence retained — 2026-10-29
Canonical Edge `bg-externe-signalen` v24 ACTIVE (SHA256 `61db948c7079e919f550bb4459f9f80e7868897d56533f230c754befd41f9ff7`). Protected PR #5130 merged (`ba27370e923e27d911ed48476a4e90657fbb988a`). One authenticated **operator-triggered** invocation using existing `bg_roep_functie` produced pg_net request **15935** (15:12:46 UTC): HTTP **200**, processed/successful **3/3**, failed **0**; 27 DataForSEO source results, 5 allowed, 17 noise. Topics: Concurrentie, Cyberdreigingen, Demografie. Independent source observation `external-intelligence` at 15:12:54.378Z and `brain_delivery_evidence` GREEN at 15:12:54.600Z agree for this batch. Existing ONE BRAIN failure fingerprint promoted by CAS to VALIDATED v4, preserving earlier 14:54:23Z 2/3 failure (Bedrijfsoverdracht, task 40101). A deduplicated Powerhouse runtime event records exact request and pending obligations.
**Not accepted yet:** The next natural invocation of scheduler mux #171 (2026-10-30 05:31 / 05:51 / 06:11 UTC), a natural rotation revisiting the original Bedrijfsoverdracht topic, billable cost delta, and tenant/customer outcome. Never silently roll old RED into GREEN or immediately replay billable 40101. No new scheduler, provider account or store. See `brain/learning/2026-10-29-tavily-plan-limit-canonical-fallback.json` and GitHub #5130 / #4215.

## Canonical cross-agent routing gap — 2026-10-29, PR #5135

Post-protected-merge readback for PR #5133 confirms Source Universe skill, Brain learning, human documentation and regression live on main `14ced18b5876fadc4e111d42f6bbac7cdb293b5a`. Central `AGENTS.md` did not contain a direct required source skill pointer, so other domain agents could miss the incident/fallback rules during preflight. This is a **discoverability/handoff** gap, not a new observed provider outage.

Fix candidate PR #5135: single canonical `AGENTS.md` preflight route to existing `.agents/skills/powerhouse-source-universe-impact-engine/SKILL.md` and `brain/learning/2026-10-29-tavily-plan-limit-canonical-fallback.json`; corresponding skill release provenance and regression. No parallel scheduler/provider/writer or paid replay. The protected admission check initially refused the 4-file candidate with `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE: activity_ledger,brain_learning`. This ledger and the original Brain learning record were appended/updated on the same PR to satisfy those non-skippable gates.

Incident `powerhouse|external-search|tavily-plan-limit-432|20261029` remains VALIDATED; historical RED 2/3, 40101 for Bedrijfsoverdracht, manual operator 15935 GREEN 3/3 and separate PENDING natural-run/historical-topic proof retained. Human documentation in `docs/changes/2026-10-29-external-source-proof-borging.md`. The cross-agent addition is NOT LIVE until Required+CodeQL on the exact synchronized head, protected squash merge and independent main readback. No website/Edge deployment is implied.
