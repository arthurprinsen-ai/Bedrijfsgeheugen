# CRO Edge-publicatie — ontbrekende functieconfiguratie (29 oktober 2026)

## Probleem en oorzaak
De beschermde release van bestaande CRO raw-telemetry na PR #5144 faalde in GitHub workflow `Supabase Edge Production Authority` (run 40927339145, job 123636253798): `SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG:bg-interactie`. Supabase kent deze functie al als **ACTIVE versie 10** met **verify_jwt=false**. De Edge-broncode was aangepast, maar `supabase/config.toml` bevatte geen bijbehorende functieverklaring. De bestaande production gate stopte daarom terecht vóór het uitrollen.

## Herstel
Deze afgebakende follow-up in dezelfde incidentlijn #5141 voegt uitsluitend de declaratie `[functions.bg-interactie]` met `enabled=true`, `verify_jwt=false` en het huidige `entrypoint` toe. Er komt geen nieuwe Edge-function, scheduler, writer of datasilo. De bestaande browserontvanger gebruikt geen Supabase-JWT en valideert zijn toegestane origins, toegestane gebeurtenissen, consent voor gedetailleerde meting en databaseduurzaamheid in `supabase/functions/bg-interactie/index.ts`. Verander de historische permissie niet alleen om een deploy te laten slagen.

## Agent-, test- en leerborging
Vastgelegd in `.agents/skills/powerhouse-seo-conversion-orders/SKILL.md`, `brain/learning/2026-10-29-cro-edge-production-config-5141-v1.json` en `docs/development-ledger-events/2026-10-29-cro-edge-allowlist-5141.md`. Test `tests/brain-cro-edge-config-5141.test.mjs` verifieert exact één declaratienaam, bestaande securityinstelling, bronpad en intacte fail-closed intake. De bestaande workflow en CodeQL/Required blijven ongewijzigd.

## Productiegates
1. Exact-head GitHub Required/CodeQL en beschermde squash-merge zonder regels te omzeilen.
2. Supabase migraties `20261029180000` en `20261029181000` plus authentieke Edge provider-versie/bundel/readback, niet alleen de source `main`.
3. Netlify werkelijke productiecommit + browser Consent/503/retry/deduplicatie `event_uid` → `public.bg_interacties` DB-record en owner-portal met aparte tenant-auth-readbacks.
4. Geslaagde causale experimenten, gekwalificeerde echte leads en betaalde orders alleen op eigen onafhankelijk bronbewijs.

**Status bij aanmaken: CANDIDATE / NOT_LIVE**. De automatische release en agent mogen het incident niet sluiten op grond van alleen een configregel.
