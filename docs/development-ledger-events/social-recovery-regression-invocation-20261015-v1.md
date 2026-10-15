# Incident: social recovery regression preflight fails

Date: 2026-10-15
Fingerprint: social-recovery|test-rename-workflow-dispatch-unblocked|v1

Observed: GitHub workflow_dispatch run 38737629053 failed before provider dispatch because the regression test asserted the obsolete `tests/social-publication-recovery.test.mjs` filename, while the workflow already runs `tests/supabase-social-publication-recovery.test.mjs`.

Root cause: a test rename was not updated inside the test's own workflow-path assertion. This is a test metadata error and must not be fixed by removing the security review.

Fix: update the assertion to require the exact currently invoked `node --test` command; retain same-day-only and provider evidence assertions unchanged.

Verification: required GitHub CI and the next canonical recovery workflow invocation are separate gates. Successful provider delivery is not claimed by this source change.
