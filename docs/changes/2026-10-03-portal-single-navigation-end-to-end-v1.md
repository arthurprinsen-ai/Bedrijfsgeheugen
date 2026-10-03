# Portal: één end-to-end navigatie

## Doel

Het klantenportaal moet als één product aanvoelen. Er mag niet één compact hoofdmenu naast een tweede volledig menu bestaan.

## Nieuwe navigatiecontract

De canonieke pagina-index is `PORTAL_SECTIONS` / `PORTAL_PAGE_INDEX`.

- Desktop rendert alle geregistreerde portalpagina's rechtstreeks in één scrollbare sidebar.
- Mobiel gebruikt één hamburger die exact dezelfde gegroepeerde pagina-index rendert.
- De oude desktop all-pages drawer is geen actieve navigatielaag meer.
- De losse mobiele shortcutnavigatie is verwijderd.
- De extra Business OS navigatie-injectie wordt niet meer geladen als tweede authority.
- De oude portal-library overlay wordt niet gemount.
- Navigeren blijft binnen dezelfde portal-shell en bewaart de bestaande `?page=` URL/history-contracten.

## Borging

De regressietests controleren dat alle geregistreerde pagina's via dezelfde builder bereikbaar blijven en dat een tweede desktopmenu, shortcutnav of legacy navigation mount niet terugkeert.
