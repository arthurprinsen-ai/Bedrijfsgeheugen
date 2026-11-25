# Customer-visible AI → CSRD review status

- Obligation-ID: customer-ai-csrd-review-visibility-20261008-v1
- Existing-state-first: reuse portal-next/data-sovereignty-panel.js and its existing tenant policy read model.
- Added: pending impact notification with known ESRS review labels, no green applicability or emissions claim.
- Regression: `tests/portal-ai-csrd-review-visibility.test.mjs` and customer-only no-internal-metadata assertion.
- Production readback: pending protected merge and deployment of both UI and Edge/database policy writeback.
