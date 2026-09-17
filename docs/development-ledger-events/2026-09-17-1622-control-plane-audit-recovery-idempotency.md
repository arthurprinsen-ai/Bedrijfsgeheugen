# 2026-09-17 16:22 CEST — AUDIT + LEARNING — Control Plane Recovery & Idempotency

- **Fingerprint:** `powerhouse-control-plane-audit-2026-09-17-v1`
- **Context:** the Powerhouse agent/chat reliability audit tested whether resilience and completion behaviour are actually enforced in the production control plane rather than only described in prompts or documentation.
- **Verified production state:** the canonical Supabase runtime is active and contains the shared operations, obligations, delivery evidence, reconciliation and runtime-event layers used by the control plane.
- **Completion enforcement:** `powerhouse_enforce_completion` exists in production and prevents an execution contract from remaining nominally complete when required completion conditions are not green; degraded state is enforced at database/runtime level rather than entrusted to agent wording.
- **Execution resilience:** production contains `powerhouse_execution_heartbeat_v1`, `powerhouse_mark_execution_interrupted_v1` and `powerhouse_execution_resilience_watchdog_v1`; the watchdog is scheduled through `pg_cron` every minute.
- **End-to-end recovery proof:** reconciliation job `0b2ae9b0-e315-4a95-8de3-dbbfe8f86790` (`execution-resilience:fe02a49c-f57c-48cf-ad75-6dc313f99096:v3`) moved from a previously observed `PENDING` recovery state to `RESOLVED` with `attempt_count=1`; its linked `powerhouse-execution-resilience-selftest` operation reached `VERIFIED`. Follow-up readback at 2026-09-17 16:23 CEST showed `0 PENDING`, `0 active`, `0 failed`, `0 dead` reconciliation jobs.
- **Core idempotency proof:** `brain_operations` has unique index `brain_operations_logical_key_unique` on `(capability_id, operation_type, idempotency_key)` and `brain_reconciliation_jobs` has unique index/constraint `brain_reconciliation_jobs_job_key_key` on `job_key`. Logical operation/recovery duplication is therefore database-enforced on these core lanes.
- **Do not rebuild:** heartbeat, interruption detection, minute watchdog, core reconciliation recovery and core idempotency are considered proven control-plane capabilities. Future agents must reuse these canonical mechanisms and must not introduce parallel recovery queues, duplicate idempotency stores or prompt-only substitutes.

## Closure — universal agent/chat control-plane binding

- **Obligation:** `universal-agent-chat-control-plane-binding-proof-v1`.
- **Root cause found:** `service_role` retained direct `INSERT` privilege on `brain_operations`, while `brain_create_operation` was invoker-security. A caller could therefore bypass the canonical operation-admission path and create shadow/unbound operation state.
- **Production repair:** added append-only/server-only `brain_control_plane_bindings`; backfilled every existing `brain_operations` row; added a fail-closed `BEFORE INSERT` admission trigger; converted `brain_create_operation` to the single `SECURITY DEFINER` admission RPC; revoked direct service-role insert; required a binding before operation transitions.
- **Backward compatibility:** existing operations are preserved and marked as legacy/backfilled bindings. Existing create-RPC signature remains unchanged.
- **Production bypass proof:** `powerhouse_control_plane_binding_selftest_v1()` attempted a direct insert and received exact error `CONTROL_PLANE_ADMISSION_REQUIRED`; the same self-test created a canonical `agent:binding-selftest` operation through `brain_create_operation`, producing binding `f06f486b-279a-4283-a70f-302edb9eea21` for operation `16f4186d-2744-4ce4-a240-9f1a5049b930`, session `chat-binding-selftest`, admitted via `brain_create_operation_v2`.
- **Coverage readback:** after the production test, `brain_operations` contained 9 rows and `brain_control_plane_bindings` covered 9/9; unbound count = 0.
- **Privilege readback:** `service_role` ACL on both `brain_operations` and `brain_control_plane_bindings` is read-only (`r`); no direct insert/update/delete remains.
- **Self-declared completion rule:** an agent/chat statement cannot create or mutate canonical operation status outside the control plane because operation admission is fail-closed and transitions require an existing canonical binding. Existing completion enforcement remains unchanged and authoritative.
- **Learning from repair:** the first self-test exposed a schema-qualified extension bug (`digest()` not on `public,pg_catalog` search path). The canonical create RPC now uses `extensions.digest(...)`; the full bypass proof subsequently passed.
- **Prevention rule:** never restore direct service-role write access to `brain_operations` or `brain_control_plane_bindings`; all new operation ingress must reuse `brain_create_operation` and its binding contract. Do not create a parallel session/job/completion store.
- **Status:** runtime obligation is eligible for `FULFILLED` once repository parity is merged and read back from `main`.
- **Owner:** Powerhouse Control Plane / Knowledge & Governance / Agent Runtime.
