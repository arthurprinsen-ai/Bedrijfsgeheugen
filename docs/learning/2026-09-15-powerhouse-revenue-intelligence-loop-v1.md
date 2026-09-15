# Powerhouse Revenue Intelligence Loop v1 — production learning

Date: 2026-09-15
Status: production backend live; release branch pending final CI/main merge

## Canonical purpose

This loop extends the existing Bedrijfsgeheugen Powerhouse commercial core into one account-aware, evidence-driven revenue decision system. It does not create a parallel CRM, second sales brain, duplicate action queue or duplicate learning store.

Canonical lineage:

`runtime event -> person/company intelligence -> opportunity -> buying window -> forecast -> next-best-action -> observed outcome -> calibration -> learning -> revised next-best-action`

Supabase remains transactional source of truth. Notion remains a knowledge/audit projection. The Chrome/LinkedIn cockpit remains an execution surface and is not claimed fully live until a real browser-to-Supabase writeback is observed.

## Production capabilities

The release adds/reuses the following Powerhouse surfaces:

- `powerhouse_contact_pressure_v1`: outbound/inbound recency, no-response pressure, cooldown and follow-up state.
- `powerhouse_account_strategy_v1`: company buying-committee evidence, account thesis and coordinated account move.
- `powerhouse_research_queue_v1`: fail-closed research obligations for stale, contradictory or incomplete evidence.
- `powerhouse_commercial_next_best_action_v3`: wait/research/comment/DM/e-mail/warm-intro decision, verified-asset gating and bounded empirical funnel estimates.
- `powerhouse_revenue_attribution_v1`: exact action linkage is observed; weaker opportunity/content linkage is explicitly correlated.
- `powerhouse_model_health_v1`: sample size, Brier score, calibration error, false positives/negatives and probability drift.
- `powerhouse_experiment_learning_v2`: no experiment becomes proven on vanity metrics alone; downstream commercial evidence and minimum samples are required.
- `powerhouse_revenue_command_center_snapshot_v1`: rebuildable operational projection of the ranked revenue command center.
- `powerhouse-revenue-intelligence`: token-authenticated readback/orchestration facade over the same canonical Powerhouse state.

No Make dependency is introduced.

## Prediction semantics

Reply, meeting, proposal and win values are bounded, smoothed empirical estimates based on observed action/outcome lineage and current buying-window evidence. They are predictions, not guarantees and not a trained statistical ML model. Sparse evidence lowers prediction confidence and leaves the segment in `insufficient_evidence` rather than manufacturing certainty.

Current snapshot model identifier: `nba-v3-empirical-smoothed-snapshot-v2`.

## Fail-closed behavior

Outbound is suppressed or redirected to research when identity is incomplete, evidence is missing, confidence is too low or contact pressure requires cooldown. Missing verified assets resolve to no asset. Missing forecast lineage on an outbound recommendation is surfaced as a structural gap. Correlation is never labeled observed causality. Revenue is only learned from explicit observed outcomes.

## Production incident and root cause

The first command-center read path used the fully derived `powerhouse_revenue_command_center_v2` view directly. A production `EXPLAIN ANALYZE ... LIMIT 1` took about 40.9 seconds because the view chain repeatedly recalculated person/company intelligence across roughly 23k contacts and 17k companies and then joined that work back to the small open-opportunity set.

A simple timeout increase was rejected as non-structural. The fix was to keep the canonical derived views as source logic but introduce one rebuildable operator snapshot. The snapshot refresh materializes `powerhouse_commercial_next_best_action_v2` once, then adds lightweight set-based contact pressure, observed funnel outcomes, research gating and empirical prediction fields only for the active opportunity set.

Regression rule: **interactive/readback paths must never recompute the full person/company graph. Heavy intelligence is refreshed into a rebuildable projection; operator reads are bounded indexed reads.**

## Performance readback

Observed production evidence on 2026-09-15:

