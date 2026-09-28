# Repository Writer Shadow explicit dispatch — activity ledger

Date: 2026-09-28
Obligation: repo-writer-shadow-explicit-dispatch-v1

Implemented:
- Candidate Shadow pull_request trigger removed;
- dispatch-writer-shadow helper with immutable PR identity validation;
- explicit dispatch added to 5 missing writers;
- existing 4 explicit writer dispatchers preserved;
- writer workflow definitions scoped to automation lane;
- regression checks all 9 canonical writers.

Expected effect:
- ordinary PRs lose one always-skipped workflow run;
- writer candidates retain identical or stronger immutable Shadow verification;
- lower workflow fan-out per SHA.
