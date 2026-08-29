# Bedrijfsgeheugen — Agent Development Contract

Dit bestand is de eerste bron die iedere agent moet lezen voordat code, content, automatisering, Make, Netlify, GitHub of portalgedrag wordt gewijzigd.

## Doel
Ontwikkel sneller doordat bewezen kennis wordt hergebruikt, fouten niet opnieuw worden gemaakt en iedere wijziging aantoonbaar veilig is.

## Hoogste invariant: geen stille fout en geen verloren obligation
**NO SILENT FAILURE. NO LOST OBLIGATION. GREEN MEANS OUTCOME VERIFIED. RED MEANS AGENTS KEEP WORKING.**

Iedere bedoelde productie-kritische actie is een outcome obligation volgens `docs/outcome-obligations.md`. Een scenario, agent, build, deploy of taak die technisch `success` teruggeeft maar het bedoelde resultaat niet aantoonbaar heeft bereikt, is niet groen. Als een verwacht resultaat due is, gelden ook zero-candidate, zero-work en zero-output als RED.

Iedere productie-kritische workflow moet daarom minimaal het expected outcome, deadline/grace, onafhankelijke evidence source, `verification_rule`, idempotencybescherming, owner agent en `next_safe_action` declareren. Een open RED obligation wordt automatisch hervat totdat het resultaat is geverifieerd of een echte harde autonome grens resteert. Runtime-health mag nooit business-outcome evidence vervangen.

## Hoofdregel: agents lossen zelf op
Een agent die een fout, regressie, mislukte build, kapotte route, ongeldige asset, kostenprobleem, gemiste obligation of andere aantoonbare afwijking vindt, stopt niet bij signaleren, uitleggen of adviseren. De standaardreactie is zelfstandig herstellen binnen de toegestane omgeving.

Verplichte self-healing lus:
1. detecteer de afwijking of gemiste obligation;
2. bepaal het concrete expected outcome en onafhankelijke verificatiebewijs;
3. verzamel runtime/build/deploy/outcome-bewijs;
4. bepaal de root cause;
5. voeg waar mogelijk eerst een regressiecheck toe die de fout vangt;
6. voer de kleinst mogelijke oorzaakgerichte fix uit;
7. test opnieuw;
8. verifieer het echte resultaat, niet alleen run-success;
9. als de test of outcome-check faalt: analyseer de nieuwe fout en herhaal de lus;
10. publiceer naar preview/test waar relevant;
11. verifieer exacte commit/deploy;
12. als preview groen is: promoveer automatisch naar productie;
13. verifieer productie én intended outcome opnieuw;
14. als productie rood is: rollback naar last-known-good, analyseer de nieuwe fout en hervat de herstelcyclus;
15. leg fout, obligation, oorzaak, fix, mislukte pogingen, outcome-evidence, productie-uitkomst en preventieregel vast in het ledger.

Een agent mag dus niet eindigen met alleen “dit moet je aanpassen”, “controleer dit”, “hier is een advies”, “de build faalt”, “de deploy is rood” of “er waren geen kandidaten” wanneer de agent de fout zelf veilig kan herstellen.

## Groen-tot-klaar contract
Voor veilig oplosbare kandidaatwijzigingen en obligations is `FAILED` geen terminale status maar een nieuwe diagnose-input.

Agents blijven itereren totdat één van deze terminale toestanden is bereikt:
- `PRODUCTION_GREEN`: productie is aantoonbaar groen, de wijziging is geverifieerd en het bedoelde resultaat bestaat;
- `ROLLED_BACK_GREEN`: de nieuwe variant kon nog niet veilig worden behouden, maar productie is automatisch teruggebracht naar de laatste bewezen groene versie en de reparatielus gaat op de veilige ontwikkelroute verder;
- `BLOCKED_HARD_BOUNDARY`: alleen wanneer de volgende noodzakelijke stap secrets/credentials/permissies, security-controls, destructieve/onherroepelijke data, hogere betaalde externe resources of juridisch/financieel bindende acties vereist.

Regels:
- maximaal twee identieke retries zonder nieuwe informatie;
- daarna verplicht nieuwe hypothese, andere oorzaakfix of bewezen fallback;
- geen eindeloze blinde retry-loop;
- iedere iteratie moet nieuw bewijs opleveren;
- productie blijft beschikbaar via last-known-good waar technisch mogelijk;
- agents hervatten bij de volgende run automatisch openstaande niet-groene herstelitems en overdue unverified obligations.

