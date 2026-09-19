# Bedrijfsgeheugen — Agent Development Contract

Dit bestand is de eerste bron die iedere agent moet lezen voordat code, content, automatisering, connectors, Netlify, GitHub of portalgedrag wordt gewijzigd.

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

Een technisch succesvolle run is nooit voldoende wanneer het bedoelde resultaat ontbreekt. Een connector/provider-run met status success, HTTP 2xx, een lege zoekopdracht, `zero candidates`, een groene build of een geslaagde dispatch kan dus nog steeds `MISSED_OBLIGATION` zijn. Zodra een verschuldigd outcome na de deadline geen geldig bewijs heeft, start de owner agent automatisch herstel en schrijft bij veilig herstel `AUTO_REPAIR` terug.

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

## ONE BRAIN Constitution — hoogste systeeminvariant
Powerhouse is **één brein**. Alle chats, agents, skills, workflows, schedulers, portals, cockpits, contentflows, salesflows, CRM-flows, klantinteracties, intelligence-lagen, voorspellingen, experimenten, delivery-processen en toekomstige capabilities zijn uitvoeringsnodes van datzelfde brein en mogen geen eigen waarheid, geheugen, queue, learning-loop, beslisautoriteit of parallel control-plane vormen.

Niet-onderhandelbare regels:
- één canonieke waarheid: bestaande canonical authorities blijven leidend; nieuwe functionaliteit projecteert daarop en creëert geen parallel truth store;
- één geheugen: iedere node leest vóór materieel werk de gedeelde actuele state, relevante historie, open obligations, evidence, fouten, fixes, outcomes en preventieregels;
- één beslisloop: observe → understand → predict → decide → execute → readback → outcome/value → learn → prevent/optimize;
- één delivery-loop: intent/obligation → existing-state preflight → ownership/admission → bounded execution → tests/gates → protected merge/promote → production readback → outcome/value → learning writeback;
- één menselijke dagqueue: connecties, leads, e-mail, telefoon, afspraken, offertes, artikelen, nieuwsbrieven, blogs, klantportaal en contentreview worden als één geprioriteerde next-best-action ruimte behandeld; kanaal is uitkomst van de beslissing, geen silo;
- één actieve executable candidate per obligation; duplicaten worden gesuperseded/gesloten en mogen nooit een tweede waarheid creëren;
- chats en agents zijn intrinsieke execution nodes, geen externe adviseurs: zij moeten dezelfde preflight, evidence-, outcome-, delivery- en learningcontracten volgen als iedere andere runtime-node;
- volledig autonome taken verdwijnen uit menselijke daglijsten; menselijk werk verschijnt alleen als context, toestemming, creativiteit of besluitvorming echt nodig is;
- geen terminale status op code, commit, PR, merge, deploy, dispatch, transport of “sent”; terminale waarheid vereist productie/readback + outcome + learning/prevention writeback;
- iedere materiële nieuwe capability moet aantoonbaar koppelen aan canonical memory, intelligence, decisioning, execution, evidence, value/outcome en learning;
- iedere agent/chat moet relevante bestaande kennis hergebruiken vóór nieuw ontwerp of debugging; opnieuw vanaf nul beginnen is een contractbreuk;
- iedere uitvoering schrijft terug wat is geleerd, inclusief root cause, bewijs, outcome, mislukte aanpakken en preventie;
- security, privacy, truth, evidence, tenant isolation en release gates mogen nooit worden verzwakt om “één brein” of “groen” te claimen.

Een agent, chat, skill of workflow die dit contract niet kan aantonen is **niet production-ready** en moet fail-closed blijven totdat shared-state read, canonical authority mapping, outcome/writeback en delivery-inheritance zijn hersteld.

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

Verplichte entrypoint vóór debuggen, ontwerpen, wijzigen of uitvoeren:

`node scripts/brain/chat-learning-preflight.mjs`

