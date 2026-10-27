# Prevent evidence head-of-line starvation in the existing revenue-learning agent

**Date:** 2026-10-25  
**Issue:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Production finding
The October 25 revenue-learning run was genuinely executing with a per-hour limit of eight, but attempted eight, promoted zero, with repeated `VERIFIED_SOURCE_REQUIRED` or `INSUFFICIENT_VERIFIED_COHORT` evidence blockers. The canonical store reports 110 due rows. The prior algorithm always chose the first sorted row of each channel before rotating only the remainder; one permanently unverified head record could monopolize a slot at every hour.

## Smallest safe correction
Keep the **one existing @hourly Netlify executor**, gateway, canonical forecasting and obligation tables. Replace channel-head selection with a deterministic rotating per-channel evidence cursor and bounded round-robin. Stable retries in the same hour return the same order. The current 8-item default and 16-item maximum are preserved. Missing/ambiguous source data remains a typed **OPEN** proof-debt obligation. No new scheduler, queue table, provider send or mutation of customer revenue data.

## Acceptance
- Historical static 54-item backlog reaches every entry across seven hourly batches at cap eight.
- Separate 12-item cohorts per channel are covered in six hourly batches at cap four.
- Source-obligation writeback is idempotent and never fabricates `PROVEN` or paid orders.
- Explicit regression in existing Required, CodeQL, protected merge, Netlify production revision readback, next real hourly execution observed separately.
- Existing wider forecast-calibration debt, missing Instagram media, blog PR, provider permission issues, and independently measured €0 paid revenue remain separate genuine obligations.
