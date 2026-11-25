# Relevantie & dagelijkse agentverbetering — 22 oktober 2026

Fingerprint: `powerhouse|agent-incident-relevance-daily-evolution|20261022-v1`

## Probleem en preventie
Materiële fouten, verbeterkansen en agentleren mogen niet uiteenlopen over chats, skills, Brain en portaal. De bestaande universele closed-loop route en dagelijkse zelfevolutie bestaan, maar een expliciet, getest contract voor portaalrelevantie en meetbare dagelijkse verbetering moest worden gekoppeld.

## Verandering
- Versterk `config/universal-closed-loop-learning.json` met verplichte incidentpreflight, canonieke writeback, tenant-afgebakende portaalprojectie en dagelijkse non-regressie/KPI-gates.
- Valideer deze eisen fail-closed in de bestaande universele gate.
- Gebruik bestaande Portal V2-route `learning-writeback` onder de label `Relevantie & verbeteringen`; toon alleen runtime-projectie van het eigen bedrijf.
- Geen nieuwe database, scheduler, cron, parallel agentgeheugen of tweede foutregister. Geen klantgegevens in deze publieke repository.
- Werk de bestaande self-improvement-skill en regressietests in dezelfde wijzigingslijn bij.

## Verificatie en nog niet bewezen
De PR en tests leveren kandidaatbewijs. LIVE of GROEN wordt pas verleend na toepasselijke Required CI en CodeQL, beschermd merge, exacte productie-commit/readback, Brain-writeback en controle van zichtbaarheid in de echte tenant-portal. Zonder bewijs: `RECORDED_PENDING_FINAL_DELIVERY_READBACK`.
