# Terminal Supabase migration identity — exact version before name

## Failure proven, 8 October 2026

[Protected merged PR #4118](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4118) passed Required, CodeQL and native Supabase Preview, and its migration was applied in Supabase production. Its corrected, PR-number-aware post-merge terminal closure [run #37756633885](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37756633885) correctly **failed** at migration identity reconciliation, not at production database replay.

The precise exception was `SUPABASE_MIGRATION_CANONICAL_IDENTITY_AMBIGUOUS:powerhouse_identity_graph_replay_baseline_v1`. Both `20261007063438_powerhouse_identity_graph_replay_baseline_v1.sql` and `20261008080905_powerhouse_identity_graph_replay_baseline_v1.sql` legitimately exist in protected-main history. Likewise, both `20261008080913_commercial_day_provider_proof_brain_v1.sql` and `20261008094000_commercial_day_provider_proof_brain_v1.sql` represent distinct real version identities with the same human-readable name.

## Structural correction

The existing `.github/workflows/obligation-terminal-closure.yml` now imports a single pure deterministic resolver. For each migration, it first matches the *full version plus name* against the current authoritative main tree. Only an absent exact identity may fall back to a single distinct name match; a genuine multiple-match fallback remains a hard failure. No fake migration, force merge, migration-ledger rewrite, double terminal scheduler, or skipped production-readback gate.

The existing terminal regression suite replays both real duplicate-name scenarios, one unambiguous fallback, one ambiguous fallback, and malformed identity inputs. Any future change to this authority remains protected by Required, CodeQL, native merge guards and production evidence.

## Acceptance

1. Exact candidate tests, protected Required and CodeQL pass, and protected merge occurs.
2. The existing terminal closure for #4118 is re-dispatched exactly once on the corrected main and verifies migration identities **and production evidence**.
3. The final terminal run is green only when actually completed. Historical failed/cancelled runs remain auditable.
