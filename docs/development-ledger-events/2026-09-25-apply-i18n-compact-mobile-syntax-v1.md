# 2026-09-25 — apply-i18n compact mobile syntax recovery

Observed:
- current main: `6200b6cf13aa09d058c92f02f061368e21013e03`;
- linked and exact-source Netlify transports both reached the build stage;
- build failed in `tools/site-shell/apply-i18n.mjs` with `SyntaxError: Invalid or unexpected token`;
- diagnostic run `36158943900` reproduced the same failure outside Netlify.

Root cause:
- accidental duplicate function source was embedded inside the compact-mobile CTA replacement string.

Action:
- restore the intended `MOBILE_LANGUAGE + '$&'` replacement;
- add syntax and source-shape regression coverage;
- retain exact-main production proof and NL/EN browser readback as terminal gates.
