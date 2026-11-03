# Universal agent incident reporting and self-repair assurance — 2026-11-03

**Parent:** [#4918](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4918), related [#4681](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4681), [#5333](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5333), [#5332](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5332). **Owner:** existing ONE BRAIN–Powerhouse–Heartbeat governance owner.

## Observed systemic gap

The prior mandatory `chat-learning-preflight` enforced skill markers and incident policy configuration but could return `READY` without independently reading any provider failures or the canonical Brain occurrence registry. This is not sufficient evidence that incidents were detected, reported, fixed or prevented. Never infer zero incidents from no source telemetry.

## Implementation in original authority

- Pure `brain/observability/incident-obligation-assurance.mjs` matches native provider-event ID and root-cause fingerprint against exactly one `brain_observe_failure` receipt with independent registry readback and payload hash. Duplicate provider events never inflate incident counts; contradictory hashes remain an open conflict.
- The original `scripts/brain/chat-learning-preflight.mjs` now exposes `incident_self_fix.reporting_audit` with independently observable states: `UNREPORTED_FAILURE_DETECTED`, `SAFE_RECOVERY_REQUIRED`, `RECOVERY_NOT_PROVEN`, `INCIDENT_IDENTITY_CONFLICT`, `SOURCE_COVERAGE_UNVERIFIED`.
- A repair is not PROVEN until original owner, obligation identity, actual fix, versioned skill, protected release SHA, regression and independent provider readback are all present. A later same-fingerprint failure reopens the incident.
- Original policy/AGENTS/continuity skill make failure of incident reporting itself a separately assigned same-writer obligation; consent, production migrations, privileges, external communication and other restricted actions are escalated rather than bypassed.

## Hard limit and rollout

This PR provides a reusable executable assurance contract **for evidence supplied to the original preflight**, not a complete ingestion/repair adapter for every Edge Function and external provider. The 59-edge-function inventory remains the separate existing PR #5112; that incomplete original branch was not altered. Each actual agent must feed independently read source events and ONE BRAIN receipts into the original preflight or authorized runtime and prove provider-side natural recurrence check. Until then `SOURCE_COVERAGE_UNVERIFIED` and no global green. There is no extra scheduler, queue, provider connector, database table or writer.

**Tests:** `node --test tests/brain-incident-register-self-fix-preflight-20261029.test.mjs` historical replay, shadow and canary. **Acceptance:** exact-head Required/CodeQL/full BRAIN, protected merge, native agent/provider source and original registry readback, authenticated portal projection and natural-run proof. No absolute guarantee that software never fails.
