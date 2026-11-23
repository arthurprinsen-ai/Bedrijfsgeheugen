# 2026-11-19 — DATA_QUALITY_FIX — Company entity only as verified whole-word mention

- **Fingerprint:** `powerhouse|company-signal|substring-match-junk-entity|20261119-v1`
- **Signal:** 898 trigger research actions expired against 195 done in 7 days; 527 of 776 carried a short single-word company key such as "ster", "anva" or "appen".
- **Impact:** research tasks for non-companies consumed the daily research capacity and never reached a message, so trigger-based acquisition produced no handoffs.
- **Root cause:** `powerhouse_company_signal_resolution_v1` matched connection names as raw substrings of news text; the trigger view and growth-swarm then read those fragments back as company evidence.
- **Final fix:** whole-word, exact-spelling, capitalised match with a common-word and month stoplist; trigger view ignores legacy substring-resolved signals and growth-swarm output. Same view and columns, no data deleted.
- **Owner:** Powerhouse Opportunity Intelligence (existing daily resolver, cron 05:45).
- **Regression gate:** `tests/brain-company-signal-verified-entity-20261119.test.mjs`.
- **Verification boundary:** not live until protected merge, migration apply and the next natural resolver run show fewer short keys and more actions reaching "Bericht klaar".
- **Rollback/last-known-good:** revert this migration; the previous view definition is in `20260924132746_trigger_based_mkb_acquisition_runtime_v1.sql` lineage.
- **Reusable lesson:** an entity key is only a company when a company source confirms it; text containment alone is not identity.
