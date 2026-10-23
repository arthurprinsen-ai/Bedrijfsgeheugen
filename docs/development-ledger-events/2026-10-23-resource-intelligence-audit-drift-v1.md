# Append-only delivery evidence — Resource Intelligence source parity

- **2026-10-23; canonical owner:** [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661)
- **Fingerprint:** `ci|resource-intelligence|audit-obsolete-migration-path-and-units|20261023-v1`
- **Observed true provider failure:** [Resource Intelligence run #39937291073](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39937291073), job `120359836809`: missing migration version `20260917093000`.
- **Root cause:** read-only audit contained a stale path and deprecated physical unit vocabulary. Canonical repository migration and existing tests share `20260917094812`, and read-only production migration history verified the same version present. No incorrect DDL replay required.
- **Scope:** one audit script, one new canonical `tests/brain-*.test.mjs` regression (existing original contract test unchanged), one Brain learning entry, one change note, this append-only ledger. No migration SQL, production database or GitHub security rule changed.
- **Local source contract check:** canonical migration present (immutable Git blob SHA `51c13c5c298523278dad440da8dbbbc3ab11c977`); kWh/liters/kgCO₂ nullable aggregation filters and source lineage observed, no forbidden synthetic zero branch.
- **Independent release gates:** new candidate's Required / CodeQL and the original Resource Intelligence schedule run remain to be verified before claiming production recovery.
- **Autonomous learning rule:** verify artifact identity/version and source vocabulary from canonical committed migrations before diagnosing a resource error; dedupe against Brain failure fingerprint. Never create or reapply a historical production migration merely to placate an audit. Preserve BG169 and existing release gates.
- **Improvement claims:** speedup, savings and model-quality gain UNPROVEN until measured against real provider outcomes.

- **Admission correction:** First Required #39938691372 refused an evaluation path not prefixed with the canonical `tests/brain-` test namespace. This candidate now preserves the original standalone resource contract and registers an executable canonical Brain test for historical replay, shadow and canary. No admission rule waived.
