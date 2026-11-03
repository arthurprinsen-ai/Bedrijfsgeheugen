# 2026-11-03 — Janitor quota failure and prevention evidence

- Fingerprint: `github|janitor-archive-sweep|installation-rate-limit-uncaught-after-tag403|20261103-v1`.
- Original run: 41595648620; job 125784745984, source SHA `019016ddc50bcbfe354001a704ad1e9159c1e4c6`.
- Provider evidence: three tag ref POST 403 `Resource not accessible by integration` followed by distinct HTTP403 `API rate limit exceeded for installation` at 07:29:04Z, request `081B:53DBA:9F779:208D21:6AE98D40`.
- Root cause: original circuit breaker blocked further archive-tag attempts but not other provider reads, and commit/compare inventory requests were outside typed failure catch. Job failed and preserved unique work.
- Code: `tools/ci/branch-archive-sweep.mjs` bounded rotating <=60 branch window, immediate circuit stop, quota categorization, catch for inventory/compare/commit, truthful bounded scope, existing always evidence artifact.
- Regression: `tests/brain-branch-archive-sweep.test.mjs`; Brain learning: `brain/learning/2026-11-03-janitor-archive-rate-limit-guard-v1.json`; existing agent skill updated.
- Release: CANDIDATE. No new scheduler, publisher, writer, unverified live or security bypass. Retain separate issue #5333 tag permission and #4655 ghosts; demand original next natural run and exact SHA provider/portal readback.
