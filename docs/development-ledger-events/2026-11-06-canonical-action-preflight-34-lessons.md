# Delivery ledger — 2026-11-06 canonical action preflight

- Fingerprint: `delivery|preflight|shared|action-guard-not-connected-to-preflight-20261106-v1`.
- Owner: existing `tools/delivery-preflight.mjs`; existing action guard and learning registry.
- Source: merged PRs #5490 and #5493; independent code inspection showing the original guard was not called from the central preflight.
- Change: 15 more action triggers (34 total), central preflight integration, regression test, AGENTS instruction.
- Failure prevented: a matching PROVEN lesson stored as documentation but never consulted before a change.
- Proof required: exact-head Required and CodeQL, protected merge, original main tree readback; operational agent usage and outcome separately.
- Safety: acknowledgement alone is NOT provider/action proof, and neither a green preflight nor merged PR proves all Powerhouse processes are green.
- Status: CODE_CANDIDATE until protected checks pass.
