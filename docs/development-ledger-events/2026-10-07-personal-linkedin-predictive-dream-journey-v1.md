# 2026-10-07 — Personal LinkedIn predictive founder journey

## Observed gap

The personal LinkedIn founder-journey behavior was already active in the live Supabase orchestrator, but repository closure was incomplete.

The first Required attempt on PR #4075 failed before tests because delivery machine metadata was missing. After the candidate was rebuilt on current main and metadata was added, the next admission exposed a second structural issue: the new regression filename was outside the repository's classified delivery namespaces.

## Structural correction

The candidate was rebuilt on current main without overlapping-file loss.

The PR contract now carries:
- one obligation ID;
- backend delivery lane;
- recovery candidate type;
- exact base SHA;
- exact change scope and scope budget;
- terminal writer lease bound to the candidate head.

The regression was moved to `tests/brain-personal-linkedin-predictive-dream-journey-v1.test.mjs`, using the existing canonical Brain/backend test namespace instead of weakening the classifier.

Required admission then passed. Preflight subsequently identified the final repository-closure debt: Brain learning, human documentation and development-ledger evidence were absent for the material Supabase delta. This file, the paired change note and the paired Brain learning record close that requirement.

## Prevention

Future material changes to this founder-journey runtime must remain one repository obligation with exact-head CI, canonical `tests/brain-*` regression coverage and all three closure-artifact classes present before the heavy suite can proceed.

No live-only behavioral change should be treated as complete until repository SSOT, migration history, regression and closure evidence agree.
