# 2026-10-07 — Security Trust terminal green v1

## Doel
De Data & AI Sovereignty / Security Trust-runtime sluit niet langer af op een vals `EVIDENCE_PARTIAL` wanneer RLS bewust fail-closed staat en browserrollen geen tabelprivileges hebben.

## Structurele correctie
- browser-executable `SECURITY DEFINER` RPCs: EXECUTE ingetrokken van `PUBLIC`, `anon` en `authenticated`; `service_role` blijft toegestaan;
- RLS zonder policy wordt opgesplitst in:
  - browser-granted review surface;
  - service-only intentional deny-all;
- alleen de eerste categorie blijft een open finding;
- de bestaande sovereignty/security-heartbeat blijft de enige refresh-authority.

## Production readback
- browser-executable SECURITY DEFINER: 0;
- RLS/no-policy met browsergrant: 0;
- service-only intentional deny-all: 166;
- canonical security snapshot: `VERIFIED_NO_OPEN_FINDINGS`;
- findingCount: 0;
- highRiskFindingCount: 0;
- evidenceCoverage: 100%.

## Delivery truth
Netlify production deploy `6ac692d18140b50008e74167` draait commit `cfbf6247cd59506d468dd75bca0307c3065b4f67`, die 8 commits vóór en 0 commits achter de merge van Security Trust Center #4058 staat. De UI/runtime van #4058 zit daarmee aantoonbaar in productie.
