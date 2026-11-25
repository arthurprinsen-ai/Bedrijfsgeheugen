# Delivery ledger — één standaard AI-model per organisatie

**Obligation-ID:** portal-one-default-model-routing-20261015

## Aanleiding
Na vrijgave van modelkeuze PR #4381 en Brain-routing PR #4384 ontbrak een tenantbrede standaardkeuze. De Brain gateway kon enkel uitvoeren op expliciete `assignments.brain`; gebruikers moesten voor elke functie herhaaldelijk selecteren.

## Geleverde codewijzigingen
- `portal-v2/modules/ai-model-choice.js` toont bovenaan een klantbreed standaardmodel en diens gewenste providerroute, laat per workload optionele uitzonderingen kiezen, en bewaart deze tenantgebonden in schemaVersion 3.
- `platform/policy/tenant-ai-default-model.mjs` dwingt één resolver voor benoemde workloads af zonder ongeldige of niet-geselecteerde modellen te accepteren.
- `platform/policy/tenant-model-choice.mjs` gebruikt de resolver voor de bestaande geattesteerde Bedrijfsbrein-vraagroute en houdt de provider-, regio-, contract- en bewijschecks intact.
- Bestaande verplichte tests in `tests/brain-tenant-ai-inference-gateway-v1.test.mjs` en `tests/portal-ai-model-choice.test.mjs` bewaken default, overrides, blokkades en voorkeursopslag.

## Acceptatie en resterende grenzen
Geen kunstmatige goedkeuring voor de 26 PARTIAL-records, het AWS-conflict of enige klanttenant. Geen autonome koppeling van OCR, prognoses, agents en de legacy vraagfunctie; de gekozen standaard is voor die functies *gewenste toestand*. Bij start zijn CI/CodeQL, beschermde merge en productiereadback nog niet afgerond. Maak geen live-claim zonder providerresultaat.
