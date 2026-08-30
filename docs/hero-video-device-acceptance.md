# Hero Video — Device Acceptance Contract

Dit document is uitvoerbaar teamgeheugen voor de homepage hero-video. Het voorkomt dat toekomstige chats, agents of automatiseringen dezelfde Safari/iPhone-fouten opnieuw introduceren.

## Visuele bedoeling
De gewenste hero is licht, premium en optimistisch: cinematografische dronebeweging over moderne architectuur, paden/wegen en geometrische structuren, ochtend/golden-hour, duidelijke maar rustige parallax. Geen zakelijke hoofden, kantoorinterieurs, donkere navy-scènes, wolken als hoofdonderwerp of bijna stilstaande camera.

## Hoogste bewezen playback-invariant
De canonical V18 hero-player/controller is bewezen werkend op een fysieke iPhone. Deze playback-infrastructuur wordt als immutable beschouwd tijdens mediavervanging:
- `autoplay`, `muted`, `playsinline`, `loop` blijven behouden;
- canonical V18-controller niet vervangen of herschrijven zonder afzonderlijke root-cause-evidence;
- geen `playbackRate`/`defaultPlaybackRate` tuning als hersteltruc;
- geen WebP/animated-image vervanging voor een videoprobleem;
- geen wijziging van meerdere playbackvariabelen tegelijk.

## Media-delivery contract
AI/OpenArt-bronnen mogen niet rauw als hero worden gebruikt wanneer zij buiten het bewezen profiel vallen. De huidige OpenArt-bron kwam als 1920x1088, 24 fps en met audio. Voor iPhone-safe delivery wordt een lokale derivative gebruikt met exact:
- 1920x1080;
- 30 fps CFR;
- H.264;
- yuv420p;
- geen audio;
- MP4 faststart (`moov` voor `mdat`).

De huidige bron is:
`https://cdn.openart.ai/openart-ai/production/2026-08/create-video/WZvuT1BzGx566fWaFo8F/xai-video-143123ce-c19d-935c-a98f-0ffc678d4ae0_1787928916465_3c8704c8.mp4`

De huidige lokale derivative is:
`/assets/openart-hero-iphone-safe-v1.mp4`

Bron- en derivative-hashes staan in `assets/openart-hero-production.json` en zijn onderdeel van de acceptatie-identiteit.

## Fysieke-device acceptatie is content-addressed
Een runtime-status `PASS` mag NOOIT worden geërfd van een eerdere video of eerdere derivative.

`physical_iphone_runtime = PASS` is alleen geldig wanneer:
1. `physical_iphone_runtime_derivative_sha256` exact gelijk is aan `derivative_sha256`;
2. `physical_iphone_runtime_evidence` expliciet vastlegt welk fysiek device/resultaat de acceptatie leverde;
3. de exact geteste immutable deploy/commit bekend is;
4. de gebruiker de beweging/visual van die exacte kandidaat heeft bevestigd.

Bij iedere bron-, derivative-, transcode-, poster- of playbackwijziging wordt runtime-acceptatie teruggezet naar `PENDING` totdat het exacte nieuwe artifact opnieuw fysiek is getest.

## Bekende foutfingerprints en lessen

### `hero|legacy-people-fallback|flash`
Symptoom: kort een man/personenfoto vóór de video.
Root cause: oude afbeelding zat niet alleen in `poster`, maar ook in een CSS-fallback/pseudo-element.
Preventie: legacy people-image mag nergens meer in de gegenereerde hero voorkomen; poster en CSS-first-paint moeten dezelfde kandidaat representeren.

### `hero|openart-raw|iphone-autoplay-risk`
Symptoom: poster/first frame, daarna stil/blank of zeer onbetrouwbare start.
Root cause: ruwe AI-video 1920x1088/24fps/audio/hoog bitrate-profiel week af van bewezen iPhone-delivery.
Preventie: altijd normaliseren naar het media-delivery contract vóór browseracceptatie.

### `hero|cdn-family-assumption|false-confidence`
Symptoom: dezelfde CDN-familie werd als bewijs voor Safari-compatibiliteit gebruikt.
Les: CDN-hostnaam is geen codec/container/runtime-bewijs. Valideer het exacte artifact.

### `hero|guessed-source-url|invalid-delivery`
Symptoom: poster verschijnt maar video start niet.
Root cause: directe mediabestandsnaam was uit een URL-patroon afgeleid in plaats van aantoonbaar door de bron uitgegeven.
Preventie: nooit externe media-URLs construeren of raden; gebruik uitgegeven endpoint/manifest of lokale content-addressed derivative.

### `hero|playback-rate-hack|extra-variable`
Symptoom: herstel werd onduidelijk doordat na `playing` extra snelheidstuning werd toegevoegd.
Preventie: tijdens recovery één hypothese/variabele per kandidaat; geen tuning totdat basisplayback fysiek groen is.

### `hero|parallel-agent-branch-drift|acceptance-invalidated`
Symptoom: PR/head veranderde nadat een artifact was getest; builder en QA liepen tijdelijk uiteen.
Preventie: release-identiteit = exact commit SHA + immutable deploy + derivative hash, nooit alleen branch- of PR-naam. Geen parallelle writes op dezelfde hero-builder/testbestanden.

### `hero|physical-pass-inheritance|false-acceptance`
Symptoom: manifest vermeldde `physical_iphone_runtime: PASS` voor een nieuwe OpenArt-video zonder bron-/derivative-specifiek fysiek bewijs in deze acceptatiecyclus.
Root cause: acceptatiestatus was niet cryptografisch/content-addressed aan het geteste derivative-artifact gekoppeld.
Preventie: regression gate vereist `physical_iphone_runtime_derivative_sha256 === derivative_sha256` plus expliciete evidence. Nieuwe kandidaat start altijd als `PENDING`.

## Diagnostiek
Voor device-only fouten moet diagnostiek in dezelfde Safari-execution context worden uitgevoerd. Relevante velden/events:
- `currentSrc`;
- `readyState`;
- `networkState`;
- `paused`;
- `currentTime`-progressie;
- `error.code`/message;
- `videoWidth`/`videoHeight`;
- `loadedmetadata`, `loadeddata`, `canplay`, `play`, `playing`, `waiting`, `stalled`, `error`.

Een groene Netlify-build is geen fysieke runtime-acceptatie.

## Acceptatievolgorde
1. Begin vanaf de actuele `test`/last-known-good lineage, niet vanaf een historische previewbranch.
2. Behoud controller/player invarianten.
3. Valideer bron en derivative technisch.
4. Zet manifeststatus op `PENDING`.
5. Bouw een geïsoleerde HTTPS-preview op exact commit SHA.
6. Test op fysieke iPhone.
7. Alleen bij expliciete acceptatie: bind PASS aan exact derivative SHA + evidence + commit/deploy.
8. Voer daarna opnieuw alle regression/build-gates uit.
9. Voor deze acceptatiekandidaat: geen `main`/productiepromotie zonder expliciete productiebevestiging.

## Reusable rule
**Een hero-video is pas bewezen als visuele acceptatie, technische media-validatie, exact artifact identity en fysieke-device runtime-acceptatie allemaal naar hetzelfde derivative-hash verwijzen.**
