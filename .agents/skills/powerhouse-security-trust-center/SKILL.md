---
name: powerhouse-security-trust-center
description: Use for every material change to security, privacy, provider assurance, data sovereignty, IAM, customer trust answers or security/compliance evidence.
---

# Powerhouse Security Trust Center

Fingerprint: `powerhouse|security-trust|evidence-first|v1`.

## Invariants
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
- `portal-next/security.html`
- `portal-next/security-trust-center.js`
- `netlify/functions/security-trust.mjs`
- `supabase/functions/portal-state-eu/index.ts`
- `public.security_trust_snapshot_v1`
- `public.security_database_posture_v1()`
- `public.powerhouse_refresh_data_sovereignty_v1()`


## Least-privilege client exposure
- Direct client privilege is deny-by-default for `SECURITY DEFINER` functions, internal intelligence views and materialized views.
- A `SECURITY DEFINER` function may be executable by `anon` or `authenticated` only when a browser/client use-case is explicitly documented, tenant/auth boundaries are enforced, and runtime access evidence proves the route is needed.
- Internal triggers, cron routines, backfills, publisher/sales routines and server-side intelligence helpers must be service-role-only.
- A view without `security_invoker` is high-risk only when a client role can actually SELECT it; private definer views remain observable but are not falsely classified as client exposure.
- Before revoking existing client privileges, check call graph plus recent PostgREST access evidence; preserve service-role and database-owner execution paths.
