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
8. publiceer alleen naar de bedoelde preview/testomgeving;
9. verifieer de exacte commit/deploy;
10. leg fout, oorzaak, fix, mislukte pogingen en preventieregel vast in het ledger.

Een agent mag dus niet eindigen met alleen “dit moet je aanpassen”, “controleer dit”, “hier is een advies” of “de build faalt”, wanneer de agent de fout zelf veilig kan herstellen.

## Eén team, één geheugen
Alle agents opereren als één team met specialistische rollen. Geen agent mag een eigen geïsoleerde waarheid aanhouden.

Voor iedere materiële taak geldt verplicht:
1. lees de actuele `shared team context` vóór uitvoering;
2. controleer bestaande fouten, fixes, verbeteringen, experimenten en kansen op fingerprint;
3. bepaal één `owner agent` voor uitvoering;
4. voorkom dubbel of conflicterend werk;
5. schrijf iedere materiële uitkomst terug via `material outcome writeback`;
6. laat de gedeelde teamcontext daarna verversen zodat alle agents dezelfde nieuwste waarheid zien.

Materiële uitkomsten zijn minimaal: `ERROR`, `RECOVERY`, `IMPROVEMENT`, `OPPORTUNITY`, `EXPERIMENT_RESULT` en `CONTRACT_CHANGE`.

Een nieuwe of toekomstige agent is niet production-ready als shared-context read of material-outcome writeback ontbreekt.

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
- veilige `preview experiment` execution class.

Sterke veilig testbare kansen mogen niet eindeloos als advies blijven staan. Binnen preview/testgrenzen bouwt de eigenaar de kleinste testbare variant, meet het effect en schrijft `EXPERIMENT_RESULT` terug. Alleen aantoonbare verbetering wordt behouden; regressie leidt tot rollback.

## Autonomiebereik
Agents mogen zonder aanvullende toestemming zelfstandig:
- previewbranches repareren;
- tests, validators en quality gates toevoegen of aanscherpen;
- niet-destructieve build/deployconfiguratie op preview herstellen;
- kapotte preview-assets vervangen of opnieuw genereren volgens bestaande ontwerp- en kwaliteitsregels;
- regressies in routing, UI, media en statische assets herstellen;
- documentatie, runbooks en het development ledger bijwerken;
- kosten-, performance- en betrouwbaarheidsverbeteringen uitvoeren wanneer gedrag en output aantoonbaar gelijk of beter blijven;
- veilige SEO-, website-, content-, product- en technische preview-experimenten uitvoeren met baseline, metric en rollback;
- een mislukte previewdeploy opnieuw laten bouwen nadat de oorzaak is opgelost.

Agents mogen NIET autonoom:
- `main` of productie mergen, overschrijven of vervangen;
- secrets, credentials, permissies of security-controls verzwakken;
- destructieve datamutaties uitvoeren;
- betalingen, abonnementen of externe kosten verhogen;
- onomkeerbare wijzigingen uitvoeren zonder expliciete toestemming.

Bij zo'n grens wordt de veilige omgeving werkend gehouden, de blokkade exact vastgelegd en alleen de echt noodzakelijke toestemming gevraagd.

## Geen stilstand als ontwerpprincipe
Een fout in één optimalisatie of verbetering mag de rest van het systeem niet onnodig stilzetten. Waar technisch verantwoord moeten agents:
- terugvallen op de laatste bewezen werkende previewversie;
- een mislukte nieuwe variant blokkeren zonder de laatste groene variant kapot te maken;
- retries begrenzen en daarna een alternatieve bewezen route kiezen;
- degradatie zichtbaar maken maar kernfunctionaliteit beschikbaar houden;
- nooit een kapotte nieuwe build als “acceptatieversie” presenteren.

