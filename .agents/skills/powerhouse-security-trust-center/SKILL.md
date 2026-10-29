---
name: powerhouse-security-trust-center
description: Use for every material change to security, privacy, provider assurance, data sovereignty, IAM, customer trust answers or security/compliance evidence.
---

# Powerhouse Security Trust Center

Fingerprint: `powerhouse|security-trust|evidence-first|v1`.

## Invariants
- Portal is one product: `portal/`, `portal-next/` and `portal-v2/` are technical implementation paths only, never separate portals, authorities or UX shells.
- Trust surfaces are private portal capabilities: only authenticated customers and Bedrijfsgeheugen administrators may see them; demo/public access is forbidden.
- Customer trust APIs must resolve the tenant server-side; canonical Bedrijfsgeheugen scope is admin-only.
- Legacy standalone URLs may only deep-link into authenticated Portal V2 and must never render independent trust data.
- Never turn provider SOC/ISO/security assurance into a Bedrijfsgeheugen certification claim.
- Never turn legal framework relevance into a compliance conclusion without applicability evidence.
- Never keep IAM/account evidence green after its expiry; use STALE.
- Derive database posture from live catalog/privilege evidence where possible.
- Reuse the data-sovereignty heartbeat; do not create a second scheduler.
- Preserve tenant isolation and server-side tenant resolution.
- Surface answers where the customer asks them: data location, access, AI training, cross-border transfer, open findings and relevant frameworks.
- Unknown is a valid result and is never silently promoted to verified.
- Production/provider readback is required before LIVE_BEWEZEN.

## Canonical runtime
- `portal-v2/?page=trust-center`
- `portal-v2/?page=data-ai-passport`
- `portal-next/security-trust-center.js`
- `netlify/functions/security-trust.mjs`
- `supabase/functions/portal-state-eu/index.ts`
- `public.security_trust_snapshot_v1`
- `public.security_database_posture_v1()`
- `public.powerhouse_refresh_data_sovereignty_v1()`

## Tenant model choice → live passport (2026-10-20)
Fingerprint: `portal|ai-passport|tenant-model-choice-live-projection|v1`.
- Bind passport to existing tenant `portal.aiModelPreferences`, same-tenant sovereignty AI registry, and `/api/tenant-ai-activation-status`.
- Requested preference, registered route, ready-for-test and actual execution remain separate claims.
- Reuse canonical domain-state/BusinessInput/organism writes and the existing sovereignty Heartbeat; no second scheduler.
- Revalidate after successful save ACK, including when mounted during a save. Hide readiness for pending/changed selections.
- Authoritative runtime events force a coalesced refresh; passive focus/visibility is throttled. Queue one follow-up during a read.
- Clear details on identity change; abort/dispose and reject late responses on navigation.
- Even admin model preferences require same-tenant evidence, never a join to canonical admin inventory.
- Regression: `tests/brain-portal-ai-passport-model-binding-v1.test.mjs`.

## Incident egress, immutable logging and historical-copy assurance (2026-10-29)

INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1

- Treat **public GitHub PRs and branches**, code-review diffs, Action artifacts, Netlify previews, webhook/agent tools, email and social providers as **external egress**. Unapproved blog drafts, internal Brain/ledger data, tasks, tenant context and credentials MUST NOT be staged there.
- Before the last egress writer, enforce explicit approval, content classification, server-side tenant and recipient/destination authorization, deterministic allowlist and duplicate prevention. Missing evidence is a denial, not a deferred green.
- For each material attempt, persist a sanitized, idempotent audit receipt in **existing private ONE BRAIN** with UTC time, incident fingerprint, owner, source SHA, action, destination class, approval/authorization decision, provider request ID (if one exists), readback, failure class, remediation and regression proof. Do not publish raw drafts, tokens, personal identifiers or internal evidence in PRs, previews or issue comments.
- Keep separate claims for `TECHNICAL_CONTAINED`, `HISTORIC_PUBLIC_COPIES_UNRESOLVED` and fully `RESOLVED`. Closing a PR, deleting its source branch or deploying a fix does **not** delete public historical PR diffs, cached preview assets, Git objects or third-party copies. Preserve original private evidence and re-evaluate the residual exposure.
- Privacy controller classification, independent recipient attribution and provider access logs are distinct evidence types. Absence of a match or a bounded regex scan is never proof of exhaustive absence; reassess if contrary evidence emerges.
- A security decision or failed release must update the same incident/failure fingerprint, its bounded recovery obligation, negative test and preventive skill. Keep the original executor running only on independently authorized lanes; never loosen GitHub Required/BRAIN/CodeQL, approval, OAuth or protected merge to get green.
- Regression: `tests/brain-social-delivery-agent-handoff-20261029.test.mjs`; factual production authorization evidence remains in the existing private incident register, not this public skill.
