# Powerhouse Self-Improvement Layer v1

Fingerprint: `powerhouse-self-improvement-layer-v1`

## Change

Powerhouse now has one explicit, evidence-gated Self-Improvement Layer above the existing Company Intelligence OS, autonomous-improvement runtime, Quality Autopilot and protected delivery.

The layer introduces measurable agent objectives, provider-neutral model routing, architecture-health evaluation, candidate promotion gates, Learning Compiler projection and a guarded daily improvement score.

## Root cause

The underlying capabilities already existed, but their cross-layer relationship was implicit. That made it possible for model, agent, prompt, policy or engineering improvements to be evaluated in separate local loops instead of one compound intelligence contract.

## Prevention

Every material improvement now follows:

`evidence → measurable objective → candidate → eval → regression/security/architecture gates → protected promotion → production readback → outcome → learning compilation`

No learning may become a production mutation directly. Unknown evidence remains non-green.

## Evidence

- `brain/self-improvement/self-improvement-layer.mjs`
- `brain/contracts/self-improvement-layer-v1.json`
- `tests/brain-self-improvement-layer-v1.test.mjs`
- `tests/powerhouse-daily-self-evolution.test.mjs`
- `supabase/migrations/20260928194500_powerhouse_self_improvement_layer_v1.sql`
- `platform/system-map/canonical-system-map.mjs`

## Runtime hardening

Production verification exposed one architectural inefficiency: the first daily self-improvement orchestrator synchronously invoked the heavier Company Intelligence cycle. That duplicated orchestration ownership and made the observer unnecessarily long-running.

The hardened runtime now reads the current canonical Company Intelligence projections and Self-Improvement control state. Company Intelligence and autonomous-improvement keep their own canonical schedulers. Regression: `tests/brain-self-improvement-runtime-nonblocking-v1.test.mjs`.

