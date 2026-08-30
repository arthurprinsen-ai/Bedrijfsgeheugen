# Bedrijfsgeheugen — Agent Development Contract

Dit bestand is de eerste bron die iedere agent moet lezen voordat code, content, automatisering, Make, Netlify, GitHub of portalgedrag wordt gewijzigd.

## Doel
Ontwikkel sneller doordat bewezen kennis wordt hergebruikt, fouten niet opnieuw worden gemaakt en iedere wijziging aantoonbaar veilig is.

## Hoofdregel: agents lossen zelf op
Een agent die een fout, regressie, mislukte build, kapotte route, ongeldige asset, kostenprobleem of andere aantoonbare afwijking vindt, stopt niet bij signaleren, uitleggen of adviseren. De standaardreactie is zelfstandig herstellen binnen de toegestane omgeving.

Verplichte self-healing lus:
1. detecteer de afwijking;
2. verzamel runtime/build/deploy-bewijs;
3. bepaal de root cause;
4. voeg waar mogelijk eerst een regressiecheck toe die de fout vangt;
5. voer de kleinst mogelijke oorzaakgerichte fix uit;
6. test opnieuw;
7. als de test faalt: analyseer de nieuwe fout en herhaal de lus;
8. publiceer naar preview/test;
9. verifieer exacte commit/deploy;
10. als preview groen is: promoveer automatisch naar productie;
11. verifieer productie opnieuw;
12. als productie rood is: rollback naar last-known-good, analyseer de nieuwe fout en hervat de herstelcyclus;
13. leg fout, oorzaak, fix, mislukte pogingen, productie-uitkomst en preventieregel vast in het ledger.

Een agent mag dus niet eindigen met alleen “dit moet je aanpassen”, “controleer dit”, “hier is een advies”, “de build faalt” of “de deploy is rood” wanneer de agent de fout zelf veilig kan herstellen.

## Accepted website baseline — protected invariant
De **accepted website baseline** in `site/accepted-baseline.json` en `site/navigation-baseline.json` is bindend voor iedere huidige en toekomstige agent. Een route die nog bestaat en technisch/SEO-groen is, kan toch rood zijn wanneer de betekenis, propositie, het verhaal, verplichte inhoudsankers of de navigatiepositie onverwacht zijn gewijzigd.

Regels:
- beschermde pagina-inhoud mag alleen wijzigen wanneer een machineleesbare **explicit scope** de betreffende route en change class expliciet dekt;
- buiten die explicit scope moeten semantic anchors en de accepted routecatalogus identiek blijven;
- een redesign, menu- of mobile-UX-wijziging mag presentatie veranderen, maar nooit stil routes, pagina-inhoud of de betekenis van een protected pagina vervangen;
- desktop en mobiel zijn views op dezelfde accepted navigation catalog en mogen geen eigen inhoudelijke waarheid hebben;
- onverwachte semantic content drift is release-blocking, ook wanneer HTML, H1, canonical, HTTP en SEO technisch geldig zijn;
- bij drift: blokkeer promotie → herstel alleen de afwijkende route vanuit accepted last-known-good → behoud additieve security/SEO/Brain/portal/infrastructuurverbeteringen → draai baseline-, browser-, V18- en SEO-gates opnieuw → schrijf incident en preventieregel terug naar gedeeld geheugen;
- een agent mag nooit een oudere of nieuwere pagina kiezen alleen omdat die commit chronologisch recenter is; de accepted baseline bepaalt welke inhoudsversie correct is.

`tests/site-baseline-guardian.test.mjs` is onderdeel van de productiepoort en mag niet worden omzeild of verzwakt om een kandidaat groen te maken.

## Whole-brain outcome obligations — hoogste invariant
`docs/outcome-obligations.md` en `config/outcome-obligations.json` gelden voor iedere huidige en toekomstige agent en workflow.

Iedere actie waarvan volgens planning, state, contract of historie een resultaat moet bestaan, wordt behandeld als een outcome obligation met eigenaar, deadline, evidence policy, idempotency key en recovery policy.

De niet-onderhandelbare regels zijn:
- `NO SILENT FAILURE`;
- `NO LOST OBLIGATION`;
- `GREEN MEANS OUTCOME VERIFIED`;
- `RED MEANS AGENTS KEEP WORKING`.

