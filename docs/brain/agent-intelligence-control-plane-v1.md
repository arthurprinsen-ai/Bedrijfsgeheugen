# Powerhouse Agent Intelligence — control-plane contract v1

Status: feature PR, not production-verified. Extends the existing admin-only
Powerhouse Control Center. No new scheduler, agent, database or failure register.

## Canonical authorities

- GitHub owns executable source, required CI, protected merge and commit lineage.
- Supabase owns obligations, canonical incident/failure fingerprints, experiments,
  forecast calibration, source observations, candidate decisions and outcomes.
- Notion owns the human-readable knowledge and agent update contract.
- Netlify provides deploy identity and functional provider readback, not proof of
  business impact.
- Brain / Powerhouse / Heartbeat retain their single existing control loop.

The first version reads the already authenticated administrator-only
Powerhouse observability projection. It charts sampled server-side events,
NOT the whole provider data lake. To claim complete provider coverage the
existing ingestion owners must add provider-specific freshness watermarks,
event ID, correlation ID, tenant scoping, auth/readback evidence and rate
limit accounting. Never expose server-side secrets or arbitrary tenant data.

## One improvement lineage shared by agents

1. Observe: source, timestamp, tenant scope, claim and evidence ID.
2. Deduplicate using canonical failure/candidate fingerprint. Consult old
   root causes, skills, regression guards and owner leases before any action.
3. Prioritize by independently measured impact, confidence, urgency, cost,
   reversibility and risk. Missing financial evidence remains unknown, not zero.
4. Pre-register experiment baseline, control/treatment, sample floor, primary
   metric, guardrails, horizon, fairness, privacy and rollback.
5. In existing owner lease: test low-risk reversible changes; ask for required
   approvals before permissions, payments, destructive migrations or high-risk
   customer actions. Never weaken CI or bypass OAuth/consent.
6. Require protected merge, exact commit/deploy identity, native Supabase
   preview where required, independent outcome measurement and readback.
7. Reject or roll back failing variants; record causes, counterexamples,
   prevention and regression tests in existing canonical storage.
8. Project independently verified learning to shared skills and Notion using
   existing authorized writeback. Apply lessons in the next agent decision.

## Quantitative models

Observed activity: unique dated events included in secured readback; retention
and sampling are declared. The count is not improvement.

First-time-right: verified completed obligations without retry divided by
eligible matured obligations. Open/censored cases are separate.

Recovery: median and P90 time to verified terminal outcome, cause-specific
recurrence and rollback frequency. Never claim zero because data is absent.

Improvement effect: causal treatment-minus-control lift when reliable
randomized assignment and matured results exist; otherwise descriptive trend.
Show sample sizes and uncertainty intervals.

Forecast intelligence: independently observed Brier score, calibration,
prediction drift, segmentation and model-version provenance.

Business value: separately confirmed incremental revenue/time saved minus
recorded costs. Unknown costs are never silently synthesized.

Source reliability: per-provider event coverage, auth status, ingestion
freshness, permission boundaries and schema/production identity parity.

Customer intelligence: tenant-scoped goal completion, correction rates,
confidence, adoption and measured verified outcomes. Cross-tenant leakage
is forbidden, and anonymous comparisons require privacy thresholds.

## Fail-closed acceptance

- No source-events: label NOT OBSERVED rather than broken or healthy.
- A memory is not production-proven without explicit PROVEN maturity,
  production verification AND an approved proof URL.
- A green workflow cannot substitute for production and customer outcome.
- No new scheduler, queue runner, second failure register or arbitrary green
  status setter.
- All UI text is escaped; untrusted evidence links require HTTPS allowlist.
- Existing protected checks, native preview, migration integrity and
  branch/writer ownership take priority. Current recovery PR #4733 is
  independent and must not be bypassed.
- Any release requires exact-head test/CodeQL/required gate, protected merge,
  Netlify exact-SHA deployment and authenticated browser readback.
- Customer-facing claims only follow independent outcome evidence.

## Source documentation

https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4733
https://supabase.com/docs/guides/database/postgres/row-level-security
https://docs.netlify.com/api-and-cli-guides/api-guides/get-started-with-api/
https://www.notion.com/help/create-integrations-with-the-notion-api
