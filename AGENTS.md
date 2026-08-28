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

## Autonomiebereik
Agents mogen zonder aanvullende toestemming zelfstandig:
- previewbranches repareren;
- tests, validators en quality gates toevoegen of aanscherpen;
- niet-destructieve build/deployconfiguratie op preview herstellen;
- kapotte preview-assets vervangen of opnieuw genereren volgens bestaande ontwerp- en kwaliteitsregels;
- regressies in routing, UI, media en statische assets herstellen;
- documentatie, runbooks en het development ledger bijwerken;
- kosten-, performance- en betrouwbaarheidsverbeteringen uitvoeren wanneer gedrag en output aantoonbaar gelijk of beter blijven;
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
5. Domeinspecifieke regressiedocumentatie, o.a. `docs/prototype-preview-regressions.md`
6. Bestaande tests/build-gates voor het onderdeel dat wordt gewijzigd

## Niet opnieuw ontdekken
Als een fout, oorzaak, fix of werkende architectuur al in de repo is vastgelegd, moet die kennis worden hergebruikt. Een agent mag niet opnieuw experimenteren met een eerder afgewezen aanpak zonder aantoonbare nieuwe reden.

## Werkmethode
Voor iedere wijziging:
1. Lees huidige branch/deploy/runtime-state.
2. Schrijf het gewenste resultaat en de invarianten op.
3. Reproduceer of bewijs de huidige fout.
4. Voeg waar mogelijk eerst een falende regressiecheck toe.
5. Pas de kleinst mogelijke oorzaakgerichte wijziging toe.
6. Test lokaal/build-time/runtime passend bij het risico.
7. Publiceer alleen naar de bedoelde preview/omgeving.
8. Verifieer de exacte commit/deploy die de gebruiker gaat testen.
9. Leg oorzaak, fix, bewijs en preventieregel vast in het development ledger.

## Definition of Done
Een wijziging is pas klaar als:
- de oorzaak bekend is of expliciet als onbewezen staat gemarkeerd;
- relevante tests groen zijn;
- regressiechecks toekomstige herhaling blokkeren;
- de juiste omgeving/commit is geverifieerd;
- documentatie/ledger is bijgewerkt;
- productie niet onbedoeld is gewijzigd;
- de gebruiker geen oude of lokale acceptatie-URL krijgt.

## Snelheidsregels
- Eerst bestaande kennis lezen, daarna pas debuggen.
- Eén hypothese per minimale wijziging.
- Geen brede rewrites voor een lokale fout.
- Gebruik de laatste bewezen werkende versie als basis.
- Bewaar checks in code/build, niet alleen in tekst.
- Gebruik versioned assets voor cachegevoelige media.
- Maak één bron van waarheid voor binaries, routes, hashes en runtimeconfig.
- Vermijd tijdelijke oplossingen die later handmatig moeten worden onthouden.
- Als een fix twee keer terugkomt, automatiseer de preventie.
- Als een agent een fout zelf veilig kan oplossen, doet hij dat direct in plaats van een actie bij de gebruiker neer te leggen.

## Veiligheids-/omgevingregels
- `main`/productie nooit mergen, overschrijven of vervangen zonder expliciete bevestiging.
- Preview-acceptatie moet een echte HTTPS-deploy zijn.
- Lokale `file:`, `sandbox:` of QuickLook-weergave is geen acceptatiebewijs.
- Grote binaire assets niet blind via connector-upload publiceren; transportintegriteit controleren of build-time reconstrueren/downloaden.

## Golden baseline — V18 hero video op iPhone
De op 2026-08-28 fysiek op iPhone bevestigde werkende hero is een beschermde baseline. Deze baseline omvat:
- de canonical `v18-4-video-controller`;
- muted autoplay + `playsinline` + loop zoals in de canonical V18;
- officiële Pexels-delivery in de bewezen 1920×1080/30fps-klasse;
- harde hero-fallback-reset zodat oude mensenafbeeldingen of andere legacy CSS-lagen niet vóór de video kunnen verschijnen;
- normale runtime zonder playbackRate-, alternatieve controller-, WebP- of IntersectionObserver-trucs;
- optionele diagnose uitsluitend via `?video-debug=1`.

Referentie voor fysieke-device acceptatie: commit `3361ec315874c8ea4c3ceca844bb3e4c9e707be6`, Netlify deploy `6a919798b6397000080985a7`.

Voor hero/video-wijzigingen geldt voortaan:
1. verander de bewezen controller niet zonder aparte root-cause-hypothese;
2. verander maximaal één mediavariabele per test;
3. behoud de harde fallback-reset;
4. behoud de iPhone-debugmodus;
5. accepteer build/desktop-groen nooit als vervanging voor fysieke-device acceptatie wanneer playbackgedrag verandert;
6. een nieuwe hero/video-baseline mag pas de golden baseline vervangen nadat een gebruiker de exacte immutable HTTPS-deploy op een echt iPhone-device werkend heeft bevestigd;
7. bij regressie altijd eerst terugvallen op deze golden baseline en van daaruit één verschil tegelijk onderzoeken.

## Kennisborging
Nieuwe fouten en belangrijke beslissingen worden toegevoegd aan `docs/development-ledger.md` met:
- datum;
- symptoom;
- impact;
- root cause;
- mislukte aanpakken;
- definitieve fix;
- regressietest/gate;
- herbruikbare les;
- relevante commit/deploy.

De repo is het gedeelde geheugen. Agents moeten deze kennis uitbreiden en gebruiken.