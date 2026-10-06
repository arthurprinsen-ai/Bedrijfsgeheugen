# 2026-10-06 — CI provider gates inside Required v1

Evidence from the live audit showed that the remaining PR latency was dominated by provider/build work before lane startup and by unconditional workflow fan-out.

This change removes the full deploy-preview build from serial preflight and wires Supabase exact-head provider applicability into the canonical Required test as a conditional reusable gate.

Rollout is two-phase by design: keep the old standalone Supabase status until this integration is merged, then change branch protection, then remove the redundant pull_request trigger.
