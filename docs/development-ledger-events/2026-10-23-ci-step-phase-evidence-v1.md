# Engineering evidence — CI step-phase provenance, 2026-10-23

Owner #4661. Fingerprint `delivery|predictive-lane-capacity|repeatable-ci-step-attribution|20261023-v1`.

Existing measured source: GitHub Janitor 39926363163 at exact then-main 8a08a22107b29adc4a4fdcd92eb228e5a04790e6, 28 executed jobs across 13 workflow attempts, queue p95 3000ms, longest actual job 353000ms, zero provider-read errors. No measured phase breakdown, longitudinal baseline or causal speed gain yet.

New candidate: existing provider job steps, accepted only against canonical job identity, SHA, attempt, result and time boundaries. Require 20 jobs/5 attempts and 3 independently repeated exact phase instances; bounded median + peak and precise exemplar. Missing/invalid source yields `INSUFFICIENT_*`, never zero duration or invented owner. Historical/shadow/canary regression: tests/brain-ci-step-phase-evidence-v1.test.mjs. No new scheduler, telemetry API budget, actor, mutation or status writer.

Protected merge, full Required/CodeQL and natural Janitor execution on merged main are required before phase readback can be claimed. Existing #4655 provider-owned queued ghosts and unrelated production blockers remain independently open.
