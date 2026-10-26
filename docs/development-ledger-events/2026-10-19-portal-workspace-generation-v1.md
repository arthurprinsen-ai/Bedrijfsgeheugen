# Portal canvas workspace race — production acceptance recovery 2026-10-19

Obligation-ID: `portal-workspace-delegation-race-20261019`
Fingerprint: `powerhouse|portal-v2|workspace-mount-generation|v1`
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4442

## Observable incident
On exact-current-main immutable Netlify deploy `6ad5f4a3cdc6d23b784395e5`, SHA `a3c025d1c56aa7854e2c0d689dbd54f51fe3bed6`, the manual [Portal DOM run 39242832614](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39242832614) ran 16 tests: 14 passed, one skipped, **one failed** on `Canvassen production binds edits to canonical domain state and confirms a safe demo writeback round-trip`. The visible page ID was `canvassen`, but `data-functional-workspace="canvassen"` did not appear before the 10-second guarded assertion. The release itself was correctly published and the Supabase OIDC Netlify bridge regained provider authorization.

## Root cause and repair
Existing `portal-v2/workspace-shell.js` used `root.dataset.functionalDelegating` as a shared, mutable in-flight flag despite `openPortalPage` replacing that root whenever navigation occurs. An obsolete async mount can keep the guard while the new render skips the specialist, or resume after a route switch. The repair replaces the cross-mount mutex with a per-root `WeakMap` generation. Each new mount starts independent lazy stylesheet/module resolution; only the current generation is authorized to mutate its shell or attach legacy evidence, including after imports.

## No safety downgrade
No changes to customer data, permissions, roadmap writes, Supabase roles, Supabase Edge functions, Netlify credential bridge, OAuth, or existing authentication. Do not remove the failing `canvassen` integration check, fake a saved receipt, or introduce a parallel router. The canonical domain-state writeback remains the acceptance gate.

## Evidence for closure
Native Node regression `tests/brain-portal-workspace-generation-v1.test.mjs` tests two async ordering permutations using the exact production mount function. Required CI and CodeQL on exact PR head, protected merge, Netlify production deployment matching main, and repeat real Chromium `tests/integration/portal-v2-production-canvassen.spec.js` on immutable current-main. Only after that can this incident be terminal; if still failing, inspect actual playwright error-context artifact and extend the existing implementation.
