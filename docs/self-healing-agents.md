# Self-Healing Agents — Bedrijfsgeheugen

## Doel
Agents herstellen aantoonbare fouten zelfstandig, houden de laatste groene toestand beschikbaar en zetten iedere fout om in herbruikbare kennis en een automatische preventieregel. De whole-brain outcome-regels in `docs/outcome-obligations.md` zijn bindend voor iedere herstelroute.

## Hoogste outcome-invariant
**NO SILENT FAILURE. NO LOST OBLIGATION. GREEN MEANS OUTCOME VERIFIED. RED MEANS AGENTS KEEP WORKING.**

Een technisch succesvolle run is nooit voldoende wanneer een verwacht resultaat ontbreekt. Als een outcome due is, zijn zero-candidate, zero-work, zero-output en success-without-outcome rode toestanden. Een gemiste outcome wordt `MISSED_OBLIGATION` en blijft herstelwerk totdat onafhankelijk bewijs bestaat of een echte harde grens resteert.

## Accepted website baseline en semantic content drift
De geaccepteerde website-identiteit in `site/accepted-baseline.json` en `site/navigation-baseline.json` is een protected invariant. **Semantic content drift** betekent dat een route technisch bestaat en mogelijk zelfs SEO-groen is, maar inhoudelijk een andere pagina-/propositie-/verhaalversie vertegenwoordigt dan de accepted website baseline.

Bij semantic content drift geldt verplicht dezelfde autonome herstelroute:
1. blokkeer preview-naar-productiepromotie;
2. rapporteer route, gewijzigde of ontbrekende semantic anchors en de niet-gedekte wijzigingsscope;
3. herstel alleen de afwijkende protected content vanuit de versioned **last-known-good** accepted baseline; draai geen brede repository rollback;
4. behoud additieve security-, SEO-, Brain-, portal-, analytics- en infrastructuurverbeteringen;
5. controleer dat desktop en mobiel dezelfde accepted navigation route catalog behouden;
6. draai `tests/site-baseline-guardian.test.mjs`, V18 Production Promotion, Live Preview Smoke en Pagina-/SEO-controle opnieuw;
7. als een gate rood blijft, vervolg de normale diagnose-/repairlus en promoveer niet;
8. schrijf incident, root cause, herstelbron, herstelcommit en nieuwe preventieregel naar development ledger en gedeeld agentgeheugen.

Een protected pagina mag alleen inhoudelijk veranderen wanneer een expliciete machineleesbare scope de route dekt. Zonder explicit scope is iedere onverwachte semantic hash/anchor-drift rood, ook als HTTP, HTML, H1, canonical of SEO technisch geldig zijn.

## Standaardcyclus
1. **Observe** — lees actuele runtime-, build-, deploy-, branch- en obligation/outcome-status.
2. **Classify** — bepaal: code, data, config, asset, dependency, performance, kosten, externe storing, semantic content drift of gemiste obligation.
3. **Define outcome** — bepaal welk concreet resultaat verwacht wordt en welke onafhankelijke evidence dat bewijst.
4. **Protect** — bewaar de laatste bewezen groene productieversie als rollback/fallback.
5. **Reproduce** — leg symptoom of outcome-gap vast met concreet bewijs.
6. **Root cause** — verander niets voordat de meest waarschijnlijke oorzaak aantoonbaar is.
7. **Gate first** — voeg waar mogelijk een test toe die de fout reproduceert.
8. **Minimal repair** — wijzig alleen de oorzaak en behoud invarianten.
9. **Verify candidate** — draai statische tests, buildtests en relevante runtimechecks.
10. **Verify outcome** — controleer het echte resultaat; technisch succes alleen telt niet.
11. **Deploy preview** — publiceer naar veilige preview/testomgeving wanneer code/deploy betrokken is.
12. **Inspect exact preview** — controleer exacte SHA, deploystatus en artifact.
13. **If red, continue** — een rode kandidaat of obligation is geen eindstatus; analyseer nieuw bewijs en hervat de cyclus.
14. **Promote on green** — zodra de kandidaat aantoonbaar groen is, promoveer automatisch naar productie.
15. **Verify production** — controleer exacte productie-SHA/deploy, smoke/regressie, protected metrics en intended outcome.
16. **Rollback on production red** — bij productieregressie onmiddellijk terug naar last-known-good en hervat herstel op de veilige route.
17. **Learn** — schrijf incident, obligation, oorzaak, fix, retries/hypotheses, outcome evidence, promotie/rollback en preventie naar gedeeld geheugen.
18. **Promote prevention** — maak herhaalbare foutklassen permanente gates/validators.

