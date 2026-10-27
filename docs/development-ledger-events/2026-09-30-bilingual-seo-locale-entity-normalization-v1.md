# 2026-09-30 — Bilingual SEO locale entity normalization

Obligation: bilingual-seo-locale-entity-recovery-2026-09-30.

Root cause: serialization-only differences such as `&amp;` versus `&` caused false locale SEO failures after the exact production build.

Action: normalize standard HTML entities before semantic metadata comparison and add regression coverage. No SEO gate was weakened.
