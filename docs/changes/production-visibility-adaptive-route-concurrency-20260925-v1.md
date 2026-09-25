# Production visibility adaptive route concurrency — 2026-09-25

## Probleem
De sitebrede productie-readback bleef semantisch correct maar overschreed het vaste 8-minutenbudget. Viewport-parallelisatie alleen was niet voldoende: vier route-workers per viewport bleven te weinig voor de huidige sitemap.

## Oorzaak
De workload groeide terwijl de routeconcurrency vast op vier bleef staan. Daardoor kon één viewport nog vrijwel het volledige budget consumeren, ondanks parallelle phone/tablet/desktop-verificatie.

## Fix
De verifier schaalt de routeconcurrency nu met de actuele sitemapgrootte: minimaal vier workers, circa één worker per twaalf routes en maximaal acht workers per viewport. Een expliciete UI_VR_ROUTE_CONCURRENCY override blijft leidend. Alle zichtbaarheid-, occlusie-, content- en CLS-asserties blijven ongewijzigd.

## Preventie
Browsergates moeten niet alleen bounded zijn; hun bounded concurrency moet ook proportioneel blijven aan de workload, met een expliciete bovengrens.
