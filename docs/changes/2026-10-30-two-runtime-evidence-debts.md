# Powerhouse — twee actuele runtime-gezondheidsfouten: herstel, bewijs en eigenaarschap
Datum: 30 oktober 2026. Canonieke scope: Powerhouse × ONE BRAIN × Heartbeat. Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Vastgestelde productiefeiten
De originele view `public.powerhouse_one_brain_runtime_health_v1` gaf 32/32 aangesloten lagen, 18/18 actieve vereiste jobs, geen structurele lineagebreuk, maar `current_runtime_errors=2`. Die twee fouten zijn de **laatste per (event_type,source,subject_key)** geregistreerde `state=error`-events, niet twee stilgevallen crons.

1. `revenue_flywheel_health`, event `6008e9a4-5b4d-4e31-ad4c-258e79639fa4`: `calibration_gap=true`, 1.867 `due_uncalibrated_forecasts`, nul `unmanaged_outcome_gaps`, vijf uitstaande externe uitkomsten.
2. `full_cycle_production_proof`, event `aff25914-b086-4f35-a602-4e75acb3f30e`: 2.085 `overdue_calibrations`, geen volledige provider-/publicatie- en omzetbewijsreconciliatie. Na onafhankelijke heruitvoering om 07:34:33 UTC: `predictive_run_ok=true`, `full_cycle_healthy=false`, `execution_healthy=false`.

**De 1.867 en 2.085 zijn geen uitwisselbare tellingen:** ze komen uit twee verschillende bestaande definities. Analyseer ze afzonderlijk, niet via bulk-update of gefingeerde herberekening.

Het reeds bestaande `powerhouse-forecast-calibrator` (HTTP 200) gaf `NON_PUBLIC_SCOPE_BACKLOG`. Van de 2.085 vervallen kalibratieverplichtingen zijn 1.714 persoonsgericht, 371 bedrijfsgericht en **nul publieke markt-scope**. De originele `powerhouse_forecast_resolution_candidates_v3` bevatte op de controle 0 geschikte geverifieerde koppelbare uitkomstkandidaten. Een publieke modelrespons bewijst geen privéklantuitkomst en ook geen negatief 'niet-gebeurd'.

## Bewezen deelreparatie en resterende grenzen
De protected Predictive-reparatie in https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5169 is gemerged, en de bestaande engine schreef 30 oktober om 07:02:15 UTC een echte succesvolle run: 18 publieke signalen, 1 nieuwe voorspelling, 0 afwijzingen. Ook portaalbronverbetering https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5170 is gemerged. Dit bewijst **niet** dat de voorspellingen uitgekomen zijn. De originele 15-loop portalwijziging https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5172 heeft een aparte actieve schrijver: niets daarin overschrijven.

## Permanente agent- en skillsregels
- Lees actuele originele source-views, de meest recente **unieke** runtime-events, originele HTTP/Edge-respons, `cron.job_run_details`, `bg_gezondheid` en het canonieke outcome-/providerbewijs. Classificeer zelfstandig `TECHNICAL_EXECUTION_FAILED`, `EVIDENCE_DUE`, `UNVERIFIED`; nooit `ALL_GREEN` door slechts twee eventstates te herschrijven. Het nieuwe pure helperbestand is advies, geen uitvoerend tweede systeem of live-proef.
- Gebruik **bestaande** fingerprints `powerhouse|revenue-flywheel|forecast-calibration-evidence-due|20261029-v1` en `powerhouse|full-cycle|publication-predictive-proof-gaps|20261029-v1`. Log bij herhaling eenmaal via `public.brain_observe_failure` met exacte occurrence-ID en SHA-256; log oorzaak, eigenaar, bron, herstel, regressie, volgende stap en readback. Voeg geen parallel incidentregister of scheduler toe.
- De private outcome-eigenaar moet een werkelijk toegestane handeling en bewijsketen koppelen aan exact forecast-ID, tenant, tijdvenster, contact/bedrijf, autorisatie, originele provider-/factuur- of outcome-ID en onafhankelijke readback. Alleen dan één idempotente kalibratie toepassen. Ontbrekend bewijs = OPEN/PENDING; nooit 'missed', nul omzet of geslaagd fabriceren.
- De originele publishers moeten elk kanaal onafhankelijk beëindigen met provider-ID en geldige readback; OAuth-consent door mensen waar expliciet vereist, Instagram-origineel asset/identiteitsbewijs, beschermd blog releasepad. Bestaande 29-oktober LinkedIn URN mag nooit opnieuw worden gepubliceerd.
- Voor elke bronwijziging: één oorspronkelijke writer/lease → exacte mainbasis → test + Required/BRAIN/CodeQL/System Map → beschermd mergen → Edge/Netlify waar werkelijk nodig → originele productierun → echt outcome → onafhankelijke Brain-lerentoepassing. Een geteste helper of dit document is **geen live herstelde full-cycle**.

## Verificatie en groencriteria
Geen twee actuele runtime-error-events én geen verplichte evidence-/learning-gaten, nul onterecht onbewezen privé-uitkomsten, volledige vereiste kanaal-/orderproviderreadbacks, originele 15 loops niet rood, natuurlijke agentrun met aantoonbaar toegepaste regel, en gewijzigde code exact protected gemerged/productie-actief. Zo lang een van deze ontbreekt blijven bronhealth en P0 OPEN.

## Voor/na
Voor: 2 error-events; 1.867 flywheel-due; 2.085 full-cycle overdue; private scope 1.714/371; 0 verifieerbare koppelkandidaten. Na broncontrole: Predictive `predictive_run_ok=true` en registratie in originele Brain-incidenten, maar **geen bewezen reductie** in private kalibratieachterstand en **geen all-green**. Deze wijziging bevat een preventiehelper, agents-preflight, skill, test en menselijke documentatie, maar claimt geen aanpassing van de actieve SQL-runtime zonder protected merge en volgende natuurlijke run.
