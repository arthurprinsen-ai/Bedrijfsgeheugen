# Sitewide V18 navigatie en megamenu — 22 september 2026

## Probleem
De navigatie-inhoud was inhoudelijk gelijk, maar het desktopmenu **Meer** kon op een afzonderlijke pagina smaller en verschoven renderen. In het gemelde voorbeeld was `/wijzigingen` duidelijk minder leesbaar dan de brede accepted variant.

## Oorzaak
De bestaande releasecontrole controleerde contrast en vetheid van het echte V18-megamenu, maar deed dat alleen op de homepage. Dat bewees dus niet dat de berekende layout op alle publieke routes identiek bleef.

## Oplossing
De V18-productiebuilder markeert het echte Meer-paneel als canonieke megamenu-root. Vanaf desktopbreedte wordt het paneel ten opzichte van de viewport gecentreerd en krijgt het maximaal 1190 px leesbreedte met 16 px minimale viewportmarge. De top volgt dynamisch de onderzijde van de header.

De browsercheck bezoekt standaard:
- `/`
- `/wijzigingen`
- `/prijzen`
- `/product`
- `/kennis/`
- `/over-ons`

Voor iedere route moeten dezelfde zichtbare desktopnavigatielabels aanwezig zijn. Breedte en linkerzijde van het geopende menu mogen bij dezelfde viewport maximaal 2 px van de homepage afwijken. Het bestaande contrastcontract blijft daarnaast actief.

## Preventieregel
Een sitebrede navigatiewijziging is pas groen wanneer minstens één gewone contentpagina, een view-gebaseerde pagina, een prijs/productroute, de kennisroute en een bedrijfspagina dezelfde shellgeometrie bewijzen. Alleen homepagebewijs is onvoldoende.
