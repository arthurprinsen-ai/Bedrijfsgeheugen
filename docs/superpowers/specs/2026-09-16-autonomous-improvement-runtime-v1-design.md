# Autonomous Improvement Runtime v1 — Design

Fingerprint: `powerhouse-autonomous-improvement-runtime-v1`
Parent: `powerhouse-continuous-improvement-engine-v1`

## Goal
Run the existing Powerhouse improvement contract autonomously and periodically as one closed-loop runtime: observe -> diagnose -> experiment -> evidence -> promote/rollback -> learn, without adding a parallel brain, queue, scheduler authority, analytics truth, learning store, capability registry, experiment database, or architecture registry.

## Authorities
- GitHub remains source/review/protected release authority.
- Supabase/Brain remains runtime state, evidence, experiment, outcome and learning authority.
- Notion remains human-readable projection only.
- `BRAIN-DELIVERY-v2` remains release authority.
- `powerhouse-continuous-improvement-engine-v1` remains candidate/evaluation authority.
- Existing Engineering OS, Quality Intelligence, outcome, calibration and learning contracts remain canonical.

## Runtime lifecycle
`OBSERVE -> FITNESS -> CAPABILITY_MAP -> CANDIDATE -> PORTFOLIO -> REPLAY -> EXPERIMENT -> CHAOS -> DECIDE -> PROMOTE_OR_ROLLBACK -> SIMPLIFY -> VALUE_ATTRIBUTE -> WRITEBACK -> REVALIDATE`

## Capabilities
1. Scheduler/orchestrator: deterministic periodic run over existing signals; idempotent run identity; bounded work; fail-closed on missing critical evidence.
2. Architecture fitness: per-dimension current/baseline/delta/trend for reliability, security, performance, cognitive load, reuse, cost, lead time and the Engineering OS architecture dimensions. No aggregate magic score decides promotion.
3. Capability graph: in-memory/materialized projection built from existing component/agent/tool/test/evidence metadata. It is not a new source of truth. It must expose overlap and gaps.
4. Experiment portfolio: champion/challenger ranking is metric-specific and evidence-gated. Promotion requires predeclared metrics, minimum observations, guardrails and rollback identity.
5. Causal learning: default is observational attribution only. Causal claims require explicit causal identification metadata (randomized/holdout/quasi-experimental design with assumptions and contamination checks).
6. Digital twin/replay: bounded replay of historical Powerhouse events against candidate decision functions before risk-bearing promotion.
7. Failure injection: safe simulated provider/schema/rate-limit/staleness/timeout/writeback failures. Never mutate production state destructively; simulations are isolated and require explicit blast-radius metadata.
8. Automatic simplification: identify dead/duplicate/overlapping capabilities, helpers, rules, docs and dependencies; destructive removal is proposal-only until protected tests/readback prove safety.
9. Business-value feedback: improvement priority consumes observed realized outcomes (revenue, conversion, time, error, cost, retention) with freshness/confidence and never fabricates unknown value.

## Decision rules
- Security/correctness/tenant isolation are hard non-degradation gates.
- Unknown critical evidence fails closed.
- No single aggregate score is release authority.
- Champion/challenger decisions are per declared metric and guardrail set.
- Replay and chaos evidence can block promotion but cannot by themselves prove business impact.
- Business-value priority uses observed outcome evidence; unknown stays unknown.
- Simplification may auto-suggest and auto-test, but destructive deletion remains behind existing protected delivery and hard-boundary rules.
- Every side effect requires exact candidate identity, idempotency key, trace/run identity, budget, rollback/fallback and existing canonical writer route.

## Runtime output packet
The runtime emits one deterministic packet for writeback through existing authorities:
- `fingerprint`, `run_id`, `observed_at`, `source_sha`
- `fitness`
- `capability_graph`
- `candidates`
- `portfolio_decisions`
- `replay_results`
- `chaos_results`
- `simplification_candidates`
- `value_feedback`
- `promotion_holds`
- `learning_events`

The packet is evidence, not a new durable authority. Persistence uses existing Brain/Supabase routes only.

## Scheduler integration
Do not introduce a separate scheduler family. Reuse the existing `Business OS Intelligence` workflow as the GitHub-side periodic execution surface and existing Supabase/Brain scheduled functions where persistence is required. The workflow may run the pure runtime in read/evaluate mode without secrets; writeback requires the existing canonical Brain/Supabase writer path and must fail closed when credentials/route are unavailable.

## Success criteria
- Deterministic runtime packet from the same ordered evidence.
- Fitness regression detection including material percentage change.
- Capability overlap/gap detection without persistent registry.
- Champion/challenger requires minimum observations and hard guardrails.
- Causality never inferred from correlation alone.
- Historical replay returns counterfactual decision deltas without claiming factual outcomes that were not observed.
- Safe chaos scenarios prove expected recovery classification.
- Simplification identifies duplicates/dead elements without destructive auto-delete.
- Business-value evidence can reorder improvement priority only when observed/fresh/confident enough.
- Required CI executes the runtime contract tests.
- Protected merge plus post-merge exact-SHA readback required before LIVE & BEWEZEN.