## Groen-tot-klaar
Voor veilig oplosbare wijzigingen bestaan slechts drie geldige terminale toestanden:
- `PRODUCTION_GREEN`: nieuwe productieversie én het bedoelde resultaat zijn aantoonbaar groen;
- `ROLLED_BACK_GREEN`: productie is terug op last-known-good en de nieuwe kandidaat blijft open voor verdere automatische reparatie;
- `BLOCKED_HARD_BOUNDARY`: de volgende noodzakelijke stap raakt een harde autonome grens.

`FAILED`, `BUILD_FAILED`, `TEST_FAILED`, `DEPLOY_FAILED`, `SUCCESS_WITHOUT_OUTCOME` en `MISSED_OBLIGATION` zijn tussenstappen zolang een veilige herstelroute bestaat.

Een open rood herstelitem of obligation wordt bij de volgende agentrun automatisch hervat vanuit het laatste bewijs, zodat herstel niet afhankelijk is van chatgeschiedenis of handmatige opvolging.

## Beslisregels
- **Expected outcome ontbreekt ondanks technisch succes:** classificeer RED / `MISSED_OBLIGATION` en start of hervat recovery.
- **Semantic content drift:** blokkeer release, herstel protected route vanaf accepted last-known-good, verifieer volledige site-identiteit en leg de foutklasse vast.
- **Known issue + known fix:** fix direct; geen nieuwe verkenning.
- **Known issue + eerdere fix faalt:** onderzoek verschil in omgeving/state en maak nieuwe regressiecheck.
- **Nieuwe fout, laag risico:** zelfstandig herstellen tot groen.
- **Nieuwe fout, hoog risico:** last-known-good groen houden; risicovolle stap isoleren en alle overige veilige herstelstappen uitvoeren.
- **Deterministisch veilige state-gap:** herstel kleinste reversibele machine-state, voer idempotent opnieuw uit en verifieer outcome.
- **Runtime continuity:** BG165 kan inactive/invalid state herstellen, maar runtime-health vervangt nooit outcome evidence.
- **Niet deterministisch veilig:** routeer via gedeeld geheugen/BG168 en BG156 of het kleinste geschikte specialistische team.
- **Externe dependency faalt:** gebruik laatste goede lokale/cached output waar mogelijk; dependency niet eindeloos pollen.
- **Kosten/performance overschrijding:** reduceren, batchen, cachen, comprimeren of fallback gebruiken; functionaliteit niet onnodig stoppen.
- **Productie groen na candidate gate:** automatisch promoveren en exact verifiëren.
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
- accepted website baseline;
- versioned assets;
- cached/read-only state;
- idempotente writes en idempotency keys;
- degradatie zonder totale uitval;
- atomische deploys;
- rollbackbare branches/releases;
- productie-canary/smoke vóór definitieve KEEP-beslissing;
- persisted next safe action voor gemiste obligations.

## Harde stopgrenzen
Autonome self-healing stopt uitsluitend wanneer de volgende noodzakelijke stap één van deze grenzen raakt:
- secrets/credentials/accountverbindingen/permissies wijzigen;
- security-controls verzwakken;
- destructieve of onomkeerbare datamutatie;
- externe kosten/betalingen/resources verhogen;
- juridisch of financieel bindende actie.

Productiepromotie zelf is geen harde grens: een aantoonbaar groene, rollbackbare kandidaat mag automatisch naar productie.

De agent moet vóór een harde grens alles doen wat wel veilig mogelijk is: diagnose afronden, kandidaat groen maken, tests draaien, rollback voorbereiden, obligation-state bewaren en exact aangeven welke blokkade resteert.

## Kennis als gedeeld teamgeheugen
Alle agents gebruiken dezelfde repo-documentatie, tests en Powerhouse Team Memory. Een incident of gemiste obligation is pas afgesloten wanneer oorzaak, fix, mislukte hypotheses, outcome evidence, productie-uitkomst en preventieregel voor de volgende agent beschikbaar zijn.

Open herstelitems bewaren minimaal: fingerprint, obligation-id/expected outcome waar relevant, current hypothesis, laatst geverifieerde fout, attempted fixes, retry count per hypothesis, last-known-good, candidate SHA/deploy, owner agent en next safe action.

## KPI's voor sneller ontwikkelen en minder stille uitval
We sturen op:
- mean time to detect;
- mean time to repair;
- tijd van rood naar groen;
- percentage fouten automatisch hersteld;
- percentage obligations vóór deadline geverifieerd;
- aantal overdue unverified obligations;
- aantal technisch-succes-zonder-outcome incidents;
- aantal semantic-content-drift incidents dat vóór productie is geblokkeerd;
- percentage groene kandidaten automatisch succesvol naar productie gepromoveerd;
- rollback rate;
- regressiepercentage;
- aantal herhaalde foutklassen;
- deploy success rate;
- aantal handmatige interventies.

Doel: veilig oplosbare rode toestanden verdwijnen automatisch, gemiste outcomes kunnen niet stil blijven liggen, productie blijft groen en dezelfde foutklasse wordt na één incident voortaan eerder onderschept of automatisch hersteld.
