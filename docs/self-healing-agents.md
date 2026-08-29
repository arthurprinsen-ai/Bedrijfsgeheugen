# Self-Healing Agents — Bedrijfsgeheugen

## Doel
Agents herstellen aantoonbare fouten zelfstandig, houden de laatste groene toestand beschikbaar en zetten iedere fout om in herbruikbare kennis en een automatische preventieregel. De whole-brain outcome-regels staan aanvullend en bindend in `docs/outcome-obligations.md`.

## Hoogste outcome-invariant
**NO SILENT FAILURE. NO LOST OBLIGATION. GREEN MEANS OUTCOME VERIFIED. RED MEANS AGENTS KEEP WORKING.**

Een technisch succesvolle run is nooit voldoende wanneer een verwacht resultaat ontbreekt. Als een obligation due is, zijn zero-candidate, zero-work, zero-output en success-without-verification rode toestanden. Iedere productie-kritische flow moet daarom naast runtime-health ook het echte resultaat onafhankelijk verifiëren volgens `docs/outcome-obligations.md`.

## Standaardcyclus
1. **Observe** — lees actuele runtime-, build-, deploy-, branch- én obligation/outcome-status.
2. **Classify** — bepaal: code, data, config, asset, dependency, performance, kosten, externe storing of gemiste obligation.
3. **Define outcome** — bepaal welk concreet resultaat verwacht wordt en welke onafhankelijke evidence dat bewijst.
4. **Protect** — bewaar de laatste bewezen groene productieversie als rollback/fallback.
5. **Reproduce** — leg het symptoom of de outcome-gap vast met concreet bewijs.
6. **Root cause** — verander niets voordat de meest waarschijnlijke oorzaak aantoonbaar is.
7. **Gate first** — voeg waar mogelijk een test toe die de fout reproduceert.
8. **Minimal repair** — wijzig alleen de oorzaak en behoud invarianten.
9. **Verify candidate** — draai statische tests, buildtests en relevante runtimechecks.
10. **Verify outcome** — controleer de echte resultaat-evidence; run-success alleen telt niet.
11. **Deploy preview** — publiceer naar veilige preview/testomgeving wanneer het code/deploy betreft.
12. **Inspect exact preview** — controleer exacte SHA, deploystatus en artifact.
13. **If red, continue** — een rode kandidaat of obligation is geen eindstatus. Analyseer de nieuwe fout en ga terug naar root cause/gate/minimal repair.
14. **Promote on green** — zodra de kandidaat aantoonbaar groen is, promoveer automatisch naar productie.
15. **Verify production** — controleer exacte productie-SHA/deploy, smoke/regressie, protected metrics en het bedoelde resultaat.
16. **Rollback on production red** — bij productieregressie onmiddellijk terug naar last-known-good en hervat de herstelcyclus op de veilige ontwikkelroute.
17. **Learn** — schrijf incident, obligation, oorzaak, fix, retries/hypotheses, productiepromotie/rollback en preventie naar het gedeelde ledger.
18. **Promote prevention** — maak herhaalbare foutklassen permanente gates/validators.

## Groen-tot-klaar
Voor veilig oplosbare wijzigingen bestaan slechts drie geldige terminale toestanden:
- `PRODUCTION_GREEN`: nieuwe productieversie én het bedoelde resultaat zijn aantoonbaar groen;
- `ROLLED_BACK_GREEN`: productie is terug op last-known-good en de nieuwe kandidaat blijft open voor verdere automatische reparatie;
- `BLOCKED_HARD_BOUNDARY`: de volgende noodzakelijke stap raakt een harde autonome grens.

`FAILED`, `BUILD_FAILED`, `TEST_FAILED`, `DEPLOY_FAILED`, `SUCCESS_WITHOUT_OUTCOME`, `ZERO_CANDIDATES_WHILE_DUE` en vergelijkbare statussen zijn tussenstappen, geen eindresultaten zolang een veilige herstelroute bestaat.

