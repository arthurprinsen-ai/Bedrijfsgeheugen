# 4 november 2026 — First Time Right vóór bouwen

## Bronincident en oorzaak
De oorspronkelijke content-orchestrator werd eerder met een dubbele `const revisionInput` uitgerold. Supabase gaf versie v601 ACTIVE, maar de echte Edge-worker faalde met HTTP503. Een SQL-migratie verloor eerder zijn PL/pgSQL-dollar-quote terminator. De bekende, deterministisch herkenbare fouten hadden vóór build/release kunnen worden tegengehouden.

## Oorspronkelijke oplossing
Geen parallel agent of scheduler. De bestaande GitHub `hygiene / admission` krijgt in twee beschermde stappen een source-readiness controle: (1) checker, tests, ONE BRAIN-leerregel, AGENTS/skill, menselijke documentatie; (2) pas na beschermd merge de checker van de actuele vertrouwde `main` SHA in dezelfde admission gebruiken. De kandidaat mag nooit zijn eigen policy bepalen. Check gewijzigde JS/TS syntaxis zonder uitvoering, SQL dollar-quotes, en minstens één gewijzigde regressietest. Bij afkeuring machine-evidence: foutfingerprint, eigenaar, oorzaak, bronpad, reparatie, preventie, regresstest en terminale verificatie.

## Verplicht vóór ieder ontwerp, werk of provider side-effect
Agent verifieert gebruikersbehoefte, acceptatiecriteria, actuele broncontext, bestaand incidentpatroon, eerstehands bewijs, exclusieve writer en afhankelijkheden, toestemming/privacy/security, providerrechten, kosten/limieten, herhaalveiligheid, regression/failover, rollback en onafhankelijke meting. Ontbrekende harde vereiste is `BLOCKED_BEFORE_BUILD`. Onbekende nieuwe fouten kunnen niet nul worden gegarandeerd; nieuwe incidenten blijven origineel owner en moeten op fingerprint worden geleerd.

## Afsluitbewijs
Stage 1: origineel beschermd merge met Required/BRAIN/CodeQL/preview. Stage 2: aparte beschermde PR voor bestaande native admission, waarbij exact main-versie de checker levert; originele admission eerst vóór dure CI. Daarna een echte geweigerde test-PR op dubbele declaratie en succesvolle veilige test-PR, artifact uitlezen, incident niet vals gesloten verklaren. Echte productiewijzigingen vragen nog exact source/deploy/readback/provider/outcome bewijs. Foutloos bouwen is een streven, geen technische garantie.

Centrale incidentregistratie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
