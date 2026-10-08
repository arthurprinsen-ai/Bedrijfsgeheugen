# Connector changes are part of the One Brain cross-domain loop

New or modified tenant connectors generate a canonical change assessment covering data movement, vendors, security, AI/data governance, finance, sustainability and candidate CSRD/ESRS materiality reviews. The existing GET /api/connectors/review-queue endpoint now includes pending cross-domain assessments without revealing source configuration, identities or credentials.

The server refuses connector activation while its latest material change requires review; connector tests do **not** count as CSRD sign-off. State=Active, approval claims and impact metadata sent by the browser in draft create/update are never trusted. A material configuration change increments the connector version; administrative state/test readbacks do not artificially reset impact.

No implicit legal CSRD determination, ESG measurement, new provider provisioning, or fabricated success. Legacy connectors without a recorded impact continue under existing test/plan/sovereignty controls. Review completion still requires a trusted server-side evidence and authorization route, to be implemented separately; browser claims are not such a route.

Regression: `tests/brain-connector-impact-gate-v1.test.mjs`.
