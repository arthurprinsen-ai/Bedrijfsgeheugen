# Faster static NL/EN builds without weakening reliability

Fingerprint: `global-i18n-static-build-concurrency-v1`

The static locale architecture was already narrowed to public routes and smaller translation batches, but the batches were still processed one after another. That made deploy previews too slow for the existing six-minute smoke-test window.

The build now uses a bounded worker pool with at most four concurrent batches. It is deliberately capped rather than unbounded, so provider quotas and resource governance remain controlled. A failing batch still falls back through the existing recursive split logic down to individual strings.

The worker count can be changed with `STATIC_I18N_CONCURRENCY` without changing code.
