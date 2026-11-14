# Innovation zero-source false green — original P0 incident 2026-11-14

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `powerhouse|innovation|empty-source-false-green|20261114-v1`
- Owner: existing Self-Improvement / ONE BRAIN / Heartbeat engineering, not new worker
- Actual preview observation: provider schema applied migration 20261114193000 to Supabase branch `bszjifiycurnerfmhvth`; calling existing original daily function with 0 candidates yielded `health=INDEPENDENTLY_VERIFIED` even though zero original intake and outcome. No evidence of improvement.
- Current original production: 14 candidates, 14 original `INNOVATION_INTAKE` operations, 0 verified ACK, `RECOVERY_DUE`, original event `observed/OWNER_HANDOFF_PENDING`, so bug is specifically the 0-source edge case.
- Root cause: missing first condition in original daily health and event CASE expressions; 0/0 fell into nominal verified branch.
- Repair: protected source migration `20261114213500_innovation_original_agent_intake_recovery_v1.sql`. Do NOT edit already-applied 20261114193000 migration. Preserve single original daily function and protections, no new scheduling.
- Prevention: original daily event and control result must use `NO_SOURCE_CANDIDATES` when no source; dedicated historical regression and existing skill rule; independently rerun empty provider preview after merge candidate.
- Lifecycle: proposed for protected exact-head Required/CodeQL/preview/provider readback. NOT production-fixed until new migration actually applies. Original 14 consumer tasks remain open with no invented value.

## Same-original resilience recovery observation

- Exactly 14 originally PLANNED `INNOVATION_INTAKE` operations became `RESULT_UNKNOWN` by original watchdog after 120s, marked `WORKER_LOST`, although provider effect `NOT_STARTED` and `remote_ref=NULL`.
- Original `brain_reconciliation_jobs`: 14 PENDING `EXECUTION_RESILIENCE_RECOVERY`, repeated `NO_SAFE_CANONICAL_RECOVERY_HANDLER` at 18:41 UTC; no verified owner ACK, no external side effect.
- Root: watchdog treats an unclaimed intent as active worker; original reconciliation worker handles SELFTEST but not this typed intake.
- Same PR protected source `20261114213500_innovation_original_agent_intake_recovery_v1.sql` preserves exact source and controls; excludes never-started PLANNED intake from heartbeat timeout, recognizes safe original `RESULT_UNKNOWN` and transitions only back to `PLANNED` with `NO_SIDE_EFFECT_STARTED` through original CAS. Original job records `RESOLVED` solely for recovery, not innovation.
- Regression appended to existing daily original `tests/brain-innovation-original-consumer-intake-20261114.test.mjs`; associated skill updated. Never mark pending work consumer-verified.
- Status: PROTECTED SOURCE PROPOSAL — not live until CI/preview/merge/provider proof and natural original recovery worker readback.

## Protected admission recovery — PR #5800

- First exact-head Required job `43630475539`, original hygiene/admission rejected the machine header `Supersedes: #5796` as `PR_MACHINE_METADATA_INVALID:SUPERSEDES_INVALID`. This is a real CI refusal, not permission to bypass the canonical admission gate.
- The canonical parser `tools/delivery/delivery-hygiene.mjs` accepts only a numeric unprefixed supersession ID or `none`. Since the original predecessor #5796 is already closed and the successor has an expanded recovery obligation (not exactly the same original obligation ID), preserve #5796 as a human-readable predecessor link and normalize machine field to `Supersedes: none`. Do not manufacture a same-obligation merge lineage.
- Recovery stays on the SAME protected PR #5800, with new exact-head CI event; verify Required + CodeQL + provider preview, protected merge and canonical Supabase readback before any production claim. No alternate direct database migration or duplicate scheduler.

## Provider follow-up — original ESCALATED recovery, same queue

- At 2026-11-14 18:46 UTC, independently read 14 existing original `EXECUTION_RESILIENCE_RECOVERY` jobs `ESCALATED` with 3 no-progress attempts, while all 14 original intake operations remain `RESULT_UNKNOWN` with `side_effect_state=NOT_STARTED`, `remote_ref=NULL` and no real consumer ACK.
- A handler alone cannot receive an escalated job. Same existing five-minute watchdog and existing `brain_schedule_reconciliation` must create **one source-bound idempotent recovery job per original operation revision** in the same original queue; exact original binding+candidate+obligation and escalation required; the original worker alone restores `PLANNED` and records readback. Repeat escalations remain visible and do not spawn unlimited jobs.
- Extended original watchdog guard now fails while a never-started intake remains `RESULT_UNKNOWN`; no green from zero old-stale-heartbeat count alone.
- Converged both pending SQL changes to a **single atomic protected migration** `20261114213500_innovation_original_agent_intake_recovery_v1.sql` ordered after the real provider identity `20261114211500` (different, original public-business-email migration). The two stale proposed SQL filenames are deleted from this PR branch; neither was native production-applied. No direct database DDL or scheduler fork.

## Werkelijke runtime-eigenaar v2 (2026-11-14)

De oorspronkelijke vijf-minuten-mux `powerhouse_runtime_scheduler_mux_v1`, aangeroepen via v2/v3, gebruikt aantoonbaar `powerhouse_reconciliation_worker_v2`, **niet** v1. Dat is bevestigd uit de productie-functiedefinitie en de `brain_reconciliation_jobs.evidence.worker=powerhouse-reconciliation-worker-v2` van de 14 echt geëscaleerde jobs. De beschermde migratie vervangt daarom de bestaande **v2**-functie, met behoud van de gewone `safe_replay=true`- en fail-closed-paden. Alleen een brongebonden, idempotente hersteljob na de oorspronkelijke escalatie (`prior_escalation_verified=true`, exacte operation_id, eigenaar, kandidaatbron, oorspronkelijke verplichting en control-plane binding, geen remote_ref, side-effect `NOT_STARTED`) mag zonder externe actie terug naar `PLANNED`. Dit blijft **zonder consumer ACK**, gevalideerde waarde of automatische publicatie. Test en skills controleren expliciet v2 om een papieren correctie in de verkeerde functie voortaan te blokkeren.
