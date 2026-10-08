# Connector activation / impact-review consistency

- Obligation: connector-activation-review-consistency-20261008-v1
- Finding: customer UI demanded completed CSRD review before a technically verified activation, while production backend recorded that review as pending and applies separate hard privacy/sovereignty checks.
- Repair: present independent technical proof versus unresolved regulatory materiality; do not disable otherwise eligible activation solely because ESRS relevance remains unassessed.
- Security boundary: the backend still decides actual activation using persisted test, entitlements, sovereignty evidence and provider checks.
- Regressions: `tests/brain-connector-crossdomain-review-ui-v1.test.mjs` and `tests/brain-connector-impact-gate-v1.test.mjs`.
- No compliance/CO2/CSRD obligation is represented as approved; production delivery and authenticated customer readback remain subject to standard checks.
