# Production route visible-surface proof — 24 september 2026

## Root cause

De generieke production route verifier wachtte op `body` met Playwright state `visible`. Op `/prijzen` was de exacte release live en de pagina-inhoud aanwezig, maar Playwright classificeerde het `body`-element zelf twee keer niet als visible. Daardoor stopte de generieke routecheck vóór de specifieke pricing/i18n-browserproof.

## Fix

De routecheck bewijst nu:
- `body` is aan de DOM gekoppeld;
- de pagina bevat niet-lege rendered tekst;
- minstens één direct contentvlak heeft een echte zichtbare bounding box en is niet hidden/display:none/opacity:0.

Daarna blijven canonical/title/HTTP/assets/page-errors gewoon gecontroleerd. De pricing/i18n-verifier blijft een afzonderlijke echte browserinteractietest; die wordt niet versoepeld.
