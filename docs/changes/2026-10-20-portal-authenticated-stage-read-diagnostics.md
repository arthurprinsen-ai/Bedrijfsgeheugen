# P0 #4215 — Geauthenticeerde portaaldata: diagnostiek voor trage leesfase

Datum: 20 oktober 2026  
PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4535  
Moederissue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215  
Obligation-ID: `portal|authenticated-entrepreneur-stage-latency-isolation|20261020`

## Waarom deze wijziging nodig is

De productieaanroep `GET /api/portal-ondernemersdata` heeft met een geauthenticeerde synthetische identiteit HTTP 504 geretourneerd na circa 30 seconden. De bestaande Supabase Edge-functie `portal-state-eu` vraagt voor `entrepreneur_intelligence` tien PostgREST-gegevenssets op in batches met maximaal drie gelijktijdige reads. In Supabase werden ook PostgreSQL-statementtimeouts en verbindingsproblemen in andere workloads waargenomen. Dat bewijst gedeelde databaseproblemen, maar **nog niet welke portaalleesfase traag is**.

## Wijziging en preventie

De bestaande `boundedReads`-helper blijft lazy, behoudt de bestaande volgorde en limiet op gelijktijdigheid en blijft fail-closed bij een mislukte read. Langzame of mislukte fasen krijgen een anonieme trace, een vooraf vastgestelde stage-naam en verstreken milliseconden in serverlogs. Er worden geen tenants, SQL, bronwaarden of credentials gelogd. De regressietest controleert ten minste lazy scheduling, maximaal drie gelijktijdige reads, stage-herkenning en het ontbreken van een vals succesvolle gedeeltelijke respons.

Dit betreft **instrumentatie**, geen aanpassing van de echte databasequery of ongecontroleerde verhoging van timeouts. Een Netlify- of browser-200 alleen bewijst geen geldige tenantprojectie.

## Openstaande technische herstelactie

1. Maak de bestaande PR groen op alle verplichte GitHub-controles (Required + CodeQL) zonder bypass.
2. Breng instrumentatie via de beschermde merge- en exacte broncode-uitrol naar de bestaande Edge-functie, uitsluitend na toegestane releasecontroles.
3. Observeer de stage/trace/latency van een geauthenticeerde reproductie; identificeer de werkelijke relationele query en het Postgres-queryplan. Controleer daarbij bestaande zware cron- en commerciële workloads, verbindingswachtrijen en database-indexen.
4. Herstel gericht (selectiviteit, index, read-model of begrensde batching), met een regressie die de oorzaak reproduceert en niet alleen timing maskeert.
5. Bewijs met **twee onafhankelijke tenants** Frisse Blik → geautoriseerde write → sourceRevision/Brain-ACK → Heartbeat/Powerhouse-recompute → dashboard-readback, inclusief geen datalekken tussen tenants.
6. Controleer externe bronversheid en de afwezigheid van gefingeerde financiële impact; sla exacte immutable deploy/CI/runtime-evidence op in #4215.

## Acceptatiestatus

**NIET GEACCEPTEERD.** Bij opstellen ontbreken production-stage-evidence, gerichte DB-optimalisatie, geauthenticeerde HTTP-200-readback en het verplichte tweeklantbewijs. #4215 blijft open. Geen demo- of lege fallback mag als klantenwaarheid worden weergegeven.