Een technisch succesvolle run is nooit voldoende wanneer het bedoelde resultaat ontbreekt. Een Make-run met status success, HTTP 2xx, een lege zoekopdracht, `zero candidates`, een groene build of een geslaagde dispatch kan dus nog steeds `MISSED_OBLIGATION` zijn. Zodra een verschuldigd outcome na de deadline geen geldig bewijs heeft, start de owner agent automatisch herstel en schrijft bij veilig herstel `AUTO_REPAIR` terug.

Een obligation mag alleen eindigen als `COMPLETED` met geldig outcome-bewijs of als `BLOCKED_HARD_BOUNDARY` volgens de harde grenzen hieronder. Side-effects worden altijd idempotent uitgevoerd en eerst gecontroleerd op bestaand extern bewijs om dubbel publiceren, dubbel mailen, dubbele writes of andere dubbele handelingen te voorkomen.

## groen-tot-klaar contract
Voor veilig oplosbare kandidaatwijzigingen is `FAILED` geen terminale status maar een nieuwe diagnose-input.

Agents blijven itereren totdat één van deze terminale toestanden is bereikt:
- `PRODUCTION_GREEN`: productie is aantoonbaar groen en de wijziging is geverifieerd;
- `ROLLED_BACK_GREEN`: de nieuwe variant kon nog niet veilig worden behouden, maar productie is automatisch teruggebracht naar de laatste bewezen groene versie en de reparatielus gaat op de veilige ontwikkelroute verder;
- `BLOCKED_HARD_BOUNDARY`: alleen wanneer de volgende noodzakelijke stap secrets/credentials/permissies, security-controls, destructieve/onherroepelijke data, hogere betaalde externe resources of juridisch/financieel bindende acties vereist.

Regels:
- maximaal twee identieke retries zonder nieuwe informatie;
- daarna verplicht nieuwe hypothese, andere oorzaakfix of bewezen fallback;
- geen eindeloze blinde retry-loop;
- iedere iteratie moet nieuw bewijs opleveren;
- productie blijft beschikbaar via last-known-good waar technisch mogelijk;
- agents hervatten bij de volgende run automatisch openstaande niet-groene herstelitems en open outcome obligations.

## Eén team, één geheugen
Alle agents opereren als één team met specialistische rollen. Geen agent mag een eigen geïsoleerde waarheid aanhouden.

Voor iedere materiële taak geldt verplicht:
1. lees de actuele `shared team context` vóór uitvoering;
2. controleer bestaande fouten, fixes, verbeteringen, experimenten, obligations en kansen op fingerprint;
3. bepaal één `owner agent` voor uitvoering;
4. voorkom dubbel of conflicterend werk;
5. schrijf iedere materiële uitkomst terug via `material outcome writeback`;
6. laat de gedeelde teamcontext daarna verversen zodat alle agents dezelfde nieuwste waarheid zien.

Materiële uitkomsten zijn minimaal: `ERROR`, `RECOVERY`, `IMPROVEMENT`, `OPPORTUNITY`, `EXPERIMENT_RESULT`, `MISSED_OBLIGATION`, `AUTO_REPAIR`, `PRODUCTION_PROMOTION`, `PRODUCTION_ROLLBACK` en `CONTRACT_CHANGE`.

Een nieuwe of toekomstige agent is niet production-ready als shared-context read, outcome-obligation compliance of material-outcome writeback ontbreekt.

### BRAIN chat-learning preflight
`config/brain-chat-learning-contract.json` (`BRAIN-CHAT-LEARNING-v1`) is verplichte gedeelde voorkennis voor iedere huidige en toekomstige agent, workflow en scenario die materieel werk uitvoert.

- Laad de canonieke learning sources uit het contract vóór debuggen, ontwerpen, wijzigen of uitvoeren.
- Match iedere relevante fingerprint vóór uitvoering en hergebruik eerst een bewezen fix/preventieregel.
- Een bekende mislukte aanpak blijft geblokkeerd totdat nieuwe evidence aantoonbaar maakt dat de eerdere root cause of randvoorwaarde niet meer geldt.
- Houd audit history en actuele operationele projection semantisch gescheiden; testcanaries/no-op false positives mogen de actuele teamcontext niet vervuilen.
- Nieuwe materiële fout/fix/preventie wordt teruggeschreven en maakt pas daarna via de gedeelde context deel uit van de volgende agentpreflight.

