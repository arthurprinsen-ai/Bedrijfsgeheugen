# Development ledger event — 2026-10-10 P0 #4198
- Incident: Orchestrator load-context failed with DB_TABLE_REJECTED after new LinkedIn consumed-capability ledger read was introduced.
- Evidence: bg_gezondheid runtime error, 2026-10-10 10:17:12 UTC.
- Repair: explicit direct Postgres allowlist admission for existing read-only capability ledger.
- Safety: keep current daily publication authority consumed and immutable, never create duplicate LinkedIn posts to compensate.
- Tests: tests/brain-linkedin-capability-ledger-read-admitted-p0-4198.test.mjs.
- Status: candidate pending protected CI, production deployment and provider proof.
