# Autonomous Improvement Runtime v1 — Completion Specification

Date: 2026-09-16
Fingerprint: `powerhouse-autonomous-improvement-runtime-v1`
Status target: `LIVE & BEWEZEN`

## Purpose

Complete the existing Autonomous Improvement Runtime v1 without creating a parallel v2 or any new persistent Brain, CRM, queue, scheduler, analytics store, learning system or Make dependency.

Canonical authority remains existing Supabase/Brain. Existing Agent Fabric, BRAIN-DELIVERY-v2/BG169, Quality Intelligence, Brain outcome/learning records and the existing `42 * * * *` pg_cron job are reused.

## Closed loop

`SIGNAL → OBLIGATION → PLAN → REPLAY → EXPERIMENT → EXECUTE → VERIFY → PROMOTE/ROLLBACK → PROD_VERIFY → VALUE_VERIFY → LEARN → REPRIORITIZE`

A blocker is a resumable substate of the same obligation. It is never a successful terminal state.

## Lifecycle

`OBSERVED → EXPERIMENTING → PROVEN → PROMOTED → PROD_VERIFIED → VALUE_VERIFIED → LEARNED`

Transitions are sequential and evidence-gated. Promotion requires explicit metric, minimum valid observations, correctness/security/tenant-isolation guardrails and rollback readiness.

## Components

### Improvement Obligation Engine

Material candidates map idempotently to existing `brain_obligations`. Evidence records hypothesis, executor, baseline, metric/target, guardrails, rollback, budget, expected outcome and provenance. Existing obligation identity is retained across external blockers and retries.

### Experiment & Replay Engine

Existing historical Brain events are used for counterfactual replay. Champion/challenger promotion is allowed only for reversible low-risk policies. The first production proving candidate is replay-window efficiency over `brain_failure_occurrences`: a shorter window may be promoted only if minimum sample and all material failure fingerprints are preserved.

### Safe Chaos & Recovery

The following scenarios are injected only inside isolated synthetic function context: Supabase unavailable, provider 429, schema mismatch, stale knowledge, agent timeout and partial writeback. Production customer state is never destructively faulted. Recovery proof requires recovered + idempotent + consistent + isolated evidence.

### Capability Inventory & Simplifier

The existing scheduled Quality Intelligence run scans the live repository/runtime surfaces daily across Brain scripts, Supabase migrations, agents, workflows, tests, Brain docs, assurance, API contracts, Netlify functions, portal and site surfaces. It emits overlap/gap/simplification candidates. Auto-delete is forbidden; dependency/use proof, replay, regression tests and rollback are mandatory before removal.

### Causal Value Lineage

Every promoted change can record `change → exposure → outcome → realized value → attribution/confidence`. Observed operational deltas are labelled as such. Revenue requires explicit observed revenue outcomes. Causal claims require randomized/holdout or explicitly justified quasi-experimental identification evidence; otherwise attribution remains correlation/operational measurement.

### Daily Technology Discovery

The existing Quality Intelligence scheduler observes primary sources for browser/frontend testing, accessibility, performance, security, property/API/integration/mutation testing, OpenAI API/model changes, Supabase, PostgreSQL, GitHub, Netlify and Node. Candidates survive only when they match active inventory domains. Discovery never auto-adopts; benchmark, replay and challenger proof remain mandatory.

### Meta-learning

Learning records capture hypothesis class, executor, sample, outcome, cost, duration/value evidence and scheduler proof. Reusable policy functions calculate priority/sample/test-depth adjustments from prior outcomes without creating a second learning authority.

### Scheduler Proof

Manual/function calls cannot satisfy scheduler proof. A natural cycle is proven only from the existing pg_cron job name, its concrete `cron.job_run_details.runid`, and a start minute of `:42`. The existing job command is upgraded to a wrapper that runs the old v1 cycle and the completion executor.

### Executive Control Surface

`powerhouse_autonomous_improvement_control_v1` is a security-invoker projection on existing `brain_obligations`. It exposes lifecycle, blocker, replay, chaos, promotion, value, learning record, scheduler proof, change id and version. It is not a datastore and browser roles have no direct access.

### Autonomy Boundaries

Low-risk reversible internal policy changes may be autonomous. External communication, customer-data mutation, privileges/secrets, destructive schema changes, large spend and missing rollback remain fail-closed.

## Acceptance

The broader runtime is `LIVE & BEWEZEN` only after a naturally started `:42` pg_cron cycle produces end-to-end production evidence for one real candidate through obligation, replay/experiment, controlled promote-or-rollback, production readback, value linkage and learning writeback.

Code on main, a green unit test, manual SQL execution, proposal packets or observability alone do not satisfy acceptance.

## Security and authority invariants

- `new_persistent_authority=false`.
- No Make dependency.
- Existing Supabase/Brain remains persistence/lifecycle authority.
- Existing pg_cron job remains scheduling authority.
- Internal SECURITY DEFINER functions are revoked from public/anon/authenticated and service-role-only.
- Internal view uses `security_invoker=true` and revokes browser roles.
- No invented revenue or causal claims.
- No blind auto-delete or latest-version chasing.
