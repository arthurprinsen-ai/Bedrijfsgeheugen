# LinkedIn persoonlijk — alleen persoonlijk leven — 20 september 2026

Fingerprint: `personal-linkedin-personal-life-only-v1`.

De persoonlijke LinkedIn-route is aangescherpt van “persoonlijk tenzij exact business-exception” naar **uitsluitend persoonlijk leven, zonder business-exception**.

De bestaande canonical identity gate blijft authority. De wijziging voegt geen parallel content-systeem toe. Bronselectie vereist nu expliciet `personal_life_only=true` en `business_bridge=false`; de final-copy gate blokkeert bedrijven, klanten, MKB, consultancy, werk-/bedrijfsprocessen, Bedrijfsgeheugen, zakelijke AI/data/digitalisering, sales en zakelijke lessen.

Zakelijke thema's worden naar de bedrijfspagina gerouteerd. Persoonlijke performance blijft gescheiden van zakelijke/commerciële ranking.

Regression: `tests/brain-linkedin-personal-semantic-gate-v5.test.mjs`.
