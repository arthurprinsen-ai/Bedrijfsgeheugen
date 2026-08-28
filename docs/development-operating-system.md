# Development Operating System

## Waarom dit bestaat
Bedrijfsgeheugen moet sneller ontwikkelen zonder betrouwbaarheid te verliezen. De oplossing is niet sneller gokken, maar minder opnieuw uitvinden. Daarom is iedere ontwikkelcyclus: **observe → bewijs → minimale fix → automatische gate → deploybewijs → leerregel**.

## 1. Start iedere taak vanuit bekende toestand
Leg vóór wijzigen vast:
- branch + HEAD SHA;
- actieve preview/deploy;
- bewezen werkende basis;
- betrokken bestanden/modules;
- invarianten die niet mogen veranderen.

Voorbeeld invarianten prototype:
- 14 views blijven bestaan;
- menu/routing/scans/portal blijven werken;
- productie blijft onaangeraakt;
- echte anchors blijven absolute HTTPS-links.

## 2. Classificeer de wijziging
**A — lokaal/laag risico:** copy, stijl, één component.
**B — gedrag/middel risico:** routing, state, formulier, API-contract.
**C — infrastructuur/hoog risico:** deploy, media pipeline, build, secrets, Make, data-integriteit.

Hoe hoger het risico, hoe sterker de vereiste gate en rollback.

## 3. Root-cause-first debugging
Gebruik deze volgorde:
1. exact symptoom;
2. reproduceerbare toestand;
3. verschil met laatste werkende toestand;
4. bewijs voor oorzaak;
5. minimale wijziging;
6. regressietest;
7. deployverificatie.

Niet doen:
- meerdere vermoedelijke fixes tegelijk;
- UI herschrijven om een mediafout op te lossen;
- externe afhankelijkheid toevoegen als lokale infrastructuur al werkt;
- claimen dat een client werkt zonder clientbewijs.

## 4. Tests als geheugen
Iedere terugkerende fout moet veranderen in een machinecheck.

Voorbeelden:
- verkeerd aantal views → build faalt;
- verkeerde route-target → build faalt;
- verkeerde hero-codec → build faalt;
- audio in autoplay-hero → build faalt;
- oude preview-root → build faalt;
- verkeerde assetversie/cache → build faalt;
- payload/hash mismatch → build faalt.

Tekstdocumentatie legt uit **waarom**; tests voorkomen **herhaling**.

## 5. Deploybeleid
Een acceptatieversie wordt alleen gedeeld wanneer:
1. exacte commit bekend is;
2. CI/Netlify groen is;
3. immutable deploy-URL bekend is;
4. rootroute naar dezelfde versie wijst;
5. kritieke assets in dezelfde deploy aanwezig zijn.

Een eerdere groene deploy blijft de rollback totdat de nieuwe versie bewezen is.

## 6. Assetbeleid
Voor video/afbeeldingen:
- versieer filenames bij inhoudswijziging;
- zelfde-origin assets voor kritieke hero-media;
- browser krijgt eindasset, geen reconstructielogica;
- zware bronmedia wordt build-time geoptimaliseerd;
- autoplay-video: H.264, yuv420p, geen audio, faststart, redelijke bitrate/resolutie;
- cachecontract en assetversie horen bij de test.

## 7. Snelheidsmechanismen
### A. Bevries bewezen onderdelen
Een gerichte wijziging mag bewezen delen niet aanraken. Video-fix = geen menu rewrite.

### B. Eén bron van waarheid
Gebruik één builder/config voor dezelfde technische eigenschap. Builder en QA gebruiken dezelfde binary/module/config.

### C. Hergebruik werkende pipelines
Nieuwe versies worden afgeleid van de laatste groene versie, niet van losse lokale kopieën.

### D. Automatische negatieve kennis
Leg ook vast wat **niet** werkt. Dit voorkomt dat volgende agents opnieuw tijd besteden aan dezelfde doodlopende route.

### E. Time-to-proof boven time-to-code
Optimaliseer voor hoe snel we kunnen bewijzen dat iets goed is, niet alleen hoe snel code geschreven is.

## 8. Incident-template
Voeg bij ieder relevant incident toe aan `docs/development-ledger.md`:

```md
### YYYY-MM-DD — korte titel
- Symptoom:
- Impact:
- Root cause:
- Bewijs:
- Mislukte aanpakken:
- Definitieve fix:
- Gate/test:
- Herbruikbare les:
- Commit/deploy:
```

## 9. Decision-template
Voor architectuurkeuzes:

```md
### ADR — titel
- Context:
- Besluit:
- Alternatieven:
- Waarom:
- Gevolgen:
- Wanneer heroverwegen:
```

## 10. Definition of Ready voor een volgende agent
Een volgende agent moet binnen enkele minuten kunnen antwoorden:
- wat is de laatste werkende toestand?
- welke fouten zijn al opgelost?
- welke routes zijn verboden?
- welke gates beschermen ons?
- waar staat de acceptatie-URL?
- welke delen mogen niet veranderen?

Als dat niet uit repo + tests blijkt, is de kennisborging nog niet compleet.