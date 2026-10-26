# Customer Data Sovereignty API – audit metadata minimization

Problem: the customer sovereignty UI hides actors and internal event references, but the previous API GET/POST returned the entire last_change_impact object, including actor and before/after policy state. Browser network responses must follow the same tenant-safe disclosure contract as the UI.

Solution: sanitize only customer API responses, preserving the canonical EU audit record and restricted internal administrator readback. For last_change_impact expose review status, reviewed change category and ESRS review subject labels with unknown legal applicability/materiality and no measured values. Remove policy.updated_by from the public tenant response. No new portal or shadow store.

Evidence: `tests/brain-sovereignty-customer-api-redaction-v1.test.mjs` and protected production readback required. Scope does not activate any AI provider, assert CSRD applicability or close open Brain obligations.
