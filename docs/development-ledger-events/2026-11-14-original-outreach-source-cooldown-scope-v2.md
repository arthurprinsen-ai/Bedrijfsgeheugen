# 2026-11-14: Follow-up P0 — original approved-source cooldown false exclusion

Canonical incident fingerprint: `powerhouse|commercial|original-approved-source-cooldown-false-exclusion|20261114-v2`.

## Proven root cause
The protected PR #5759 code was merged into `main` as `7603fc67c85093bcd03328fa1e42f6c128200cbb`, and the native Supabase `public.powerhouse_prime_approved_connection_research_v1` function and existing stage-2 call are independently present. Yet it primed **zero** new source research actions. SQL cohort readback: 23,295 connecties, 605 emails, 123 `human_approved=true`, 114 after the other policy gates. The broad prior `research_enrichment` cooldown excluded 123/123 approved contacts. These legacy MKB-trigger internal tasks often have no verified company source; they do not prove that a public-company query occurred. The corrected predicate leaves 99 suitable approved contacts across 98 companies for **research only**. No email delivered today.

## Minimal repair in the ORIGINAL owner
Native migration `20261114091500_original_outreach_source_research_cooldown_scope_v2.sql` updates only the existing `powerhouse_prime_approved_connection_research_v1`. A 30-day research cooldown now applies only to existing original `relationship-research:approved-source:%`, original `relationship-research:outreach-source:%`, or independent records with `public_research_execution.researched_at`, for the same person or company. Old generic research suggestions no longer block ALL approved contacts. The original `powerhouse_execute_relationship_research_v1` and stage #116 remain unchanged.

Preserved: 5 maximum research actions per Europe/Amsterdam calendar day, stable day-person dedupe, original advisory lock, one same-company source query, no public API send, human approval, suppression, negatives, 90-day actual contact cooldown, valid business email and provider ID/readback only after original authorized Gmail executor. Sender limits and existing newsletter authorization restrictions are **not changed**.

## Release and regression
Regression `tests/brain-original-outreach-research-cooldown-20261114.test.mjs` asserts the false exclusion does NOT recur and that no send/cron/security authority is introduced. CI Required/CodeQL/Supabase Preview and protected merge are mandatory before applying the native migration. After this, read `pg_get_functiondef`, migration history, grants and the next natural #116 stage-2 readback. A research `done` does not count as sent, provider-readback or revenue. Maintain commercial OPEN if no separately verified Gmail delivery. Original parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Previous PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5759.

Status at creation: PROPOSED, not live.

## Original native Supabase history reconciliation (independently measured 08:26:46 UTC)
Original provider reports 853 applied migrations, while the existing Git lock had 851. Version `20261114080027/original_approved_connection_source_priming_v1` was applied through direct native management using one SQL statement of exactly 11,353 characters and provider MD5 `7f3b733b4f450b931b416bcaf9eac773`, byte-identical to the protected original version `20261114083500/original_approved_connection_source_priming_v1` source. The latter was also separately applied through the canonical release in four SQL statements. These are **two real historical entries** for the same source; neither is a new mail send or a valid reason to rewrite/delete the provider ledger.

This recovery restores the exact historical 852 executable SQL file, appends only the two real version/name identities to the original source lock, and uses a strictly exact-base, exact-path, exact-SQL-digest CI guard to prove that source history. The **new** 854 SQL is not in the applied lock and still goes through normal proposed-SQL preview and protected release before native application. Regression includes negative cases for altered history, source digest, branch, security guards, and unrelated SQL. Never claim `LIVE` for 854 or any new mail until independently verified.

## Protected Required: independent portal fixture aging (14 Nov 08:32 UTC)
The unrelated portal finance test failed only because its fixture uses the fixed reference 2026-10-15 but `createOwnerFinancialClient.load()` normally evaluates `Date.now()`. As of 14 November, the fixture is older than the real 30-day verified-financial-evidence window; rejecting it is correct runtime behavior. Limited repair in **test only**: mock `Date.now` with the fixture's own `now` inside that one Node test; no runtime data-age exception, no financial metric invention and no gateway/tenant change. Re-run full protected Required, portal, backend, preview and CodeQL before merging this original outreach repair.

## Canonical version coordination
As of 2026-11-14, protected PR #5761 already reconciled native 852/853 and fixed the deterministic portal finance fixture test on `main` commit `f72a460152d662cb871dc1867a21df0e97f4c3c4`. This follow-up PR does NOT reimplement the existing native migration ledger, CI one-time verifier or unrelated portal test; it only proposes the still-unapplied 854 source-cooldown predicate repair. Source attestation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5761. No provider mail proof is implied.