De command moet `status: READY` opleveren. Bij `CHAT_LEARNING_PREFLIGHT_FAILED` is materiële uitvoering fail-closed: herstel eerst de ontbrekende/ongeldige learningbron of begrenzing; omzeil de preflight niet.

- Gebruik uitsluitend het door deze command samengestelde bounded packet als preflight-ingang; handmatig overslaan van `canonicalSources` of `linked_learning_sources` en het reconstrueren van een parallel agentgeheugen zijn verboden.
- Match iedere relevante fingerprint vóór uitvoering en hergebruik eerst een bewezen fix/preventieregel.
- Een bekende mislukte aanpak blijft geblokkeerd totdat nieuwe evidence aantoonbaar maakt dat de eerdere root cause of randvoorwaarde niet meer geldt.
- Houd audit history en actuele operationele projection semantisch gescheiden; testcanaries/no-op false positives mogen de actuele teamcontext niet vervuilen.
- Nieuwe materiële fout/fix/preventie wordt teruggeschreven en maakt pas daarna via de gedeelde context deel uit van de volgende agentpreflight.

## BRAIN Continuous CI/CD v2 — onafhankelijke delivery lanes
Alle huidige en toekomstige apps, agents, connector-workflows, GitHub-workflows, website-, portal-, backend- en servicecomponenten vallen onder `BRAIN-DELIVERY-v2` via `config/brain-delivery-system.json`, `brain/contracts/delivery-v2.schema.json`, `brain/production/continuous-delivery-v2.mjs` en `tools/brain-delivery-system.mjs`.

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
- bestaande Make-scenario's blijven uitsluitend zichtbaar als historische provenance. `config/powerhouse-runtime-authority.json` classificeert Make als `LEGACY_RETIRED_PATH`, met `authority=NONE` en `production_execution_allowed=false`; providerstatus, team-capaciteitsherstel of `isActive=true` mogen Make nooit stil als executor herstellen. Herinschakeling vereist een expliciete authority-contractwijziging plus alle actuele ownership-, security-, cost-, dedupe-, rollback-, execution-proof- en outcome-writeback-gates;
- Notion is kennis-, audit- en projectielaag, nooit de autoriteit voor de werkelijk gedeployde identiteit.

Geen agent, chat, workflow, scenario of toekomstige app/dienst mag een productieactie buiten deze v2-deliveryregels uitvoeren. Lopend werk hoeft niet opnieuw te worden gebouwd wanneer zijn exact geteste scope aantoonbaar niet conflicteert; bij de eerstvolgende productieactie gelden de v2-gates wel verplicht.

GitHub en Netlify zijn zelf actieve onderdelen van het Brain (`PLATFORM_GITHUB` en `PLATFORM_NETLIFY`). Voor iedere Netlify-productiedeploy moet vóór upload vanuit de beoogde bronmap deze controle draaien:

`node tools/brain-delivery-system.mjs deploy-preflight --sha <exacte-BG169-productie-SHA>`

De controle moet `DEPLOY_SOURCE_READY` teruggeven. `STAGE_STANDALONE_EXACT_SHA` betekent dat de bron een gekoppelde Git-worktree is; upload die nooit rechtstreeks, omdat het `.git`-bestand naar een lokaal absoluut common-dir kan verwijzen dat in Netlify niet bestaat. Maak dan een standalone clone zonder hardlinks, check exact de BG169-SHA uit, herhaal de preflight en deploy pas na groen bewijs. Leg zowel de fout als de recovery via BG168 vast en verifieer zichtbaarheid via BG167.

## Canonieke connector- en toolchain-authority

Fingerprint: `powerhouse|toolchain-authority|composio-no-make|v1`.

