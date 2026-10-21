# 2026-10-21 — baseline contract canonical pointer correction

- Obligation: `baseline-contract-current-sql-v1` / #3742 / related #4215.
- Fingerprint: `ci|inherited-baseline|canonical-sql-contract-test-reference|v1`.
- Main source epoch: `8f322681ba46045e5d65746c2b2f0fd5b40ffac1`.
- Exact failed release: BRAIN run `39554866582`, candidate PR #4573; 355 inherited failing tests.
- Root cause addressed here: two test files read historic migration identities no longer in canonical SQL directory; existing canonical replacements independently satisfy all eight unchanged assertions.
- Changes: only two test-path strings; source-backed learning and change documentation. No version resurrection, SQL/production mutation, weakened assertion or workflow exclusion.
- Current outcome: draft correction prepared; no exact-head CI, complete baseline resolution, merge, deploy or customer acceptance claimed.
- Next proof: protected full BRAIN+Required+CodeQL and native portal tenant-isolation readback. Continue #3742 and #4215 independently to closure.
