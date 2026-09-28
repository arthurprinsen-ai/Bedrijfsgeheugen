# Development ledger — Company Intelligence OS v1

- Date: 2026-09-28
- Classification: architecture + runtime + intelligence
- Scope: Company Graph, System of Context, autonomous action boundary, Outcome Memory, Compound Intelligence
- Canonical principle: CRM is a source, Powerhouse is the brain.
- Reuse-first decision: existing `bg_connecties`, opportunities, sales actions/outcomes, decision cycles, realized values, evidence spine and commercial loop remain authoritative.
- New storage: none for graph/context/outcome learning; derived views only.
- New orchestration: `public.powerhouse_run_company_intelligence_os_v1(date)`, wrapping the existing canonical execution loop.
- Governance: system map, operating canon, skill, learning and regression test updated in the same lineage.
- Required terminal proof: repository tests + migration delivery + production Supabase readback + system-map projection readback.

## Terminal proof

- GitHub protected-main merge: `f177340af3aa08287cc510915623e01ce701778d`
- Required test, CodeQL, Supabase preview/security/RLS, portal/browser and quality gates: green before merge.
- Production Supabase migration readback: `all_matched=true`, match mode `UNIQUE_NAME_RECONCILED`.
- Runtime objects present: Company Graph nodes/edges, System of Context, Autonomous Action Layer, Outcome Memory, Compound Intelligence and OS orchestrator.
- Runtime population readback: 42,217 graph nodes; 25,164 edges; 17,328 company contexts; 2,883 actions; 12 outcome-memory records; 17,328 compound-intelligence contexts.
- System Map status promoted to `LIVE_PROVEN_RUNTIME` only after production readback.
