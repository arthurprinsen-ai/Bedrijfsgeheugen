# Development ledger — migration terminator
Obligation-ID: p0-4198-migration-sql-terminator-20261010
Parent-P0: #4198
Source PR: #4312, corrective PR: #4314
Date: 2026-10-10
Error: PostgreSQL 42601 near REVOKE while applying the already merged asset-lineage-preserving migration.
Action: add missing SQL semicolon between CREATE OR REPLACE FUNCTION end delimiter and ACL statements.
Mandatory controls: protected CI, unchanged service-only EXECUTE, canonical SQL runtime and Edge parity, exact OpenArt video asset preservation before any further Mira publication.
Regression: tests/brain-publication-resilience-media-and-delivery-p0-4198.test.mjs
No bypass, no second media provider, no direct publication and no fake provider media proof.
