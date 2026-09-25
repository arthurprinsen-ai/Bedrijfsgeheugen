# 2026-09-25 — production snapshot ghost-lock recovery v2

Observed:
- stale run `36162423347` remained `in_progress` on `0e6a879c…`;
- latest exact-main snapshot `36162844641` remained pending;
- production deploy serialization was functioning, but the scheduler state was stale.

Action:
- rotate concurrency group from `production-source-snapshot-main-v2` to `production-source-snapshot-main-v3`;
- keep `cancel-in-progress: false`;
- add regression coverage and Brain learning;
- retain exact-main Netlify equality and browser readback as terminal conditions.
