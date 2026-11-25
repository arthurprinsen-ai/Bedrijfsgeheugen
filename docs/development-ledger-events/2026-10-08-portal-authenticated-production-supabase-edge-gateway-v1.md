# 2026-10-08 — Portal authenticated production Supabase Edge gateway recovery

- Obligation: `portal-authenticated-production-supabase-edge-gateway-v1`
- Prior exact production SHA: `c41045c3ead33371e4c1a7c097ca9c660e238837`
- Prior Netlify deploy: `6ac6b6816fbc2f0008862171`
- Prior Production Release Readback: `37688134818`
- Observed failure: `AUTHENTICATED_PORTAL_API_HTTP_503`
- Proven auth state: real temporary Netlify Identity user/JWT reached the protected endpoint.
- Remaining architecture defect: privileged Supabase reads required a Supabase master credential in the Netlify runtime.
- Recovery: route entrepreneur intelligence through the existing `BG_PORTAL_EU_SERVICE_TOKEN` -> `portal-state-eu` authority and keep privileged database access inside Supabase.
- Tenant rule: Netlify derives tenant from verified Identity; the gateway adapter rejects any returned tenant mismatch.
- Security rule: no Supabase service-role/secret key in `portal-ondernemersdata`, no new secret, no browser credential exposure, no RLS weakening.
- Terminal state remains withheld until exact-main Supabase + Netlify deployment and authenticated production proof `PROVEN`.
