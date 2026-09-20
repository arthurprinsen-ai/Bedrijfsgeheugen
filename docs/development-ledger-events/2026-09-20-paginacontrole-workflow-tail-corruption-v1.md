# Development ledger — paginacontrole workflow corruption recovery

- Date: 2026-09-20
- Fingerprint: `paginacontrole-workflow-tail-corruption-v1`
- Failure class: `CI`
- Root cause: duplicated YAML fragments were appended after the canonical final workflow step, causing GitHub to reject the workflow before job creation.
- Recovery: restored one canonical workflow document and added structural regression coverage.
- Prevention: treat zero-job workflow failures as parse/configuration failures first; enforce one canonical workflow body and terminal tail.
- Evidence: `.github/workflows/paginacontrole.yml`, `tests/brain-paginacontrole-workflow-integrity.test.mjs`, Brain learning with the same fingerprint.
- Delivery state: candidate pending protected gates and main readback.
