# Tenant AI and CSRD changes feed canonical Brain review obligations

When an AI model, provider, private cloud, document storage or data-processing location changes, the already audited cross-domain impact event now opens one `CROSS_DOMAIN_REVIEW` in the existing `brain_obligations` table. This makes follow-up traceable in the same Brain lifecycle as other change obligations, rather than a disconnected status-only portal alert.

- One row per tenant policy version and change, with unique obligation identity and `OPEN` state.
- The source ledger remains immutable; known affected domains, candidate ESRS topics and an exact change reference are recorded. No secrets, prompts or raw customer files are copied.
- Nothing is marked `FULFILLED` or `COMPLIANT` without evidence; CSRD applicability and energy/CO₂ impact are **UNDETERMINED**.
- Existing historical events are replayed idempotently. No second scheduler or commercial executor is introduced.
- Client or Netlify cannot directly invoke the trigger function. The existing authenticated Supabase Edge policy path writes the source event.

**Limit:** A canonical Brain review obligation is **not** proof of dispatch to a human reviewer or of authorized sign-off; that remains a distinct evidence/authorization step. Inference in external cloud/on-prem remains blocked until real runtime verification and credentials exist.

Regression: `tests/brain-sovereignty-impact-obligation-v1.test.mjs`.
