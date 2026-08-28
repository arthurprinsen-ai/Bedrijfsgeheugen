# V18 preview — reliability contract & lessons learned

Deze regels gelden voor alle huidige en toekomstige agents die de Bedrijfsgeheugen-preview wijzigen.

## Acceptatie-architectuur
- De acceptatie-URL serveert gewone statische HTML vanaf Netlify.
- Hero-media is een lokaal, versieerbaar MP4-bestand op dezelfde Netlify-deploy.
- Geen browser-side gzip/base64/chunk-reconstructie.
- Geen `DecompressionStream`, pako of externe decoder voor kernfunctionaliteit.
- Geen Netlify Function als primaire acceptatieroute voor het statische prototype.
- Geen `file:`, `sandbox:` of lokaal HTML-bestand gebruiken als bewijs dat de live versie werkt.
- De rijke V18-basis mag nooit stilzwijgend worden vervangen door een vereenvoudigde wrapper.
- `main`/productie nooit mergen of overschrijven zonder expliciete bevestiging.
- De preview-root (`index.html`) moet altijd naar `/prototype-v18-stable.html` wijzen en mag nooit terugvallen naar de oude `/prototype-v18-6.html`.

## Hero-video contract
- H.264 MP4 zonder audio voor autoplay.
- Exact één `<video id="heroBackgroundVideo">`.
- Verplicht: `autoplay muted playsinline loop`.
- In JS ook `muted`, `defaultMuted`, `volume=0` en `playsInline` afdwingen.
- Videowijzigingen mogen menu, routing, scans, AI of portal niet wijzigen.
- Visuele richting: inspirationeel/premium/abstract; geen zakelijke hoofden, kantooroverleg of generieke wolkenbeelden.
- Geaccepteerde media gebruikt een cache-busted bestandsnaam (`inspirational-hero-v2.mp4` of hoger); een bestaand immutable media-URL mag niet opnieuw voor andere bytes worden gebruikt.
- Grote binaire bestanden worden niet rechtstreeks via connectorwrites vertrouwd. De canonieke video wordt als kleine Base64-bronsegmenten opgeslagen en tijdens de Netlify-build tot één gewone statische MP4 gereconstrueerd.
- De gereconstrueerde MP4 moet vóór publicatie exact overeenkomen met de vastgelegde bytegrootte en SHA256.

## Routing/UI contract
- Exact 14 views in de huidige acceptatiebasis.
- Iedere `data-view` moet naar een bestaande view wijzen.
- Mobiele drawer moet aanwezig blijven en openen/navigeren/sluiten.
- Geen horizontale overflow op mobiel.
- Iedere echte `<a href>` gebruikt een absolute `https://` URL; SPA-routing gebruikt daarnaast `data-view`.

## Deploy quality gate
`tools/bouw-v18-preview.mjs` bouwt de volledige pagina tijdens de Netlify-build. `tools/test-v18-preview.mjs` blokkeert de deploy bij regressie. Een link mag pas gedeeld worden wanneer de Netlify Deploy Preview `success/ready` is.

Verplichte checks:
1. canonieke V18 payloadlengte + SHA256;
2. canonieke uitgepakte HTML SHA256;
3. 14 views;
4. mobiele drawer aanwezig;
5. alle `data-view` targets bestaan;
6. exact één hero-video;
7. autoplay/muted/playsinline/loop;
8. lokale versieerbare MP4;
9. geen runtime-decompressielogica;
10. alleen absolute HTTPS-anchorlinks;
11. hero-MP4 heeft exact 48.909 bytes, een geldige `ftyp` MP4-header en SHA256 `476e0cfcfb065b01f419dab96ca5f28a20495862716fb34da9db742e9899db2a`;
12. preview-root wijst naar `prototype-v18-stable.html` en niet naar de vereenvoudigde V18.6;
13. Netlify deploy is groen.

## Incidenten die niet opnieuw mogen gebeuren
- iPhone Safari: `DecompressionStream` gaf “Failed to Decode Data”.
- pako/fallback: `invalid distance too far back`; browserdecode was geen betrouwbare architectuur.
- Chunkvolgorde: `chunk-gap` werd eerst onterecht toegevoegd/verwijderd; hierdoor ontbraken exact 8.000 tekens of werd gzip corrupt.
- `chunk-03` raakte versnipperd; zonder hashes kon een afwijkende payload worden gepubliceerd.
- Lokale HTML werd als acceptatieversie gedeeld; menu/video gedroegen zich anders dan op HTTPS.
- Een vereenvoudigde V18.6-wrapper verving tijdelijk de rijke V18-uitvoering; dat is verboden.
- De Deploy Preview-root bleef daarna nog naar die oude V18.6 verwijzen terwijl `prototype-v18-stable.html` al werd gebouwd. Rootrouting is daarom nu onderdeel van de quality gate.
- Dubbele/legacy video-controllers en opacity-states konden de video onzichtbaar maken.
- Externe video-hosting leverde technisch werkende maar inhoudelijk verkeerde beelden (wolken / zakelijke hoofden).
- De live branch bevatte een andere hero-MP4 dan de lokaal geteste asset. Branch/deploy is voortaan de enige acceptatiewaarheid.
- Inline SVG-motion werd als “video” gepubliceerd; dit voldeed niet aan de afgesproken echte video-output.
- Een grote MP4-write via de GitHub-connector werd stil afgekapt (7.500 bytes in plaats van 48.909). Daarom mogen grote binaire connectorwrites niet meer de canonieke bron zijn; build-time reconstructie uit gecontroleerde kleine tekstsegmenten is verplicht.
- Een vorige QA-gate controleerde alleen een minimale bestandsgrootte en liet daardoor een foutieve placeholder door. De gate controleert nu exacte grootte, MP4-header en SHA256.
- Een immutable media-URL (`v1`) werd hergebruikt met andere inhoud. Nieuwe media krijgt voortaan altijd een nieuwe versie in de bestandsnaam om clientcache ambiguïteit uit te sluiten.

## Werkmethode toekomstige agents
1. Eerst foutmelding/reproductie en branch/deploy-state lezen.
2. Root cause bewijzen; geen stapeling van vermoedelijke fixes.
3. Regressietest eerst laten falen waar mogelijk.
4. Eén minimale wijziging per hypothese.
5. Build-time QA moet groen zijn.
6. Exacte Netlify commit/deploy verifiëren.
7. Voor acceptatie bij voorkeur de atomic deploy-permalink gebruiken; die verandert nooit.
8. Pas daarna acceptatielink delen.
9. Nooit claimen dat iets op echte iPhone werkt voordat dat daar daadwerkelijk bevestigd is.
