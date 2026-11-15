# Innovatie-agent — brongetrouwe meetwaarden in het Powerhouse-portaal

Datum: 15 november 2026. Originele innovatie: `2c1ecc77-58aa-4f25-ae68-e2337853fdc7`, eigenaar `agent:agent-integration-engineer`.

## Probleem en impact
In het bestaande portaal-readmodel werden gegevens met `Number(v)` omgerekend. Lege of uitsluitend uit witruimte bestaande waarden, booleans en arrays konden hierdoor ten onrechte een gemeten nul opleveren. Voor onder meer rode lussen leidde dat tot ontbrekende waarschuwingen en de kans op een onjuiste groene status. Een echte nul moet wel gewoon nul blijven.

## Wat de oorspronkelijke agent daadwerkelijk bouwde
De bestaande `platform/portal/powerhouse-existing-integration-read-model.mjs` accepteert voortaan uitsluitend eindige getallen en niet-lege numerieke strings voor meetwaarden. Andere bronwaarden blijven onbekend (`null`); er wordt geen bronbewijs of omzet gesynthetiseerd. Bestaande privacy-, autorisatie- en bronregels blijven ongewijzigd.

## Controle
`tests/brain-innovation-metric-source-truth-20261115.test.mjs` herhaalt zowel de afwijkende bronwaarden als geldige nul- en positieve/negatieve getallen. Het leerrecord `brain/learning/2026-11-15-innovation-metric-source-truth-v1.json` registreert historische regressie én canary-testmodus voor `FALSE_GREEN` / `RUNTIME`. De eerste echte GitHub Required-achtervang wees ontbrekende canary-evaluatie af; de tweede wees het ontbreken van deze menselijke documentatie en het ontwikkellog af. Beide oorzaken zijn in dezelfde kandidaat-PR #5908 hersteld zonder verplichte controles te omzeilen.

## Productie en resultaat
Dit is een broncode-kandidaat, geen bewezen productie- of businessresultaat. De oorspronkelijke `INNOVATION_INTAKE` blijft `PLANNED` en `INNOVATION_DELIVERY` blijft `OPEN` tot beschermde merge, exact productie-SHA-readback, runtimecontrole en onafhankelijke Heartbeat-effectmeting zijn uitgevoerd. Regressies alleen bewijzen niet dat klantsavings, conversie of agentvoltooiing verbeterden.

Herstel: indien de bronlogica foutief blijkt, revert uitsluitend de afgebakende bronwijziging via de bestaande beschermde GitHub-release en behoud originele events, ONE BRAIN-verplichtingen en auditsporen.

Bron: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5908
