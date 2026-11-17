# Mira: nul geschikte zakelijke bronnen → verbeter originele zoektermen en probleemherkenning

**17 november 2026 — oorspronkelijke Powerhouse-bronzoeker #120; géén nieuw systeem.**
Oorspronkelijke incidenten: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232 en https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198 .

## Feitelijke productieoorzaak

- Voor de oorspronkelijke publicatiedagen 16 en 17 november waren er **nul geschikte zakelijke Mira-bronnen**. De originele #120-run van 16 november 20:02 UTC registreerde in de bestaande bronnenbank slechts twee zakelijke artikelen: nieuws over Teamleader AI-productintroducties (0,661 en 0,690), geen echte, zelfstandig bevestigde MKB-frictie. De bedrijfsvideo mocht daardoor niet worden aangemaakt. De bestaande cron #140 en dagelijkse uitgever bleven actief; hun lopende status bewees geen levering.
- Origineel incidentbewijs `brain_failure_occurrences` fingerprint `powerhouse|mira|no-new-unique-source-backed-daily-winner|20261117-v1` bevat provider-candidates, bronuitval, kwaliteitspoorten en redenen voor afwijzing. Geen fake homepage, nieuwsfragment of van een persoonlijk LinkedIn-slot geleende bron is toegestaan.
- Actueel onafhankelijk webonderzoek toont relevante werkelijk gepubliceerde voorbeelden buiten die bronbank: artikel gedateerd 16 november 2026 over factuurfouten en betalingsachterstanden, https://www.ictmagazine.nl/nieuws/bedrijven-zetten-klanten-onder-druk-door-eigen-factuurfouten/ ; een actuele CBS-conjunctuurpeiling over bedrijfsbelemmeringen, https://www.cbs.nl/nl-nl/nieuws/2026/45/bijna-kwart-bedrijven-heeft-investeringen-uitgesteld-of-geschrapt-in-laatste-12-maanden ; actueel onderzoek over krappe marges, https://www.metaalnieuws.nl/krappe-marges-en-onzekerheid-weerhouden-mkb-maakbedrijven-van-investeren/ . Dit zijn **alleen gecontroleerde zoek-/classificatievoorbeelden**; ze zijn niet stiekem in `powerhouse_mira_problem_signals_v1` geschreven, niet bevestigd als originele providerbron en geen toestemming tot publicatie.

## Geen schema-, veiligheids- of eigenaarwissel

In de **bestaande** `supabase/functions/powerhouse-mira-problem-radar/distinct-source-queries.mjs` vervangt uitsluitend de lokaal bestaande alternate-query-route voor vijf canonieke PH-P-problemen de taal door herkenbare korte zoektermen: Excel-administratiefouten, dubbele data-invoer, meerwerkkosten in bouw, krappe marges en personeelstekort. De eerdere originele verbeterde query `bedrijven factuurfouten betalingsachterstanden` blijft op 18 november staan. Samen vormen ze exact **zes** zakelijke en **twee** persoonlijke bronzoekposities, geen nieuw betaalde zoekopdracht.

In dezelfde oorspronkelijke radar `index.ts` en de lokale concrete-frictieclassificatie worden echte `factuurfouten`, `foutieve facturen`, `onjuiste facturen` en `krappe marges` ook bij de juiste canonieke PH-P geregistreerd, uitsluitend wanneer de teruggekomen oorspronkelijke providertekst de inhoud daadwerkelijk bevat. Een leverancier die een AI-product lanceert, wordt nog steeds onvoorwaardelijk afgewezen; bron-score-, gedateerde-URL-, content-, anti-dup- en Mira-identitycontroles blijven identiek.

## Eenmalige score vs. bewezen autonomie

Eerst de gewijzigde originele Edge-bron op protected main en in de originele productie-Edge byte-voor-byte verifiëren. Daarna alleen bij de **volgende bestaande 21:02 Amsterdam** bronrun echte `dataforseo_news`/`tavily_news`-providerresultaten en hun tijdstempels controleren, zonder #120 opnieuw handmatig te draaien of kosten te verdubbelen. Alleen na de echte nieuwe, unieke zakelijke dagwinnaar is de bestaande OpenArt CAS-job legitiem. Er volgt pas `LIVE_PROVEN` bij eigen Meta-ID en onafhankelijke GET; pas `PROCESSED` bij named ONE BRAIN-consumer en pas commercieel groen bij echt gekoppelde leads/betaalde orders.

Regressies: `tests/brain-mira-real-business-friction-20261117.test.mjs` en `tests/brain-mira-distinct-source-query-rotation-20261114.test.mjs`. Logs blijven in de oorspronkelijke Brain-fingerprint en het bestaande incident; geen apart dashboard, database of cron.
