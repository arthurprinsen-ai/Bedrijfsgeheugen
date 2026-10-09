# Development ledger — live CSRD navigation and anonymous compliance browser parity

- Parent: #4215
- Prod source commit: `8d8abeffcbd65a1577d67ca59e45295b6c69f5e0` after PR #4225
- Netlify production deploy: `6ac87c022afa610008579a46` (ready, exact commit 8d8abeffc...)
- Failure: Production DOM Readback run `37888919728` completed failure (12 pass, 2 fail, 1 skip)
- Failures: first, CSRD native route click generated no active `#portalView`; second, anonymous compliance legacy-algorithm test demanded a protected workspace
- Confirmed cause: `mountCanonicalDesktopNavigation()` rerenders button children after `bindPortalNavigation()` attached direct handlers.
- Corrective scope: `portal-v2/router.js`, `portal-v2/tests/router-event-delegation.test.mjs`, `tests/integration/portal-v2-production-legacy-algorithm-parity.spec.js`
- Acceptance: exact-head Portal Required+CodeQL, live production route-ID DOM readback, anonymous protected page denial, and Netlify exact-main release. Full two-tenant and authoritative CSRD applicability proof must stay open.