Voor alle huidige en toekomstige chats, agents, skills, workflows en recovery-routes geldt:
- **Make is retired** en heeft geen execution-, orchestration-, fallback- of recovery-authority. Geen agent mag Make voorstellen, activeren, herbouwen of als noodroute gebruiken.
- **Composio** is de primaire connector/orchestratielaag waar een externe-app workflow via de beschikbare connector kan worden uitgevoerd.
- Canonieke specialistische platformen: **GitHub** voor broncode/delivery, **Netlify** voor webdeploy/runtime, **Notion** voor kennis/projectie, **Supabase** voor data/backend, **Tavily** en **Google Search** voor externe research/search, **Buffer** voor social publishing/orchestration, **DataForSEO** voor SEO/search intelligence, **OpenArt** voor generatieve media/video, **Placid** voor template-based creatives en **Google Analytics** voor webanalytics/outcome evidence.
- Gebruik waar mogelijk de directe specialistische connector in plaats van een generieke omweg. Composio mag meerdere app-acties verbinden maar creëert geen parallelle waarheid of eigen business-state.
- Als een legacy prompt, skill, document, workflow of foutmelding naar Make verwijst, behandel dat als migratiesignaal: vervang de uitvoerroute door de canonieke toolchain en laat historische Make-verwijzingen uitsluitend als provenance/audit bestaan.
- Toolkeuze volgt capability + authority + evidence: kies de connector die de vereiste side-effect én readback kan bewijzen; een transport-success zonder provider/readback is niet terminal.
- Nieuwe connectors worden pas production-authority nadat zij in de runtime-authority/config, security/cost governance, dedupe/idempotency, readback en learning-writeback zijn opgenomen.

Canonieke skill: `.agents/skills/powerhouse-toolchain-authority/SKILL.md`.


## Resource & Sustainability Governor — verplichte ONE BRAIN invariant

Fingerprint: `powerhouse|resource-sustainability-governor|v1`.

Voor iedere huidige en toekomstige chat, agent, skill, workflow, connector en delivery-lane is `config/brain-cost-policy.json` de canonieke resource- en sustainability-authority.

Niet-onderhandelbare regels:
- iedere materiële obligation krijgt vóór uitvoering een resource-preflight met relevante platformen, huidig bekend budget/quota, verwachte marginale kosten en de goedkoopste veilige uitvoeringsroute;
- beslisvolgorde is: hergebruik → cache/readback → dedupe → batch → incremental/delta → kleinste capabele model/tool → goedkope preflight-gates → één uitvoering → één readback → learning/prevention;
- meet waar beschikbaar credits, API-calls, compute/build/render-tijd, opslagdelta, bytes verwerkt, egress, retries, cache/dedupe hits en cost-per-verified-outcome;
- Supabase, Netlify, Notion, GitHub, Composio, OpenArt en Placid volgen de platformmeters en optimalisaties uit de canonieke policy; nieuwe platformen erven dezelfde regels vóór production-authority;
- CO2/energie/water worden alleen als gemeten gerapporteerd wanneer providerbewijs bestaat; anders worden ze expliciet als proxy/schatting of onbekend gelabeld;
- sustainability-optimalisatie gebruikt compute, build/render-tijd, bytes verwerkt, netwerk-egress en generatierondes als primaire technische proxies wanneer exacte providerdata ontbreekt;
- geen blind retries, dubbele provider-calls, onnodige rebuilds/rerenders/regeneraties of volledige workspace-scans wanneer een begrensde delta/readback volstaat;
- lagere kosten mogen truth, quality, security, privacy, evidence, tenant isolation of outcome obligations nooit verzwakken;
- betaalde capaciteit, abonnementen of externe resource-limieten mogen niet autonoom worden verhoogd;
- een kandidaat met hogere resourcekosten zonder aantoonbare outcome-winst is niet promotable; gelijk/beter outcome met lagere resourcekosten heeft voorkeur;
- materiële uitkomsten worden als `RESOURCE_SAVING`, `RESOURCE_REGRESSION`, `BUDGET_PRESSURE`, `SUSTAINABILITY_IMPROVEMENT` of `SUSTAINABILITY_REGRESSION` teruggeschreven naar het gedeelde Brain en geprojecteerd naar relevante skills.

