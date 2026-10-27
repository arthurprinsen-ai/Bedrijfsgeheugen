# 2026-10-27 — Mira-radar en materializer: ondernemerscontract

- Root cause confirmed: evergreen consumer queries without news window plus a consumer-only materializer that forbids the business bridge; orchestrator contract (#4267) contradicted it.
- Reused existing radar, materializer, freshness gate and frozen-winner resolver. No new scheduler, provider path or catalog.
- Tests: `tests/brain-mira-entrepreneur-radar-materializer-20261027.test.mjs`.
- Supersedes #4265. Live proof requires deploy of radar and migration, then fresh signals and a frozen winner readback.
