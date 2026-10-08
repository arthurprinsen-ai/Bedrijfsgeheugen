# POWERHOUSE — CI self-tuning outcome and safe reversal · 8 October 2026

**Obligation:** `powerhouse-ci-tuning-outcome-feedback-20261008-v1`.

## Objective and existing authority
Extend `scripts/brain/autonomous-engineering-fabric-v3.mjs` and `scripts/brain/powerhouse-ci-intelligence.mjs`. Keep the existing daily scheduled optimizer, one canonical GitHub tuning config, protected PR merge, learning and release proof. No independent optimizer scheduler, parallel database, new AI-brain, new authority or direct production mutation.

## Root cause
Existing daily tuning could adjust concurrency and speculation from observed aggregate CI metrics but did not persist a versioned baseline and inspect real *subsequent* jobs for degradation. A pure 30-hour cooldown is a delay, not a measured learning loop.

## Implemented candidate
- Record the actual previous tuning knobs, sampled pre-change Required p95, failure rate and timestamp in the existing tuning config when a material adjustment is proposed.
- Derive measured post-change job, queue and Required-run metrics from GitHub run timestamps. Never count pre-change jobs as candidate outcome evidence.
- An active trial blocks optimistic follow-up tuning until enough real post-change evidence exists.
- After at least 30 hours, 20 observed jobs, 5 completed Required runs and 10 queue samples, classify as either observed regression or observed non-regression.
- A regression exceeding both the bounded absolute/relative p95 threshold or a meaningful failure-rate deterioration restores previous tuning knobs using the *same* protected PR channel. A healthy result closes the trial without immediate additional upward adjustments.
- Labels explicitly say **observational**, not causally proven improvement. Required, CodeQL, SHA identity, protected branch, existing publication readback and security gates remain unchanged.

## Verification and business meaning
The regression suite tests insufficient evidence, rollback, no-regression closure and baseline capture. CI outcome learning becomes meaningful only after the protected merge, subsequent scheduled runs and actual evidence. This is engineering self-improvement, not yet a proven effect on CRM, website conversions, CSRD compliance or orders.

**Status:** candidate pending CI, protected delivery and runtime readback. Future experiment-candidate writeback should reuse `public.powerhouse_optimization_candidate_v1` and canonical Brain rather than inventing another store; it is not implemented in this PR.
