# Learning canonicalization gate recovery v1

- Obligation-ID: powerhouse-learning-canonicalization-gate-v1
- Recovery date: 2026-09-19
- Source PR: #2289
- Purpose: enforce evaluation before canonical skill projection without overwriting newer current-main workflow changes.
- Recovery strategy: rebuild from exact current main, restore only the missing learning gate/script/tests/migrations, merge the gate into the current Powerhouse Skill Projection workflow, and preserve all newer control-plane behavior.
- Safety: no stale shared-file overwrite; exact-head Required + BRAIN + CodeQL + Skill Projection remain mandatory before merge.
- Terminal completion still requires protected merge, current-main/production readback, durable learning projection, and writer-lease closure.
