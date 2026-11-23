# Rituals-richting stap 2: rustigere homepage-hero

Besluit 17 nov 2026 (Arthur): website en portaal ademen rust en exclusieve begeerte, zoals Rituals; energie en humor blijven voor social. Stap 2 van de richting; bouwt voort op #5938 (inmiddels gemerged, main groen via #5963).

- Alleen CSS, een extra laag `v18-home-rituals` in `tools/bouw-v18-chrome-alles.mjs` (na `v18-home-blauw`). Geen DOM-, tekst-, kleur- of routewijziging; de pinned V18-payload is ongemoeid.
- Kop: kleiner en rustiger (clamp 2,2-3,5 rem, gewicht 600, ruimere regelhoogte).
- Bestaande desktopfout opgelost: `.mark` in de H1 werd als geel logo-blokje getekend omdat de reset alleen in de mobiele media-query stond. Nu op alle breedtes gewone gele woordmarkering.
- Handline als rustig versaalregeltje, kleinere bijtekst, "Bekijk het portaal" als tekstlink, metrics zonder kaders, rustigere hover (600 ms), geen beweging bij `prefers-reduced-motion`.
- Lokaal bewijs: generatorketen in tijdelijke kopie, screenshots 1440x900 en 390x844 voor/na; vier gerelateerde testbestanden groen (1, 14, 2, 1).
- Niet bewezen: exact-head checks, productie-readback, effect op gedrag (meting: scrolldiepte home, klik op Gratis lekscan, portaalaanmelding; geen A/B bij ~150 sessies).
- Open: `assets/kop.css` lijkt niet gelinkt op V18-pagina's (kop is `v17-header`), dus de kopwijziging uit #5938 kan daar zonder effect zijn.
- Volgende stappen: portal-v2 welkomstscherm, /prijzen, Stijlgids 18.
