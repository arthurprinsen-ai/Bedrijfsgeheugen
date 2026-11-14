# Source-only research cooldown: exclude old bookkeeping placeholders

**Date:** 14 November 2026
**Owner:** original commercial source researcher in Powerhouse cron #116, stage 2
**Parent:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## User-visible problem and root cause

Source primer was released and independently read back after protected PR #5759. Despite available human-approved business contacts, zero new public-company-source research was prepared. 123/123 approved connections were classified as researched in last 30 days because the old internal MKB-trigger `research_enrichment` records were treated as actual source checks. Generic placeholder tasks often had null verified source. That is a false-positive cooldown, not recipient suppression.

## Minimal change

Only the existing internal PostgreSQL `powerhouse_prime_approved_connection_research_v1` is corrected. The 30-day guard now requires actual `public_research_execution.researched_at` or an original `relationship-research:outreach-source:%` / `relationship-research:approved-source:%` dedicated action, matching same person OR company. No changes to original provider sender or #116 scheduler.

Independent **pre-change read-only SQL cohort**: 114 after human approval, valid business email, negative-response suppression and recent-contact rules; **99 qualified for source-only research**, covering 98 companies, after the corrected 30-day source guard. This does not approve 99 outbound emails. Underlying confirmed Gmail sends today remain zero.

## Permanent safety rules

At most five new internal public-source research actions per Europe/Amsterdam day with original dedupe key and advisory lock, valid human-approved existing business contacts only, no opted-out/complaining contacts, existing 90-day sent-message exclusion, no duplicate company source spend, and fail closed when relevant source not found. A found source must be independently accepted with relevance and date before original composer can act. Direct recipient authority, content quality, semantic uniqueness, provider ACK and readback remain mandatory; even a completed source task is not a sent message.

## Quality and live acceptance

`tests/brain-original-outreach-research-cooldown-20261114.test.mjs` checks prior false-exclusion regression, bounded source stage, non-delivery and grants. Protected Required, CodeQL and Supabase-preview, merge, then native version `20261114091500` application and production `pg_get_functiondef`/ACL readback. Measure next original stage-2 source-only tasks without creating a parallel job, and independently verify any eventual Gmail delivery. Record root cause to ONE BRAIN and agent skill, keep commercial delivery state OPEN absent real provider receipts.

Status at PR creation: NOT LIVE until provider proof.
