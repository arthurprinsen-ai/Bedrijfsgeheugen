# Main push fan-out governor v3 — 25 september 2026

This successor closes stale regression drift exposed after #2850.

## Repaired
- main-push fan-out regression now accepts valid multiline YAML branch lists;
- canonical System Map includes the new browser-gate-boundedness skill;
- pricing rescue-runtime tests no longer hard-code the obsolete timestamp cache key;
- production pricing readiness is asserted through the canonical dataset ready-v3 contract, not literal selector spelling.

No product safety invariant is weakened. Content-addressed cache identity, real runtime readiness, System Map completeness and protected delivery remain fail-closed.