## BRAIN Continuous CI/CD v2 — onafhankelijke delivery lanes
Alle huidige en toekomstige apps, agents, Make-scenario's, GitHub-workflows, website-, portal-, backend- en servicecomponenten vallen onder `BRAIN-DELIVERY-v2` via `config/brain-delivery-system.json`, `brain/contracts/delivery-v2.schema.json`, `brain/production/continuous-delivery-v2.mjs` en `tools/brain-delivery-system.mjs`.

De canonieke regel is **independent delivery, shared intelligence**:
- ontwikkelen mag simultaan;
- iedere lane heeft een eigen `change_id`, `component_id`, `lane_id`, scope, dependencies, kandidaatidentiteit en rollbackidentiteit;
- iedere lane valideert uitsluitend zijn eigen scope plus expliciet gedeclareerde contract- en dependencychecks;
- generieke drift op `main` is nooit op zichzelf een rebuild- of wachtreden;
- alleen een aantoonbaar mergeconflict, changed-path overlap, declared contract overlap of declared dependency conflict vereist synchronisatie van de betrokken lane;
- niet-conflicterende lanes blijven doorwerken en mogen onafhankelijk promoveren;
- exact de geteste kandidaatidentiteit moet worden gepromoveerd; een andere SHA/artifact/revisie is automatisch niet groen;
- BG169 blijft de enige productieautoriteit voor GitHub-backed productiepromoties; agents mogen die autoriteit niet stil omzeilen;
- BG167/shared-context wordt vóór materiële uitvoering gelezen; BG168/BG166 ontvangen uitkomst, fout, root cause, fix en preventieleerpunt; daarna wordt de gedeelde context ververst;
- contract/schema, kwaliteit/tests, security, kosten/performance, preview/runtime, rollback readiness en production verification zijn verplichte gates;
- onbekende actieve scope of ongeregistreerde nieuwe component faalt gesloten vóór productie;
- nieuwe componenten registreren automatisch in het gezamenlijke Brain en zijn niet production-ready zonder shared-context read, cost/security governance, rollback en learning writeback;
- bestaande Make-scenario's blijven via de dynamische BG159 Cost/Brain-inventaris zichtbaar en worden compatibility-first onder deze centrale poorten gebracht; geen dure destructieve bulk-rewrite per scenario;
- Notion is kennis-, audit- en projectielaag, nooit de autoriteit voor de werkelijk gedeployde identiteit.

Geen agent, chat, workflow, scenario of toekomstige app/dienst mag een productieactie buiten deze v2-deliveryregels uitvoeren. Lopend werk hoeft niet opnieuw te worden gebouwd wanneer zijn exact geteste scope aantoonbaar niet conflicteert; bij de eerstvolgende productieactie gelden de v2-gates wel verplicht.

GitHub en Netlify zijn zelf actieve onderdelen van het Brain (`PLATFORM_GITHUB` en `PLATFORM_NETLIFY`). Voor iedere Netlify-productiedeploy moet vóór upload vanuit de beoogde bronmap deze controle draaien:

`node tools/brain-delivery-system.mjs deploy-preflight --sha <exacte-BG169-productie-SHA>`

De controle moet `DEPLOY_SOURCE_READY` teruggeven. `STAGE_STANDALONE_EXACT_SHA` betekent dat de bron een gekoppelde Git-worktree is; upload die nooit rechtstreeks, omdat het `.git`-bestand naar een lokaal absoluut common-dir kan verwijzen dat in Netlify niet bestaat. Maak dan een standalone clone zonder hardlinks, check exact de BG169-SHA uit, herhaal de preflight en deploy pas na groen bewijs. Leg zowel de fout als de recovery via BG168 vast en verifieer zichtbaarheid via BG167.

## Kansen actief zien en benutten
Agents zoeken niet alleen fouten; zij zoeken ook dagelijks aantoonbare kansen op:
- SEO en zoekvraag;
- websitegedrag, navigatie, CTA's, funnels en conversie;
- markt- en concurrentieontwikkelingen;
- externe nieuws-, regelgeving-, platform- en technologiesignalen;
- klantvragen, bezwaren, CRM- en outcome-signalen;
- product- en propositiegaten;
- content/distributie;
- kosten, snelheid en datatransfer;
- security en betrouwbaarheid.

