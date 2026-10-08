# Tenant AI cross-domain review obligations

- Obligation-ID: ai-cross-domain-review-portfolio-20261008-v1
- Reuses canonical tenant data sovereignty change impact; adds a derived read-model, not a second source of truth.
- Security: exact tenant match in projection, authenticated tenant selection in existing Netlify endpoint, no raw sensitive evidence/configuration in review list.
- Truth: all domain review tasks NEEDS_EVIDENCE. Candidate ESRS labels are not CSRD legal applicability or CO2 measurements.
- Integration: Netlify /api/data-sovereignty GET/POST and portal-next/data-sovereignty-panel.js.
- Regression: `tests/brain-cross-domain-review-portfolio-v1.test.mjs`.
- External proof: production release and logged-in customer read/write/readback pending at PR creation. Provider adapters remain separately open in #4152.
