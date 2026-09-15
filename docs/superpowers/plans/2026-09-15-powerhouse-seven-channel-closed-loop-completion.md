# Powerhouse seven-channel closed-loop completion — implementation plan

> **Canon:** this is a delta implementation plan. It does not replace `docs/growth-revenue-os-architecture.md`, `powerhouse-daily-execution-contract-v1`, the prediction → outcome → calibration contract, or the Revenue Command Center design.

## Goal

Make the already-approved seven-channel Powerhouse contract operational end-to-end without parallel storage and without Make.

The seven canonical lanes are:

1. `email_newsletter`
2. `linkedin_personal`
3. `linkedin_company`
4. `linkedin_article_personal`
5. `linkedin_article_company`
6. `instagram_company`
7. `blog`

Hard daily publication lanes are `linkedin_personal`, `linkedin_company`, and `instagram_company`. Blog, email, and both LinkedIn article lanes receive an explicit daily Brain decision but use adaptive cadence based on prediction, downstream commercial evidence, fatigue and learned performance.

## Verified production gaps on 2026-09-15

- `content_publication_obligations` projects only four lanes (`linkedin_personal`, `linkedin_company`, legacy `instagram`, `blog`).
- `powerhouse_channel_decisions` has no rows for 2026-09-15 onward even though `powerhouse_execution_status()` already requires seven decisions.
- `powerhouse-content-orchestrator` cron returns HTTP 500; its exception logging masks the original error.
- deployed orchestrator marks Instagram non-executable and allows a hard daily LinkedIn personal lane to become HOLD/SKIP.
- deployed social publisher handles only the two LinkedIn channels.
- `content_operations_cockpit` does not join the Brain decision state.
- publication watchdog/assertion watches four legacy lanes and permits `SKIPPED` for all of them.

## Task 1 — Contract tests first

Add a regression test that requires one seven-lane canonical projection, legacy Instagram normalization, hard-social no-skip semantics, cockpit decision visibility, source-controlled orchestrator/publisher functions, Instagram Mira media fail-closed handling, and safe orchestrator error persistence.

Run the focused test and prove RED before implementation.

## Task 2 — Canonical publication-ledger migration

Add one forward migration that:

- normalizes legacy `instagram` → `instagram_company`;
- supports content kinds `social`, `blog`, `email`, `article`;
- projects all seven lanes from the existing experiment calendar into `content_publication_obligations`;
- backfills the approved operating horizon without duplicating execution truth;
- joins `powerhouse_channel_decisions` into `content_operations_cockpit`;
- updates publication watchdog/assert functions to seven lanes;
- treats `SKIPPED` as invalid terminal success for the three hard daily social lanes;
- preserves explicit skip/hold decisions for adaptive lanes with reason evidence;
- extends execution status/guard readback so a daily run cannot hide a mismatch between seven Brain decisions and seven ledger obligations.

No new calendar, CRM, analytics store, prediction store, or learning store is introduced.

## Task 3 — Repair daily orchestrator

Source-control the deployed `powerhouse-content-orchestrator` and minimally change it so:

- exactly seven decisions are always persisted or the run fails closed;
- hard social lanes are publication obligations, not optional HOLD/SKIP fallbacks;
- adaptive cadence policy is supplied for blog/email/articles, while predictions and calibrated learnings remain the deciding evidence;
- Instagram is an executable lane only through verified Mira media evidence;
- missing personal-source or Instagram-media prerequisites create explicit blocked/recovery evidence instead of silently erasing the publication obligation;
- error persistence cannot mask the root exception.

After deployment, invoke the function through the existing scheduler-token path and require HTTP 200 plus exactly seven decision rows as readback evidence.

## Task 4 — Extend social publisher safely

Source-control the deployed `powerhouse-social-publisher` and extend it to `instagram_company` using the existing channel-identity/Mira media contract. No Instagram Buffer mutation may occur without final verified media evidence and a public provider-usable asset URL. Missing or invalid media becomes a visible blocked recovery state, never a fake success.

LinkedIn personal identity v4 and the existing pre-publish gate remain fail-closed.

## Task 5 — Cockpit and closed-loop reconciliation

The existing cockpit becomes the projection of the same canonical rows. For each date/lane it must show publication state plus Brain decision, confidence, topic/content key, schedule, delivery reference/evidence, errors, next action and measurement/learning state.

The hourly execution guard remains the completion authority and must combine:

`7 decisions + ledger coverage + required delivery + predictive health + calibration obligations`.

Later provider readback/metrics/outcomes continue through the existing social/revenue learning chain and influence subsequent predictions/decisions.

## Task 6 — Production and release proof

Required proof before claiming completion:

1. focused contract tests RED before implementation and GREEN after;
2. required GitHub `test` gate green on exact PR head;
3. Supabase Preview green on fresh migration replay;
4. production migration applied and read back;
5. deployed orchestrator invocation returns success and seven decisions exist for today;
6. ledger contains seven obligations per date for the approved horizon;
7. hard-social lanes cannot terminate as SKIPPED;
8. cockpit exposes decision + execution truth;
9. social publisher readback proves LinkedIn/Instagram safety behavior;
10. daily run remains degraded until the already-canonical predictive/execution contract is genuinely satisfied.
