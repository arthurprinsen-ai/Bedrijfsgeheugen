# LinkedIn company provider-create acknowledgement authority

Date: 2026-09-28  
Fingerprint: `linkedin-company-create-ack-over-readback-v1`

## Incident

A LinkedIn company post was successfully created through Composio and returned the durable provider ID `urn:li:share:7510281040192602112`. The post was visibly live on the Bedrijfsgeheugen company page. Subsequent organization/readback calls returned 401/403 because those read/admin capabilities were permission-limited.

Powerhouse incorrectly treated that readback limitation as evidence that the publication itself had failed.

## Root cause

The runtime conflated three different truths:
1. **write truth** — did LinkedIn accept the create request and return a durable post URN?
2. **readback truth** — can the current token retrieve the exact post through the API?
3. **admin/ACL truth** — can the current token inspect organization administration state?

Those capabilities are not equivalent. A successful provider write cannot be negated by a later read/admin permission failure.

## Permanent contract

For LinkedIn company publishing:
- successful `LINKEDIN_CREATE_LINKED_IN_POST` plus a valid `urn:li:share:...` or `urn:li:ugcPost:...` closes the publication as `PUBLISHED`;
- persist the provider URN immediately;
- set `provider_create_success=true`, `provider_publication_ack_verified=true` and `republish_forbidden=true`;
- exact readback remains useful verification enrichment, but it is not required to preserve publication state;
- 401/403 from post readback or organization ACL inspection must not downgrade the post to failed/blocked;
- recovery may only reconcile the existing URN;
- user-visible company-page evidence may upgrade provider truth when API readback is unavailable;
- repeated OAuth reconnection is forbidden solely to verify an already-created provider post.

## Daily no-gap impact

The daily social closed loop now distinguishes provider-write acknowledgement from readback capability. This removes the failure mode where a live company post was incorrectly classified as a silent publication failure and repeatedly pushed through auth recovery.

The anti-duplicate fence remains authoritative: once a provider-created external ID exists, no replacement post may be created.

## Regression proof

Canonical test surface: `tests/brain-linkedin-composio-authority.test.mjs`.

Related policy surfaces:
- `.agents/skills/linkedin-composio-publisher/SKILL.md`
- `AGENTS.md`
- `brain/learning/2026-09-28-linkedin-provider-write-ack.json`
