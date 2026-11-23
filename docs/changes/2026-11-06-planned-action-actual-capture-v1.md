# Canonical actual-action capture in original BRAIN (6 November 2026)

## Incident, evidence, authority
Issue #5510. PR #5506 implemented the 41 additional triggers, #5511 corrected eight real PR-title false-block proxies and #5512 delivered a privacy-preserving recall evaluator. The exact decisions of **actual agent preflight invocations** were not stored in the existing BRAIN evidence authority. The original `brain_records` baseline is `NOT_MEASURED`.

## Implementation
- The existing `tools/delivery-preflight.mjs` and **same** `matchPlannedAction` now allow an asynchronous `recordPlannedAction` hook before `PLANNED_ACTION_PREVENTION_REQUIRED` is thrown. No change to the match decision, blocked/acknowledged semantics or PROVEN lesson requirements.
- The original Node CLI `node tools/delivery-preflight.mjs shared --action "..." ` uses `createCanonicalPlannedActionRecorder` only when a genuine action is supplied. It records a digest of the actual action string, matching and blocked rules, agent ID, run-source reference, exact execution ID and timestamp. Raw free text, credential and private prompt are **never** in the payload.
- The writer reuses `createSupabaseRecordAdapter` to call **existing** `public.brain_append_record` and performs independent REST readback of the same row; a blocked plan is recorded *before* denial. Same event/action/acknowledgement is idempotent; changing ack state is a different decision.
- Secret key is derived in memory from server-held service-role material. No new table, cron, scheduler, provider, second guard or public write endpoint. URL is restricted to an actual HTTPS `*.supabase.co` root and network failures fail closed if capture was configured.
- `POWERHOUSE_ACTION_RECALL_MODE=auto` reports `NOT_CONFIGURED` when source identity or authorized credentials are missing, without reporting successful capture. `required` fails closed. The operational measurement remains `NOT_MEASURED` until independent reviews and sample support exist.
- The **original** BRAIN PR-delivery planner passes its concrete action into the same preflight, but **does not receive privileged credentials**, since it checks untrusted PR candidate code.
- The already-established protected-main `Main Write Integrity` and `Production Release Readback` actions also invoke the original guard with concrete actions under `if: github.ref == 'refs/heads/main'` and only these steps receive existing Supabase secrets. Neither action creates a parallel executor; both are naturally existing main events. If a protected main service credential is unavailable, the code reports `NOT_CONFIGURED`, not green.
- Preflight outcome is not an execution outcome or independent ground-truth review. Reviewer identity must still be authenticated independently (see #5512), and measured recall/precision/false-block rate require the existing minimum sample requirements. This feature **does not** manufacture positive labels, alter original incident data or automatically close #5510.

## Required production evidence and next acceptance
Protected Required (including new original-runtime capture and secret-isolation regression tests), CodeQL, original BRAIN, main SHA, independent production-readback, terminal record. Then observe natural original main release/integrity runs and check for distinct `PLANNED_ACTION_GUARD_OBSERVATION_V1` rows with provider readback. If no credentials or run happens: **NOT_CONFIGURED** / **NOT_MEASURED**. Independent human or separately authenticated reviewer attestation is still needed to compute operational metrics; observed guard events alone are not recall.

Keep #5510 OPEN until independent labels and outcome truth are proven. No changes to Monday weekly-job control or the active publisher.
