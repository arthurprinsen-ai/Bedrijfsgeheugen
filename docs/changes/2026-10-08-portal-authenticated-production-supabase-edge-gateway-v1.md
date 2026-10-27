# Portal authenticated production proof — Supabase Edge gateway authority

## Observed production truth

PR #4101 corrected the serverless environment API, but exact production main `c41045c3ead33371e4c1a7c097ca9c660e238837` still returned `AUTHENTICATED_PORTAL_API_HTTP_503` in Production Release Readback run `37688134818`.

That proves the remaining problem is not Netlify Identity. The temporary Identity user and JWT reached the protected endpoint; the endpoint still depended on a privileged Supabase credential being distributed into Netlify.

## Structural repair

The Portal already has a hardened server-to-server authority path:

`Netlify Function -> BG_PORTAL_EU_SERVICE_TOKEN -> portal-state-eu -> Supabase privileged client`.

This recovery reuses that path.

- `portal-ondernemersdata` keeps Netlify Identity authentication and server-derived tenant resolution.
- It no longer reads or transmits a Supabase service-role/secret key.
- `_portal-supabase-store` gains one tenant-checked `entrepreneur_intelligence` gateway method.
- `portal-state-eu` performs the existing Source Universe, signals, company impact and action reads inside Supabase.
- The returned payload preserves the existing Portal contract.
- A mismatched tenant returned by the gateway fails closed.

## Security result

The database master credential remains inside the Supabase runtime. Netlify only needs the existing service-to-service gateway token. No browser receives either credential, no RLS policy is weakened and no test-only authentication path is introduced.

## Terminal truth

This is not live-proven until protected merge, exact production deployment of both runtimes and the canonical authenticated production receipt is `PROVEN` with HTTP 200, matching tenant scope, valid payload shape and deleted synthetic user.
