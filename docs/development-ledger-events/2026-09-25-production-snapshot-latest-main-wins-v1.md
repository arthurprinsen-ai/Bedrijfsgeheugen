# 2026-09-25 — production snapshot latest-main-wins v1

Observed delivery race:
- production lagged nine commits behind `main`;
- snapshot trigger was restricted to changes in its own workflow file;
- no workflow concurrency existed to cancel superseded snapshots.

Change:
- remove the push path filter;
- run on every push to `main`;
- add `concurrency.group=production-source-snapshot-main`;
- add `cancel-in-progress=true`.

Expected behavior:
newest `main` SHA always supersedes older production reconciliation work.
