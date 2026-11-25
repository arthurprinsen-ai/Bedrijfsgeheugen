# Forecast public-evidence source priority — 30 October 2026

## Incident and verified root cause
The original daily `powerhouse-predictive-engine` cron request at 06:08 UTC returned HTTP 500 `AI_PUBLIC_MARKET_EVIDENCE_REQUIRED`. Supabase production query exactly reproduces the selection: **all 80** highest-strength recent `powerhouse_predictive_signals` rows are `external_relationship_evidence`. The model payload excludes private relationship evidence and accepts only public `external_news` and `search_demand`, so the old query exhausted its top-80 limit *before* applying the allowed-source filter.

At inspection, 7 recent valid public news and 11 search-demand rows already passed the 21-day, market scope, canonical key constraints. No extra ingestion, invented source, privacy bypass or relaxed evidence gate is required.

## Canonical bounded fix
In the original `supabase/functions/powerhouse-predictive-engine/index.ts`, filter before rank and cap, with **independent** source quotas: 24 recent public news and 16 recent search demand. Preserve the existing external market boundary, model eligibility, minimum independent signals, forecast evidence references, predicted outcome tracking and canonical scheduler. Regression test: `tests/brain-predictive-public-market-priority-20261030.test.mjs`.

## Distinct known problem
The `powerhouse-forecast-calibrator` scheduled 05:50 UTC HTTP response was **200** with `NON_PUBLIC_SCOPE_BACKLOG`; 2,085 due items lack public-outcome scope. Do not mark as calibrated or fabricate outcomes. The 401 calls visible in Edge logs are separate from the confirmed successful calibrator request and the predictive HTTP 500 request. Cron job execution success is not proof of successful HTTP execution.

## Acceptance
Protected PR passes Required/Brain/CodeQL/System Map and deploys exact source to Supabase; then a real scheduled or authorized natural runtime call must return non-error and write a forecast run receipt with allowed public-market source references. Verify official run + provider response; BRAIN learning remains OBSERVED until independent post-merge evidence. No added scheduler/parallel publisher, no budget-increasing branch resources, no premature GREEN state.
