# LinkedIn Composio capability proof v1

Fingerprint: `linkedin-composio-capability-proof-v1`

The connected account is discovered through Composio using the `linkedin` toolkit. Capability discovery is intentionally read-only.

Checks:
1. exactly one active LinkedIn connected account;
2. personal author identity via `LINKEDIN_GET_MY_INFO`;
3. organization/page administrator capability via `LINKEDIN_GET_COMPANY_INFO`;
4. canonical Brain state with separate `personal_ready` and `company_ready`.

A personal LinkedIn connection is never sufficient evidence for company-page posting. Organization publishing may require organization scopes and administrator access.
