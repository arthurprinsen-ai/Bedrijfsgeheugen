# Powerhouse Engineering OS — Closed Loop v1

Fingerprint: `powerhouse-engineering-closed-loop-v1`

This is not a new engineering authority. It is an executable measurement and learning capability inside the current `powerhouse-engineering-os-v1`, subordinate to the newer `powerhouse-continuous-improvement-engine-v1` and `BRAIN-DELIVERY-v2`.

## Goal

Shorten Idea/Fix → LIVE & BEWEZEN without trading away correctness, security, recoverability, maintainability or evidence quality.

## Capabilities

1. Engineering scorecard: DORA throughput/instability signals plus Powerhouse lead time, test flake rate, escaped defects, gate latency and evidence completeness. Missing evidence remains `unknown`, never synthetic zero.
2. Flaky-test intelligence: pass/fail oscillation is diagnostic only; it never turns a required failure green and rerun-until-green is prohibited.
3. Dependency graph: deterministic nodes/edges and reverse blast-radius traversal across code, tests, workflows and runtime dependencies.
4. Recovery proof: stale, failed or missing bounded-rehearsal evidence fails closed.
5. Golden-path scaffolds: deterministic frontend/backend/migration/agent/integration scaffolds that remain in registered delivery lanes.
6. Meta-learning: produces evidence-backed recommendations but cannot mutate release gates or production authority directly.

## Integration after #1744 reconciliation

The stale #1744 branch was more than 200 commits behind current main and contained an older `continuous_improvement` configuration that must not overwrite the newer canonical Engineering OS. The unique executable delta is therefore reconciled onto current main as the closed-loop runtime, regression test, scheduled/PR evidence workflow and this human-readable documentation. The current `config/powerhouse-engineering-os.json` remains canonical and unchanged.

The regression explicitly proves compatibility with the current `powerhouse-continuous-improvement-engine-v1`, disaster-recovery proof controls and multidimensional autonomy scorecard. The learning workflow runs the regression on relevant pull requests and on the daily schedule before collecting evidence and producing artifacts.

## Safety

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No new brain, queue, registry, analytics store or release authority.
- GitHub remains source/review/protected-delivery authority.
- Supabase remains runtime/data/learning authority.
- Notion remains human-readable projection.
- Meta-learning recommendations require the normal protected delivery path.

## Definition of Done

Complete only when the reconciled candidate tests are green, protected merge is complete, exact main is read back, #1744 is closed as superseded, and canonical Supabase + Notion writeback records the resulting source revision and evidence.
