# Customer evidence review portfolio UI

- Obligation-ID: ai-cross-domain-review-portfolio-ui-20261008-v1
- UI path: portal-next/data-sovereignty-panel.js
- API authority: existing authenticated Netlify /api/data-sovereignty, backend #4184.
- Security: escape task labels and ESRS names, no sensitive audit IDs, no client-side authority.
- Regulatory truth: all tasks pending; CSRD/ESRS legal applicability and materiality not assumed.
- Regression: `tests/brain-portal-ai-cross-domain-review-portfolio-v1.test.mjs`.
- Merge/release readback and authenticated customer journey remain required.
