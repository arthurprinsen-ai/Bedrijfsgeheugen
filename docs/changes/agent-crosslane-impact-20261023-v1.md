# Automatic cross-lane agent impact — 23 October 2026

Canonical owner [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661). This modifies the **existing** Powerhouse predictor, not the scheduler or incident registry.

## Change
The pure `classifyDeliveryImpact(changedPaths)` function returns ordered impacted lanes and shared contract edges, with a full preflight fallback for unknown paths. `planConcurrentAgentWork` now exposes this information in both build and hold states. Domain edges: CMS→website, shared Brain contracts→Portal/Powerhouse/Heartbeat and Supabase migrations→Brain/Portal/Heartbeat.

These are **early advisory preflight hints only**. Hygiene, Required, CodeQL, provider preview, security, tenant isolation, real CLS, financial parity and exact production readback remain mandatory and unchanged. No duplicated writer, no extra CI scheduler, no false-green or blanket bypass. Actual throughput p50/p95 improvement is not claimed until repeated comparable production evidence is measured.

## Verification
Regression: `tests/delivery-powerhouse-supervisor.test.mjs`. Exact-head protected workflow checks, merge, current-main source readback and existing Brain skill projection must succeed. Wider queue-throughput and #4655 provider ghost issue remain open.
