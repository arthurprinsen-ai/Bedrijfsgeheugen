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
