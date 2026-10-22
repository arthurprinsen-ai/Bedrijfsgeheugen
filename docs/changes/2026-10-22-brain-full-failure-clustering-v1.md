# Unified BRAIN: full failure coverage with one canonical repair owner

Fingerprint: `delivery|brain|first-failure-only-learning-blindspot|20261022-v1`
Date: 2026-10-22

## Observed gap
Independent [Unified BRAIN run 39791707071](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071) had 3,526 tests, 3,171 pass and **355 failures**. The existing failure handler captured just the FIRST `not ok` paragraph for its canonical learning event. This makes complete root-cause clustering difficult and fosters repeated triage.

## Source-safe improvement
One new pure parser takes the entire existing TAP log; records all test failures and their deterministic fingerprints; groups probable errors as SQL-source missing, workflow-source missing, other missing files, assertion mismatch or unknown. Each category is a **hypothesis**, never a proved root cause or a successful repair. It compares extraction to the TAP `# fail` summary and flags mismatch/incomplete coverage. Titles are bounded and secrets redacted. Source's original tests, first-failure learning event, gate and abort behavior remain unchanged. A machine-readable artifact is written to the SAME existing failed-lane upload, not a new queue, cron, event store, brain register or agent.

## Safe closure
- Exact-head regression/Required + CodeQL before protected merge.
- Read the next real failed lane's cluster artifact, including exact number of failures and redaction; only then claim runtime diagnostic proof.
- For each component fingerprint reuse `public.brain_failure_registry` and existing owner PRs (#4605/#4608/#4617/#4618/#4620/#4627/#4629/#4631/#4662 etc). Do not write their branches or merge historical SQL into executable migrations.
- Full independent BRAIN=0, #3742 clean-room parity and #4215 authenticated tenant evidence remain distinct non-bypassable gates.

No additional provider calls or scheduler; no claim of 355 repaired.
