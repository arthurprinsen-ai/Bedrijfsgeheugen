# 2026-09-25 — AI ecosystem static i18n cache recovery

- Observed fail-closed validation: 126 missing translations.
- First missing string: AI-ecosysteem voor het mkb | Data, systemen, processen en AI-agents | Bedrijfsgeheugen.
- Canonical authority: config/bg-static-i18n-en.json + config/bg-static-i18n-en.d/*.json.
- Retired authority: .cache/bg-static-i18n-en.d.
- Production policy remains offline and fail-closed.
- Regression: tests/brain-ai-ecosystem-static-i18n-cache-v1.test.mjs.
- Terminal state requires protected merge, exact Netlify production SHA and NL→EN→NL browser proof.
