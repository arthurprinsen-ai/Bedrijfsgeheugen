# Autonomous Branch Sync — change and recovery

## Problem and cause
Open pull requests can drift from main; manual updates let required checks become stale. PR #4916 also initially lacked machine contract metadata and writeback evidence.

## Candidate change
On main pushes, request GitHub's native PR branch update with `expected_head_sha` for authorized same-repo nondraft branches. Serialize reconciliation, never force-push, and report rejected updates without implying success.

## Limitations and prevention
Accepted API calls are not independent branch-head readback, and conflicts/permissions may prevent updates. Post-merge runs and refreshed exact-head Required/CodeQL evidence are prerequisites for green. This change does not guarantee zero transient drift or autonomy for forks/drafts. Existing Brain learning and delivery audit should capture failures.
