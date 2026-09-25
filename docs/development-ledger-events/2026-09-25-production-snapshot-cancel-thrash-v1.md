# 2026-09-25 — Production snapshot cancel thrash v1

Observed:
- exact-main Production Source Snapshot runs were healthy and in progress;
- each was cancelled when a newer protected-main commit arrived;
- the cancellation happened before Netlify exact-SHA and browser readback could complete.

Root cause:
- production snapshot concurrency used `cancel-in-progress: true`.

Permanent repair:
- set `cancel-in-progress: false`;
- let one active production snapshot finish;
- coalesce subsequent waiting work through the existing concurrency group;
- require the newest completed snapshot to prove current-main production identity and browser behavior.
