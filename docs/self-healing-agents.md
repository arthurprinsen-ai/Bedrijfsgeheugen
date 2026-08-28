# Self-Healing Agents — Bedrijfsgeheugen

## Doel
Agents herstellen aantoonbare fouten zelfstandig, houden de laatste groene toestand beschikbaar en zetten iedere fout om in herbruikbare kennis en een automatische preventieregel.

## Standaardcyclus
1. **Observe** — lees actuele runtime-, build-, deploy- en branchstatus.
2. **Classify** — bepaal: code, data, config, asset, dependency, performance, kosten of externe storing.
3. **Protect** — bewaar de laatste bewezen groene productieversie als rollback/fallback.
4. **Reproduce** — leg het symptoom vast met concreet bewijs.
5. **Root cause** — verander niets voordat de meest waarschijnlijke oorzaak aantoonbaar is.
6. **Gate first** — voeg waar mogelijk een test toe die de fout reproduceert.
7. **Minimal repair** — wijzig alleen de oorzaak en behoud invarianten.
8. **Verify candidate** — draai statische tests, buildtests en relevante runtimechecks.
9. **Deploy preview** — publiceer naar veilige preview/testomgeving.
10. **Inspect exact preview** — controleer exacte SHA, deploystatus en artifact.
11. **If red, continue** — een rode kandidaat is geen eindstatus. Analyseer de nieuwe fout en ga terug naar root cause/gate/minimal repair.
12. **Promote on green** — zodra de kandidaat aantoonbaar groen is, promoveer automatisch naar productie.
13. **Verify production** — controleer exacte productie-SHA/deploy, smoke/regressie en protected metrics.
14. **Rollback on production red** — bij productieregressie onmiddellijk terug naar last-known-good en hervat de herstelcyclus op de veilige ontwikkelroute.
15. **Learn** — schrijf incident, oorzaak, fix, retries/hypotheses, productiepromotie/rollback en preventie naar het gedeelde ledger.
16. **Promote prevention** — maak herhaalbare foutklassen permanente gates/validators.

## Groen-tot-klaar
Voor veilig oplosbare wijzigingen bestaan slechts drie geldige terminale toestanden:
- `PRODUCTION_GREEN`: nieuwe productieversie is aantoonbaar groen;
- `ROLLED_BACK_GREEN`: productie is terug op last-known-good en de nieuwe kandidaat blijft open voor verdere automatische reparatie;
- `BLOCKED_HARD_BOUNDARY`: de volgende noodzakelijke stap raakt een harde autonome grens.

`FAILED`, `BUILD_FAILED`, `TEST_FAILED`, `DEPLOY_FAILED` en vergelijkbare statussen zijn tussenstappen, geen eindresultaten zolang een veilige herstelroute bestaat.

Een open rood herstelitem wordt bij de volgende agentrun automatisch hervat vanuit het laatste bewijs, zodat het niet afhankelijk is van chatgeschiedenis of handmatige opvolging.

## Beslisregels
- **Known issue + known fix:** fix direct; geen nieuwe verkenning.
- **Known issue + eerdere fix faalt:** onderzoek verschil in omgeving/state en maak nieuwe regressiecheck.
- **Nieuwe fout, laag risico:** zelfstandig herstellen tot groen.
- **Nieuwe fout, hoog risico:** last-known-good groen houden; risicovolle stap isoleren en alle overige veilige herstelstappen uitvoeren.
- **Externe dependency faalt:** gebruik laatste goede lokale/cached output waar mogelijk; dependency niet eindeloos pollen.
- **Kosten/performance overschrijding:** reduceren, batchen, cachen, comprimeren of fallback gebruiken; functionaliteit niet onnodig stoppen.
- **Productie groen na candidate gate:** automatisch promoveren en productie verifiëren.
- **Productie rood na promotie:** automatisch rollback en nieuwe diagnose-iteratie.

## Retrybeleid
- Geen onbeperkte identieke retries.
- Maximaal 2 identieke retries per hypothese zonder nieuwe informatie.
- Daarna verplicht hypothese wijzigen, oorzaakfix veranderen of bewezen fallback kiezen.
- Iedere retry/iteratie moet nieuwe observatie opleveren.
- Een retry die alleen dezelfde fout opnieuw produceert is bewijs dat de aanpak moet veranderen, niet dat het werk mag stoppen.
- De totale herstelcyclus mag meerdere verschillende hypotheses/fixes doorlopen totdat groen of een harde grens is bereikt.

## Fallbacks
Agents moeten waar mogelijk ontwerpen met:
- last-known-good productieartifact;
- versioned assets;
- cached/read-only state;
- idempotente writes;
- degradatie zonder totale uitval;
- atomische deploys;
- rollbackbare branches/releases;
- productie-canary/smoke vóór definitieve KEEP-beslissing.

## Harde stopgrenzen
Autonome self-healing stopt uitsluitend wanneer de volgende noodzakelijke stap één van deze grenzen raakt:
- secrets/credentials/permissies wijzigen;
- security-controls verzwakken;
- destructieve of onomkeerbare datamutatie;
- externe kosten/betalingen/resources verhogen;
- juridisch of financieel bindende actie.

Productiepromotie zelf is geen harde grens meer: een aantoonbaar groene, rollbackbare kandidaat mag automatisch naar productie.

De agent moet vóór een harde grens alles doen wat wel veilig mogelijk is: diagnose afronden, kandidaat groen maken, tests draaien, rollback voorbereiden, production promotion voorbereiden en exact aangeven welke ene blokkade resteert.

## Kennis als gedeeld teamgeheugen
Alle agents gebruiken dezelfde repo-documentatie, tests en Powerhouse Team Memory. Een incident is pas afgesloten wanneer oorzaak, fix, mislukte hypotheses, productie-uitkomst en preventieregel voor de volgende agent beschikbaar zijn. Geen agent mag afhankelijk zijn van chatgeschiedenis om een bekende fout te begrijpen.

Open herstelitems bewaren minimaal: fingerprint, current hypothesis, laatst geverifieerde fout, attempted fixes, retry count per hypothesis, last-known-good, candidate SHA/deploy, owner agent en volgende veilige actie.

## KPI's voor sneller ontwikkelen
We sturen op:
- mean time to detect;
- mean time to repair;
- tijd van rood naar groen;
- percentage fouten automatisch hersteld;
- percentage groene kandidaten automatisch succesvol naar productie gepromoveerd;
- rollback rate;
- regressiepercentage;
- aantal herhaalde foutklassen;
- deploy success rate;
- aantal handmatige interventies.

Doel: veilig oplosbare rode toestanden verdwijnen automatisch, productie blijft groen en dezelfde foutklasse wordt na één incident voortaan eerder onderschept of automatisch hersteld.