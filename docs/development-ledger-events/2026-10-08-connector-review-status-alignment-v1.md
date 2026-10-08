# Connector activation / impact-review consistency

- Obligation: connector-activation-review-consistency-20261008-v1
- Finding: customer UI demanded completed CSRD review before a technically verified activation, while production backend recorded that review as pending and applies separate hard privacy/sovereignty checks.
- Repair: present independent technical proof versus unresolved regulatory materiality; do not disable otherwise eligible activation solely because ESRS relevance remains unassessed.
- Security boundary: the backend still decides actual activation using persisted test, entitlements, sovereignty evidence and provider checks.
- Regressions: `tests/brain-connector-crossdomain-review-ui-v1.test.mjs` and `tests/brain-connector-impact-gate-v1.test.mjs`.
- No compliance/CO2/CSRD obligation is represented as approved; production delivery and authenticated customer readback remain subject to standard checks.

- Main integration readback: candidate reconciled against non-overlapping main commit `9c7c21a08ad6c6125b9302431bb5489b9bcaf717`; refreshed required CI must revalidate the exact final head.
