# 2026-11-18 — original i18n request storm guard

- P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215; related #4198
- Original one-owner runtime: `assets/js/i18n.js`, static `/en` build and existing Netlify i18n endpoint
- Live witnessed production: Netlify deploy `6afd583c726cf176ada08779` main `2408a130dd04c8d01398d54e11ff97558d25c477`; original endpoint postrelease counts 515 HTTP502, 412 HTTP499; classified provider `UPSTREAM_HTTP_REJECTION/429`
- Source root: two retries per batch + recursive five-item split + per-unresolved-single retry on every non-200, plus all public EN MutationObserver retranslation
- Corrective candidate: first non-200 provider outage stops same request tree, bounded five-minute tab cooldown, normal 200 cache and visible failure; no provider change, RLS, credentials, new executor/cron or additional sender
- Proof tests: `tests/brain-i18n-provider-storm-bounds-20261118.test.mjs` plus existing three locale/asset-version tests
- Explicitly outstanding: protected exact-head Required and CodeQL, merge, Netlify READY SHA, genuine postrelease request/readback and Heartbeat effect. Original API quota resolution **not proven**; GitHub blog original `OPENAI_I18N_HTTP_429` is separately logged.
- State: CODE_CANDIDATE / OPEN; not yet live
