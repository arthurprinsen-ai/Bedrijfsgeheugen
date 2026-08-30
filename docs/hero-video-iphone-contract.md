# Hero Video iPhone Acceptance Contract

Dit document is de canonieke bron voor de Bedrijfsgeheugen hero-video op iPhone. Het doel is herhaalfouten voorkomen, experimenten begrenzen en toekomstige agents direct vanaf fysiek bewezen kennis laten werken.

## 1. Hoogste bewijslaag

Voor above-the-fold hero-media geldt deze bewijsrangorde:
1. fysieke-device acceptatie op de exacte immutable HTTPS-deploy;
2. runtime-diagnostiek op dat device;
3. Netlify READY + exacte commit/deploy;
4. build-/QA-gates;
5. desktop/lokale observatie.

Een lagere laag mag een hogere laag nooit overrulen. Een groene build is dus geen bewijs dat Safari op iPhone daadwerkelijk beweegt.

## 2. Golden baseline

Fysiek door gebruiker bevestigd werkend op iPhone:
- branch: `prototype-v18-6`;
- commit: `3361ec315874c8ea4c3ceca844bb3e4c9e707be6`;
- Netlify deploy: `6a919798b6397000080985a7`;
- canonical script: `v18-4-video-controller` byte-identiek aan de originele rijke V18;
- hero-attributen: muted autoplay, `playsinline`, loop;
- mediadeliveryklasse: officiële Pexels HD 1920x1080/30fps;
- harde fallback-reset na bestaande CSS;
- oude people-image nergens toegestaan als hero-fallback;
- geen playbackRate-hack, alternate controller, WebP-vervanging of nieuwe startarchitectuur;
- device-diagnostiek alleen via `?video-debug=1`.

Deze baseline is immutable control. Nieuwe visuele media mogen hem pas vervangen nadat de exacte nieuwe immutable HTTPS-deploy op een echt iPhone-device expliciet is bevestigd.

## 3. Historische failure catalog

### 3.1 48 KB / Base64-v2
Een vroege compacte same-origin variant leek tijdelijk succesvol, maar later bleek de hero op iPhone stil te staan. Deze variant is daarom **geen geldige movement proof**.

Preventie: alleen expliciete, actuele fysieke-device bevestiging telt als playbackacceptatie.

### 3.2 Originele rijke V18 + originele Pexels-video
De originele V18-combinatie met Pexels source `15107522_1920_1080_30fps.mp4`, originele poster en `v18-4-video-controller` werd op iPhone expliciet bevestigd met `Ja werkt`.

Dit bewees dat player/controller/autoplayarchitectuur zelf Safari-compatibel was.

### 3.3 Lokale OpenArt-transcode met identieke controller
De OpenArt/Grok-video werd lokaal getranscodeerd en in exact dezelfde player/controller geplaatst. Ondanks byte-identieke controller startte de video op iPhone niet zichtbaar; het device bleef op de oude poster staan.

Conclusie: codecnaam en controller-identiteit alleen zijn onvoldoende. Media-encoding, delivery, containerkarakteristieken en browsergedrag vormen samen de playbackketen.

Preventie: verander nooit tegelijk player en media; als control werkt en candidate niet, onderzoek candidate/delivery eerst.

### 3.4 Directe Pexels-bron verkeerd afgeleid
Een Pexels `videos.pexels.com/...` URL werd aanvankelijk uit een patroon afgeleid in plaats van aantoonbaar via de officiële downloadendpoint opgelost.

Preventie: nooit CDN-bestandsnamen raden. Resolve via de officiële downloadroute en leg de werkelijk geredirecte URL vast in een buildmanifest.

### 3.5 Poster gewijzigd maar people-flash bleef
De oude personenfoto zat niet alleen in het `poster`-attribuut maar ook in de canonical CSS-fallback (`.hero-video::before`). Daardoor kon Safari de man nog heel kort tonen voordat de nieuwe media zichtbaar werd.

Preventie: hero-fallbacks zijn een volledig renderingcontract. QA moet niet alleen het `<video poster>` controleren, maar de volledige gegenereerde HTML/CSS op verboden legacy hero-images.

### 3.6 25fps/andere Pexels-variant: traag/stil gedrag
Een andere directe Pexels-variant liet gebouwen zien maar bewoog zeer langzaam of bleef visueel stil. Alleen dezelfde CDN-familie gebruiken bleek dus niet voldoende.

