# Shallow control-plane contract recovery — 2026-10-06

PR #3947 intentionally bounded Git history across the CI control plane. Two stale full-history assumptions remained:

1. Powerhouse Skill Projection moved to `fetch-depth: 2`, while its canonicalization regression still required `fetch-depth: 0`.
2. The Integration Bundle CLI still calculated changed paths with `BASE...HEAD`, which needs merge-base ancestry and fails in a targeted shallow checkout even when both exact commit objects are present.

This recovery aligns both components with the same invariant:

- Skill Projection regression requires depth 2 and rejects depth 0.
- Integration Bundle performs a bounded targeted fetch for explicit missing commit objects and then uses exact two-tree `git diff BASE HEAD`.
- Triple-dot merge-base-dependent candidate scope is rejected by regression.

No provider, runtime, release, security or production behavior is weakened.
