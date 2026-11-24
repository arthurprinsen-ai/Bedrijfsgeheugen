# Provider replay input regression — 24 November 2026

#6151 merged with green Required and CodeQL but full BRAIN verification 45440492591 failed one old test. Existing test now executes the actual two manual guards: empty input rejected; explicit function selection retained; exact replay PR accepted for validation; mixed, malformed and non-manual replay rejected. No production workflow or authority changed. Historical failure retained; protected successor and independent original replay outcome still required.
