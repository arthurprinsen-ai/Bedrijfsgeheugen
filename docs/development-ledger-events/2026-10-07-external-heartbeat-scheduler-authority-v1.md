# 2026-10-07 — external heartbeat scheduler authority

- Production migration ledger: 605 through 20261007083900.
- Legacy commercial pg_cron owner: retired.
- External Edge runner: ACTIVE and receiving scheduled calls.
- Post-retirement failure: HTTP 503, HEARTBEAT_DURABLE_READBACK_MISSING.
- Terminal lineage debt found: 7 internal research_enrichment actions.
- Canonical terminalizer result: 7 outcomes, 7 links, 100% terminal coverage, 0 missing outcomes.
- Remaining cause: regression gate still modeled pg_cron as the only scheduler authority.
- Correction: transaction-local external-owner marker + exact-one-authority gate.
- No auth weakening, no fabricated business outcomes, no parallel scheduler owner.
