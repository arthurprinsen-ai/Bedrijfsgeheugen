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

## Hero-video contract
- H.264 MP4 zonder audio voor autoplay.
- Exact één `<video id="heroBackgroundVideo">`.
- Verplicht: `autoplay muted playsinline loop`.
- In JS ook `muted`, `defaultMuted`, `volume=0` en `playsInline` afdwingen.
- Videowijzigingen mogen menu, routing, scans, AI of portal niet wijzigen.
- Visuele richting: inspirationeel/premium/abstract; geen zakelijke hoofden, kantooroverleg of generieke wolkenbeelden.

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
11. hero-MP4 heeft plausibele bestandsgrootte;
12. Netlify deploy is groen.

## Incidenten die niet opnieuw mogen gebeuren
- iPhone Safari: `DecompressionStream` gaf “Failed to Decode Data”.
- pako/fallback: `invalid distance too far back`; browserdecode was geen betrouwbare architectuur.
- Chunkvolgorde: `chunk-gap` werd eerst onterecht toegevoegd/verwijderd; hierdoor ontbraken exact 8.000 tekens of werd gzip corrupt.
- `chunk-03` raakte versnipperd; zonder hashes kon een afwijkende payload worden gepubliceerd.
- Lokale HTML werd als acceptatieversie gedeeld; menu/video gedroegen zich anders dan op HTTPS.
- Een vereenvoudigde V18.6-wrapper verving tijdelijk de rijke V18-uitvoering; dat is verboden.
- Dubbele/legacy video-controllers en opacity-states konden de video onzichtbaar maken.
- Externe video-hosting leverde technisch werkende maar inhoudelijk verkeerde beelden (wolken / zakelijke hoofden).
- De live branch bevatte een andere hero-MP4 dan de lokaal geteste asset. Branch/deploy is voortaan de enige acceptatiewaarheid.
- Inline SVG-motion werd als “video” gepubliceerd; dit voldeed niet aan de afgesproken echte video-output.

## Werkmethode toekomstige agents
1. Eerst foutmelding/reproductie en branch/deploy-state lezen.
2. Root cause bewijzen; geen stapeling van vermoedelijke fixes.
3. Regressietest eerst laten falen waar mogelijk.
4. Eén minimale wijziging per hypothese.
5. Build-time QA moet groen zijn.
6. Exacte Netlify commit/deploy verifiëren.
7. Pas daarna acceptatielink delen.
8. Nooit claimen dat iets op echte iPhone werkt voordat dat daar daadwerkelijk bevestigd is.