Een open rood herstelitem of obligation wordt bij de volgende agentrun automatisch hervat vanuit het laatste bewijs, zodat het niet afhankelijk is van chatgeschiedenis of handmatige opvolging.

## Beslisregels
- **Expected outcome ontbreekt ondanks success:** classificeer RED en start obligation-recovery.
- **Known issue + known fix:** fix direct; geen nieuwe verkenning.
- **Known issue + eerdere fix faalt:** onderzoek verschil in omgeving/state en maak nieuwe regressiecheck.
- **Nieuwe fout, laag risico:** zelfstandig herstellen tot groen.
- **Nieuwe fout, hoog risico:** last-known-good groen houden; risicovolle stap isoleren en alle overige veilige herstelstappen uitvoeren.
- **Deterministisch veilige state-gap:** herstel kleinste reversibele machine-state, voer idempotent opnieuw uit, verifieer outcome.
- **Niet deterministisch veilig:** routeer via BG168 naar shared learning en BG156 / kleinste specialistische agentteam.
- **Runtime continuity:** BG165 herstelt inactive/invalid state, maar runtime-health vervangt nooit business-outcome evidence.
- **Externe dependency faalt:** gebruik laatste goede lokale/cached output waar mogelijk; dependency niet eindeloos pollen.
- **Kosten/performance overschrijding:** reduceren, batchen, cachen, comprimeren of fallback gebruiken; functionaliteit niet onnodig stoppen.
- **Productie groen na candidate gate:** automatisch promoveren en productie verifiëren via BG169.
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
- idempotente writes en `idempotency_key`-equivalenten;
- degradatie zonder totale uitval;
- atomische deploys;
- rollbackbare branches/releases;
- productie-canary/smoke vóór definitieve KEEP-beslissing;
- persisted `next_safe_action` voor gemiste obligations.

## Harde stopgrenzen
Autonome self-healing stopt uitsluitend wanneer de volgende noodzakelijke stap één van deze grenzen raakt:
- secrets/credentials/permissies wijzigen;
- security-controls verzwakken;
- destructieve of onomkeerbare datamutatie;
- externe kosten/betalingen/resources verhogen;
- juridisch of financieel bindende actie.

Productiepromotie zelf is geen harde grens meer: een aantoonbaar groene, rollbackbare kandidaat mag automatisch naar productie.

De agent moet vóór een harde grens alles doen wat wel veilig mogelijk is: diagnose afronden, kandidaat groen maken, tests draaien, rollback voorbereiden, production promotion voorbereiden, obligation-state bewaren en exact aangeven welke ene blokkade resteert.

## Kennis als gedeeld teamgeheugen
Alle agents gebruiken dezelfde repo-documentatie, tests en Powerhouse Team Memory. Een incident of gemiste obligation is pas afgesloten wanneer oorzaak, fix, mislukte hypotheses, outcome-evidence, productie-uitkomst en preventieregel voor de volgende agent beschikbaar zijn. Geen agent mag afhankelijk zijn van chatgeschiedenis om een bekende fout te begrijpen.

Open herstelitems bewaren minimaal: fingerprint, obligation_id/expected_outcome waar relevant, current hypothesis, laatst geverifieerde fout, attempted fixes, retry count per hypothesis, last-known-good, candidate SHA/deploy, owner agent en `next_safe_action`.

## KPI's voor sneller ontwikkelen en minder stille uitval
We sturen op:
- mean time to detect;
- mean time to repair;
- tijd van rood naar groen;
- percentage fouten automatisch hersteld;
- percentage obligations vóór deadline geverifieerd;
- aantal overdue unverified obligations;
- aantal success-without-outcome incidents;
- percentage groene kandidaten automatisch succesvol naar productie gepromoveerd;
- rollback rate;
- regressiepercentage;
- aantal herhaalde foutklassen;
- deploy success rate;
- aantal handmatige interventies.

Doel: veilig oplosbare rode toestanden verdwijnen automatisch, gemiste outcomes kunnen niet stil blijven liggen, productie blijft groen en dezelfde foutklasse wordt na één incident voortaan eerder onderschept of automatisch hersteld.
