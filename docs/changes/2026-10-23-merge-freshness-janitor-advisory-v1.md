# GitHub merge freshness without a second scheduler

Canonical delivery owner: [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661). The existing Repository Janitor already downloads every open PR and compares it with protected main, for bounded stale/duplicate cleanup. This candidate reuses those exact observations, pins all comparisons to one immutable `GITHUB_SHA` main epoch and emits only a read-only advisory in `.artifacts/powerhouse-merge-freshness.json`.

## Output and guardrails

A drifted candidate must have an exact open PR + head SHA match, valid non-negative GitHub ahead/behind counters, a matching compare status, unique commits, and a canonical obligation identifier (otherwise owner unresolved). A duplicate active obligation is explicitly marked. Draft, retired and fully contained candidates never enter the proposed refresh list. An inconsistent or incomplete snapshot yields only `WITHHELD_*`, zero advice. Neither green CI nor the sampled PR `behind` state prove safe refresh or merge.

A current canonical owner may subsequently check protected Required+CodeQL on the exact head, compare file overlap against current main, reconcile the same writer lease and retest. This advisory **never** mutates heads, dispatches CI, authorizes the merge, creates another scheduler, changes provider permission or drops a release gate. The existing Janitor artifact includes the diagnostic. No new GitHub GETs are needed.

## Future merge queues

GitHub [merge queue guidance](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue) requires `merge_group` jobs for every required GitHub Actions check. A merge queue is **not enabled** by this change, and no protected rule is adjusted.

Replay: `node --test tests/brain-merge-freshness-janitor-v1.test.mjs`. Real proof: exact-head hygiene, Required and CodeQL success, protected merge, main source readback, actual next existing Janitor run with diagnostic artifact, skill projection. No CI speedup or production deployment claim without comparative and provider evidence.
