# Original Powerhouse / ONE BRAIN / Heartbeat publication recovery — one obligation, one accountable next action

**Date:** 31 October 2026. **Parent:** [P0 #4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198). **Incident:** `powerhouse|publication|obligation-next-action-diverges-from-one-brain-recovery|20261031-v1`.

## Verifiable failure

Original production `content_publication_obligations` still has four `PLANNED` public obligations and zero provider IDs. Its `next_action` is stale/generic ('Genereer/publiceer...' or generic blog PR), although same original `content-closed-loop:2026-10-31` ONE BRAIN runtime holds five concrete owner-assigned `RECOVERY_DUE` channel reasons (3x provider credit failure, one Mira unique source winner, one protected email sender/opt-in). This splits context, decisions, operations, reporting and learning.

## Single original feedback-loop repair

The **existing** exclusive-lease `powerhouse-content-loop` reads original decisions and original obligations after current reconciliation, computes `assessDailyPublicationRecovery` as the single typed authority, then uses `planOriginalPublicationHandoffs` to project only the existing hardcoded sanitized Dutch recovery instructions into each original public obligation's existing `next_action`. The only mutation is `next_action` and `updated_at`, CAS-guarded by tenant/date/channel, exact previous next_action, still `PLANNED/BLOCKED/FAILED` and `external_id IS NULL`. It never touches already-approved, dispatched, provider-ACK or completed items; no e-mail update without an authorized original sender and opt-in. The same original Brain receipt reports planned/applied/CAS-conflict/error writebacks and next actions. The original read-only private portal shows the accountable original agent and specific source-confirmed next step, **still RED until provider proof**.

Dataflow: public source → original channel decision → typed cause/owner → original obligation `next_action` CAS → original ONE BRAIN verification receipt → existing Heartbeat/portal → original authorized agent repair → exact provider ID/public URL and measured outcome → ONE BRAIN learning, future regression. No second cron, alternate sender, post create, AI fallback model or authority override.

## Proof / guardrails

Protected `tests/brain-publication-obligation-recovery-handoff-20261031.test.mjs` must exercise four public channels and excluded email, native Date scheduling, sanitized failures, original idempotence, CAS protection and final provider ACK immutability, and private portal owner readback. Required + Backend/BRAIN + Portal + CodeQL, exact protected main, original Edge function source parity and native Netlify release are required. On next original normal content-loop, verify `handoffWriteback.applied` and exact original SQL `next_action` readback before technical fix is VALIDATED. Independent public provider IDs are separate; never claim all green on successful metadata handoff.
