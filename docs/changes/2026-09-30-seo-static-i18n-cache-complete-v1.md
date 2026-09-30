# SEO static English cache completeness — 30 September 2026

The bilingual SEO release was blocked by the production i18n fail-closed contract: 23 exact Dutch source strings introduced or recomposed by the Modelwijzer/SEO changes were not yet present in the committed English translation cache.

The canonical cache patch now contains those exact strings, including Modelwijzer guidance, numbered decision steps, governance copy, CTA copy, footer copy and the Company Brain explanation.

Permanent rule: when `STATIC_I18N_REQUIRE_CACHE=1`, a public-source copy change and its English cache entry are one atomic delivery. The gate remains enabled; Dutch fallback on English production pages is not an accepted recovery.
