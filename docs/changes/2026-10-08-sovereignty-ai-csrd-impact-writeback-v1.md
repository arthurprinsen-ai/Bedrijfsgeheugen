# One Brain: AI sovereignty changes affect CSRD and all dependent controls

A change in tenant AI model, provider, storage or inference region now generates a canonical cross-domain impact assessment before saving sovereignty policy.

**Authority boundary:** Netlify Identity supplies authenticated tenant context, One Brain supplies the dependency impact graph, Supabase Edge validates exact before/after policy values and optimistic version, and a database trigger appends a tenant-scoped audit record in the same transaction as the policy update. Existing sovereignty snapshot automatically includes last_change_impact through the policy row.

**Evidence semantics:** ESRS E1, E5, G1 etc. are candidate *reviews* only. Materiality, regulatory applicability and measured emissions remain UNDETERMINED. The selected AI provider is NOT activated by the policy write. No secrets are stored in assessment data. No cross-tenant query access to the ledger is granted.

**Operational caveat:** this does not provision a cloud/on-prem runtime or automatically clear unresolved regulatory reviews. Production requires merged Edge function and SQL migration plus authenticated customer readback. Backfill of historical policy edits is not inferred.

**Regression:** `tests/brain-sovereignty-cross-domain-persistence.test.mjs`.
