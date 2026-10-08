# Cross-domain connector review visibility

The existing customer connector-builder monitor now surfaces pending connector-specific cross-domain reviews using the same review queue already used by the connector API. It presents domain groups and possible ESRS topics only, without audit IDs, reviewer identities, prompts, or secret-bearing configuration.

While a connector's current changeImpact remains REVIEW_REQUIRED, the activation stage keeps the review visibly pending. Technical activation is allowed only when independently verified test evidence is present and the server passes the existing entitlement, sovereignty and connector-safety gates; the pending CSRD/ESRS review is not itself proof that activation is illegal. Technical activation does not clear the outstanding impact review or assert regulatory compliance. The server checks from PR #4160 remain authoritative. There is no fabricated CSRD compliance or emissions assertion.

Regression: `tests/brain-connector-crossdomain-review-ui-v1.test.mjs` (technical evidence present and absent). Actual regulatory materiality review, independent evidence verification and approved provider provisioning remain separate prerequisites; this UI does not silently clear them.
