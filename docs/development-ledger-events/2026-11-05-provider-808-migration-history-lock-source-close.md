# Development ledger — Supabase applied migration #808 source-lock reconciliation

- Datum: 2026-11-05. Fingerprint: `supabase|migration-lock|808th-provider-applied-source-lock-lag|20261105-v1`.
- Eigenaar: oorspronkelijke GitHub Required/Supabase migration-history owner. Parent #3742. Related protected source PR #5450.
- Productiecontrole: Supabase provider 808 unieke applied version/name, GitHub executable SQL source 808 identiek; originele immutable `migration-history.lock.json` 807 exact historische rijen.
- Breuk: na nieuwe toegepaste 808e SQL `20261105134200_original_data_spine_decision_receipt_same_tick_v1` bleef de bron-lock bij 807; Required van onafhankelijke PR #5457 is terecht rood: run #42055033207.
- Herstel: beschermde source candidate branch `fix/supabase-808-provider-lock-readback-20261105` voegt uitsluitend de providerbewezen 808e versie/naam toe aan de oorspronkelijke lock; oude 807 rijen, scripts, tests, OIDC en providerhistorie zijn ongewijzigd. Bewijs via originele lock-parity- en provider-tests.
- Preventie: na elke toegepaste provider-migratie exact provider-applied ↔ GitHub-executable ↔ immutable source-lock readback, idempotent; voorgestelde PR-source nooit als toegepast vastleggen.
- Regresstests: `tests/supabase-migration-history-integrity.test.mjs` en `tests/brain-original-supabase-800-provider-migration-lock-20261104.test.mjs`. Geen valse omzet of publicatie-green.
- Status: SOURCE_CANDIDATE_UNVERIFIED totdat Required + CodeQL + beschermde merge en onafhankelijke providercontrole groen zijn. Een lopende of mislukte originele check is geen providerbewijssluiting.
