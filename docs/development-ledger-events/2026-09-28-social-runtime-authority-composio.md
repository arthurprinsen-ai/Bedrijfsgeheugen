# 2026-09-28 — Social runtime authority recovery

Obligation: `runtime_authority_reconciliation`

Root cause: canonical authority still named Buffer after retirement and did not isolate channel capabilities.

Change: social transport becomes Supabase + Composio. LinkedIn personal, LinkedIn company and Instagram each require their own exact account/capability/readback. Missing LinkedIn organization scope fails closed only for company publishing.

Evidence before merge: LinkedIn personal provider health succeeds; organization ACL returns 403 for missing `r_organization_admin`; canonical Instagram resolves to `bedrijfsgeheugen.nl` BUSINESS. Runtime Authority Governance Tests and admission passed. Terminal production readback remains mandatory.
