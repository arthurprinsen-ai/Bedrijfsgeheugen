# 2026-09-17 — CONTRACT_CHANGE / RECOVERY — universal agent/chat control-plane binding

- **Fingerprint / contract:** `universal-agent-chat-control-plane-binding-proof-v1`
- **Owner:** Powerhouse Control Plane / Agent Runtime + Knowledge/Governance
- **Canonical production project:** `adhjwmvyoixzjtmiroln`
- **Repository change:** PR #1949, candidate/head `92a6821e391f02adbaedb10f2920e370d276587c`, merged as `a3dcaa54f528313f0fbbbccdbc8e9f76f5959382`.
- **Production migration:** `supabase/migrations/20260917170556_universal_control_plane_binding_v1.sql`.
- **Canonical obligation:** `a16f9f1d-02ee-4f9d-8977-e9709473b57a`, transitioned through the canonical obligation transition path to `FULFILLED` with `runtime_status=LIVE_AND_PROVEN`.

## Signal / problem

The Powerhouse completion and obligation machinery existed, but privileged callers could still write directly to `public.brain_operations`. That meant an operation could theoretically be created outside the canonical admission path and therefore escape universal agent/chat control-plane binding. Application-level convention was being treated as if it were a database-enforced invariant.

## Impact

Without database-level admission enforcement, an agent/chat could appear to participate in the shared control plane while its operation lineage was not guaranteed to have a matching durable binding. That weakens `NO LOST OBLIGATION`, recovery, completion supervision, evidence lineage and the one-team/one-memory contract.

## Root cause

`service_role` retained direct DML capability on the operation truth tables while canonical admission was not the only database-authorized creation path. The design relied too heavily on callers behaving correctly. A privileged execution path is not governed merely because the intended RPC exists; the database must make bypass impossible or fail closed.

## Final fix

Migration `20260917170556_universal_control_plane_binding_v1.sql` makes the admission boundary explicit and database-enforced:

1. `public.brain_control_plane_bindings` is the durable binding lineage for `brain_operations`.
2. Existing operations were grandfathered/backfilled so migration does not orphan historical work.
3. New admission uses canonical RPC `brain_create_operation_v2`.
4. Direct `service_role` `INSERT/UPDATE/DELETE` privileges on `brain_operations` and `brain_control_plane_bindings` are revoked.
5. Transition/recovery paths reject operations that do not have the required binding.
6. `public.powerhouse_control_plane_binding_selftest_v1()` proves both sides of the invariant: direct bypass fails closed while canonical admission succeeds and creates its binding.

## Production evidence

Production readback after merge showed:

- `brain_operations`: **10**
- `brain_control_plane_bindings`: **10**
- unbound operations: **0**
- `service_role` direct `INSERT/UPDATE/DELETE` on `brain_operations`: **false / false / false**
- `service_role` direct `INSERT/UPDATE/DELETE` on `brain_control_plane_bindings`: **false / false / false**
- direct bypass attempt: rejected with `CONTROL_PLANE_ADMISSION_REQUIRED`
- canonical admission: `brain_create_operation_v2`
- production selftest: succeeded after protected merge/main readback

The original obligation was closed with the exact repository candidate SHA, merge SHA, production counts, privilege readback, fail-closed error and canonical admission evidence rather than with a code-only claim.

## Migration/test-harness learning

The first verification exposed a `digest()` resolution problem under the migration/selftest search path: the function was not available on `public,pg_catalog`. The correction used the actual extension-schema function. This was a migration/test-harness/search-path defect, not evidence that the intended control-plane security invariant was wrong.

**Reusable distinction:** diagnose product/runtime failures separately from test-harness, search-path and test-oracle failures. Never weaken the product invariant merely to make a harness green; correct the harness or invocation when production semantics are sound.

## Known failed approach

- Rely on application convention or documentation that callers “must” use the canonical RPC while privileged direct table DML remains possible.
- Treat existence of `brain_create_operation`/`brain_create_operation_v2` as proof that all callers are bound to it.
- Declare the change complete after migration/merge without testing a real bypass attempt and reading privileges/binding coverage back from production.
- Interpret a harness/search-path error as justification to relax the admission invariant.

## Permanent prevention rule

**Fingerprint:** `control-plane|admission|privileged-direct-write-bypass`

For every current or future privileged Powerhouse operation/admission path:

1. enforce the invariant at the database/authority boundary, not only in caller code;
2. audit effective direct DML privileges for privileged roles;
3. require a negative bypass test that attempts the forbidden direct mutation and proves fail-closed behavior;
4. require a positive canonical-path test that proves the intended operation and its binding/lineage are created together;
5. backfill/grandfather historical rows explicitly during migrations and verify `unbound=0` afterwards;
6. bind repository candidate identity, merge identity, runtime readback and obligation evidence before `LIVE & BEWEZEN`;
7. keep test-harness/search-path defects distinct from product defects and repair the correct layer;
8. write the resulting learning back before the material operation is considered closed.

## Regression/readback gate

A future change to operation admission, privileged grants, recovery/transition functions, operation tables or binding tables is not production-ready unless it can re-prove all of the following:

- canonical selftest passes;
- forbidden direct write is rejected;
- privileged role direct-write audit remains denied unless an explicitly reviewed replacement authority exists;
- every governed operation has exactly the required canonical binding (`unbound=0`);
- transition/recovery rejects unbound lineage;
- canonical obligation/evidence lineage references the exact deployed candidate.

## Rollback / last-known-good

Do not “rollback” by restoring privileged direct writes. If a later admission change regresses, retain the fail-closed privilege boundary and the last proven canonical admission path while repairing the candidate. Data compatibility should be handled by forward-safe migration/backfill, not by reopening the bypass.

## Reusable lesson

A control plane is only universal when bypass is technically impossible at its authority boundary. Canonical APIs are necessary but insufficient while privileged direct writes remain available. Prove governance with both negative evidence (the forbidden path is rejected) and positive evidence (the canonical path creates complete bound lineage), then close the same durable obligation with exact production evidence.