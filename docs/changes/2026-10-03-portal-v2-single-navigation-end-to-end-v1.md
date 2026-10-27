# Portal V2 — één menu, één experience

## Probleem

Portal V2 had meerdere navigaties tegelijk: een compacte linker navigatie, een volledige menu-drawer, een apart projectblok en een gereduceerde mobiele bottom bar. Daardoor was niet op elke plek dezelfde set pagina's zichtbaar en voelde navigeren als meerdere portalen.

## Nieuw contract

De volledige Portal V2 page registry is de bron voor één navigatiemodel.

- Desktop: één scrollbare linker menuboom met alle pagina's.
- Tablet en mobiel: dezelfde menuboom achter één hamburger wanneer de sidebar niet beschikbaar is.
- Jouw project: bereikbaar binnen hetzelfde navigatiemodel, niet als tweede desktopmenu.
- Actieve status: exact de geopende pagina, ongeacht viewport of entry point.
- Deep links met `?page=` en `?hub=` blijven behouden.
- De mobiele bottom bar is verwijderd.
- De desktop hamburger is verborgen zolang de volledige sidebar zichtbaar is.

## Preventie

De brain- en navigatietests controleren volledige page-registry coverage, dezelfde responsive boom en het ontbreken van een tweede mobiele of desktop navigation authority.
