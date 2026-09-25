# LinkedIn personal created-URN preservation v1

Date: 25 September 2026  
Fingerprint: `linkedin-personal-created-urn-preservation-v1`

## Incident

The personal LinkedIn Composio transport performed the external create call before exact readback. On 25 September the readback endpoint returned `Forbidden`. The old implementation then threw from the combined create/readback function before the returned post URN was persisted into `delivery_ref` or the publication obligation.

This creates an unsafe ambiguity: the provider may already have accepted and published the post while the canonical database has no exact identifier for reconciliation.

## Root cause

Create success and readback truth were treated as one atomic success condition even though they are two different provider facts. Company LinkedIn already preserved its post URN when readback failed; personal LinkedIn did not.

## Prevention contract

After `LINKEDIN_CREATE_LINKED_IN_POST` returns an exact post URN for the personal lane:

- preserve that URN regardless of later readback availability;
- record `provider_create_success=true`;
- if exact readback cannot be proven, keep `provider_truth_verified=false`, `verification_pending=true`, and `republish_forbidden=true`;
- persist the same URN into both the channel decision and publication obligation;
- reconcile only that exact URN;
- never create a replacement post for the same daily claim because readback is unavailable;
- never route the claim through Buffer.

The existing 25 September personal claim has no retained URN because it ran through the old code. It therefore remains fail-closed and must not be retried blindly.

## Evidence

Regression coverage is in `tests/brain-linkedin-composio-authority.test.mjs`. The reusable operational rule is in `.agents/skills/linkedin-composio-publisher/SKILL.md`.
