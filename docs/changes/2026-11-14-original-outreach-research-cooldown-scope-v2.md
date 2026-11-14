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

## Original native Supabase history reconciliation (independently measured 08:26:46 UTC)
Original provider reports 853 applied migrations, while the existing Git lock had 851. Version `20261114080027/original_approved_connection_source_priming_v1` was applied through direct native management using one SQL statement of exactly 11,353 characters and provider MD5 `7f3b733b4f450b931b416bcaf9eac773`, byte-identical to the protected original version `20261114083500/original_approved_connection_source_priming_v1` source. The latter was also separately applied through the canonical release in four SQL statements. These are **two real historical entries** for the same source; neither is a new mail send or a valid reason to rewrite/delete the provider ledger.

This recovery restores the exact historical 852 executable SQL file, appends only the two real version/name identities to the original source lock, and uses a strictly exact-base, exact-path, exact-SQL-digest CI guard to prove that source history. The **new** 854 SQL is not in the applied lock and still goes through normal proposed-SQL preview and protected release before native application. Regression includes negative cases for altered history, source digest, branch, security guards, and unrelated SQL. Never claim `LIVE` for 854 or any new mail until independently verified.

## Canonical version coordination
As of 2026-11-14, protected PR #5761 already reconciled native 852/853 and fixed the deterministic portal finance fixture test on `main` commit `f72a460152d662cb871dc1867a21df0e97f4c3c4`. This follow-up PR does NOT reimplement the existing native migration ledger, CI one-time verifier or unrelated portal test; it only proposes the still-unapplied 854 source-cooldown predicate repair. Source attestation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5761. No provider mail proof is implied.
