# Netlify deployment evidence — delivery ledger

- Obligation: `netlify-evidence-status-20261025`; candidate PR #4947.
- New pure classifier: `tools/delivery/netlify-deployment-applicability.mjs`; regression: `tests/netlify/deployment-evidence-status.test.mjs`.
- Initial Required run 40227191148 failed because test path was not classified. Test moved under the existing `tests/netlify/` backend lane.
- Next Required run 40227353645 admitted the candidate, but rejected missing `activity_ledger`, `brain_learning`, and `human_documentation` integration evidence; CodeQL succeeded.
- This same candidate now includes those three evidence files. No runtime deployment, dashboard integration, successful full CI, or production outcome asserted.
- Acceptance: exact-head Required/CodeQL, protected merge, readback and explicit deploy applicability separation. Preserve existing security gates.
