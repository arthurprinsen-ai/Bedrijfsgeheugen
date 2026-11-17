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
