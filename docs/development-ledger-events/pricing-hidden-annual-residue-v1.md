# Pricing hidden annual residue — development ledger

- Fingerprint: `pricing-hidden-annual-residue-v1`
- Obligation: `pricing-annual-residue-removal-v1`
- Root cause: annual pricing was hidden rather than fully removed from canonical HTML.
- Fix: remove `.jr/#tj` pricing state and the hidden € 49.950 Enterprise annual amount.
- Prevention: build-integrity and live-readback fail closed if the legacy hidden annual state returns.
- Regression: `tools/site-shell/test-live-contract.mjs`.
- Production truth: only valid after exact-SHA deployment and live `/prijzen` readback.
