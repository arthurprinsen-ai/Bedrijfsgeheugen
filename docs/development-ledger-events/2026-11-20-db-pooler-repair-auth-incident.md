# P0: anoniem bereikbaar databaseherstel-endpoint afschermen — 20 november 2026

## Onafhankelijk vastgesteld risico
Supabase Edge Function `db-pooler-repair-v1` is als ACTIVE gepubliceerd met `verify_jwt=false`. De actuele function source (versie 6) doet geen enkele eigen autorisatiecontrole. Iedere aanroeper kon via de HTTP-endpoint een privileged Postgres-connectie openen en `public.powerhouse_content_closed_loop_tick_v1(now())` laten uitvoeren; dit is een **onbedoelde bevoegdheidsgrens**. Er is geen bewijs van daadwerkelijk misbruik.

Bestaande dependency-check: geen `cron.job.command` verwijst naar de slug (0 actieve of inactieve); een read-only search in de afgelopen 24 uur edge/function logs leverde geen meldingen met de slug. Dit sluit onbekende externe aanroepers of verborgen periodieke bronnen niet uit.

## Codecorrectie
De serverfunctie wordt alleen via POST bereikbaar met één van twee **server-only** bevoegdheden: de vooraf aanwezige legacy `SUPABASE_SERVICE_ROLE_KEY` als `Authorization: Bearer`, of de vooraf aanwezige moderne default `SUPABASE_SECRET_KEYS.default` als `apikey`. Beide sleutels worden uitsluitend vanuit de Supabase Edge Runtime gelezen, niet ingesloten in de code, CLI, docs, tests of log. De controle gebruikt SHA-256-digestvergelijking zonder substring-acceptatie; overige tokens en gewone gebruiker-JWT's worden geweigerd. De database wordt niet aangeraakt voordat autorisatie slaagt. Er worden geen ruwe databasefoutmeldingen teruggestuurd en responses mogen niet gecachet worden.

`verify_jwt=false` blijft in het oorspronkelijke endpoint nodig om de moderne secret `apikey` zonder JWT te kunnen accepteren, maar **alle uitvoerbare code** staat achter een expliciete eigen service-auth-guard. De function mag niet worden aangeroepen door een browser/app met een publieke sleutel.

## Uitvoering en verificatie
- Bronbestanden: `supabase/functions/db-pooler-repair-v1/index.ts`, `security.mjs`.
- Regressietest: `tests/brain-security-db-pooler-repair-auth-20261120.test.mjs`, controleert reject zonder token/verkeerd token, GET en user JWT, accepteert alleen serverreferenties en controleert dat auth vóór SQL staat.
- Na provider-publicatie vereist: versie-/contentreadback en geanonimiseerde HTTP POST zonder credential moet status 401 geven; GET moet 405 geven. **Een echte privileged POST met een service role key is bewust niet uitgevoerd**, om geen onverwachte productiecron te starten; daarvoor is een apart geautoriseerd consumer-proefscenario nodig.
- Geen wachtwoorden of sleutels in het repository of menselijke documentatie. Geen Make.
- De rest van de `verify_jwt=false` Edge Functions moeten ook op daadwerkelijke interne auth worden gecontroleerd. Niet iedere webhook met `verify_jwt=false` is kwetsbaar; provider-signatures en API keys kunnen geldig zijn.

## Beperkingen
Dwing niet zonder gebruiksbewijs een nieuwe externe cron-credential af. De enige bestaande relevante `public.powerhouse_external_cron_reconcile_v1(p_token text)` token-gated RPC is een **andere** authenticatieketen en blijft ongewijzigd. Beoordeling en tijdelijke bron/prod-status moeten bewijsgebonden blijven.
