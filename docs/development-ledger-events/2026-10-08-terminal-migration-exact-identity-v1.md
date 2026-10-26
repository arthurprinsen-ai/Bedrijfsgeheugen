# Delivery event — 2026-10-08

Obligation-ID: terminal-migration-version-identity-20261008-v1
Cause: `SUPABASE_MIGRATION_CANONICAL_IDENTITY_AMBIGUOUS` in terminal closure run 37756633885 for protected-merged PR #4118.
Scope: one existing terminal workflow, one pure resolver, one regression file, Brain learning, change note, this ledger event.
Mutation owner: GitHub protected PR only.
Gate policy: exact version+name > unique same-name alias; genuine ambiguity fails closed. Do not edit applied production migration SQL, do not fake historical mapping, and do not claim terminal green until authentic readbacks.
Expected evidence: Required, CodeQL, protected merge, canonical re-run #4118, Supabase ledger and Brain terminal.

Terminal retry evidence: [run 37757775283](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37757775283) failed `ReferenceError: resolveTerminalMigrationIdentities is not defined`. Corrected import placement inside migration-scope Node heredoc; added executable-scope source regression to preclude repeat. One existing terminal workflow, no extra scheduler or provider side effect. Must pass protected CI and terminal retry of #4118 before LIVE_BEWEZEN.
