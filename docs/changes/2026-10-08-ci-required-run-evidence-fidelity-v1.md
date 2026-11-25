# CI intelligence: Required run discovery and seven-day coverage truth
**Obligation-ID:** powerhouse-ci-required-run-evidence-fidelity-20261008-v1

## Root cause observed on live GitHub
The Required workflow sets a descriptive run name, e.g. `Required test PR #4174 997cf...`; the existing CI collector required an exact `run.name === 'Required test'`. This omitted actual Required runs from the sample and hid the gate latency. With new minimum-evidence checks it could indefinitely prevent autonomous tuning, despite healthy CI.

Separately, bounded pagination fetches at most 300 recent runs and measures jobs of at most 60; at high volume the observed period can be much shorter than seven days, even though some fields have legacy `_7d` names. Counts from an incomplete period are lower bounds, not seven-day totals.

## Correction
Extend existing `ci-calibration-engine.mjs` with pure, tested helpers: recognize canonical Required PR run names, preferentially reserve 12 of 60 sampled workflow runs for Required, and expose whether the requested seven-day window was actually covered. The existing CI collector uses these helpers, preserves existing API/page/concurrency budgets, and publishes observation coverage in JSON + GitHub step summary. No second scheduler or collector.

## Verification contract
The regression replays the real Required PR naming pattern and an API history in which the first 75 runs are unrelated. It checks incomplete/complete windows and asserts that the collector no longer uses exact-only detection. Do not infer runtime acceleration or financial savings from this patch alone; observe the next daily optimizer report, exact pull request evidence and post-deploy measurements.

## Safety
Required, CodeQL, tenant protection and protected promotion are unchanged. `_7d` fields retained for existing consumers but explicitly marked as bounded lower-bound observations when the requested seven-day window is not covered.
