# Resource → Business Value release evidence

**Fingerprint:** `powerhouse-resource-business-value-v1`

This file is release evidence, not a second authority. The canonical runtime authorities remain the existing Powerhouse/Supabase stores and projections documented in the design spec.

## Candidate evidence

- TDD contract exists for additive AI usage attribution and versioned resource→business-value projections.
- The candidate preserves unknown environmental impact and unknown economics as unknown/NULL.
- New views are `security_invoker`, browser roles are explicitly revoked, and only `service_role` receives SELECT.
- The Supabase security contract is fail-closed. A false-negative caused by valid inline PostgreSQL `WITH (security_invoker = true)` syntax was diagnosed; the candidate now also carries explicit `ALTER VIEW ... SET (security_invoker = true)` statements, so the migration itself remains independently compliant.
- No Make dependency, parallel ledger, CRM, ranking engine, or learning system is introduced.

## Required production proof before LIVE & BEWEZEN

1. Required test and BRAIN delivery green on the exact candidate SHA.
2. Exact SQL migration applied to the canonical Supabase project.
3. PostgreSQL catalog readback proves all three versioned views, `security_invoker`, and service-role-only grants.
4. Runtime readback proves unknown values remain unknown and no cross-tenant action attribution is accepted when tenant evidence is ambiguous.
5. PR merged through the protected-main route and Netlify/BG169 production identity matches the merged release.
6. Canonical Powerhouse runtime/learning evidence and the human-readable Notion handbook/register are updated from production truth.

Until all six checks are evidenced, status is **DEELS LIVE / production verification pending**, never LIVE & BEWEZEN.
