# Forced production refresh — 24 September 2026

PR #2711 intentionally refreshes the canonical Production Source Snapshot so the exact current `main` can be rebuilt, promoted and re-verified in production.

The repository correctly treats a production-workflow mutation as material. Therefore this lineage carries the required learning, ledger, documentation and regression test rather than treating a deploy trigger as metadata-only.

Closure remains fail-closed: exact production SHA, pricing-content proof, pricing interaction proof and English-route proof must all pass before the release is called live.
