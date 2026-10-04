# Portal V2 Experience Contract v1

## Doel
Portal V2 moet één betrouwbaar SaaS-product zijn: rustig, modern, snel te begrijpen en end-to-end verbonden met de bestaande Portal State en Powerhouse-runtime.

## Niet-onderhandelbare UX-regels
- Geen horizontale pagina-overflow vanaf 320 px breed.
- Interactieve controls hebben minimaal 44×44 px touchruimte.
- Grafieken, canvassen en media blijven binnen hun kaart en krijgen een begrensde visuele hoogte.
- Desktop, tablet en mobiel gebruiken dezelfde informatie-architectuur; alleen de presentatie verandert.
- Kaarten gebruiken een consistente visuele schaal, radius, schaduw en hover/focus-feedback.
- Dialogs/drawers blijven binnen de viewport en zijn toetsenbord-zichtbaar.
- Reduced-motion wordt gerespecteerd.
- Dynamisch gerenderde portalcontent krijgt dezelfde responsive/interactiecontracten.

## End-to-end betrouwbaarheid
De experience-laag verandert de data-authority niet. Portal State blijft fail-closed op ontbrekende authenticatie, schrijft bedrijfsinput eerst via de canonieke input-store en accepteert een state-write alleen bij provider-readback zonder stored=false.

## Release gate
Elke wijziging aan Portal V2 moet minimaal bewijzen:
1. statisch experience-contract;
2. browserweergave 320/390/430/760/1180/1440;
3. geen horizontale overflow;
4. bereikbare navigatie en dialogs;
5. begrensde media/grafieken;
6. portal-state auth/write fail-closed contract;
7. productie-readback na merge/deploy.
