# Post-merge CodeQL single-flight and terminal delivery

Date: 2026-09-25
Fingerprint: `delivery|post-merge-codeql|single-flight-terminality|v1`

## Root cause
Python CodeQL used `github.run_id` in push concurrency, making each run unique. Separately, agents could return an active exact-SHA post-merge security run as a pending final status.

## Permanent correction
- stable workflow + PR/ref concurrency;
- latest same-ref run supersedes stale work;
- newest exact-SHA security run is authoritative;
- active security work is internal, never final handoff;
- path-filter exclusions are explicit NOT_APPLICABLE evidence;
- exact-main production readback remains required.

## Recovery
PR #3101 was closed without merge and its branch reset to main. This candidate reconstructs only the still-missing delta from current main.

## Client transport continuation

A response transport interruption is not a delivery terminal state. Recovery resumes the canonical branch/PR and newest exact head, re-reads current main and workflow truth, and continues without creating a replacement lineage solely because the response channel ended.
