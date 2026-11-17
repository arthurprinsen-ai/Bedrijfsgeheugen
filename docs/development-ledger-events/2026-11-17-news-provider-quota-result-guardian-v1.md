# P0 incident learning — existing Guardian detects news-quota failure

**Date:** 2026-11-17
**Obligation:** `powerhouse|commercial|news-432-false-green-cron|20261117-v1`
**Original incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Direct original production evidence
Cron #20 `bg-bedrijfsnieuws-werkdagen` SQL succeeds and the owner metric says OK, but actual pg_net record 33815 for Nov 17 06:31 UTC confirms HTTP **500** `TAVILY_432`. Original company-news source `opgehaald_op` last Nov 8; 123 pre-approved email contacts but two with recent accepted company-news source. Source-specific composer rightly holds two emails; 0 provider-sent today.

## Repair applied on existing source
Update **same** original `powerhouse_original_result_guardian_v1` via new versioned SQL migration, no new scheduler, function name, email provider or side effects. Preserve original error/owner/recovery, add independent news-source result/freshness and exact 432 classification to original health+runtime events. Do not retry/bill exhausted Tavily or create unsupported email candidates while quota exhausted. Document vendor-plan boundary as non-recoverable without budget approval, while existing lawful source channels may continue.

## Required verification
Target regression `tests/brain-guardian-news-provider-truth-20261117.test.mjs`. Exact-head Required and CodeQL, clean-room Preview, protected merge, production migration readback, natural #171 guardian HTTP-source-status proof; no fake green. Any genuine source ingestion must be followed by composer and Gmail independent per-original-action proof.

## Prevention
Separately observe pg_cron and HTTP provider responses, freshness and true consumer receipts. SQL enqueued != HTTP succeeded != verified external evidence != delivered email != customer outcome. Existing P0 continues OPEN.

## Protected CI admission recovery — 2026-11-17 09:55 UTC
The first exact-head `preflight` / `test` failed **6 existing migration-lock parity assertions**, not the guardian source behavior: previous protected merged PR #5945 had already deployed its native composer migration `20261117102500` to original provider, but the original `supabase/migration-history.lock.json` still ended at `20261117094500` (876 entries). Thus provider = 877 and original source lock = 876; the protected migration inventory rightly blocked all new migrations. Independently used native Supabase `list_migrations` and verified exact `20261117102500_original_composer_email_channel_fairness_v1` once, source migration unchanged. The **same existing** lock now appends that single exact source/provider pair with captured time `2026-11-17T09:55:01.336147Z`. It does **not** pre-claim the not-yet-deployed new `20261117110000` migration or disable any gate. Existing P0 #4198 owns follow-up after merge to ensure its versioned provider history is independently reflected in canonical lock and protected delivery. Re-run exact-head CI.

## CI security source-contract repair — 2026-11-17 09:59 UTC
After original migration-history lock reconciliation, Required source-contract rejected the new `SECURITY DEFINER` function version due to missing explicit `REVOKE EXECUTE` in THIS candidate migration. Actual original production guardian already had service-only grants, but the source review correctly demands that each new SQL file explicitly repeat them rather than infer from historical permissions. The same migration now contains `REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon, authenticated` and `GRANT EXECUTE ... TO service_role`. Regression now asserts both; no public execution, RLS bypass, new grant or policy waiver.
