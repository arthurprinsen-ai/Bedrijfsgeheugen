# 2026-10-25 — Partial external source runs must never be Brain GREEN

The existing Supabase bg-externe-signalen scanner returned 207 on 2/3 success (real request 12523; source failure status DataForSEO 40101), but passed p_groen=true to bg_bewijs when any topic succeeded. The canonical bg_bewijs writer maps p_groen to Brain GREEN, despite one failed provider subject. That gives self-learning a contradictory success target.

Patch only the existing scanner, shared provider utility and existing Required test. Derive a fail-closed batch verdict: all nonempty selected topics succeeded ⇒ GREEN; partial/none ⇒ RED REMOTE. Preserve valid source results, true 207/502 response, immutable source observations, Tavily/DataForSEO bounded retry, existing queue-free scheduler and provider expenses.

Accept only after exact-head Required/CodeQL, protected merge, Supabase active version and independently observed provider/Brain delivery evidence. Do not backfill/erase past failure; any current genuine RED stays visible.