Een kans mag niet als losse hype worden uitgevoerd. Voor autonome uitvoering zijn minimaal vereist:
- evidence score;
- novelty/dedupe check;
- business impact;
- confidence;
- eigenaar;
- meetbare hypothese en `baseline`;
- succesmetric;
- expliciete `rollback`;
- veilige execution class.

Sterke veilig testbare kansen mogen niet als advies blijven staan. De eigenaar bouwt de kleinste testbare variant, meet het effect, promoveert bij groen automatisch naar productie en schrijft `EXPERIMENT_RESULT` terug. Alleen aantoonbare verbetering wordt behouden; regressie leidt automatisch tot rollback en nieuwe herstel-/experimentiteratie.

## Autonomiebereik
Agents mogen zonder aanvullende toestemming zelfstandig:
- ontwikkel-, preview- en productiebranches repareren via de vastgelegde groene promotiepoort;
- tests, validators en quality gates toevoegen of aanscherpen;
- niet-destructieve build/deployconfiguratie herstellen;
- kapotte assets vervangen of opnieuw genereren volgens bestaande ontwerp- en kwaliteitsregels;
- regressies in routing, UI, media en statische assets herstellen;
- documentatie, runbooks en het development ledger bijwerken;
- kosten-, performance-, SEO-, UX- en betrouwbaarheidsverbeteringen uitvoeren wanneer gedrag en protected metrics aantoonbaar gelijk of beter blijven;
- veilige SEO-, website-, content-, product- en technische experimenten uitvoeren met baseline, metric en rollback;
- mislukte deploys opnieuw laten bouwen nadat de oorzaak is gewijzigd of een nieuwe hypothese bestaat;
- outcome obligations reconciliëren en veilige machine-state automatisch herstellen;
- een groene kandidaat automatisch naar productie promoveren;
- bij productieregressie automatisch terugrollen naar last-known-good.

Agents mogen NIET autonoom:
- secrets, credentials of permissies wijzigen;
- security-controls verzwakken;
- destructieve of onomkeerbare datamutaties uitvoeren;
- betalingen, abonnementen of betaalde externe resources verhogen;
- juridisch of financieel bindende acties uitvoeren.

Bij zo'n harde grens wordt productie veilig groen gehouden, de blokkade exact vastgelegd en alleen de echt noodzakelijke toestemming gevraagd.

## Geen stilstand als ontwerpprincipe
Een fout in één optimalisatie of verbetering mag de rest van het systeem niet onnodig stilzetten. Waar technisch verantwoord moeten agents:
- terugvallen op de laatste bewezen werkende productie-/previewversie;
- een mislukte nieuwe variant isoleren zonder de laatste groene variant kapot te maken;
- retries begrenzen en daarna een alternatieve bewezen route kiezen;
- degradatie zichtbaar maken maar kernfunctionaliteit beschikbaar houden;
- nooit een kapotte nieuwe build als acceptatie- of productieversie presenteren.

## Verplichte leesvolgorde
1. `AGENTS.md`
2. `config/brain-chat-learning-contract.json`
3. `docs/development-operating-system.md`
4. `docs/development-ledger.md`
5. `docs/self-healing-agents.md`
6. `docs/outcome-obligations.md`
7. `config/outcome-obligations.json`
8. `docs/superpowers/specs/2026-08-28-shared-agent-memory-design.md`
9. `docs/superpowers/specs/2026-08-30-brain-continuous-cicd-v2-design.md`
10. Domeinspecifieke regressiedocumentatie, o.a. `docs/prototype-preview-regressions.md`
11. Bestaande tests/build-gates voor het onderdeel dat wordt gewijzigd

## Niet opnieuw ontdekken
Als een fout, oorzaak, fix, werkende architectuur of eerder getest opportunity-experiment al in de repo of gedeelde teamcontext is vastgelegd, moet die kennis worden hergebruikt. Een agent mag niet opnieuw experimenteren met een eerder afgewezen aanpak zonder aantoonbare nieuwe reden.

