# 2026-10-07 — Portal authenticated production 503 serverless env repair

- Obligation: `portal-authenticated-production-503-serverless-env-v1`
- Observed exact production SHA: `e30cf09cf7a1f0bddffd334e191fcb0c2021b7ea`
- Netlify deploy: `6ac6b2bc943e4e00084ffce2`
- Production Release Readback: run `37686181317`
- Observed proof failure: `AUTHENTICATED_PORTAL_API_HTTP_503`
- Fail-closed endpoint path: `SUPABASE_SERVICE_KEY_MISSING`
- Root cause class: `EDGE_ENV_API_USED_IN_SERVERLESS_FUNCTION`
- Historical recurrence: `brain/learning/2026-09-21-netlify-serverless-env-api-v1.json`
- Repair: serverless runtime env access changes from `Netlify.env` to `process.env`; existing credential names and authentication boundary remain unchanged.
- Prevention: canonical authenticated-production-proof regression forbids the Edge env API at this serverless boundary.
- Security: no credential value, new secret, permanent user, auth bypass or service-role client exposure is introduced.
- Terminal state remains withheld until exact-main authenticated production proof becomes `PROVEN`.
