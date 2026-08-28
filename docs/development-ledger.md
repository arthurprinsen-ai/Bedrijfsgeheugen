# Development Ledger

Dit ledger bewaart uitvoerbare kennis: wat ging mis, waarom, hoe het is opgelost en welke automatische preventie daarna bestaat.

## 2026-08-28 — V18 preview: browser-side payloadreconstructie faalde op iPhone
- Symptoom: preview gaf decode-/gzipfouten of werkte lokaal anders dan op iPhone.
- Impact: menu/video/preview onbetrouwbaar; veel iteraties zonder stabiele acceptatiebasis.
- Root cause: acceptatiepad bevatte browser-side gzip/base64/chunk-reconstructie en meerdere fallbackmechanismen.
- Bewijs: fouten zoals `Failed to Decode Data`, `invalid distance too far back`, ontbrekende 8.000 payloadtekens en afwijkende chunkvolgorde.
- Mislukte aanpakken: `DecompressionStream`, pako fallback, browser-side chunks opnieuw samenstellen.
- Definitieve fix: statische HTML build-time reconstrueren en als gewone HTTPS-pagina publiceren.
- Gate/test: payloadlengte + SHA256 + uitgepakte HTML SHA256 + verbod op runtime decompressietokens.
- Herbruikbare les: complexe transport-/buildlogica hoort niet in de acceptatiebrowser als de server/build die vooraf kan oplossen.

## 2026-08-28 — Lokale HTML was geen betrouwbare acceptatieomgeving
- Symptoom: lokale/sandboxversie had video/menuproblemen terwijl HTTPS-versie anders reageerde.
- Impact: verkeerde conclusies en regressies.
- Root cause: file/QuickLook/sandbox-runtime verschilt van echte webhosting, caching en Safari-policy.
- Definitieve fix: alleen immutable HTTPS Netlify-deploys gebruiken voor acceptatie.
- Gate/test: rootroute naar stable preview + deploy moet READY zijn voordat link gedeeld wordt.
- Herbruikbare les: test in dezelfde uitvoeringscontext als de gebruiker.

## 2026-08-28 — Preview-root wees nog naar verouderde V18.6
- Symptoom: nieuwe rijke/stabiele pagina was gebouwd maar normale previewlink opende oude vereenvoudigde versie.
- Root cause: `index.html` redirect bleef naar `/prototype-v18-6.html` wijzen.
- Definitieve fix: root naar `/prototype-v18-stable.html`.
- Gate/test: QA faalt wanneer root niet naar stable wijst of nog naar obsolete V18.6 verwijst.
- Herbruikbare les: valideer niet alleen het artifact maar ook het entrypoint dat gebruikers werkelijk openen.

## 2026-08-28 — Grote binaire GitHub-connectorupload werd afgekapt
- Symptoom: MP4 in branch had slechts ~7,5 KB terwijl lokale bron veel groter was.
- Root cause: connectortransport voor grote binaire payload was niet geschikt voor directe upload.
- Definitieve fix: kleine tekstchunks voor transport of build-time download/reconstructie; outputintegriteit controleren.
- Gate/test: minimale grootte, MP4 `ftyp`, SHA/manifestcontrole.
- Herbruikbare les: binary transport is een afzonderlijk betrouwbaarheidsrisico; altijd eindasset controleren.

## 2026-08-28 — Immutable cache hield oude hero-asset vast
- Symptoom: inhoud van `v1.mp4` wijzigen kon op iPhone nog oude media tonen.
- Root cause: asset had immutable caching maar dezelfde filename.
- Definitieve fix: inhoudswijziging = nieuwe versioned filename (`v2`, `v3`, `v4`).
- Gate/test: HTML moet expliciet de nieuwe versie gebruiken.
- Herbruikbare les: bij immutable caching hoort content-addressing of versieerbare bestandsnamen.

## 2026-08-28 — Technisch werkende video was visueel verkeerd
- Symptoom: wolken, zakelijke hoofden of te donkere abstracte video paste niet bij gewenste merkbeleving.
- Impact: techniek groen, ontwerpacceptatie rood.
- Root cause: functionele videokeuze zonder voldoende visuele richting.
- Definitieve richting: lichte, dromerige drone over mooie architectuur, paden en wegen; inspirationeel, premium, geen zakelijke hoofden/kantoor/wolken.
- Herbruikbare les: scheid technische acceptatie en visuele acceptatie; beide moeten expliciet groen zijn.

## 2026-08-28 — Ruwe AI-video startte niet betrouwbaar op iPhone
- Symptoom: live v3-video startte niet.
- Root cause: ruwe bron was H.264 maar 1920×1088, circa 18,2 Mbit/s en bevatte AAC-audio; onnodig zwaar voor autoplay-hero.
- Definitieve fix: build-time transcode naar 1280×720, H.264, yuv420p, geen audio, faststart, gemaximeerde bitrate; lokale same-origin v4.
- Gate/test: eindassetgrootte/container + codec/pixelformaat/resolutie/no-audio contract.
- Herbruikbare les: valideer niet alleen extensie/codecnaam; valideer webdelivery-profiel.

