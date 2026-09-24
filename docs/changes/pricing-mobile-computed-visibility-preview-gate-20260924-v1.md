# Pricing mobile computed visibility + preview gate — 24 september 2026

## Productiefout
De production browserreadback op commit `945febc5cb2d603dfaefcc8b1d12a36b075a7d1d` vond de lifecycle-knop `Verlies & herstel` wel in de DOM, maar kon hem op 390 px niet aanklikken omdat hij niet zichtbaar/stabiel was.

## Fix
- mobiele lifecycle-container en tabs krijgen expliciete computed-visibility/clickability hardening;
- dezelfde volledige pricinginteractieproef draait voortaan op de exacte Netlify deploy-preview vóór merge wanneer `/prijzen` geraakt is.

## Gate
De preview moet lifecycle, Run-tab, jaarfacturatie en de statische Engelse route `/en/prijzen` functioneel bewijzen.
