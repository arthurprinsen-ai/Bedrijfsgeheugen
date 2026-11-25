# Customer-facing AI and CSRD cross-domain change review

The canonical Data Sovereignty Control Plane now presents pending cross-domain reviews from the policy last_change_impact field. Customers see that AI model, provider and data-location edits may require additional evaluation of GDPR/privacy, information security, financial and sustainability impact. Only review-required ESRS topics are named. The UI does not imply legal CSRD applicability, confirmed environmental measurements, approved runtime provisioning, or any completed audit. This reuses the existing compliance page; no competing portal is created.

The UI deliberately omits internal actor identity and audit event IDs. The customer read model must always be tenant-authorized by the existing Netlify Identity gateway. Regression: `tests/portal-ai-csrd-review-visibility.test.mjs`.
