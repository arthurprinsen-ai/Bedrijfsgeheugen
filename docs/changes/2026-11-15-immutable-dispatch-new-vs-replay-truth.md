# ONE BRAIN immutable dispatch: new work versus replay — 15 Nov 2026

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Verified source defect and limits
The original `tools/outcome-obligation-supabase-store.mjs` called POST with `Prefer: resolution=ignore-duplicates,return=minimal`, then GET and **always** returned `{created:true}` even when the immutable idempotency key already existed and PostgREST inserted no row. It also did not reject mismatched stored owner, trace, obligation or state for an existing key. This is a correctness defect in the dispatch acknowledgment, **not independent evidence that any external send was duplicated**.

Independent native source snapshot 2026-11-15: `AgentWork/PENDING=3313`; all have >=1 evidence row but only 70 have any accepted independent exact-production evidence of any type, not necessarily terminal completion. `RecoveryWork/RECOVERING=1055` have no evidence rows. 14 original innovation-intake operations remain PLANNED. No mass deletion/relabel/closure of old source records is justified.

## Existing sole owner bounded repair
Preserve original service-only REST store, append-only constraints, `ON CONFLICT DO NOTHING`, original job schedules and original agent roster. Request `Prefer: resolution=ignore-duplicates,return=representation`. Exactly one returned inserted row **with the submitted immutable key and type** is a newly created dispatch. Empty array is a duplicate replay and returns `created:false`; missing/ambiguous response is an error. Independently GET the persisted row and validate exact `idempotencyKey`, `type`, `obligationId`, `ownerAgent`, `traceId`, `state`; a collision fails closed and stays with original owner. Do not accept a new owner via same immutable key or overwrite source metadata.

The original Reliability and Data Quality agents gain explicit tasks, existing recovery skill adds operational contract, original executable tests cover create/replay/owner-conflict/missing-insert-proof/key-mismatch. The canonical original ONE BRAIN evidence table and actual consumer/provider readback still determine completion; `created` is not a terminal result or customer value.

## Release gates
Exact-head protected Required + CodeQL, generated System Map integrity, original protected merge, Netlify published production commit and original post-merge workflow evidence required. No new Supabase migration or branch, no additional worker or cron and no provider actions. A passing test proves the **store semantics**, not full closure of historical missing consumer receipts.
