# Powerhouse CI Acceleration v1 — 28 september 2026

GitHub delivery is versneld zonder security- of exact-head-gates te verzwakken.

## Wijzigingen
- Required preflight voert Portal- en Supabase-domainchecks niet meer onvoorwaardelijk dubbel uit.
- PR/ref single-flight blijft de autoriteit; superseded runs worden geannuleerd.
- npm downloads worden hergebruikt via een package.json-gebonden cache; de repo heeft bewust nog geen package-lock.
- Website page/SEO controle hergebruikt de bestaande build in plaats van een tweede volledige build.
- Browserverificatie gebruikt de exact-SHA Netlify preview wanneer die gereed is; lokale build is fallback.
- Mutation testing is uit de gewone PR critical path gehaald en blijft beschikbaar via schedule/manual.
- Powerhouse CI Intelligence meet queue time, execution time, fan-out per SHA en failure/cancel/skip-signalen.
- Learning, skills en de canonical System Map zijn in dezelfde lineage bijgewerkt.

Regression oracle: `tests/brain-ci-critical-path-acceleration-v1.test.mjs`.

- Closure metadata is gesynchroniseerd met de volledige 16-file candidate scope na Required readback.

- Scope metadata reconciled with the complete 16-file delivery lineage after CI readback.

- Portal V2 verification now belongs to the portal lane rather than the generic Required preflight, preserving coverage while avoiding unrelated PR execution.

- PR scope metadata is gesynchroniseerd op 17 bestanden, inclusief de portal-lane ownership-wijziging.

- Release-control regression assertions now validate build-once plus exact-preview reuse rather than the superseded duplicate page-SEO/local-build architecture.

- Website-risk regression contract now treats the canonical parity build as the shared artifact owner and local browser build as preview-unavailable fallback only.
