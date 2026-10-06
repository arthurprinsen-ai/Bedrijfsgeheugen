# Production proof commit-status projection v1

Date: 2026-10-06  
Obligation: `production-proof-commit-status-projection-20261006-v1`  
Base: `62b8c91f39474887a3f691ffa3ab550a8876cd09`

## Problem

The GitHub connector used by agents exposes commit workflow runs through a pull-request-filtered view. Post-merge `push` runs such as Production Source Snapshot and Production Release Readback can therefore be real and successful but not directly observable from that connector surface.

That observability gap made terminal delivery depend on repeated polling or indirect public-crawl evidence.

## Structural correction

Both production workflows now publish durable GitHub commit statuses on the exact merge SHA:

- `production/source-snapshot`
- `production/release-readback`

Each context is published as `pending` at start and as `success`, `failure` or `error` from an `always()` terminal step. The status links to the canonical Actions run. Publication retries are bounded.

This adds no second production truth store. Netlify deploy identity, `release.json`, exact SHA and functional readback remain authoritative. The commit statuses are a GitHub-native projection that any connector capable of reading commit statuses can consume.

## Terminal rule

A fresh public crawl is useful functional evidence but cannot substitute for a missing required exact-SHA production status. Future agents should read combined commit status once, inspect only a failed target when necessary, and avoid workflow-list polling when the connector cannot expose push runs.
