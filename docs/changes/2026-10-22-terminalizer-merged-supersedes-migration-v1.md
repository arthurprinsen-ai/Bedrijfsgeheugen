# Terminalizer #4681 — exact merged coverage for retired migration paths

The independent terminal closure run [39840439339](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39840439339) failed after the real Supabase migration provider readback passed. Root cause: a closed, unmerged superseded #4686 still declares a migration path that protected-merged #4697 delivered. The old terminalizer rejected every historical unmerged migration path without comparing against already collected merged successor paths.

Fix: only skip exact SQL paths proven delivered in an earlier merged, same-obligation descendant. Extra, mismatched-version or unknown SQL still throws `UNMERGED_SUPERSEDES_HAS_SUPABASE_MIGRATIONS`. The live Supabase migration, security rights, provenance, SHA and independent production readback checks are unchanged. No direct production DDL, replay dispatch, duplicate incident, new scheduler or new error registry.

Regression: `tests/brain-terminal-unmerged-supersedes-migration-v1.test.mjs` covers real #4686→#4697 lineage, absent migration, extra migration, version drift and unchanged provider gate.

Candidate only until exact-head Required, CodeQL, protected merge and one canonical postmerge terminalizer run genuinely succeeds. The privileged raw-occurrence INSERT and revenue cron #46 timeout remain separate unmet outcomes of existing #4681/#4215; do not mark global Brain green.
