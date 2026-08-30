# Make Scenario Admission Validator — Evidence 2026-08-30

## Purpose
Turn chat-proven Powerhouse/Make lessons into a deterministic fail-closed admission gate for new/materially changed scenarios.

## Artifacts
- `config/make-scenario-admission-contract.json`
- `tools/make-scenario-admission-validator.mjs`
- `tests/make-scenario-admission-contract.test.mjs`
- `tests/make-scenario-admission-validator.test.mjs`

## Enforced learning classes
The contract includes blocking rules for domain eligibility on generic Datahub sources, dedupe before expensive work, bounded reads, field projection where supported, cheap deterministic gates before AI/API/inventory, AI justification, polling rationale, API semantics probes, shadow-before-cutover, semantic outcome verification, rate-limit discipline, shared learning writeback and protected-metric rollback.

It explicitly references proven fingerprints including:
- `bg145|control-plane-semantic-corruption|commercial-writeback-cross-domain`
- `bg89|generic-datahub-watch|noncommercial-record-scoring`
- `make|scenario-list|array-query-serialization`
- `make|datastore|exact-get-not-supported`
- `make|notion-json|mapped-pipe-escaping`
- `make|concurrency|bg14-overlapping-ai-runs`
- `agents|shared-context|full-json-token-ballast`
- Make 429 retry-pressure patterns.

## Local deterministic validator evidence
The execution sandbox could not clone GitHub because DNS for `github.com` was unavailable. No false claim of a full repository test is made.

An isolated Node fixture containing the same validator behavior was executed with `node --test`.

Result:
- tests: 4
- passed: 4
- failed: 0
- cancelled/skipped: 0

Verified behaviors:
1. incomplete scenario declaration => `BLOCK_PROMOTION`;
2. generic Datahub source without explicit domain eligibility => blocked;
3. missing AI/deterministic-path justification => blocked;
4. complete bounded shadow candidate => `ADMISSION_PASS`.

## Open verification obligation
The complete branch tests, including all rule IDs and mandatory regression-case assertions, have not yet executed in repository CI because the isolated docs branch currently has no GitHub Actions run. Before integrating this validator into BG169/PH11 or promoting it as a production gate, run the exact repository test suite on the exact candidate SHA and preserve the workflow evidence.

## Regression contract
- Never downgrade a missing block requirement to warning-only to make promotion green.
- Validator pass is admission evidence, not proof of business/runtime outcome; normal protected runtime/outcome gates remain required.
- New chat-proven failure classes must be added to the contract/regression set before related future promotion.
