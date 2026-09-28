# CI Pattern Memory v1 — activity ledger

Date: 2026-09-28
Obligation: ci-pattern-memory-v1

Implemented as a complement to Delivery Pattern Memory:
- rolling 30-day GitHub CI history;
- repeated failed-PR -> hot-file extraction;
- repeated workflow/job failure signatures;
- thresholding that excludes one-off failures;
- retained pattern-memory artifact;
- Required preflight restore;
- Integration Bundle risk escalation from hot-file evidence;
- no risk downgrade path;
- safe fallback when memory is unavailable.