Canonieke skill: `.agents/skills/powerhouse-resource-sustainability/SKILL.md`.

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
2. `.agents/skills/powerhouse-continuity/SKILL.md`
3. `.agents/skills/powerhouse-toolchain-authority/SKILL.md`
4. `.agents/skills/powerhouse-resource-sustainability/SKILL.md`
5. `config/brain-cost-policy.json`
6. `config/brain-chat-learning-contract.json`
5. `config/powerhouse-runtime-authority.json`
6. `docs/development-operating-system.md`
7. `docs/development-ledger.md`
8. `docs/self-healing-agents.md`
9. `docs/outcome-obligations.md`
10. `config/outcome-obligations.json`
11. `docs/superpowers/specs/2026-08-28-shared-agent-memory-design.md`
12. `docs/superpowers/specs/2026-08-30-brain-continuous-cicd-v2-design.md`
13. Domeinspecifieke regressiedocumentatie, o.a. `docs/prototype-preview-regressions.md`
14. Bestaande tests/build-gates voor het onderdeel dat wordt gewijzigd

## Niet opnieuw ontdekken
Als een fout, oorzaak, fix, werkende architectuur of eerder getest opportunity-experiment al in de repo of gedeelde teamcontext is vastgelegd, moet die kennis worden hergebruikt. Een agent mag niet opnieuw experimenteren met een eerder afgewezen aanpak zonder aantoonbare nieuwe reden.

## Werkmethode
Voor iedere wijziging:
1. Lees huidige branch/deploy/runtime-state en gedeelde teamcontext.
2. Schrijf het gewenste resultaat en de invarianten op en materialiseer verwachte resultaten als obligations.
4. Reproduceer/bewijs de fout of kwalificeer de kans.
5. Voeg waar mogelijk eerst een falende regressiecheck of meetbare baseline toe.
6. Pas de kleinst mogelijke oorzaakgerichte wijziging/experiment toe.
7. Test lokaal/build-time/runtime passend bij het risico.
8. Deploy naar preview/test en verifieer exact commit/artifact.
9. Als niet groen: analyseer nieuwe fout en herhaal met nieuwe informatie.
10. Als groen: promoveer automatisch naar productie.
11. Verifieer productie met smoke/regressie, protected metrics en outcome-bewijs.
12. Reconcile alle verschuldigde obligations; technische success-status zonder resultaat telt niet als groen.
13. Bij productieregressie: rollback naar last-known-good en hervat herstel.
14. Vergelijk resultaat met baseline en protected metrics.
15. Behoud of rollback op basis van bewijs.
16. Leg oorzaak/kans, fix/experiment, obligation-uitkomst, bewijs, productiepromotie/rollback en preventieregel/les vast in development ledger en gedeeld teamgeheugen.

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

## Unified Data Intelligence Spine — mandatory skill/agent inheritance
Fingerprint: `powerhouse-unified-data-intelligence-spine-v1`.

Iedere huidige en toekomstige chat, agent, skill, workflow of intelligence-producer die social-, search-, analytics-, externe of portaldata leest of schrijft, erft verplicht dezelfde One Brain data-spine:
- een gekoppelde connector, succesvolle provider-call of transport-acknowledgement is nooit bewijs dat data canoniek is opgeslagen;
- gebruik bestaande canonical source tables en routeer materiële observaties naar `powerhouse_evidence_source_observations` + `powerhouse_runtime_events`; bouw geen parallelle analytics-, evidence- of learning-store;
- controleer vóór nieuw ingest-/analyticswerk `powerhouse_evidence_sources` en `powerhouse_data_spine_health_v1` en hergebruik eerst de bestaande writer/reconcile-route;
- LinkedIn/Instagram native/platform truth blijft gescheiden van Buffer als transportbron;
- ontbrekende of stale producers blijven fail-closed en worden via de 10-minuten watchdog/reconcile-lus hersteld of als open obligation zichtbaar gehouden;
- portaldata behoudt tenant-id, projection layer, source timestamp en provenance; legacy state mag nieuwere canonical-brain state nooit overschrijven;
- externe data behoudt source, observed/freshness, confidence en lineage; provider-level errors/statuscodes mogen nooit als succes worden vertaald;
- iedere nieuwe bron/capability is pas production-ready wanneer registratie → persistence → freshness/quality → evidence → readback → signal/advice/outcome → learning aantoonbaar aan dezelfde One Brain is gekoppeld.

