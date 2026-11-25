# Commercial contact authority bounded function first

Date: 2026-10-20
Base SHA: 9535f80c80f73c5857e8b684f2854f42e0cb0867
Obligation-ID: commercial|contact-authority-preselection-function-first|20261020
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
Related: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
State: SOURCE_CANDIDATE / NOT_PRODUCTION_VERIFIED

Live DB predicate check: original 'with candidates as (' TRUE, new 'with picked as materialized (' FALSE. Combined PR #4536 index+rewrite failed PostgreSQL 55P03; no queue index. Dedicated patch reuses only its already reviewed guarded function rewrite, with 2-second lock timeout. Original commercial Edge v225 200-slot-guard is LIVE, but subsequent contact SQL still returned 57014.

Required: Required CI, CodeQL, Supabase Preview, protected merge, exact atomic production migration and pg_get_functiondef signature readback; workload/tenant/provider proofs before closing P0. No new executor, scheduler or fake metrics.
