# Cross-domain connector review visibility

The existing customer connector-builder monitor now surfaces pending connector-specific cross-domain reviews using the same review queue already used by the connector API. It presents domain groups and possible ESRS topics only, without audit IDs, reviewer identities, prompts, or secret-bearing configuration.

While a connector's current changeImpact remains REVIEW_REQUIRED, the activation stage explains why activating is unsafe and disables the action even when the document test has passed. The server guard from PR #4160 remains authoritative. There is no fabricated CSRD compliance or emissions assertion.

Regression: `tests/brain-connector-crossdomain-review-ui-v1.test.mjs`. Actual regulatory materiality review, independent evidence verification and approved provider provisioning remain separate prerequisites; this UI does not silently clear them.
