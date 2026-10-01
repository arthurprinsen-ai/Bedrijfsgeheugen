# 2026-10-01 — Portal V2 source API authentication recovery

- Surface: Portal V2 → Actueel & externe data → Bronnenbibliotheek.
- Incident: `/api/portal-ondernemersdata` returned HTTP 401 because the browser request omitted the Netlify Identity bearer token.
- Root cause: client/server authentication contract mismatch; the function required `getUser()` while the client sent only same-origin credentials.
- Recovery: reuse the existing Portal V2 identity widget, obtain the current JWT, send it as `Authorization: Bearer …`, and keep the service-role key server-side.
- Guard: automated test asserts the bearer header and customer-safe 401 handling.
