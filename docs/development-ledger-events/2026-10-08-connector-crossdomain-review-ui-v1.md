# Connector review visibility implementation

- Obligation-ID: connector-crossdomain-review-ui-20261008-v1
- Existing state: connector builder and existing tenant review-queue, PR #4160 guarded activation.
- Changed: monitor renders connector-scoped pending privacy/security/finance/CSRD candidate review; activation CTA disabled until proof.
- Evidence: `tests/brain-connector-crossdomain-review-ui-v1.test.mjs`; synthetic XSS/tenant connector isolation checks.
- Release readback: pending protected merge and exact Netlify production version.
