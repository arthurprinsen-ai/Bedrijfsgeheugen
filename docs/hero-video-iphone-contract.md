# Hero Video iPhone Acceptance Contract

Canonieke engineeringkennis voor hero-video op Safari/iPhone. Dit document bewaart de volledige bewezen leerketen en voorkomt dat agents bekende mislukte aanpakken herhalen.

## Evidence hierarchy
1. fysieke-device acceptatie op exacte immutable HTTPS-deploy;
2. device runtime-diagnostiek;
3. exact-SHA preview/production deploy evidence;
4. build/QA gates;
5. lokale/desktop observatie.

Een groene build of Netlify `READY` bewijst nooit zelfstandig dat een iPhone-video beweegt.

## Baseline evolution

### Eerste fysiek bewezen preview-control
- commit `3361ec315874c8ea4c3ceca844bb3e4c9e707be6`;
- Netlify deploy `6a919798b6397000080985a7`;
- canonical `v18-4-video-controller`;
- muted autoplay + `playsinline` + loop;
- officiële Pexels HD 1920×1080/30fps-deliveryklasse;
- harde legacy hero-fallback-reset;
- `?video-debug=1` voor opt-in device-diagnostiek.

Deze preview was de eerste expliciet op iPhone bevestigde stabiele control en blijft historisch root-cause-bewijs.

### Latere productie-control
De actieve Brain-checkpoint registreert daarna een fysiek geaccepteerde OpenArt-derivative:
- source SHA-256 `d4a516304adebbf8067bceb034046ddd65e3ff62fd8e34c800115aeb226c89e0`;
- fysiek geaccepteerde derivative SHA-256 `a261792e9b0058802ab5b30ce107c7ac14e8b2291a3bd7ee78fdb5968bbe97fd`.

Een andere derivative hash erft deze fysieke acceptatie niet, ook niet bij identiek technisch profiel.

## Failure fingerprints

### `hero|iphone|false-movement-proof`
Een vroege 48 KB/Base64-v2 leek tijdelijk succesvol maar bleek later stil. Geen movement proof zonder expliciete actuele device-confirmatie.

### `hero|media|controller-good-source-bad`
Originele rijke V18 + originele Pexels `15107522_1920_1080_30fps.mp4` werkte fysiek op iPhone. Een lokale OpenArt-transcode faalde daarna ondanks byte-identieke controller. Conclusie: source/delivery/container/encoding zijn onderdeel van het systeemcontract; pas de controller niet aan om een slechte candidate te redden.

### `hero|pexels|guessed-cdn-url`
Een `videos.pexels.com/...` URL werd eenmaal uit een patroon afgeleid in plaats van via de officiële downloadroute opgelost. CDN-bestandsnamen nooit raden; resolve via officiële endpoint/redirect en leg resolved URL vast.

### `hero|iphone|same-provider-different-profile`
Een andere Pexels-variant uit dezelfde CDN-familie gaf toch traag/stil gedrag. Provider/CDN-familie alleen is geen compatibiliteitsbewijs; fps/resolutie/container/deliveryprofiel blijven relevante variabelen.

### `hero|fallback|legacy-people-flash`
De oude personenfoto zat niet alleen in het `<video poster>` maar ook in een CSS-fallback (`.hero-video::before`). Daardoor kon de man nog zeer kort verschijnen. QA moet volledige gegenereerde HTML/CSS scannen op verboden legacy hero-images; poster-only checks zijn onvoldoende.

### `github|agent-race|hero-builder-qa-409`
Parallelle agents schreven tegelijk naar hero builder/QA en veroorzaakten stale SHA/409 en tijdelijk incoherente verwachtingen. Eén canonical writer per bestand/semantische scope. Bij 409: stop, fetch nieuwste state, reconcileer semantisch, geen blind retry.

## OpenArt ingestion contract
OpenArt-output is creatieve bronmedia, nooit automatisch browser-ready hero-media.

Nieuwe generation uit deze chat:
- model: Grok Imagine 1.5 via OpenArt;
- history id: `uUxKRWcQkzWIPosutXVF`;
- raw URL: `https://cdn.openart.ai/openart-ai/production/2026-08/create-video/WZvuT1BzGx566fWaFo8F/xai-video-143123ce-c19d-935c-a98f-0ffc678d4ae0_1787928916465_3c8704c8.mp4`;
- metadata: 1920×1088, 24 fps, ~8.04 s, audio aanwezig.

Deze raw candidate mag niet direct de fysiek geaccepteerde productie-control vervangen. Hij wijkt af van de bewezen iPhone-media-invarianten en lijkt op eerder problematisch raw AI-videomateriaal.

Candidate-normalisatie vóór preview:
- 1920×1080;
- 30 fps;
- H.264;
- yuv420p;
- geen audio;
- faststart;
- versioned/content-addressed asset;
- canonical controller/startgedrag/fallback-reset ongewijzigd.

Dit profiel is alleen een candidate gate, geen acceptatiegarantie. Echte iPhone-confirmatie blijft verplicht.

## One-variable rule
Bij hero/media-debugging:
1. herstel eerst actuele fysiek bewezen control;
2. wijzig maximaal één relevante variabele;
3. behoud controller en fallback-reset;
4. publiceer immutable HTTPS candidate;
5. verzamel device evidence;
6. bij falen: rollback control en vorm een nieuwe hypothese.

Geen gecombineerde source + controller + playbackRate + fallback-experimenten.

## Visual gate
Gewenste richting:
- lichte, rustige premium dronevlucht;
- moderne architectuur / waterfront / high-rises;
- wegen, paden en geometrische structuur;
- golden hour / warm licht / lichte lucht;
- zichtbare maar rustige parallax vanaf het begin;
- vrijwel geen mensen, weinig verkeer;
- geen kantoorhoofden, donkere abstractie, wolken als hoofdonderwerp, snelle cuts of tekst.

Technisch groen en visueel groen zijn afzonderlijke gates.

## Device diagnostic contract
`?video-debug=1` blijft opt-in beschikbaar en toont minimaal:
- `currentSrc`;
- `readyState`;
- `networkState`;
- `paused`;
- `currentTime`;
- `error.code`;
- `videoWidth` / `videoHeight`;
- media-events: `loadedmetadata`, `canplay`, `playing`, `waiting`, `stalled`, `error`.

Normale bezoekers mogen geen debugoverlay zien.

## Promotion gate
Een nieuwe hero-video is pas fysiek geaccepteerde baseline wanneer:
- exact candidate-profiel/gates groen zijn;
- exact-SHA Netlify preview READY is;
- immutable HTTPS candidate is getest;
- geen legacy people-flash optreedt;
- beweging direct zichtbaar en continu is;
- visuele stijl is geaccepteerd;
- echte iPhone expliciet PASS geeft;
- exacte derivative hash wordt vastgelegd;
- learning/fingerprint/preventie wordt teruggeschreven naar het Brain.

Tot die tijd blijft de actuele fysiek geaccepteerde production derivative de control.