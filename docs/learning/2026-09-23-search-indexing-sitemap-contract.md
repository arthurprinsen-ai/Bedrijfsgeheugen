# Search indexing: sitemap en noindex-contract hersteld

## Probleem
Search Console liep op naar 53 URL's met de status **Gevonden – momenteel niet geïndexeerd**. De website maakt tijdens de productiebouw extra HTML-routes aan, maar de sitemap werd niet opnieuw uit die definitieve output opgebouwd. Daardoor konden interne links en de sitemap verschillende signalen aan Google geven.

Daarnaast was `/inloggen` in de routeconfiguratie bewust als niet-indexeerbaar gemarkeerd, maar de generator verving een al aanwezige `robots`-meta niet. Daardoor kon een geërfde `index, follow` blijven staan.

## Oorzaak
De deploy-output was de feitelijke bron van waarheid voor routes, terwijl `sitemap.xml` als los artefact achterliep. De robots-logica behandelde “robots-tag bestaat” ten onrechte als equivalent aan “juiste indexeringsinstructie staat er”.

## Oplossing
De Netlify-build draait nu `tools/genereer-sitemap.mjs` nadat de finale routes zijn opgebouwd. Die generator leest de definitieve HTML, gebruikt de canonicals en laat noindex-routes weg. Voor `geenIndex`-views wordt een bestaande robots-meta expliciet vervangen door `noindex, follow`.

## Preventie
Sitemap, canonical en robots moeten voortaan uit dezelfde finale build-state komen. Nieuwe gegenereerde routes mogen niet alleen via interne links worden ontdekt terwijl de sitemap een oudere route-inventaris bevat.

## Verificatie
De kandidaat bouwt succesvol, de contract- en smokechecks zijn geslaagd en de Netlify deploy-preview is gereed. De laatste gate is productiepromotie plus live readback van sitemap, robots/canonical en representatieve routes.
