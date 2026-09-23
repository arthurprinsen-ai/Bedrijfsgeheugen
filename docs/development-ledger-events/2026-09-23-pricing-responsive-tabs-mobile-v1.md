# 2026-09-23 — Pricing responsive interaction recovery

User-observed mobile failure was traced to two independent causes: duplicate inline pricing interaction runtimes and an unscoped mobile table-to-card selector. The candidate consolidates interaction state into one versioned external runtime, scopes the legacy table transform to the feature matrix, and gives the lifecycle matrix dedicated responsive cards and tap targets.

Regression coverage was updated in the same lineage. Terminal completion remains gated on required CI, merge, Netlify production deployment and public `/prijzen` readback.