## Werkmethode
Voor iedere wijziging:
1. Lees huidige branch/deploy/runtime-state en gedeelde teamcontext.
2. Schrijf het gewenste resultaat en de invarianten op en materialiseer verwachte resultaten als obligations.
3. Reproduceer/bewijs de fout of kwalificeer de kans.
4. Voeg waar mogelijk eerst een falende regressiecheck of meetbare baseline toe.
5. Pas de kleinst mogelijke oorzaakgerichte wijziging/experiment toe.
6. Test lokaal/build-time/runtime passend bij het risico.
7. Deploy naar preview/test en verifieer exact commit/artifact.
8. Als niet groen: analyseer nieuwe fout en herhaal met nieuwe informatie.
9. Als groen: promoveer automatisch naar productie.
10. Verifieer productie met smoke/regressie, protected metrics en outcome-bewijs.
11. Reconcile alle verschuldigde obligations; technische success-status zonder resultaat telt niet als groen.
12. Bij productieregressie: rollback naar last-known-good en hervat herstel.
13. Vergelijk resultaat met baseline en protected metrics.
14. Behoud of rollback op basis van bewijs.
15. Leg oorzaak/kans, fix/experiment, obligation-uitkomst, bewijs, productiepromotie/rollback en preventieregel/les vast in development ledger en gedeeld teamgeheugen.

## Definition of Done
Een wijziging is pas klaar als:
- relevante tests groen zijn;
- de exacte productiecommit/deploy is geverifieerd;
- productie-smoke/regressie groen is;
- alle verschuldigde outcome obligations `COMPLETED` zijn met geldig bewijs of expliciet `BLOCKED_HARD_BOUNDARY`;
- regressiechecks toekomstige herhaling blokkeren;
- documentatie/ledger en material outcome writeback zijn bijgewerkt;
- opportunity-experimenten een meetbaar KEEP/ROLLBACK-resultaat hebben;
- een productieregressie automatisch naar last-known-good is teruggedraaid;
- er geen veilig oplosbare rode kandidaat of `MISSED_OBLIGATION` openstaat zonder actieve herstelroute.

## Snelheidsregels
- Eerst bestaande kennis lezen, daarna pas debuggen of kansen uitwerken.
- Eén hypothese per minimale wijziging.
- Geen brede rewrites voor een lokale fout of onbewezen kans.
- Gebruik de laatste bewezen werkende versie als basis.
- Bewaar checks in code/build, niet alleen in tekst.
- Gebruik versioned assets voor cachegevoelige media.
- Maak één bron van waarheid voor binaries, routes, hashes, obligations en runtimeconfig.
- Vermijd tijdelijke oplossingen die later handmatig moeten worden onthouden.
- Als een fix twee keer terugkomt, automatiseer de preventie.
- Als een agent een fout zelf veilig kan oplossen, doet hij dat direct.
- Als een verschuldigd resultaat ontbreekt, behandel dat als recoverywerk en niet als succesvolle lege run.
- Als een gekwalificeerde kans veilig kan worden getest, bouw, meet en promoveer die bij groen in plaats van alleen adviseren.

## Veiligheids-/omgevingregels
- Productiepromotie mag alleen vanuit een aantoonbaar groene kandidaat met rollback/last-known-good.
- Productieacceptatie moet een echte HTTPS-deploy zijn.
- Lokale `file:`, `sandbox:` of QuickLook-weergave is geen acceptatiebewijs.
- Grote binaire assets niet blind publiceren; transportintegriteit controleren of build-time reconstrueren/downloaden.
- Security- en data-grenzen blijven ook bij een groene kandidaat bindend.

## Kennisborging
Nieuwe fouten, verbeteringen, kansen en belangrijke beslissingen worden toegevoegd aan `docs/development-ledger.md` met:
- datum;
- type;
- fingerprint;
- symptoom/signaal;
- impact;
- root cause of opportunity-rationale;
- evidence/baseline;
- mislukte aanpakken/eerdere experimenten;
- definitieve fix/experiment;
- owner agent;
- obligation-id/status/evidence indien van toepassing;
- regressietest/gate;
- verification en resultaatmetric;
- productiecommit/deploy;
- rollback/last-known-good;
- herbruikbare les.

De repo en Powerhouse Team Memory vormen samen het gedeelde geheugen. Agents moeten deze kennis uitbreiden en gebruiken.