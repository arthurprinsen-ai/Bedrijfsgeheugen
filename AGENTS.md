# Bedrijfsgeheugen — Agent Development Contract

Dit bestand is de eerste bron die iedere agent moet lezen voordat code, content, automatisering, Make, Netlify, GitHub of portalgedrag wordt gewijzigd.

## Doel
Ontwikkel sneller doordat bewezen kennis wordt hergebruikt, fouten niet opnieuw worden gemaakt en iedere wijziging aantoonbaar veilig is.

## Verplichte leesvolgorde
1. `AGENTS.md`
2. `docs/development-operating-system.md`
3. `docs/development-ledger.md`
4. Domeinspecifieke regressiedocumentatie, o.a. `docs/prototype-preview-regressions.md`
5. Bestaande tests/build-gates voor het onderdeel dat wordt gewijzigd

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

## Veiligheids-/omgevingregels
- `main`/productie nooit mergen, overschrijven of vervangen zonder expliciete bevestiging.
- Preview-acceptatie moet een echte HTTPS-deploy zijn.
- Lokale `file:`, `sandbox:` of QuickLook-weergave is geen acceptatiebewijs.
- Grote binaire assets niet blind via connector-upload publiceren; transportintegriteit controleren of build-time reconstrueren/downloaden.

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