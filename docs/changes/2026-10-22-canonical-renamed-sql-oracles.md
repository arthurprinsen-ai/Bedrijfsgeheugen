# BRAIN historical SQL tests: canonical timestamped migration filenames

- Parent obligation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742
- Evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39755490943/job/119746782219
- Fingerprint: `powerhouse|brain|canonical-renamed-production-sql-oracles|20261022-v1`
- Exact immutable Git blob comparison proves the current canonical SQL is identical to original historic sources: Bedrijfslek `c45901a1e162cb8936508018abc02416ad268364`; outreach suppression `135a2a08eddfed78aa1e888e8f697ec9edbee34d`.
- Two outdated test paths in `tests/brain-bedrijfslek-canonical-brain-v1.test.mjs` now reference the surviving `20261009190719_bedrijfslek_runtime_signal_cycle_v1.sql`; one in `tests/brain-outreach-4340-canonical-quality.test.mjs` references `20261012074151_20261012093000_outreach_rejection_cross_channel_anti_repeat_4340.sql`.
- Original assertions, including tenant protections, service-role-only execution, idempotency, rejection-driven outreach suppression and semantic evidence gates, remain unchanged.
- `tests/brain-canonical-renamed-production-sql-20261022.test.mjs` rejects returning retired SQL filenames as executable duplicates, and verifies retained source markers and canonical consumer pointers.
- No new migration, schema, RLS, ACL, Edge Function, sender, scheduler, provider side effects, or production mutation.
- Exact-head Required, CodeQL, complete BRAIN zero-fail acceptance and independent migration parity #3742 / tenant proof #4215 still required.

- Additional uncovered failure: `tests/supabase-powerhouse-relationship-revenue-engine-v1.test.mjs` used retired `20260928104500_powerhouse_relationship_research_auto_enrichment_v1.sql`. Its seven positive privacy/trigger-order markers and negative no-fabrication claims were source-checked against existing `20260928104333_powerhouse_relationship_research_auto_enrichment_v1.sql` (Git blob `c290810df7eca707114409cec5fa31baf7254288`). The old assertion was retained and only the source read path changed. This third source is independently verified as sufficient for the original assertion; byte identity with the obsolete filename is not claimed.