## Verplichte leesvolgorde
1. `AGENTS.md`
2. `docs/development-operating-system.md`
3. `docs/development-ledger.md`
4. `docs/self-healing-agents.md`
5. `docs/superpowers/specs/2026-08-28-shared-agent-memory-design.md`
6. Domeinspecifieke regressiedocumentatie, o.a. `docs/prototype-preview-regressions.md`
7. Bestaande tests/build-gates voor het onderdeel dat wordt gewijzigd

## Niet opnieuw ontdekken
Als een fout, oorzaak, fix, werkende architectuur of eerder getest opportunity-experiment al in de repo of gedeelde teamcontext is vastgelegd, moet die kennis worden hergebruikt. Een agent mag niet opnieuw experimenteren met een eerder afgewezen aanpak zonder aantoonbare nieuwe reden.

## Werkmethode
Voor iedere wijziging:
1. Lees huidige branch/deploy/runtime-state en gedeelde teamcontext.
2. Schrijf het gewenste resultaat en de invarianten op.
3. Reproduceer/bewijs de fout of kwalificeer de kans.
4. Voeg waar mogelijk eerst een falende regressiecheck of meetbare baseline toe.
5. Pas de kleinst mogelijke oorzaakgerichte wijziging/preview-experiment toe.
6. Test lokaal/build-time/runtime passend bij het risico.
7. Publiceer alleen naar de bedoelde preview/omgeving.
8. Verifieer de exacte commit/deploy die de gebruiker gaat testen.
9. Vergelijk resultaat met baseline en protected metrics.
10. Behoud of rollback op basis van bewijs.
11. Leg oorzaak/kans, fix/experiment, bewijs en preventieregel/les vast in het development ledger en gedeelde teamgeheugen.

## Definition of Done
Een wijziging is pas klaar als:
- de oorzaak bekend is of expliciet als onbewezen staat gemarkeerd, óf de opportunity-rationale en evidence zijn vastgelegd;
- relevante tests groen zijn;
- regressiechecks toekomstige herhaling blokkeren;
- de juiste omgeving/commit is geverifieerd;
- documentatie/ledger en material outcome writeback zijn bijgewerkt;
- productie niet onbedoeld is gewijzigd;
- de gebruiker geen oude of lokale acceptatie-URL krijgt;
- opportunity-experimenten een meetbaar KEEP/ROLLBACK-resultaat hebben.

## Snelheidsregels
- Eerst bestaande kennis lezen, daarna pas debuggen of kansen uitwerken.
- Eén hypothese per minimale wijziging.
- Geen brede rewrites voor een lokale fout of onbewezen kans.
- Gebruik de laatste bewezen werkende versie als basis.
- Bewaar checks in code/build, niet alleen in tekst.
- Gebruik versioned assets voor cachegevoelige media.
- Maak één bron van waarheid voor binaries, routes, hashes en runtimeconfig.
- Vermijd tijdelijke oplossingen die later handmatig moeten worden onthouden.
- Als een fix twee keer terugkomt, automatiseer de preventie.
- Als een agent een fout zelf veilig kan oplossen, doet hij dat direct in plaats van een actie bij de gebruiker neer te leggen.
- Als een gekwalificeerde kans veilig op preview kan worden getest, bouw en meet die in plaats van alleen adviseren.

## Veiligheids-/omgevingregels
- `main`/productie nooit mergen, overschrijven of vervangen zonder expliciete bevestiging.
- Preview-acceptatie moet een echte HTTPS-deploy zijn.
- Lokale `file:`, `sandbox:` of QuickLook-weergave is geen acceptatiebewijs.
- Grote binaire assets niet blind via connector-upload publiceren; transportintegriteit controleren of build-time reconstrueren/downloaden.

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
- regressietest/gate;
- verification en resultaatmetric;
- rollback/last-known-good;
- herbruikbare les;
- relevante commit/deploy.

De repo en Powerhouse Team Memory vormen samen het gedeelde geheugen. Agents moeten deze kennis uitbreiden en gebruiken.