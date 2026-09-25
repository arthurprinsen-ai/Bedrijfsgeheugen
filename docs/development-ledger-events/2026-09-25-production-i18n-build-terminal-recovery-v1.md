# 2026-09-25 — production i18n build terminal recovery

- Current base: `2ec0209c9a2d247ea39c8abba6785ebd7ab77672`.
- NL/EN canonical routing was already merged via #2918.
- Versioned cache + latest 7 SEO translations are already on main via #2944/#2955.
- Remaining reproduced build defect: stale pricing oracle expected `Belangrijkste doel nu`.
- Remaining delivery defect: linked Netlify `state=error` exited 78 before authorized exact-source fallback.
- Recovery: align pricing oracle to `Wat wil je bereiken?` + `Ondernemersdoelen`; route linked-build errors to exact-source fallback.
- Regression: `tests/brain-pricing-build-integrity-context-parity-v1.test.mjs` and `tests/brain-netlify-linked-build-error-fallback-v2.test.mjs`.
- Terminal proof: protected merge → Production Source Snapshot → Netlify ready exact main SHA → pricing content proof → NL→EN→NL browser readback.
