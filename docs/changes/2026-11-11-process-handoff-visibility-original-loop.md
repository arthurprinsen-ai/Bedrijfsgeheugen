# 2026-11-11 — Process stage handoffs: original loop visibility

Parent issues: #4215 and #4198.
Fingerprint: `portal|process|missing-independent-stage-receipt-visibility|20261111-v1`.

## Reproduced functional gap
The original Portal V2 tasks / process view could show overall ONE BRAIN domain-state acknowledgment but had no per-stage inventory of outstanding original process intents. A user could record task completion or request approval without a comprehensible, owner-linked pending consumer status. There was no evidence of authorized approvals, actual provider actions or outcome/learning from the original process state.

## Bounded correction
In the **existing** `portal.deliveryPlan` model, `pendingProcessHandoffs` deterministically projects every customer-submitted step and approval request as still requiring independent proof. The existing view shows totals and per-process owner counts; it never takes a customer-controlled `evidence.verified` bit as independent proof. Existing state-write, domain-state flush, authoritative business input and Brain scope remain the single original writer. No parallel worker, register, scheduler, provider call, approval bypass, commercial offer or pricing change.

Original `agent-reliability`, `agent-data-quality`, and the Portal V2 skill now explicitly require reconciliation by tenant/source revision and original intent ID with independent downstream evidence before any stage or whole release is resolved.

## Verification
- `portal-v2/tests/process-portfolio.test.mjs`: multiple stages including approval, fake client evidence, immutable and deterministic pending inventory, visible counts.
- `tests/brain-process-original-stage-handoff-20261111.test.mjs`: no second writer or hidden sender; original agent/skill parity.
- Protected admission, Required/BRAIN, CodeQL, original portal E2E and exact-current-production readback are mandatory before LIVE for **this visibility repair**.

## Still not proven
This change does **not** dispatch approvals, implement server-side per-stage consumer ACK, claim provider execution, create independent outcome observations or apply Heartbeat learning. The 4-release initiative remains incomplete until original #4215/#4198 are independently accepted with two-tenant source→consumer→provider→effect→learning traces. Never turn unresolved historical obligations green merely because a UI counter renders.

Rollback: revert the protected merge; no database migration or scheduler change.
