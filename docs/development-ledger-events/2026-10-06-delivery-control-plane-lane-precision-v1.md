# Development ledger — delivery control-plane lane precision v1

- Date: 2026-10-06
- Observed waste: #3980 changed workflows/scripts/tests/docs only but the website classifier returned `requires_preview=true`, forcing browser assurance.
- Root cause: broad shared-path expansion plus missing explicit ownership for recent control-plane files.
- Fix: explicit backend/automation scoping for known delivery infrastructure and matching website non-artifact ownership.
- Safety: unknown paths remain broad/fail-closed; real website artifacts still require preview.
- Regression: `tests/brain-delivery-control-plane-lane-precision-v1.test.mjs`.
