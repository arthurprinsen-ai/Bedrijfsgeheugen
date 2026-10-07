# Security Trust least-privilege hardening v1

## Aanleiding
De live Security Trust snapshot na PR #4058 was terecht `ACTION_REQUIRED`: 28 `SECURITY DEFINER`-functies waren uitvoerbaar door `anon`/`authenticated`, acht definer-views en één materialized intelligence view waren direct client-readable. De eerste scanner telde daarnaast vier private definer-views mee als high-risk terwijl anon/authenticated daar geen SELECT op hadden.

## Evidence vóór wijziging
- PostgreSQL catalogus: 28 client-executable `SECURITY DEFINER`-functies.
- 8 client-readable views zonder `security_invoker`.
- 1 client-readable materialized view.
- 24 uur PostgREST accesslogs: 0 directe requests naar de te hardenen intelligence views en 0 directe RPC-calls naar de zes niet via trigger/cron/call-chain verklaarde privileged functies.
- Interne functie-inspectie: publisher/sales/intelligence-functies muteren interne state of gebruiken server-side secrets en bevatten geen browser-auth/tenant boundary.

## Structurele correctie
- revoke `EXECUTE` van PUBLIC/anon/authenticated voor de 28 expliciete privileged interne functies;
- grant `EXECUTE` expliciet aan service_role;
- revoke direct `SELECT` van PUBLIC/anon/authenticated voor de 8 intelligence views + 1 materialized view;
- grant `SELECT` expliciet aan service_role;
- database posture telt definer-views alleen als high-risk wanneer anon/authenticated werkelijk SELECT hebben;
- private definer-views blijven als aparte metric zichtbaar;
- fail-closed postconditions blokkeren de migratie wanneer een geharde surface alsnog client privileges heeft.

## Niet gedaan
Geen algemene revoke op onbekende functies, geen wijziging van RLS-policies, geen wijziging van providercertificeringsclaims en geen bypass van de bestaande tenant/API-boundary.

## Terminal bewijs
Source candidate: `fix/security-trust-least-privilege-v1`. Runtime promotie en production readback zijn verplicht voordat deze hardening LIVE_PROVEN mag heten.
