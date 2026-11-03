# Kansenradar — bestaande Edge-release en oorspronkelijke scheduler beveiligen

**Datum:** 3 november 2026. **Parent:** #4198 (Powerhouse runtime). **Status:** beveiligde broncodekandidaat, cron-header reeds afzonderlijk aan originele job bevestigd; Edge v12-code nog niet gelijk aan branch.

## Onafhankelijke bronwaarneming
- Native `Supabase Edge Production Authority` run [41628384628](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41628384628) faalde met `SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG:bg-kansenradar`; broncode bestaat wel, providerfuncties toont `bg-kansenradar` ACTIVE v12 met `verify_jwt=false` en ontbrekende tokencontrole.
- De bestaande productie-`pg_cron` job 18 (`bg-kansenradar-dagelijks`, `0 6 * * *`) was actief maar stuurde alleen Content-Type, géén `x-powerhouse-token`.
- Original BRAIN Kansenradar incident rapporteert afzonderlijke Anthropic-creditfout: saldo ontoereikend. Dat wordt **niet** opgelost door een manifestfix; geen ongeautoriseerde providerwissel of kosten.

## Wijziging bestaande bron, niet parallel
- In `supabase/config.toml` wordt alleen de **bestaande** `[functions.bg-kansenradar]` geregistreerd: `enabled=true`, `verify_jwt=false` (gelijk aan daadwerkelijk actieve provider) en correct entrypoint. Dit maakt anonieme toegang NIET toegestaan: in Edge `index.ts` wordt `x-powerhouse-token` tegen `public.bg_geheim('powerhouse_daily_scheduler_token')` gecontroleerd voordat governance, Anthropic of Notion wordt gebruikt; ontbreken/mismatch levert HTTP 401.
- Idempotente migratie `20261103124000_bg_kansenradar_original_cron_authorization.sql` verandert met `cron.alter_job` alleen het oorspronkelijke, exact gecontroleerde commando van job 18; geen `cron.schedule` of nieuwe publisher. De bronsecretwaarde staat nooit letterlijk in het cron-commando.
- De huidige productiejob is met exact preimage gecontroleerd, in-place gewijzigd en opnieuw read-only teruggelezen: één actieve job, hetzelfde cronrooster en endpoint, tokenheader met server-side secretverwijzing. De code in provider Edge v12 is echter nog niet veilig tot werkelijk uitgerold.

## Preventie en uitvoerbewijs
- `tests/brain-bg-kansenradar-authenticated-release-20261103.test.mjs` verifieert manifest/bronbeveiliging en oorspronkelijke job-cardinaliteit; volledig beschermd Required, BRAIN, CodeQL vóór merge.
- Deploy uitsluitend door bestaande Supabase GitHub-integratie naar huidige protected `main` en controleer de **werkelijk gedeployde** bron: version/sha plus afwijzing 401 bij ongeldige aanroep. Controleer daarna geautoriseerde bestaande scheduler en natuurlijke run; nee, HTTP 200 van proxy of cron-transport is geen bewijs dat Anthropic-resultaten correct zijn.
- Bij ontbrekend creditsaldo: oorspronkelijke Kansenradar-agent registreert de menselijke billing-actie in ONE BRAIN en verstuurt één melding met **geverifieerde, directe** provider-actielink als die werkelijk bestaat; geen verlopen of verzonnen link, en geen onveilige kosten.
