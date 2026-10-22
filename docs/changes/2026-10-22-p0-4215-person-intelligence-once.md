# P0 #4215 — Person intelligence single statement materialization

Fingerprint: `powerhouse|p0-4215-person-intelligence-once|20261022-v1`.

**Observed failure:** snapshot task #46 continues failing at statement timeout. Root cause analysis found nested repeated person-intelligence view expansion via buying-window v2. At 22 October 2026 there were 818 open opportunities and 23,295 contact records, with complex aliases/events/outcomes joins. A memory-only experiment failed and was reverted; no timeout or scheduler bypass is permitted.

**Proposed exact rewrite:** add one PostgreSQL MATERIALIZED CTE caching the unchanged `public.powerhouse_person_intelligence_v1` for each buying-window query; point the original LATERAL selection at the CTE. Leave the condition `p1.person_key = o.person_key OR p1.linkedin_url = o.person_key`, order by `p1.last_relevant_at DESC NULLS LAST`, and `LIMIT 1` unchanged; preserve all 50 buying-window columns, forecast, finance, status and tenant semantics. Existing `security_invoker=true` and no browser-readable ACL preserved with explicit pre/post guards.

**Measurements:** PostgreSQL EXPLAIN full `powerhouse_buying_window_v2` estimated 32,713,172.61 planner units prior to change versus 1,597,888.41 for identical SELECT with proposed one-time materialization — estimated ~95.1% lower, NOT observed latency. Isolated original person selection estimated 27,085,785.15 vs 414,173.39. A read-only 60-opportunity selection comparison returned 0 person-record mismatches; it does NOT prove all-tenant or 50-column equality.

**Release guard:** run full both-way 50-column parity and channel/finance snapshots on an isolated preview with representative >=2 tenants. Two authenticated independent tenant HTTP readbacks must be successful. Run actual performance and timer/cost tests, Required CI, CodeQL, protected merge and production source/readback before calling green. PR #4558 remains separate and protected; combining optimizations requires a *new* full parity verification. No fake customer data, RLS relaxation, cron duplication or re-publication.

**Rollback:** if performance or semantics regress, use the previous versioned buying-window source via normal protected migration, preserving all public ACLs, and monitor existing cron #46.

## Twee-armen-vervolgmigratie (22 oktober 2026)

De oorspronkelijke versiebeheerde migratie blijft onaangetast. Het nieuwe `supabase/migrations/20261022221500_p0_4215_person_two_arm_match_v1.sql` bewaart één MATERIALIZED person-intelligence bron en vervangt de per-opportunity OR/LATERAL met twee disjuncte equality-joins plus per-opportunity laatste persoon. Supabase-preview `kvygrqnkhhidwbaugnqp` compileerde dit binnen BEGIN/ROLLBACK met MD5 `8a9b316a512dcf55889b0a56e7026170`, 50 kolommen en dezelfde service-only ACL; providerpreview was leeg. Dit bewijst géén volledige 818-row/result/financiële gelijkheid, echte twee-tenant HTTP-isolatie of volledige cron-SLA. Eerder gemeten beperkte resolverproef was 5,394s versus 1,079s (geen volledige snapshot).

Fail closed: exacte SHA Required/CodeQL, providerreplay, representatieve volledige 50-column/pariteit incl positieve/zero/NULL financiële fixtures, echte authenticated tenant A/B en end-to-end chronometing onder 120 seconden vóór enige productiepromotie. Geen extra scheduler, productie-DDL of omzetfabricatie.
