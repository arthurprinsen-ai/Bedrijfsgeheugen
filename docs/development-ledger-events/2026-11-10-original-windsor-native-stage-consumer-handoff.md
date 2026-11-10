# 10 november 2026 — oorspronkelijke Windsor → ONE BRAIN consument-ACK
Fingerprint: `powerhouse|social-learning|native-windsor-stage-consumer-handoff|20261110-v1`

## Incident en echte productiebron
Het native `linkedin_organic`-account van Bedrijfsgeheugen heeft vier per-post-gegevensrecords geleverd op 2026-11-10T09:30:55Z: 6 nov 199 impressies/3 likes, 7 nov 30/3, 8 nov 3/0, 9 nov 1/0. De provider-URN, bedrijfsauteur en oorspronkelijke `LIVE_PROVEN` publicaties zijn afzonderlijk gecontroleerd. Originele providerstaging sloeg `identity` en `account_id` op; de originele `linked-company-analytics.mjs`-consumer verwachtte `post_identity` en `account`. Daardoor miste de echte bron de consumer ACK, ondanks een technisch gezonde cron en oudere gekoppelde snapshots.

## Uitgevoerde veilige bronreparatie
Vier exact bewezen providerobservaties ingeschreven/ververst in de bestaande `powerhouse_growth_source_daily_v1` (geen parallelle bron, geen gefingeerde metrics). De bestaande staging-markering voor onverifieerde postidentiteit is toegevoegd, waarna de **bestaande** Edge `bg-social-metrics-sync` via de bestaande vault-geautoriseerde route eenmaal is getriggerd (request 26702; HTTP 200). Vier nieuwe eigen, brongebonden `social_metric_snapshots` onafhankelijk via SQL gecontroleerd. `powerhouse_backfill_social_learning_applications_v1(now())` leverde 12 interne acties; directe tweede run leverde 0 wijzigingen. Geen provider publicatie, email, e-commerce order, of causaal positief leereffect geclaimd.

## Permanente preventie en borging
Originele provider-consumer ondersteunt beide exact controleerbare native schema's, inclusief afwijzing bij tegenstrijdig `account` en `account_id`. Extra regressie test echte 10-nov-staging, onechte organisatie/post/URL/datum, negatieve of missende metrics en legacy contract. Alle originele publicatie- en opt-in gates blijven ongewijzigd. Deployment alleen na beschermde Required/CodeQL/Edge checks, gemergede GitHub `main`, en originele Edge productie-readback. Houd achterstallige historische metingen en leer-ACKs OPEN totdat objectieve bronconsumptie is bewezen.

## Status
Bronreparatie en exacte meting + BRAIN-evaluatie: **deels LIVE_PROVEN** (4 posts); codepreventie: **PR_CANDIDATE**; causaal getoetste vervolgpresentatie: **NOT_PROVEN**. BRAIN-incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
