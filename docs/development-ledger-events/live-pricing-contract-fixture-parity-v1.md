# Live pricing contract fixture parity — development ledger

- Fingerprint: `live-pricing-contract-fixture-parity-v1`
- Root cause: positive test fixture drifted behind the new production pricing contract.
- Fix: add Build and the value/payback statement to the positive fixture.
- Prevention: production-contract changes and positive fixtures move together.
- Evidence: canonical live shell contract + normal Production Release Readback.
