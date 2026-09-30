# 2026-09-30 — AI Modelwijzer i18n production recovery

Obligation: ai-modelwijzer-i18n-live-2026-09-30.
Root cause: 4 public Modelwijzer strings missing from static English cache.
Fix: add deterministic translations; retain STATIC_I18N_REQUIRE_CACHE=1.
Terminal condition: protected merge -> exact-main Netlify production -> /ai-modelwijzer readback.