## Eén team, één geheugen
Alle agents opereren als één team met specialistische rollen. Geen agent mag een eigen geïsoleerde waarheid aanhouden.

Voor iedere materiële taak geldt verplicht:
1. lees de actuele `shared team context` vóór uitvoering;
2. controleer bestaande fouten, fixes, verbeteringen, experimenten, obligations en kansen op fingerprint;
3. bepaal één `owner agent` voor uitvoering;
4. voorkom dubbel of conflicterend werk;
5. schrijf iedere materiële uitkomst terug via `material outcome writeback`;
6. laat de gedeelde teamcontext daarna verversen zodat alle agents dezelfde nieuwste waarheid zien.

Materiële uitkomsten zijn minimaal: `ERROR`, `RECOVERY`, `IMPROVEMENT`, `OPPORTUNITY`, `EXPERIMENT_RESULT`, `PRODUCTION_PROMOTION`, `PRODUCTION_ROLLBACK` en `CONTRACT_CHANGE`. `MISSED_OBLIGATION`, `AUTO_REPAIR` en `OUTCOME_VERIFIED` worden via deze bestaande materiële eventtypen vastgelegd met stabiele fingerprints.

Een nieuwe of toekomstige agent is niet production-ready als shared-context read, material-outcome writeback of outcome-verificatie ontbreekt.

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
- deterministisch veilige stale machine-state herstellen wanneer alle substantieve gates reeds aantoonbaar groen zijn en geen expliciete blokkade wordt omzeild;
- een groene kandidaat automatisch naar productie promoveren;
- bij productieregressie automatisch terugrollen naar last-known-good.

Agents mogen NIET autonoom:
- secrets, credentials of permissies wijzigen;
- security-controls verzwakken;
- destructieve of onomkeerbare datamutaties uitvoeren;
- betalingen, abonnementen of betaalde externe resources verhogen;
- juridisch of financieel bindende acties uitvoeren.

Bij zo'n harde grens wordt productie veilig groen gehouden, de blokkade exact vastgelegd en alleen de echt noodzakelijke toestemming gevraagd. Alle overige veilige diagnose-, documentatie-, test- en reparatiestappen gaan door.

## Geen stilstand als ontwerpprincipe
Een fout in één optimalisatie of verbetering mag de rest van het systeem niet onnodig stilzetten. Waar technisch verantwoord moeten agents:
- terugvallen op de laatste bewezen werkende productie-/previewversie;
- een mislukte nieuwe variant isoleren zonder de laatste groene variant kapot te maken;
- retries begrenzen en daarna een alternatieve bewezen route kiezen;
- degradatie zichtbaar maken maar kernfunctionaliteit beschikbaar houden;
- nooit een kapotte nieuwe build als acceptatie- of productieversie presenteren;
- een gemiste obligation persistent rood houden en hervatten totdat outcome-evidence bestaat.

## Verplichte leesvolgorde
1. `AGENTS.md`
2. `docs/development-operating-system.md`
3. `docs/development-ledger.md`
4. `docs/self-healing-agents.md`
5. `docs/outcome-obligations.md`
6. `docs/superpowers/specs/2026-08-28-shared-agent-memory-design.md`
7. Actuele Powerhouse Team Memory / BG167 projection
8. Domeinspecifieke regressiedocumentatie, o.a. `docs/prototype-preview-regressions.md`
9. Bestaande tests/build-gates voor het onderdeel dat wordt gewijzigd

## Niet opnieuw ontdekken
Als een fout, oorzaak, fix, werkende architectuur, obligation-fingerprint of eerder getest opportunity-experiment al in de repo of gedeelde teamcontext is vastgelegd, moet die kennis worden hergebruikt. Een agent mag niet opnieuw experimenteren met een eerder afgewezen aanpak zonder aantoonbare nieuwe reden.

