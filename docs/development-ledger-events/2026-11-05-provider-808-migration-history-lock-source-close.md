# Development ledger — Supabase applied migration #808 source-lock reconciliation

- Datum: 2026-11-05. Fingerprint: `supabase|migration-lock|808th-provider-applied-source-lock-lag|20261105-v1`.
- Eigenaar: oorspronkelijke GitHub Required/Supabase migration-history owner. Parent #3742. Related protected source PR #5450.
- Productiecontrole: Supabase provider 808 unieke applied version/name, GitHub executable SQL source 808 identiek; originele immutable `migration-history.lock.json` 807 exact historische rijen.
- Breuk: na nieuwe toegepaste 808e SQL `20261105134200_original_data_spine_decision_receipt_same_tick_v1` bleef de bron-lock bij 807; Required van onafhankelijke PR #5457 is terecht rood: run #42055033207.
- Herstel: beschermde source candidate branch `fix/supabase-808-provider-lock-readback-20261105` voegt uitsluitend de providerbewezen 808e versie/naam toe aan de oorspronkelijke lock; oude 807 rijen, scripts, tests, OIDC en providerhistorie zijn ongewijzigd. Bewijs via originele lock-parity- en provider-tests.
- Preventie: na elke toegepaste provider-migratie exact provider-applied ↔ GitHub-executable ↔ immutable source-lock readback, idempotent; voorgestelde PR-source nooit als toegepast vastleggen.
- Regresstests: `tests/supabase-migration-history-integrity.test.mjs` en `tests/brain-original-supabase-800-provider-migration-lock-20261104.test.mjs`. Geen valse omzet of publicatie-green.
- Status: SOURCE_CANDIDATE_UNVERIFIED totdat Required + CodeQL + beschermde merge en onafhankelijke providercontrole groen zijn. Een lopende of mislukte originele check is geen providerbewijssluiting.

## Protected admission correction, unchanged strict history rule
- First Required for source candidate: [#42056253016](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42056253016) blocked `LEARNING_EVALUATION_TEST_PATH_INVALID:historical_replay:tests/supabase-migration-history-integrity.test.mjs`. Root cause: canonical ONE BRAIN registry demands `tests/brain-*.test.mjs` for all learning `evaluation` entries even if an original non-Brain test is a valid Node test.
- Restored the normal admission contract by creating `tests/brain-provider-808-migration-lock-source-close-20261105.test.mjs`, which executes/imports both original immutable migration tests and tests the 808th actual source lock receipt; learnings `historical_replay/shadow/canary` point to that existing-lineage executable wrapper. No test exemptions, no skipped parity, no fake applied SQL, no alternate provider authority.
- Exact-head Required and CodeQL must pass again before merge; prior rejection remains a recorded failure.
