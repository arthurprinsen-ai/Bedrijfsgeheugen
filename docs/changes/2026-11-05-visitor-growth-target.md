# Dagelijks bezoekersdoel voor de SEO-lus — 2026-11-05

## Probleem
Laatste 28 dagen: ca. 35 GA4-sessies, 230 vertoningen, 1 klik, beste posities 47–100. De SEO-lus had geen dagelijkse bezoekersmaat; 69 van ca. 145 LinkedIn-posts hebben geen link.

## Wijziging
- `config/visitor-growth-target.json`: eerlijke nulmeting, dagmaat `qualified_visits_7d_avg`, volgorde van hefbomen, LinkedIn-linkregel met UTM, experimentregel (max 3 per dag, meten na 14 dagen).
- `seo-revenue-growth` verwijst ernaar als eerste maat.

## Open
`WINDSOR_API_KEY` ontbreekt voor automatische dagmeting; oorzaak laag LinkedIn-verkeer is niet geverifieerd.

## Onafhankelijke gates
Protected Required, CodeQL, original BRAIN. Bewijst geen ranking of klantuitkomst.
