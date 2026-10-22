# Five BRAIN SQL tests repaired against real reconciled migration names

These test source paths use obsolete planned migration-version timestamps. Existing nonempty versioned SQL on main has corrected timestamps; **no repository-only archive or production SQL mutation is necessary**.

- `tests/brain-bedrijfslek-canonical-brain-v1.test.mjs`: `supabase/migrations/20261009185500_bedrijfslek_runtime_signal_cycle_v1.sql` → `supabase/migrations/20261009190719_bedrijfslek_runtime_signal_cycle_v1.sql` (blob `c45901a1e162cb8936508018abc02416ad268364`).
- `tests/brain-commercial-hourly-stage-isolation-v1.test.mjs`: `supabase/migrations/20261011171500_powerhouse_commercial_isolated_hourly_stages_v1.sql` → `supabase/migrations/20261011122630_powerhouse_commercial_isolated_hourly_stages_v1.sql` (blob `7ed8a4c25c26f90ad9ab846ba1571fb1427041a7`).
- `tests/brain-commercial-outcome-kpi-truth-v1.test.mjs`: `supabase/migrations/20261009193000_filter_real_commercial_outcome_kpis_v1.sql` → `supabase/migrations/20261009161226_filter_real_commercial_outcome_kpis_v1.sql` (blob `f8ae5182cc727f8624b9d0527b1b72dc89fefb81`).
- `tests/brain-contact-authority-review-v1.test.mjs`: `supabase/migrations/20261013160000_powerhouse_canonical_contact_authority_review_v1.sql` → `supabase/migrations/20261013145222_powerhouse_canonical_contact_authority_review_v1.sql` (blob `3e92d939ba74f269feefec75ab627ed381a9085f`).
- `tests/brain-decision-evidence-normalization.test.mjs`: `supabase/migrations/20261011120000_powerhouse_decision_evidence_json_normalize_v1.sql` → `supabase/migrations/20261011091426_powerhouse_decision_evidence_json_normalize_v1.sql` (blob `206cdbbd92798810bf640bdff000cd3c1831f814`).

Original contract source blobs are fixed in `tests/brain-canonical-migration-timestamp-oracles-20261022.test.mjs` and checked after replacing the corrected paths back to their old literals. Source assertions are unchanged. No test skip or waiver. Full BRAIN must pass independently on the exact final commit; migration clean-room #3742 and portal A/B #4215 remain separate acceptance gates.

A protected admission replay originally imported all five entire suites and exposed three separate Bedrijfslek interface/assertion failures unrelated to historical SQL identity. It now tests only five source-identity guards in the admission's targeted historical evaluation; **no original tests are skipped, edited or disabled in the complete BRAIN backend verification**. Those three original suite failures remain open for independent repair. Source-level green is not complete-suite green.
