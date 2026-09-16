# Autonomous Improvement Runtime v1 — Design

Fingerprint: `powerhouse-autonomous-improvement-runtime-v1`
Parent: `powerhouse-continuous-improvement-engine-v1`

## Goal
Run the existing Powerhouse improvement contract autonomously and periodically as one closed-loop runtime: observe -> diagnose -> experiment -> evidence -> promote/rollback -> learn, without adding a parallel brain, queue, scheduler authority, analytics truth, learning store, capability registry, experiment database, or architecture registry.

## Authorities
- GitHub remains source/review/protected release authority.
- Supabase/Brain remains runtime state, evidence, experiment, outcome and learning authority.
- Existing Supabase `pg_cron` remains the production scheduler authority.
- `public.brain_append_record` -> existing `public.brain_records` remains the canonical improvement writeback route.
- `Business OS Intelligence` remains the GitHub-side read-only contract/probe surface; it is not a production writer.
- Notion remains human-readable projection only.
- `BRAIN-DELIVERY-v2` remains release authority.
- `powerhouse-continuous-improvement-engine-v1` remains candidate/evaluation authority.
- Existing Engineering OS, Quality Intelligence, outcome, calibration and learning contracts remain canonical.

## Runtime lifecycle
`OBSERVE -> FITNESS -> CAPABILITY_MAP -> CANDIDATE -> PORTFOLIO -> REPLAY -> EXPERIMENT -> CHAOS -> DECIDE -> PROMOTE_OR_ROLLBACK -> SIMPLIFY -> VALUE_ATTRIBUTE -> WRITEBACK -> REVALIDATE`

## Capabilities
1. Scheduler/orchestrator: existing Supabase `pg_cron` invokes one deterministic production cycle hourly at minute 42. Identity is hourly/idempotent; work is bounded; missing critical evidence fails closed.
2. Architecture fitness: per-dimension current/baseline/delta/trend for reliability, security, performance, cognitive load, reuse, cost and lead time. No aggregate magic score decides promotion.
3. Capability graph: projection over existing component/agent/tool/test/evidence metadata. It is not a new source of truth and exposes overlap/gaps.
4. Experiment portfolio: champion/challenger ranking is metric-specific and evidence-gated. Promotion requires predeclared metrics, minimum observations, guardrails and rollback identity.
5. Causal learning: default is observational attribution only. Causal claims require explicit causal identification metadata and contamination checks.
6. Digital twin/replay: bounded replay of historical Powerhouse events against candidate decision functions before risk-bearing promotion.
7. Failure injection: safe simulated provider/schema/rate-limit/staleness/timeout/writeback failures. Never destructively mutate production state.
8. Automatic simplification: identify dead/duplicate/overlapping capabilities, helpers, rules, docs and dependencies; destructive removal is proposal-only until protected evidence proves safety.
9. Business-value feedback: priority consumes observed realized outcomes with freshness/confidence and never fabricates unknown value.

## Production cycle
`public.powerhouse_autonomous_improvement_cycle_v1(now())` reads only existing canonical signals:
- `brain_failure_occurrences`
- `brain_blocker_occurrences`
- `brain_runtime_metrics`
- `brain_cost_by_operation`
- `brain_value_evaluations`
- `growth_outcomes`

The cycle writes one hourly deterministic `autonomous_improvement_cycle` record for tenant `canonical` via `public.brain_append_record`. Re-running within the same hour updates the same `(tenant_id, record_id)` instead of creating a duplicate. No new table/store is introduced.

## Decision rules
- Security/correctness/tenant isolation are hard non-degradation gates.
- Unknown critical evidence fails closed.
- No single aggregate score is release authority.
- Champion/challenger decisions are per declared metric and guardrail set.
- Replay and chaos evidence can block promotion but cannot by themselves prove business impact.
- Business-value priority uses observed outcome evidence; unknown stays unknown.
- Simplification may auto-suggest and auto-test, but destructive deletion remains behind existing protected delivery and hard-boundary rules.
- Every side effect requires exact candidate/run identity, idempotency key, trace/run identity, budget, rollback/fallback and existing canonical writer route.

## Security
The production function is `SECURITY DEFINER` only because it spans protected canonical evidence tables and writer RPCs. It has a deterministic `search_path`, explicitly revokes EXECUTE from `public`, `anon` and `authenticated`, and grants EXECUTE only to `service_role`. The existing Supabase security contract must remain green before merge/migration.

## GitHub probe
`.github/workflows/business-os-intelligence.yml` executes the pure runtime and contracts with `contents: read`. It receives no Supabase service-role secret and performs no production writeback. Its purpose is release-time drift detection, not scheduling authority.

## Success criteria
- Runtime/config/probe contracts green on exact PR head.
- Supabase security contract and migration preview green on exact PR head.
- Protected merge and exact-main SHA readback.
- Migration applied through the canonical Supabase migration path.
- Active `pg_cron` job `powerhouse-autonomous-improvement-cycle-v1` present at `42 * * * *`.
- Manual live cycle proves observed signal read + canonical `brain_records` writeback.
- Second invocation in the same hour proves idempotency by retaining one deterministic record identity.
- Only after those proofs may status become `LIVE & BEWEZEN`.
