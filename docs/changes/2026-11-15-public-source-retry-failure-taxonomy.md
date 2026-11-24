# Diagnoseer de originele bedrijfsbron in plaats van eindeloos te herhalen — 15 november 2026

**P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Native bewijs
Om 2026-11-15 18:07:02 UTC meldde de originele `relationship-public-research` Edge run: 2 due-only source retries, 2 `SOURCE_HTML_UNAVAILABLE`, 0 leesbare sites, 0 extra bronnen, 0 ingest ACKs, geen externe verzendactie. Er waren 10 originele source-debts waarvan 8 nog due; 23.295 contacten met 605 bestaande e-mailadressen en 4 oorspronkelijke commerciële handoffgaten. Een origineel `SOURCE_HTML_UNAVAILABLE` kon tot dan toe ontstaan uit HTTP 403/429, geen HTML, grote body, onveilige redirect of timeout zonder afzonderlijke foutregistratie.

## Veilig minimaal herstel
Gebruik de bestaande `readBoundedPublicPage` van de bestaande `powerhouse-relationship-public-research` Edge, met ongewijzigde HTTPS-only, same company host, maximaal 2 redirects, 2,5 sec/request en 160kB response cap. Geef uitsluitend categoriecodes aan het oorspronkelijke `powerhouse_sales_actions.evidence` door: geen HTML, URL+query, persoonsnaam of mailadres. Een werkelijk onleesbare site blijft `public_email_source_checked=false` met hetzelfde `action_id`, en krijgt op basis van de pogingsteller een begrensde 4→8→16→32→48 uur retry. Voorkom eindeloze 4-uurs lus op inaccessible domains en geef oorspronkelijke Reliability/Commercial-owner een diagnose.

## Gating en acceptatie
- De enige bestaande #116 bronexecutor leest op natuurlijke runs due-only research records, ook over Amsterdam-daggrenzen. #138 identiteit bevestigt alleen een werkelijk staged public work-mailto candidate met exact source/consumer readback.
- Geen extra cron, queue, betaalde provider, openbare personal-email scraping, canonieke contact-e-mailpromotie, duplicate sender of toegekende wettelijke toestemming.
- Exact-head GitHub Required + CodeQL, merge via de bestaande beschermde releaseketen, productie Edge-versie ACTIVE en exact source-body readback, natuurlijke herproef met foutcodes + correct retry_at voordat dit technisch live heet.
- De zakelijke P0 mag pas sluiten na werkelijk bronbewijs, provider-ACK, echte handoff, effectmeting en toegepaste les. Bronfoutcategorisering alleen is niet zakelijk groen.

## Veilige rollback
Terugdraaien via beveiligde GitHub release van het oorspronkelijke Edge-bestand; bestaand data/evidence blijven intact. Indien per ongeluk geen diagnostics in oude records staan, is dat `UNKNOWN`, niet bewijs van verzonden e-mail.
