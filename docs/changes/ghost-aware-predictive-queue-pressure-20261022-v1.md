# Ghost-aware queue-capaciteit zonder schijngroen — 22 oktober 2026

## Canonieke eigenaar en bestaande uitvoeringslijn
- Optimalisatie-obligation: [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661); fingerprint `delivery|predictive-lane-capacity|ghost-aware-fast-ci|20261022-v1`.
- Externe historische GitHub-storing: [#4655](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4655). Vier provider-owned runs van 7 oktober blijven afzonderlijk OPEN.
- Geen nieuwe scheduler, agent, database, queue, bypass of parallelle uitvoeringslijn. De bestaande uurlijkse Repository Janitor produceert de runtime-observatie; de bestaande `tools/delivery/predictive-controller.mjs` berekent de capaciteit.

## Probleem en minimale reparatie
Voorheen telde de voorspeller `queued=5` als vijf echte jobs, ook wanneer vier records feitelijk oude GitHub-providerfouten waren met nul jobs en 409/409/403. Dat kan de soft queue-pressure onterecht verhogen. Een GitHub queued-overzicht kan soms ten onrechte 0 tonen terwijl de vier individuele records nog bestaan. Beide cijfers mogen nooit als bewijs van providerherstel worden gebruikt.

De nieuwe queue-evidence-partition bewaart `rawQueued`, `verifiedProviderGhostQueued` en `actionableQueued`. Uitsluiten van een queue-slot is **alleen** toegestaan bij volledige actuele paginatie plus individuele provider-GET en bewezen jobs=0; queued/null, ongewijzigde 24u-timestamps, onveranderde SHA, huidige main- en open-PR-SHA uitgesloten, canonical `GHOST_RUN_PROVIDER_BLOCKED`-marker onder #4655 en een maximaal tien minuten oude readback. Een incomplete telling, ontbrekende markering, autorisatie-fout, actuele required/CodeQL of echte job blijft volledig meetellen.

Voor het regressiegeval van vijf records geldt: `rawQueued=5`, `verifiedProviderGhostQueued=4`, `actionableQueued=1`; #4655 blijft desondanks onopgelost. Zonder bewijs geldt `actionableQueued=5`. Het systeem baseert het werkbudget niet op verzonnen groene providerchecks.

## Bewijs, agents en volgende acceptatie
Code: `tools/delivery/predictive-controller.mjs` en bestaande `.github/scripts/github-actions-ghost-reconcile.mjs`. Regression: `tests/delivery-powerhouse-supervisor.test.mjs`. Canoniek leren: `brain/learning/2026-10-22-ghost-aware-predictive-queue-pressure-v1.json`. Bestaande continuity skill en System Map zijn in dezelfde PR bijgewerkt. Append-only ledger in `docs/development-ledger-events/2026-10-22-ghost-aware-predictive-queue-pressure-v1.md`.

Status tot protected merge en exacte Janitor runtime: **CANDIDATE, niet live bewezen**. Na merge moet de Janitor-artifact echte raw/verified/actionable-cijfers tonen, inclusief `collectionMissingKnownProviderIds` voor mogelijke cross-endpoint afwijking. De bredere lane-specifieke voorspelling, echte bottleneckmetingen en performancewinst blijven een afzonderlijke acceptatieverplichting in dezelfde #4661, niet stilletjes als afgerond verklaard.

## 22 oktober: provider-consistentie en conservatieve optionele dispatch
Een bronreview ontdekte dat GitHub `total_count=12` kan teruggeven terwijl slechts 10 `workflow_runs` vermeld worden, of `total_count=0` terwijl vier onafhankelijke run-endpoints nog queued melden. Ook kan een dubbel run-ID ten onrechte tweemaal worden afgetrokken. Daarom gebruikt de predictor nu de echte provider-`total_count`, controleert de Janitor afzonderlijke bekende run-ID's en weigert een optionele dispatch met `PROVIDER_QUEUE_SNAPSHOT_INCONSISTENT` bij ontbrekende, dubbele of tegenstrijdige gegevens. Bekende providerfouten blijven als incident zichtbaar. Alleen eigenaar-/GitHub-Actions-comments leveren vertrouwde eerdere denial-markers. Geen nieuwe scheduler of omzeiling van beschermde checks. De correctie blijft kandidaat totdat CI, beschermd mergen en productie-readback geslaagd zijn.