Preventie: wanneer een fysiek bewezen sourceklasse 1920x1080/30fps is, behandel fps/resolutie/deliveryprofiel als relevante variabelen. Verander één variabele per test.

### 3.7 Parallelle agent-writes
Tijdens herstel schreven meerdere agents naar dezelfde builder/QA-files. Dit veroorzaakte GitHub 409-conflicten en tijdelijk incoherente builder/testverwachtingen.

Preventie:
- één canonical writer per bestand/scope tegelijk;
- bij 409: stop, fetch nieuwste SHA/state, herbaseer de wijziging semantisch;
- nooit blind dezelfde write herhalen;
- builder + QA moeten één coherent contract beschrijven.

## 4. OpenArt media-ingang

Nieuwe OpenArt-generaties zijn **creatieve bronmedia**, nooit automatisch browser-ready hero-assets.

De op 2026-08-28 gegenereerde OpenArt/Grok Imagine 1.5 candidate:
- history id: `uUxKRWcQkzWIPosutXVF`;
- output: 1920x1088;
- 24 fps;
- duur circa 8.04 s;
- audio aanwezig;
- bron-URL: `https://cdn.openart.ai/openart-ai/production/2026-08/create-video/WZvuT1BzGx566fWaFo8F/xai-video-143123ce-c19d-935c-a98f-0ffc678d4ae0_1787928916465_3c8704c8.mp4`.

Deze raw output mag **niet direct** de golden baseline vervangen. 1920x1088 + 24fps + audio wijkt af van de fysiek bewezen deliveryklasse en lijkt op eerder problematisch bronmateriaal.

Candidate-pipeline voor OpenArt:
1. bewaar golden baseline onaangeraakt;
2. valideer raw metadata;
3. maak één candidatevariant die zo dicht mogelijk bij de bewezen klasse ligt: 1920x1080, 30fps, H.264, yuv420p, geen audio, faststart;
4. gebruik versioned/content-addressed assetnaam;
5. verander alleen hero source/poster, niet controller/startgedrag/fallback-reset;
6. build QA moet controller-identiteit, fallbackverboden, mediaeigenschappen en exacte source afdwingen;
7. publiceer naar immutable Netlify preview;
8. test op echte iPhone;
9. alleen bij expliciete movement-acceptatie mag candidate naar nieuwe baseline promoveren;
10. bij falen: rollback naar golden baseline en vergelijk precies één mediaverschil.

Belangrijk: stap 3 is een **candidate-normalisatie**, geen garantie. Een eerdere lokale transcode faalde ondanks correcte controller; echte-device acceptatie blijft verplicht.

## 5. Visuele acceptatie

Technisch groen en visueel groen zijn twee aparte gates. De gewenste hero-richting is:
- lichte, dromerige aerial/drone-beelden;
- moderne premium architectuur;
- paden, wegen en geometrische lijnen die overzicht/richting/progressie suggereren;
- vroege ochtend/golden hour, cream/wit/pale blue/warm gold;
- duidelijke maar rustige camera-parallax zodat beweging onmiddellijk waarneembaar is;
- geen zakelijke hoofden, kantoorinterieur, donkere stadsesthetiek of wolken als hoofdonderwerp;
- geen tekst in de video.

## 6. Runtime diagnostic contract

`?video-debug=1` moet beschikbaar blijven en minimaal tonen:
- `currentSrc`;
- `readyState`;
- `networkState`;
- `paused`;
- `currentTime`;
- `error.code`;
- `videoWidth` / `videoHeight`;
- relevante events zoals `loadedmetadata`, `canplay`, `playing`, `waiting`, `stalled`, `error`.

Diagnostiek is opt-in en mag normale bezoekers niet beïnvloeden.

## 7. Promotion gate

Een nieuwe hero-video is pas een nieuwe baseline wanneer alle onderstaande punten waar zijn:
- builder + QA groen;
- Netlify exact commit READY;
- immutable HTTPS URL getest;
- geen legacy people-image zichtbaar, ook niet kort;
- video start automatisch inline en blijft bewegen;
- visuele stijl geaccepteerd;
- echte iPhone expliciet bevestigd;
- resultaat + root-cause/failure learnings bijgewerkt in `docs/development-ledger.md`;
- `AGENTS.md` / self-heal-regels blijven consistent.

Tot dat moment blijft commit `3361ec315874c8ea4c3ceca844bb3e4c9e707be6` de control.