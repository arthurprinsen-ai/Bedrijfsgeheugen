# Skill: Powerhouse Daily Full Connection Enrichment

Fingerprint: `powerhouse-daily-full-connection-enrichment-v1`

## Permanente regel
Iedere connectie in de canonieke Powerhouse-relatiegraph krijgt iedere kalenderdag een enrichment-pass. Alle reeds beschikbare en rechtmatig verkregen LinkedIn-, bedrijfs-, publieke web-, nieuws-, runtime-, opportunity- en outcome-informatie wordt dagelijks opnieuw samengebracht en geprojecteerd op de juiste persoon en het juiste bedrijf.

## Canonieke flow
`all ingested evidence -> person -> company -> customer -> opportunity/NBA -> action/outcome -> learning`

## Gedrag
- Alle connecties worden dagelijks meegenomen, niet alleen high-priority of trigger-based relaties.
- Nieuwe LinkedIn-engagement/profile-evidence kan naam, bedrijf en rol alleen verrijken wanneer de match op de bestaande LinkedIn-URL geldig is.
- Bedrijfsnieuws, externe signalen en runtime evidence worden via company/person entity matching gekoppeld.
- Beschikbare evidence wordt dagelijks op de volledige graph geprojecteerd.
- Dure externe discovery blijft bounded/prioritized; full-graph betekent niet dat elke connectie iedere dag afzonderlijk een dure externe zoekopdracht krijgt.
- Freshness, provenance, confidence en source evidence blijven behouden.
- Geen gevoelige persoonsinferenties, geen scraping/platform-bypass en geen parallel CRM.

## Runtime
- State table: `public.powerhouse_connection_enrichment_state_v1`
- Projection view: `public.powerhouse_connection_enrichment_v1`
- Refresh: `public.powerhouse_refresh_all_connection_enrichment_v1(date,integer)`
- Scheduler owner: bestaande `powerhouse-commercial-learning-v1`
- Batch: 1100 per uur; met de huidige graph van circa 23k connecties is daarmee een volledige dagelijkse pass haalbaar binnen dezelfde bestaande scheduler.

## Definition of done
Een dag is pas compleet wanneer `connections_enriched_today = connections_total`. Nieuwe evidence die later op dezelfde dag binnenkomt wordt bij volgende passes opnieuw meegenomen.
