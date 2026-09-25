# Pricing component canonical parity — 25 september 2026

Fingerprint: `pricing-component-canonical-parity-v1`

## Waarom
De hoofdpagina `/prijzen` en Portal V2/SaaS-entitlements waren inhoudelijk in lijn, maar de herbruikbare pricing-component bevatte nog de oude Scan-prijs €2.900 en een niet-canonieke prijsvariant van €2.400 op afstand.

## Fix
- `components/pricing/pricing.html` gebruikt nu de canonieke Scan-prijs €2.950.
- De niet-onderbouwde remote-price variant is verwijderd.
- Een regressietest vergelijkt de component met `prijzen.html`.

## Contract
Alle publieke prijsoppervlakken en herbruikbare pricing-componenten moeten dezelfde canonieke commerciële prijs voeren. Een component mag geen alternatieve prijs tonen zonder expliciet broncontract.
