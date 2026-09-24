# 2026-09-24 — Powerhouse 50 Outcome Ledger / Verified Value Created P0

- Fingerprint: `powerhouse-50-outcome-ledger-verified-value-p0-v1`
- Obligation: `powerhouse-50-outcome-ledger-verified-value-p0-v1`
- Scope: Brain outcome/value ledger + portal company cockpit
- Root cause: realized value existed, but was not canonically attributable to the `PH-Pxxx` problem that triggered the action.
- Change: verified value is now grouped by canonical Problem ID and projected into the company cockpit as “Verified Value Created”.
- Evidence rule: value counts only when execution, verification and at least one evidence reference are present.
- Safety: non-canonical/local problem identifiers do not create a parallel value taxonomy.
- Regression: `tests/brain-powerhouse-outcome-ledger-problem-value.test.mjs`
- Completion rule: protected merge, production deployment and production lineage/readback are mandatory before `LIVE_BEWEZEN`.