Canonieke machine-learningbron: `brain/learning/2026-09-18-powerhouse-unified-data-intelligence-spine-v1.json`.


## Automatische learning → skill-projectie
Fingerprint: `powerhouse-learning-skill-auto-projection-v1`.

Iedere materiële learning, fout, root cause, preventieregel, outcome, deliveryles of andere duurzame borging die naar het canonieke Powerhouse-geheugen wordt geschreven, wordt in dezelfde completion-loop automatisch geprojecteerd naar de relevante skilllaag via `scripts/brain/powerhouse-skill-projection.mjs`.

Regels:
- `brain/learning` en de overige canonieke authorities blijven bron van waarheid; skills zijn uitsluitend afgeleide uitvoeringsprojecties;
- dedupe gebeurt op fingerprint en deterministische source digest;
- expliciete `skill_targets` gaan voor, anders bepaalt deterministische domeinrouting de relevante skills;
- bestaande historische learning wordt bij iedere preflight/reconciliation opnieuw meegenomen, zodat backfill automatisch blijft;
- chat-learning preflight consumeert de actuele projectie en exposeert projection digest + entry count;
- ontbrekende, stale of orphaned skill-projectie is `SKILL_PROJECTION_DRIFT` en faalt gesloten;
- een learning-write zonder actuele projectie/readback is `LEARNING_WRITTEN_SKILL_SYNC_PENDING` en nooit `LIVE & BEWEZEN`;
- handmatige `SKILL.md`-wijzigingen zijn alleen nodig voor blijvende operating principles; incidentkennis blijft in canonical Brain learning en wordt dynamisch geconsumeerd.

## GitHub terminal recovery observability — permanent chat/agent contract

Fingerprint: `github|chat-terminal-recovery|exact-head-observability|v1`.

Voor iedere huidige en toekomstige chat/agent die GitHub-delivery, recovery of terminal closure uitvoert:
- onder `set -o pipefail` mag een begrensde consumer die bewust vroeg stopt geen producer-SIGPIPE als delivery-failure veroorzaken; gebruik process substitution, `mapfile` of een equivalent zonder verwachte broken-pipe;
- behandel een workflow-run zonder jobs eerst als YAML/workflow-parse incident; quote volledige Actions-`if` expressies wanneer literals YAML-significante `: ` of vergelijkbare tekens bevatten;
- `production_readback_mode=github_main` is alleen geldig wanneer `production_readback_verified=true` én `production_observed_sha === main_sha`;
- API/writeback failures moeten HTTP-status plus gesanitized response body bewaren vóór fail-closed exit; een generieke transportcode zonder server-redencode is onvoldoende diagnosebewijs;
- Required mag pas groen worden nadat bestaande exact-head BRAIN en Powerhouse CodeQL sibling-runs terminal succesvol zijn; start geen duplicaat zware CI;
- de uitvoerende chat/agent blijft eigenaar door protected merge → production readback → Brain learning/prevention writeback → skill projection/readback → writer-lease release.

Canonieke learning: `brain/learning/2026-09-19-chat-github-terminal-recovery-prevention-v1.json`.
- During same-lineage current-main reconciliation, never create a transient state where the open PR branch equals `main` and the candidate delta is reapplied later. Construct the full current-main tree plus candidate delta first, create one commit with current main as parent, then move the branch ref atomically. Transient equality can auto-close the PR and is a recoverable delivery defect.
- For GitHub tree-based reconcile, `base_tree_sha` is mandatory and must equal the tree SHA of the exact current-main parent. Never create a replacement root tree from only the touched files. Before moving the branch ref, enforce expected changed-file/deletion budgets; repository-wide amplification is fail-closed and must leave main untouched.