## 2026-08-28 — QA gebruikte andere binary dan builder
- Symptoom: nieuwe codecgate blokkeerde builds ondanks werkende transcode.
- Root cause: builder gebruikte `ffmpeg-static`; QA probeerde eerst `ffprobe` en daarna systeem-`ffmpeg`.
- Definitieve fix: builder en QA gebruiken exact dezelfde `ffmpeg-static` binary.
- Herbruikbare les: één bron van waarheid voor build én verificatie; geen impliciete PATH-afhankelijkheden.

## 2026-08-28 — ffmpeg-verificatie telde input én output
- Symptoom: gate rapporteerde te veel videostreams en blokkeerde correcte asset.
- Root cause: `ffmpeg -i ... -f null -` logt zowel input als gegenereerde null-output.
- Definitieve fix: QA inspecteert alleen inputgedeelte vóór `Output #0`.
- Gate/test: huidige Netlify-build op commit `7506adf88a91c7aade82bb5004ab0e3e468f2dcf` is READY.
- Herbruikbare les: tests moeten het bedoelde observatiepunt meten, niet hun eigen gegenereerde output.

## 2026-08-28 — iPhone hero-video fysiek geaccepteerd
- Symptoom vóór fix: hero bleef stil staan; op sommige varianten verscheen kort de oude mensenfoto voordat een gebouwframe of leeg beeld verscheen.
- Root cause: meerdere oorzaken stapelden: de canonical V18 had naast het `poster`-attribuut ook een legacy people-image in de CSS-fallbacklaag; sommige vervangende mediabronnen waren niet gelijkwaardig aan de fysiek bewezen browserdelivery; wijzigingen door parallelle agents maakten builder en QA tijdelijk incoherent.
- Bewezen fix: behoud de canonical `v18-4-video-controller`; gebruik de door de build officieel opgeloste Pexels HD-bron; verwijder de legacy people-image uit alle gegenereerde hero-fallbacks; forceer na alle bestaande CSS de hero-fallback-reset; behoud de iPhone-diagnostiek uitsluitend achter `?video-debug=1`.
- Fysiek bewijs: gebruiker bevestigde op 2026-08-28 op iPhone expliciet `Werkt` voor Netlify deploy `6a919798b6397000080985a7`, commit `3361ec315874c8ea4c3ceca844bb3e4c9e707be6`.
- Nieuwe golden baseline: `prototype-v18-6` commit `3361ec315874c8ea4c3ceca844bb3e4c9e707be6` + Netlify immutable deploy `6a919798b6397000080985a7`.
- Freeze-regel: agents mogen de hero player/controller, autoplay-startupgedrag, fallback-reset of mediadelivery niet wijzigen als optimalisatie zonder eerst een afzonderlijke regressiehypothese en echte-device acceptatie. Visuele media mogen alleen worden gewisseld wanneer de technische deliveryklasse en fallbackcontracten behouden blijven.
- Diagnostiek: `?video-debug=1` toont `currentSrc`, `readyState`, `networkState`, `paused`, `currentTime`, `error.code`, dimensies en media-events; normale gebruikers zien deze overlay niet.
- Preventie: oude mensenfallback is een verboden regressie; playback-rate hacks en alternatieve controllers blijven verboden tijdens iPhone-herstel; builder en QA moeten één coherente bron-/fallbackcontractversie delen.
- Herbruikbare les: een groene build is geen browseracceptatie. Voor kritieke above-the-fold media is fysieke-device bevestiging de hoogste acceptatielaag en wordt die versie daarna de immutable golden baseline.

## ADR — Preview reliability architecture
- Context: iteraties op rijke V18-preview moesten snel én iPhone-betrouwbaar worden.
- Besluit: build-time reconstructie/optimalisatie, statische same-origin eindassets, automatische regressiegates, immutable deploy-permalinks voor acceptatie.
- Alternatieven: browser-side reconstructie, Function als primaire pagina, externe runtime-media, lokale file-acceptatie.
- Waarom: minder runtimevariabelen, reproduceerbare builds, directe rollback, machinecontrole.
- Gevolgen: build is iets zwaarder, runtime veel eenvoudiger en debugging veel sneller.
- Wanneer heroverwegen: alleen als een volwaardig frontend buildframework de prototypepagina vervangt en dezelfde gates overneemt.

## Snelheidsbaseline vanaf nu
Voor vervolgwerk geldt:
1. begin bij laatste groene deploy;
2. lees ledger vóór debuggen;
3. verander één oorzaak tegelijk;
4. behoud bewezen subsystemen;
5. maak iedere terugkerende fout een gate;
6. verifieer exact commit + deploy;
7. voeg nieuwe les direct aan dit ledger toe.

Laatste fysiek bewezen groene videoketen: previewbranch `prototype-v18-6`, commit `3361ec315874c8ea4c3ceca844bb3e4c9e707be6`, Netlify deploy `6a919798b6397000080985a7`, bevestigd werkend op iPhone op 2026-08-28.