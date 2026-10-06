# Development ledger — live PR metadata authority regression

- Date: 2026-10-06
- Obligation: `live-pr-metadata-authority-regression-20261006-v1`
- Base main: `03156e2b875718d20a9a3369f1f68f3660c721f4`
- Trigger: #3993 automation lane failed only because an old regression contradicted the current metadata-authority contract.
- Runtime code change: none.
- Test repair: assert complete live PR metadata wins; assert incomplete PR metadata still falls back to the valid same-obligation manifest.
- Safety: different-obligation manifests remain non-authoritative.
- Follow-up: after protected merge, recreate the pure production-trigger proof using only `tools/ci/**`, `brain/learning/**`, and `docs/**`.