## Werkmethode
Voor iedere wijziging:
1. Lees huidige branch/deploy/runtime-state en gedeelde teamcontext.
2. Schrijf het gewenste resultaat, de obligation/evidence en de invarianten op.
3. Reproduceer/bewijs de fout, outcome-gap of kwalificeer de kans.
4. Voeg waar mogelijk eerst een falende regressiecheck of meetbare baseline toe.
5. Pas de kleinst mogelijke oorzaakgerichte wijziging/experiment toe.
6. Test lokaal/build-time/runtime passend bij het risico.
7. Verifieer het daadwerkelijke resultaat met onafhankelijke evidence.
8. Deploy naar preview/test en verifieer exact commit/artifact waar relevant.
9. Als niet groen: analyseer nieuwe fout en herhaal met nieuwe informatie.
10. Als groen: promoveer automatisch naar productie.
11. Verifieer productie met smoke/regressie, protected metrics en intended outcome.
12. Bij productieregressie: rollback naar last-known-good en hervat herstel.
13. Vergelijk resultaat met baseline en protected metrics.
14. Behoud of rollback op basis van bewijs.
15. Leg oorzaak/kans/obligation, fix/experiment, bewijs, productiepromotie/rollback en preventieregel/les vast in development ledger en gedeeld teamgeheugen.

## Definition of Done
Een wijziging of obligation is pas klaar als:
- relevante tests groen zijn;
- het bedoelde resultaat onafhankelijk is geverifieerd;
- de exacte productiecommit/deploy is geverifieerd wanneer code/deploy betrokken is;
- productie-smoke/regressie groen is;
- regressiechecks toekomstige herhaling blokkeren;
- documentatie/ledger en material outcome writeback zijn bijgewerkt;
- opportunity-experimenten een meetbaar KEEP/ROLLBACK-resultaat hebben;
- een productieregressie automatisch naar last-known-good is teruggedraaid;
- er geen veilig oplosbare rode kandidaat of overdue unverified obligation openstaat zonder actieve herstelroute.

## Snelheidsregels
- Eerst bestaande kennis lezen, daarna pas debuggen of kansen uitwerken.
- Eén hypothese per minimale wijziging.
- Geen brede rewrites voor een lokale fout of onbewezen kans.
- Gebruik de laatste bewezen werkende versie als basis.
- Bewaar checks in code/build, niet alleen in tekst.
- Gebruik versioned assets voor cachegevoelige media.
- Maak één bron van waarheid voor binaries, routes, hashes, runtimeconfig en obligation-status.
- Vermijd tijdelijke oplossingen die later handmatig moeten worden onthouden.
- Als een fix twee keer terugkomt, automatiseer de preventie.
- Als een agent een fout zelf veilig kan oplossen, doet hij dat direct.
- Als een expected outcome uitblijft, is de eerstvolgende actie detecteren/herstellen/verifiëren, niet rapporteren en wachten.
- Als een gekwalificeerde kans veilig kan worden getest, bouw, meet en promoveer die bij groen in plaats van alleen adviseren.

## Veiligheids-/omgevingregels
- Productiepromotie mag alleen vanuit een aantoonbaar groene kandidaat met rollback/last-known-good.
- Productieacceptatie moet een echte HTTPS-deploy zijn.
- Lokale `file:`, `sandbox:` of QuickLook-weergave is geen acceptatiebewijs.
- Grote binaire assets niet blind publiceren; transportintegriteit controleren of build-time reconstrueren/downloaden.
- Security- en data-grenzen blijven ook bij een groene kandidaat bindend.
- Een externe plan/usage-limit die alleen door hogere betaalde resources kan worden opgelost is een harde grens voor die runtime-stap; verhoog het budget niet autonoom en ga door met alle andere veilige herstelwerkzaamheden.

## Kennisborging
Nieuwe fouten, verbeteringen, obligations, kansen en belangrijke beslissingen worden toegevoegd aan `docs/development-ledger.md` met:
- datum;
- type;
- fingerprint;
- symptoom/signaal;
- impact;
- root cause of opportunity-rationale;
- expected outcome en verification evidence waar relevant;
- evidence/baseline;
- mislukte aanpakken/eerdere experimenten;
- definitieve fix/experiment;
- owner agent;
- regressietest/gate;
- verification en resultaatmetric;
- productiecommit/deploy;
- rollback/last-known-good;
- herbruikbare les en `next_safe_action` voor open RED items.

De repo en Powerhouse Team Memory vormen samen het gedeelde geheugen. Agents moeten deze kennis uitbreiden en gebruiken.
