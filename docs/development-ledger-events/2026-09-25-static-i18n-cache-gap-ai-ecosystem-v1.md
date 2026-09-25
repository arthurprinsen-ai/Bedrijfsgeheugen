# 2026-09-25 — static i18n cache gap after AI-ecosystem copy

Observed:
- production `/en/prijzen` returned 200 but `data-bg-static-translated=false`;
- production `/api/i18n-translate` returned 502 `translation_failed`;
- current-main deterministic cache validator found 119 missing strings;
- all missing strings belonged to newly introduced AI-ecosystem public copy.

Action:
- translated exactly the 119 missing strings;
- added them under canonical `config/bg-static-i18n-en.d/`;
- preserved the existing fail-closed builder and config-cache authority;
- did not reintroduce `.cache` or build-time provider dependency.

Verification:
- 95 public routes / 7,508 strings complete;
- static English enabled;
- runtime fallback disabled for generated public locale routes;
- pricing and AI-ecosystem English HTML verified visibly in the generated output.
