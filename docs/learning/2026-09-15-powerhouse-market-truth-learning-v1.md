# Powerhouse Market-Truth Learning v1

Date: 2026-09-15
Status: LIVE & BEWEZEN. PR #1614 is merged to `main` at `9b78f39a515287230600be8bf20aa0f6995044fc`; production migrations are applied and read back. Reverified on 2026-09-15 after later unrelated `main` changes; current `main` at reverification was `48f94b8bbcf3806d8684f31b8b69c0ba18ccd77a` and the Market-Truth runtime remained healthy within its explicit sparse-evidence boundary.

## Purpose

This release turns the existing Powerhouse Revenue Intelligence Loop into a stricter market-truth learning loop. It does not create a second CRM, experiment brain, learning store, action queue or Make dependency.

Canonical lineage remains:

`signal/evidence -> context -> prediction -> pre-treatment assignment -> decision -> action/holdout -> observed outcome -> observed economics -> calibration -> learning -> next decision`

## New canonical persistence

- `powerhouse_experiment_assignments`: persisted treatment/holdout authority before treatment, with eligibility snapshot, assignment time, measurement horizon, model version and immutable arm.
- `powerhouse_action_economics`: observed provider cost, external cost and human minutes. Missing values stay NULL.
- `powerhouse_human_feedback_events`: approve/edit/skip/cancel/override/alternative-action evidence; edits can preserve both recommended and actual variants.

All three stores are server-side, RLS-enabled and revoked from anon/authenticated browser roles.

## Causal truth boundary

Stable hashing may choose a candidate treatment/holdout arm, but only the persisted pre-treatment assignment is authoritative. Treatment action linkage refuses holdout assignments and refuses any action created before the assignment.

`powerhouse_causal_experiment_readiness_v1` exposes treatment/control counts, matured counts, observed outcomes/revenue and assignment timing. It emits:

- `not_proven` for invalid treatment sequencing;
- `insufficient_evidence` while either arm has fewer than 10 matured assignments;
- `ready_for_estimation` only after the minimum sample gate.

`ready_for_estimation` is deliberately not a causal-lift claim. A later estimator still needs comparable eligibility and appropriate statistical inference.

## Economics truth boundary

`powerhouse_record_action_economics_v1` now requires the canonical sales action to have `status='done'` and a non-null `executed_at`. The production proof explicitly verified that a current `suggested` action is rejected with `action must be executed before economics can be recorded`.

The positive RPC path was also exercised against an already executed action with temporary internal-test economics and then cleaned up. No internal test economics remains in canonical learning data.

`powerhouse_market_truth_unit_economics_v1` derives realized revenue/cost and funnel observations only from observed rows. No cost, time or revenue is synthesized.

## Human feedback

`powerhouse_record_human_feedback_v1` accepts operational feedback without pretending it is a market outcome. A production proof exercised an `edit` event preserving recommended versus actual variants and then removed the internal-test proof row. Canonical human-feedback count therefore remains zero until real human feedback is observed.

## Daily market-truth readback

`powerhouse_market_truth_daily_v1` writes current health into the existing `powerhouse_daily_runs.evidence.market_truth_learning` object. It does not override another canonical guard or force a daily run green.

Production readback immediately after deployment showed:

- assignment count: 0;
- matured assignments: 0;
- causal-ready experiments: 0;
- actions with observed economics: 0;
- human-feedback rows: 0;
- forecast calibration samples: 1;
- realized revenue: EUR 0.

A later production reverification at 2026-09-15T19:37:58Z confirmed the same sparse-evidence truth boundary, while the overall daily run for 2026-09-15 was `completed`.

This sparse state is intentional. The truth boundary is: **sparse evidence must collect more observed market truth and must not increase autonomy**.

## GA4 historical incident resolution

The historical GA4 freshness error at `2026-09-15T11:47:00.368665Z` remains intact as an error event. Current GA4 health later returned fresh/ok. The daily Market-Truth function wrote a separate idempotent `source_health_resolved` event with `state=closed`, `data_quality=VERIFIED`, confidence 1, a reference to the historical error timestamp and `preserves_history=true`.

No historical event was deleted or rewritten.

## Production migrations

- `20260915165700_powerhouse_market_truth_learning_v1`
- `20260915170207_powerhouse_market_truth_economics_execution_guard_v1`

Repository migration filenames are aligned to these exact production ledger versions to prevent later reapplication/drift.

## Runtime surfaces

- `powerhouse_assign_experiment_v1`
- `powerhouse_link_experiment_action_v1`
- `powerhouse_record_action_economics_v1`
- `powerhouse_record_human_feedback_v1`
- `powerhouse_market_truth_daily_v1`
- `powerhouse_causal_experiment_readiness_v1`
- `powerhouse_market_truth_unit_economics_v1`
- `powerhouse_human_feedback_effectiveness_v1`
- `powerhouse_market_truth_health_v1`

## Security

All new SECURITY DEFINER RPCs pin `search_path=public`, explicitly revoke execute from `public`, `anon` and `authenticated`, and grant execution only to `service_role`. Derived views use `security_invoker=true`, revoke anon/authenticated access and grant read access to service_role.

Existing unrelated Supabase advisory warnings are not reclassified as fixed by this release.

## Operational next evidence

The release is live and production-proven, but market evidence is intentionally sparse. Powerhouse must now accumulate real pre-treatment assignments, matured treatment/control observations, real action costs/human effort and real human overrides. Those observed facts may then drive calibrated learning. Until sufficient evidence exists, causal status stays insufficient and autonomy must not increase.
