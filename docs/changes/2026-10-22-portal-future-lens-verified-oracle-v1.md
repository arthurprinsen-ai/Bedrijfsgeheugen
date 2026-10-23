# 22 oktober 2026 — Toekomstlens: echte prognoses, geen uit KPI's verzonnen scenario's

## Oorzaak
De volledige Unified BRAIN-run [39785541338](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39785541338) op een bestaande herstelbranch telt 3.521 tests en 357 fouten. Drie fouten komen uit het historische contract `tests/brain-portal-v2-nextgen-intelligence.test.mjs`: het test nog onbewezen stress-, basis- en groeiscenario's die uit een zichtbare KPI-waarde worden berekend.

De bestaande productiecode `portal-v2/nextgen-intelligence.js` doet het veilig: `project()` en `confidence()` geven `null` zolang een actuele, geauthenticeerde klantgebonden, onafhankelijk beoordeelde en gebackteste forecast ontbreekt. Ook een geldig basispad maakt niet automatisch geverifieerde stress-/kansscenario's. Deze fail-closed functionaliteit mag niet worden teruggedraaid om BRAIN groen te maken.

## Correctie
Alleen de **bestaande** historische test wordt aangepast. Er komen positief bewijs voor een volledig synthetische maar canoniek gevormde testreceipt, plus negatieve checks op ontbrekende autorisatie/tenantbinding, modelbron, source references, stale evidence, backtest, onafhankelijke review, onzekerheid, scenario en horizon.

## Acceptatie
Het oude baselinegetal is **geen** vermindering tot nul. Deze wijziging mag alleen gemerged worden als de wijzigingstests, de verplichte CI en CodeQL op exact head slagen, de volledige samengestelde BRAIN-suite uiteindelijk 0 fouten heeft en de onafhankelijke migratie- en tenantacceptatie (#3742/#4215) intact blijven. Geen runtimewijziging, klantdata, scheduler, provideruitvoering of verzonnen forecast.
