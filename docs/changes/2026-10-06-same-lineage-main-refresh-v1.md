# Same-lineage main refresh — 2026-10-06

Moving `main` no longer implies a new successor PR. When the current candidate head is exact and main drift has zero path/contract overlap, the controller keeps the same PR, performs a compare-and-swap main refresh, and advances machine metadata to the new head/main epoch.

A terminal candidate remains immutable for ordinary content changes. Real overlap remains fail-closed and must be reconciled on the same lineage first; a successor is only justified after the existing candidate is proven unsynchronizable.

This removes repeated Required/CodeQL fan-out caused solely by moving-main churn without weakening protected merge, exact-head identity, security gates, or production readback.
