# Powerhouse Daily Self Evolution — onafhankelijke foutdomeinen (22 oktober 2026)

## Bewezen incident, geen statusmaskering
De bestaande dagelijkse workflow faalde op 21 en 22 oktober 2026. De unit tests voor catalogusstructuur waren geslaagd, maar `scripts/brain/ai-model-intelligence-audit.mjs` retourneerde `REFRESH_REQUIRED` (exit 1) wegens oudere leveranciersverificaties. Daardoor sloeg de **één-job**-uitvoering automatisch alle onafhankelijke vervolgtaken over: chat-agent-skill snapshot, autonoom verbeterexperiment, capability-inventaris, engineering self-test en bewijsartifact.

Onveranderde bronbewijzen:
- https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39578449326
- https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39756866887
- Canonieke cataloguseigenaar: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4367

## Oplossing binnen dezelfde uitvoerder
De al bestaande `Powerhouse Daily Self Evolution` workflow heeft voortaan twee *onafhankelijke jobs* onder exact hetzelfde dagelijkse schema:
- `improve` voert dagelijks de bestaande eigenlijke leer- en agentcontroles uit. Hij hangt **niet** af van de catalogus-freshness-gate.
- `model-freshness` voert de onverzwakte catalogus-tests en echte broncontrole uit. Als claims niet opnieuw met leveranciersbewijs zijn bevestigd, blijft deze job en de **hele workflow** rood. Het JSON-auditrapport wordt ook bij falen geüpload.

Dit scheidt failure domains: een onderbroken of verouderde leveranciersinventaris mag dagelijkse incidentlearning niet stilzetten, terwijl dataproblemen niet als groen of als geverifieerd worden getoond. Er is geen tweede scheduler, geen nieuwe agent en geen gewijzigde catalogusdatum.

## Verificatie en meetpunten
Regressie `tests/powerhouse-daily-self-evolution.test.mjs` vereist twee onafhankelijke jobs, één cron, expliciet audit-exitgedrag, artefact bij mislukking en de originele leerscripts. Na protected merge worden de volgende echte workflow-uitvoering, status van beide jobs en twee afzonderlijke artifacts uitgelezen. Operationele verbeterstatus kan `LEARNING_EXECUTION_GREEN_WITH_CATALOG_STALE` zijn, maar **totale workflowstatus mag niet groen** worden wanneer de catalogus rood is. De 27 verouderde modelverificaties blijven open bij #4367.

## Voortaan voor alle agents
Classificeer bron-specifieke confidence/freshness-blokkades en onafhankelijke herstel-/leeruitvoer apart. Preserveer de originele fout, dedupliceer per fingerprint, voer wat veilig onafhankelijk kan verder uit, publiceer exacte readback en laat echte security-/kwaliteitseisen ongewijzigd. Geen dubbele cron, geen valse groene status, geen reset van verificatieklokken.
