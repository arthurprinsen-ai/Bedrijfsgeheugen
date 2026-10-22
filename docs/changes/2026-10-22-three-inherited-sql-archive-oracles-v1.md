# Recover three unowned historical BRAIN SQL test oracles

Fingerprint: `ci-brain|retired-sql-source|three-unowned-oracles|20261022-v1`. Parent #3742. Actual observed source: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39791707071

The three test modules reference retired `supabase/migrations` SQL filenames. Original SQL exists unchanged in `supabase/migration-history/repository-only`; their 34 original positive assertions and negative guards were checked against immutable source. No existing open BRAIN repair PR claims these test paths. This candidate changes exactly one source read-path string in each original test; preserves all original assertions, SQL files, RLS/ACL, production and schedules.

Git blobs:
- `20260918110000_legacy_growth_outcome_reconciler_v1.sql` — `e84bde6ba753e773e4d74cfb39f226dde9e068e3`
- `20260918101000_forecast_calibration_health_due_v1.sql` — `4828bd5facf452f579b530e2b4332133d978ef7a`
- `20260918131000_action_learning_production_truth_v1.sql` — `0712bedcf5b12aed3b12e4a732c0361c9ec5c57a8`

New BRAIN wrapper `tests/brain-three-inherited-sql-archive-oracles-v1.test.mjs` checks exact Git blob identity, prevents an executable migration duplicate and executes all original test modules. Brain learning, green-assurance skill, System Map and development ledger accompany same scoped PR. Exact-head CI, CodeQL, protected merge, independent complete BRAIN zero failures and separate supported Supabase migration clean-room replay remain required. No live claim.
