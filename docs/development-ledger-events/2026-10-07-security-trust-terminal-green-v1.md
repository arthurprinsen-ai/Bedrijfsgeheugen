# Development ledger — Security Trust terminal green v1

Date: 2026-10-07  
Obligation-ID: security-trust-terminal-green-v1  
Delivery-Lane: security  
Candidate-Type: security

## Observed production state before correction
- canonical snapshot: `EVIDENCE_PARTIAL`;
- 28 browser-executable `SECURITY DEFINER` functions;
- 166 RLS-enabled tables without policies;
- those 166 tables had 0 grants to `anon`, 0 grants to `authenticated`, and service-role access only.

## Mutation
1. Revoked EXECUTE on every browser-executable public SECURITY DEFINER function from `PUBLIC`, `anon`, and `authenticated`, preserving `service_role`.
2. Refined `security_database_posture_v1()` to measure browser grants separately from service-only RLS deny-all.
3. Refined `refresh_security_trust_snapshot_v1(text)` so intentional service-only deny-all is evidence, not an unresolved finding.
4. Ran the existing combined sovereignty/security heartbeat.

## Proven readback
- browser executable SECURITY DEFINER count = 0;
- RLS/no-policy browser-grant count = 0;
- intentional service-only RLS/no-policy count = 166;
- canonical posture = `VERIFIED_NO_OPEN_FINDINGS`;
- findingCount = 0;
- highRiskFindingCount = 0;
- evidenceCoverage = 100.

No second scheduler, no parallel trust store and no weakened RLS boundary were introduced.
