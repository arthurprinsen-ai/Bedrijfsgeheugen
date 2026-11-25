# Portal V2 — navigation binder recovery (19 oktober 2026)

Obligation-ID: `portal-intelligence-singleloop-20261019`  
Idempotency-key: `portal|nav-binder-query-all|20261019`  
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4442

## Observed before change
The portal defines `$` as `querySelector` and `$$` as `querySelectorAll`. The render-level `bindInteractions()` previously invoked `$('[data-route]').forEach(...)`, which throws TypeError because the first helper returns an Element/null. All handlers after this statement could be left unbound.

## Root cause and bounded repair
Repair exactly the repeated route selection with `$$`; no auth, routing, storage, forecast authorization, SEO baseline or Netlify rewrite change. Regression in `tests/brain-portal-navigation-binder-v1.test.mjs` evaluates the real function with three route controls and verifies all are connected and clickable.

## Independent readback
Branch file readback confirms `$$('[data-route]').forEach` at blob `116f7ddde627ba1794f37c8cf10f332b160ab968`. This is **not** production proof. The originally checked production Netlify deploy is `6ad12ccf4aaa7eab0652fd31` at older commit `59b4aaa1cfb01c1cd8d3c0085372cb5837db03db`, whereas observed main had advanced to `6fe132b8cdbbd9c25a6f37819738066d59d0a16d`.

## Terminal acceptance
Required CI + CodeQL; protected merge; Netlify exact SHA deployment, Portal V2 browser click verification on mobile/desktop and authenticated production readback. If any are missing, status remains candidate. Don't create a parallel portal or weaken forecast evidence gates. 
