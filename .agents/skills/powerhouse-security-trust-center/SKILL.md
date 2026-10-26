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
