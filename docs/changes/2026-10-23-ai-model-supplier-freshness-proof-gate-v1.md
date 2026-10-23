# AI model supplier freshness: seven-day proof gate

Date: 2026-10-23. Delivery lane: AI model advisor, canonical daily self-evolution.

## Observed production truth
The supplier table held 110 models: 83 historically VERIFIED, 26 PARTIAL and one CONFLICT. All 110 model verification dates were over seven days old. 'VERIFIED' is a historical classification, not a current supplier assertion. A later Supabase table update cannot change that.

## Change
- Canonical source age policy: seven days (was fourteen).
- Existing daily catalog audit reads the policy and evaluates both catalog `verified_at` and `verification_evidence.checked_on` instead of trusting DB write recency.
- Existing public advisor blocks stale supplier evidence from automatic recommendation.
- A regression checks that the audit, advisor and policy agree.
- Existing daily self-evolution workflow keeps the model-freshness job isolated from the agent-learning job. No second scheduler, store or agent is created.

## Rollout and truth boundaries
GitHub source branch and PR are *not* proof of production delivery. Required exact-head checks, repository gates, merge, deploy and live readback are mandatory. Keep any stale models research-only; record new supplier assertions only after authentic independently reviewable official evidence. Neither routine execution nor internal lifecycle completion proves revenue or entrepreneurial benefit.

## Test
`node --test tests/ai-model-intelligence-freshness-v1.test.mjs`

`node scripts/brain/ai-model-intelligence-audit.mjs`

The audit must return `REFRESH_REQUIRED` until official supplier receipts are actually updated.

## CI delivery correction
The initial PR admission rejected missing `Obligation-ID` and `Base-SHA` machine metadata, not the supplier-safety implementation. The immutable base SHA and canonical obligation were supplied in PR #4754; this documentation amendment starts a new exact-head PR check. Automatic delivery remains blocked if the new checks fail.
