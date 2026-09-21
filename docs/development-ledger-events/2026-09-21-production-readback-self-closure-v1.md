# Activity event — production readback self-closure

- **Fingerprint:** `production-readback-pricing-cta-blog-index-coverage-v1`
- **Obligation:** `production-readback-self-closure-v1`
- **Date:** 2026-09-21
- **Actor:** Powerhouse delivery recovery
- **Scope:** website, SEO order engine, canonical System Map
- **Observed failures:** production pricing CTA measurement drift; /blog/ SEO collection-index discovery false negative; inherited i18n System Map topology drift.
- **Root cause:** the measurable pricing CTA was only proven in a replaceable global footer; SEO discovery omitted `blog/index.html`; the immediately preceding i18n release added `netlify/functions/i18n-translate.mjs` without same-lineage System Map registration.
- **Recovery:** bind conversion semantics to retained pricing main content; include canonical blog index in SEO estate discovery; register i18n translation function in the System Map and reconcile provider inventory.
- **Regression evidence:** `tests/brain-prijzen-primary-cta-measurement.test.mjs`; `tests/brain-powerhouse-live-system-map-v1.test.mjs`.
- **Production evidence before final merge:** exact-head Canonical brand shell live readback and V18 Production Promotion green on recovery candidate.
- **Prevention:** no material change is terminal without Brain learning, append-only activity event, human documentation, skill projection where applicable, exact-head gates, protected merge and exact production/provider readback.
- **Terminal state:** open until protected merge and exact production readback close the same lineage.
