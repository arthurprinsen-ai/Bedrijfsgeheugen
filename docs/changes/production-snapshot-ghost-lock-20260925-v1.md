# Production snapshot ghost-lock recovery — 25 September 2026

The newest production snapshot for `933198c3…` stayed in GitHub Actions state `pending` with **zero jobs**, while no older or competing production snapshot was active. That distinguishes this incident from ordinary runner queueing or a legitimate concurrency wait.

The recovery rotates the stable concurrency-group identity from `production-source-snapshot-main` to `production-source-snapshot-main-v2`. `cancel-in-progress` remains `false`, so production deploys are still serialized; this does not permit parallel production writes.

This is a one-time scheduler-lock recovery. Terminal proof still requires Netlify `commit_ref` to equal current protected `main`, followed by public NL/EN browser readback.
