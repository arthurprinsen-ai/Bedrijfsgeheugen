# Pricing English H1 cache repair — 25 September 2026

Production was already on the exact current main SHA and the canonical live readback was green, but both Production Source Snapshot and Production Release Readback failed the final browser interaction check because `/en/prijzen` still rendered the Dutch H1 `Prijzen voor digitalisering in het mkb`.

The verifier is correct and remains unchanged.

This recovery adds the canonical static-English cache patch:

- Dutch source: `Prijzen voor digitalisering in het mkb`
- English: `Pricing for SME digitalisation`

A regression locks this mapping so the Dutch critical H1 cannot silently reappear on the English pricing route.