- heavy v3 command-center view, `LIMIT 1`: ~40.9 s;
- bounded v2 opportunity basis, top 20: ~6.2 s;
- snapshot refresh: 80 command rows materialized successfully;
- indexed top-20 snapshot read: ~0.675 ms execution time.

The snapshot is refreshed every 15 minutes by `powerhouse-revenue-intelligence-snapshot-15m`. Snapshot age above 30 minutes becomes an explicit degraded health signal.

## Production API readback

`powerhouse-revenue-intelligence` version `1.1.0` is active in Supabase and uses the existing `x-powerhouse-token` device-token contract with service-role isolation server-side.

A production `/health` call returned HTTP 200 with `snapshotBacked=true`, `commandCenterV2=true`, `accountIntelligence=true`, `researchFailClosed=true`, `modelMonitoring=true` and `db=true`.

A production `/daily` call returned HTTP 200 and wrote the `revenue_intelligence_loop` evidence block into the existing `powerhouse_daily_runs` record for 2026-09-15.

## Truthful degraded state

The intelligence backend itself is responding successfully, but the canonical daily state remains `degraded` because the existing commercial backlog still contains structural evidence gaps. At the verification point there were 70 aggregate structural gaps: 11 identity gaps, 58 forecast-lineage gaps and 1 runtime error. This is intentionally not hidden or reclassified as success.

The daily writeback also reported 30 research obligations, one sparse model-health segment and a fresh snapshot. These counts are operational state, not fabricated outcomes.

## Security-gate and current production readback

A protected CI run initially rejected the snapshot refresh migration because the repository security checker did not recognize the `SECURITY DEFINER` execution revocation in the candidate it evaluated. The candidate was hardened with an explicit fail-closed execution revocation and the dedicated `Powerhouse Supabase Security Contract` subsequently passed on head `04b37560149989e7c8fe44614586bd5fdbbf0657`.

Independent production SQL readback on 2026-09-15 confirmed that `powerhouse_revenue_command_center_v2`, `powerhouse_commercial_next_best_action_v3`, `powerhouse_revenue_command_center_snapshot_v1` and `powerhouse_refresh_revenue_intelligence_snapshot_v1()` all exist. Both canonical runtime jobs are active: `powerhouse-revenue-intelligence-daily` at `14 6 * * *` and `powerhouse-revenue-intelligence-snapshot-15m` at `*/15 * * * *`. The snapshot contained 80 rows and had refreshed at `2026-09-15 15:17:41.33036+00`.

The same readback kept health truthfully degraded: 70 structural lineage gaps, consisting of 11 identity gaps, 58 forecast-lineage gaps and one runtime error. Investigation showed the identity gaps are generic `inhaak_nieuws`/`inhaak_bedrijfsnieuws` suggestions on a DM channel without a resolved person or company; the execution gate already fails closed. Forecast-gap investigation also showed `research_enrichment` actions are research work and must not be counted as executable commercial lineage. The remaining executable commercial candidates require canonical forecast lineage rather than synthetic success data.

Prevention rules:

- `SECURITY DEFINER` runtime helpers remain service-role-only with explicit browser-role revocation and the security contract must stay green.
- Research/enrichment actions are not executable commercial actions and must not inflate commercial-lineage health failures.
- A DM/e-mail/warm-intro candidate without resolved identity and forecast lineage remains research/hold; it must never be promoted to autonomous outbound merely to make health green.
- Real outcomes and realized revenue are never synthesized to close a proof gap.

## Learning contract

Every material system change follows:

`detect -> prioritize -> execute -> tests -> production -> readback -> root cause -> regression/prevention -> canonical writeback`

Every commercial action follows:

`evidence -> prediction -> action -> observed outcome -> calibration -> learning -> revised next action`

## Browser boundary

Server-side Revenue Intelligence can be production-proven independently. Chrome/LinkedIn stays `DEELS LIVE` until a real browser session proves exact identity -> action/writeback -> Supabase readback. Server evidence must never be used to claim browser execution that did not occur.