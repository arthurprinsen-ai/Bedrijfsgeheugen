# Supabase migration-history terminal closure — #3742

This candidate is the final fail-closed closure lane for issue #3742.

Proven before this candidate:
- canonical migration-history recovery PR #3766 merged as `ccdf134ca4de73e547e54c9de00298d771f87be5`;
- hosted Supabase Preview for #3766 completed successfully;
- trusted supported repair run `37426469433` completed successfully with zero post-repair drift;
- `supabase/migration-history.lock.json` contains 568 production-applied identities, including all four replay baselines;
- terminalizer routing was corrected and the restored workflow from #3822 terminalized successfully.

This candidate performs no production DDL/DML and no migration-history repair. Its purpose is to bind those proofs to one fresh exact-head delivery candidate. Closure still requires this candidate's Supabase Preview, Required/CodeQL gates, protected merge and post-merge terminalizer to complete successfully.

## v8 exact-head correction

PR #3824 merged before the skill-projection check was green and is therefore not accepted as terminal proof. The v8 successor moves the historical replay regression into the canonical `tests/brain-*` namespace, fixes its JavaScript regex literals, and requires the complete exact-head checkset before auto-merge is enabled.
