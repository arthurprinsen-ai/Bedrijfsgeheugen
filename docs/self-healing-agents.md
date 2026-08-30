# Self-Healing Agents — Bedrijfsgeheugen

## Doel
Agents herstellen aantoonbare fouten zelfstandig, houden de laatste groene toestand beschikbaar en zetten iedere fout om in herbruikbare kennis en een automatische preventieregel.

## Standaardcyclus
1. **Observe** — lees actuele runtime-, build-, deploy- en branchstatus.
2. **Classify** — bepaal: code, data, config, asset, dependency, performance, kosten of externe storing.
3. **Protect** — bewaar de laatste bewezen groene versie als rollback/fallback.
4. **Reproduce** — leg het symptoom vast met concreet bewijs.
5. **Root cause** — verander niets voordat de meest waarschijnlijke oorzaak aantoonbaar is.
6. **Gate first** — voeg waar mogelijk een test toe die de fout reproduceert.
7. **Minimal repair** — wijzig alleen de oorzaak en behoud invarianten.
8. **Verify** — draai statische tests, buildtests en relevante runtimechecks.
9. **Deploy preview** — publiceer alleen naar veilige preview/testomgeving.
10. **Inspect exact deploy** — controleer exacte SHA, deploystatus en uiteindelijke artifact.
11. **Retry intelligently** — bij falen: nieuwe fout analyseren, niet dezelfde handeling blind herhalen.
12. **Learn** — schrijf incident, oorzaak, fix en preventie naar het development ledger.
13. **Promote prevention** — als een foutklasse herhaalbaar is, maak er een permanente gate/validator van.

## Beslisregels
- **Known issue + known fix:** fix direct; geen nieuwe verkenning.
- **Known issue + eerdere fix faalt:** onderzoek verschil in omgeving/state en maak nieuwe regressiecheck.
- **Nieuwe fout, laag risico:** zelfstandig fixen op preview.
- **Nieuwe fout, hoog risico:** veilige state behouden en alleen de risicovolle stap blokkeren.
- **Externe dependency faalt:** laatste goede lokale/cached output blijven gebruiken waar mogelijk; dependency niet eindeloos pollen.
- **Kosten/performance overschrijding:** eerst reduceren, batchen, cachen, comprimeren of fallback gebruiken; functionaliteit niet onnodig stoppen.

## Retrybeleid
- Geen onbeperkte retries.
- Maximaal 2 identieke retries zonder nieuwe informatie.
- Daarna verplicht hypothese wijzigen of fallback kiezen.
- Iedere retry moet nieuwe observatie opleveren.
- Een retry die alleen dezelfde fout opnieuw produceert telt als signaal dat de aanpak verkeerd is.

## Fallbacks
Agents moeten waar mogelijk ontwerpen met:
- last-known-good artifact;
- versioned assets;
- cached/read-only state;
- idempotente writes;
- degradatie zonder totale uitval;
- atomische deploys;
- rollbackbare previewbranches.

## Protected golden baselines
Een fysiek door de gebruiker geaccepteerde device-baseline is sterker bewijs dan alleen build-, desktop- of CI-groen. Zo'n baseline mag een self-heal agent niet autonoom herschrijven zolang de betreffende subsystemen niet aantoonbaar defect zijn.

### V18 hero video — iPhone
Golden baseline vanaf 2026-08-28:
- fysieke-device acceptatie op iPhone;
- commit `3361ec315874c8ea4c3ceca844bb3e4c9e707be6`;
- Netlify deploy `6a919798b6397000080985a7`;
- canonical `v18-4-video-controller` intact;
- officiële Pexels 1920×1080/30fps-deliveryklasse;
- alle legacy hero/fallback-achtergronden hard gereset;
- geen playbackRate-hack, alternate controller, WebP-vervanging of IntersectionObserver-playback;
- diagnose beschikbaar via `?video-debug=1`.

Volledig failure- en acceptatiecontract: `docs/hero-video-iphone-contract.md`.

Self-healregels voor deze baseline:
1. bij een nieuwe hero-regressie eerst exact deze baseline als control herstellen/vergelijken;
2. slechts één variabele tegelijk wijzigen;
3. controller en fallback-reset als invarianten behandelen;
4. build/runtime-diagnostiek verzamelen vóór bron- of architectuurwissels;
5. geen nieuwe aanpak promoveren tot baseline zonder fysieke-device acceptatie van de exacte immutable HTTPS-deploy;
6. indien een agent tegelijk aan dezelfde hero-builder/testbestanden werkt: conflicterende writer stoppen, nieuwste branchstate opnieuw lezen en één coherente wijziging uitvoeren; geen parallelle writes op dezelfde bestanden;
7. AI/OpenArt-output altijd als onbetrouwbare bronmedia classificeren totdat metadata en webdeliveryprofiel zijn gevalideerd;
8. raw OpenArt met afwijkende hoogte/fps/audio nooit rechtstreeks als hero promoten; eerst candidate-normalisatie naar de bewezen klasse, daarna preview + device-test;
9. een falende candidate nooit proberen te redden door tegelijk controller/startlogica aan te passen; dat vernietigt de control;
10. bij `GitHub 409`, onverwachte branch-head of veranderde QA-verwachting: geen retry-loop. Eerst ownership/state reconciliëren.

## Writer ownership / agent-race preventie
Periodieke guardians, self-healers en interactieve agents delen dezelfde repo en mogen daarom niet onafhankelijk dezelfde semantische obligation bezitten.

Voor iedere write:
- bepaal canonical owner voor bestand/scope;
- inventariseer actuele branch-head en bestaande write-in-flight wanneer zichtbaar;
- één writer per bestand/scope tegelijk;
- na conflict altijd opnieuw fetchen; nooit schrijven met stale SHA;
- builder en bijbehorende QA/gate gelden als één coherente wijzigingsunit;
- een agent die een andere geldige write aantreft, integreert die state in plaats van hem blind te overschrijven.

## Stopgrenzen
Autonome self-healing stopt uitsluitend wanneer de volgende stap één van deze grenzen raakt:
- productie/main wijzigen;
- secrets/credentials/permissies;
- securitycontrols verzwakken;
- destructieve of onomkeerbare datamutatie;
- externe kosten/betalingen verhogen;
- juridisch of financieel bindende actie.

De agent moet vóór die grens alles doen wat wel veilig mogelijk is: diagnose afronden, fix voorbereiden, testen op preview en exact aangeven welke ene blokkade resteert.

## Kennis als gedeeld teamgeheugen
Alle agents gebruiken dezelfde repo-documentatie en tests. Een nieuw incident is pas afgesloten als de kennis voor de volgende agent beschikbaar is. Geen agent mag afhankelijk zijn van chatgeschiedenis om een bekende fout te begrijpen.

## KPI's voor sneller ontwikkelen
We sturen op:
- mean time to detect;
- mean time to repair;
- percentage fouten automatisch hersteld;
- regressiepercentage;
- aantal herhaalde foutklassen;
- deploy success rate;
- aantal handmatige interventies;
- tijd van foutmelding tot groene preview;
- stale-write/409-conflicten;
- aantal keren dat een golden baseline onnodig werd aangeraakt;
- percentage media-candidates dat vóór device-test automatisch op profiel wordt afgekeurd.

Doel: herhaalde foutklassen dalen richting nul en dezelfde fout wordt na één incident voortaan automatisch onderschept.