# P0 #4215 — veilig onderscheid tussen echte upstream-502-oorzaken

Datum: 20 oktober 2026. Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215

## Productieverificatie
Supabase portal-state-eu ACTIVE v219, beide portal-sortindexen live. PostgreSQL had nul statement/startup-time-outs in de 13:30 en 13:35 UTC intervallen. Maar Production Release Readback run #39430198530 poging 3 was FAILED: 30 opeenvolgende geauthenticeerde portaalproeven eindigden met AUTHENTICATED_PORTAL_API_HTTP_502. Netlify production-config wijst naar het juiste Supabase-project en bevat een geconfigureerd service-token. Deze waarden worden niet opgenomen in bewijsbestanden.

## Afgebakende reparatie
Alleen de bestaande _portal-supabase-store.mjs en portal-ondernemersdata.mjs zijn aangepast. Scope.authenticatedTenant moet aanwezig zijn, anders fail closed. De route logt alleen de beperkte categorie CONFIG_MISSING, UPSTREAM_DEADLINE, UPSTREAM_HTTP_401/403/429/500/502/503/504, TENANT_SCOPE_MISMATCH, UPSTREAM_RESPONSE_SHAPE, UPSTREAM_NETWORK_FETCH of UPSTREAM_UNKNOWN_FAILURE. Ruwe foutmeldingen, tenant IDs, tokens en payloads worden nooit gelogd. HTTP-status en error no-store blijven hetzelfde. Geen extra retries, queue, provider of brondata.

## Acceptatie
Required CI/CodeQL, toepasselijke Netlify preview, protected merge, exacte productiebron, geauthenticeerde HTTP200 van twee afzonderlijke tenants met bronrevision en Brain/Heartbeat ACK. Status: SOURCE_CANDIDATE, NIET LIVE, lost de HTTP502 zelf nog niet aantoonbaar op.
