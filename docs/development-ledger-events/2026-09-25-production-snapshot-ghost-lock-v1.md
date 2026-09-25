# 2026-09-25 — production snapshot ghost-lock recovery

Observed:
- production snapshot run `36160448237` for main `933198c36121cae1f04723d5b69a53f3863f1936` remained `pending`;
- the run had zero jobs;
- no other active Production Source Snapshot run existed in the repository;
- Netlify production still served an older commit.

Action:
- rotate the stable concurrency-group key to `production-source-snapshot-main-v2`;
- keep `cancel-in-progress: false` to preserve serialized production promotion;
- add a regression test for the recovered group;
- retain exact-main Netlify equality and browser readback as terminal gates.
