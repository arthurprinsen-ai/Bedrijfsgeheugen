# Pricing production bootstrap retry — 24 september 2026

De generieke production-routecheck was groen, maar de pricing-specifieke Playwright-verifier kon vóór de eerste interactie incidenteel 15 seconden wachten op een zichtbare `body` of de `ready-v3` runtime-marker.

De verifier opent voortaan maximaal drie keer een verse mobiele pagina wanneer uitsluitend een Playwright `TimeoutError` optreedt tijdens bootstrap. Iedere nieuwe poging doet opnieuw echte navigatie, body-readiness en runtime-readiness. Niet-timeout fouten blijven direct terminal.

De functionele bewijslast is niet verlaagd: lifecycle-tab, Start/Run, maand/jaar en NL→EN blijven echte browserinteracties met zichtbare state-asserties.

Daarnaast is testdrift hersteld: de oude actionability-regressie eiste nog `scrollIntoViewIfNeeded()` terwijl de canonieke verifier inmiddels deterministic DOM-scroll voor positionering gebruikt.
