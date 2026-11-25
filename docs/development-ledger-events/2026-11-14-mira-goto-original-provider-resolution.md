# Original Mira Google News goto resolution — 2026-11-14

- Parent original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
- Original reference implementation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5769, protected merged, independent Supabase production Edge v974.
- Production original authenticated request `31065` returned HTTP503, all 18 provider news links rejected as `REJECTED_SOURCE_URL_QUALITY` pointing at `google.com`; 0 sources stored, 0 eligible, no new immutable winner.
- Official original DataForSEO Google News Live Advanced documented `resolve_goto_urls` boolean option: https://docs.dataforseo.com/v3/serp/google/news/live/advanced/
- Correction in original source collector: add `resolve_goto_urls:true` to SAME 8 approved task payloads; parallelise only provider lookups to avoid >120s cron timeout, consume outputs deterministically within original single owner. No extra vendor calls, schema, cron, writer, manual source bypass, paid video attempt or Instagram publish.
- Hard gates still original: publisher URL and independent date verified, semantic PH-P/score/duplicate gates, exact Mira media and native provider readback, ONE BRAIN processing.
- Status at code creation: CODE_CANDIDATE until protected checks, original Supabase Edge deployed source, genuine new source and provider post prove otherwise.
- Regression: `tests/brain-mira-goto-provider-resolution-20261114.test.mjs`.
