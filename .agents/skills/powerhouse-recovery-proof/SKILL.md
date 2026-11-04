---
name: powerhouse-recovery-proof
description: Use for original Powerhouse/ONE BRAIN/Heartbeat automatic error, incident, experiment and recovery work. Separates triage, fix, deployment and verified customer/provider outcome in the existing exclusive owner and scheduler.
---

# Powerhouse original autonomous recovery proof — 4 November 2026

**Fingerprint:** `powerhouse|recovery-queue|triage-only-marked-succeeded|20261103-v1`. **Owner:** existing original Powerhouse recovery queue / ONE BRAIN reliability agent. **Parent:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Non-negotiable meaning of status

- `powerhouse_ops.recovery_queue.status = succeeded` for `cron_failure_review` means **TRIAGE COMPLETED**, **not** original job/provider outcome recovered. On 4 Nov source snapshot, 307 reviews succeeded, 306 have explicit `UNRESOLVED` evidence. No sweeping 307 green.
- `public.powerhouse_recovery_review_truth_v1()` is an **original service_role-only read-only aggregate source**. It is integrated into the existing original exclusive `public.powerhouse_recovery_control_plane_tick_v1()` result as `recovery_review_truth`, with `recovery_provider_resolution_proven=false`. Until the protected migration `20261104051200` and natural production readback succeed, treat these as **proposed** interfaces, not deployed.
- `ok=true` in original control-plane result means the watchdog/reconciliation **execution completed**, not provider side effects, real customer success, revenue, or resolved historical incidents.
- `provider_success_count=null` deliberately means **unobserved**, not zero successful provider effects; never calculate a success rate using triage counts as denominator.

## Original autonomous agent closed loop

1. On every already-scheduled run, independently read the active fingerprint, original cron/Edge/GitHub/Netlify source and exact provider obligations, **before** taking action. Keep the canonical writer lease and idempotency key; never spawn scheduler/agent/queue or bypass publisher authorization.
2. Determine root cause, severity, owner, uncertainty and safe action type. Keep unknown external effects **UNKNOWN** and do not replay them. Recover only side-effect-free work or actions with independent dedupe gate and allowed provider authorization.
3. Run an eligible low-risk hypothesis through the original guarded experiment path: baseline, predicted mechanism, one reversible change, control/comparator, guardrail and measured outcome. No ad hoc customer experiments without appropriate consent. Preserve anonymization and data minimization.
4. For a source fix, the **original exclusive owner** writes the smallest bounded change under the existing lease and protected PR. Required/BRAIN/CodeQL/native preview must succeed; merge only with main parity, original prod deploy and independent source-readback. Never silently lower thresholds.
5. Independently verify provider ID/URL if a side effect happened, original natural scheduler run, before/after KPI and customer outcome (lead, consent, qualified visit, paid order). Then persist hypothesis→evidence→result→learning in original Brain, original skill, original incident, human log and portal. CAS-close **only** the exact incident whose source + provider terminal result is proven.
6. On repeat failures, reopen the same fingerprint with new occurrence and regression prevention; classify recurring failure as root cause, not noise. Escalate only human-only boundaries (OAuth, Stripe secrets, external billing/cost) by validated **full HTTPS action URL**, brief actionable steps and outcome readback; let other authorized original agents keep working.

**Do not mark all Powerhouse green** from healthy cron, code merge, triage, content creation, or service status. Break down independent states: OBSERVED → RCA → FIXED_SOURCE → PROTECTED_RELEASED → NATIVE_LIVE → NATURAL_RUN_PROVEN → PROVIDER_OUTCOME_PROVEN → LEARNED → RESOLVED. Missing evidence blocks only the *unsupported claim*, not safe progress elsewhere.

**Regression / candidate:** `tests/brain-original-recovery-queue-triage-outcome-proof-20261104.test.mjs`. **Learning:** `brain/learning/2026-11-04-original-recovery-queue-triage-outcome-truth-v1.json`.
