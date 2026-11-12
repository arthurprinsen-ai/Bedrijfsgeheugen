---
name: powerhouse-browser-gate-boundedness
description: Use when a Powerhouse browser, UI, preview or production-readback gate is slow, hung, leaking runners, or blocking protected delivery.
---

# Browser Gate Boundedness

Fingerprint: `delivery|browser-gate|bounded-async-waits|v1`.

Every browser verification must be bounded at three layers:

1. Network/navigation calls have explicit timeouts and a small retry budget.
2. Page-side asynchronous waits such as `document.fonts.ready`, observers, animations or app readiness have their own deterministic timeout/fallback.
3. The complete route/view sweep has a total fail-closed runtime budget below the enclosing job-level timeout.

A job-level timeout is only the final circuit breaker. It must never be the normal mechanism that terminates an unresolved browser promise.

Do not remove semantic assertions to make the gate fast. Preserve visibility, occlusion, content, CLS and interaction assertions; make only waiting/retry behavior bounded.

When a browser gate is in progress materially longer than its normal critical path, inspect the exact current step before retrying or mutating product code. A hanging verifier is delivery-infrastructure failure until a product assertion proves otherwise.

Canonical regression: `tests/brain-standalone-visibility-boundedness-v1.test.mjs`.


## System Map registration

Any new material skill introduced by browser-gate recovery must be registered in `platform/system-map/canonical-system-map.mjs` in the same delivery lineage. A skill is not terminally integrated while repository topology and canonical inventory disagree.


## Process-level circuit breaker

Internal Playwright/navigation budgets are not sufficient to terminate a wedged browser or protocol operation. Every production browser verifier command must also run behind an OS-level process timeout that expires materially before the enclosing job timeout. The process timeout is fail-closed and must never remove semantic browser assertions.


## Regression-oracle parity

Fingerprint: `browser-concurrency-test-contract-drift-v1`.

When the visibility implementation changes from sequential route iteration to bounded worker concurrency, every older release-risk regression that asserts the implementation shape must be updated in the same lineage. A product-safe concurrency improvement is not complete while a stale test still requires `for (const route of routes)`.

Prevention: the canonical brain regression validates both the runtime boundedness contract and the release-risk oracle, so implementation and test cannot drift independently.


## Bounded Playwright teardown

Fingerprint: `browser|playwright-cleanup|bounded-teardown|v1`.

A completed semantic sweep must not become a false-negative because Playwright hangs in `page.close()`, `context.close()` or `browser.close()`. Teardown is therefore bounded separately from navigation and assertion budgets. If teardown exceeds its cleanup budget after assertions have completed, record the cleanup anomaly, terminate residual browser handles at process level, and preserve the already-proven semantic result. If semantic failures exist, exit non-zero even when cleanup also times out.

Regression: `tests/brain-standalone-visibility-boundedness-v1.test.mjs` must assert bounded cleanup and fail/non-fail exit preservation.


## Independent viewport parallelism

When the same route inventory is verified across phone, tablet and desktop, do not spend the global budget sequentially by viewport. Run independent viewport sweeps in bounded parallel batches, while keeping route-level concurrency and the global fail-closed budget.

The concurrency product (viewport workers × route workers) must remain explicit and bounded. Do not remove semantic assertions or enlarge timeouts merely to make the gate green.

## Provider security challenge and proof (original Portal V2)
Fingerprint: `powerhouse|portal-v2|first-browser-readback-403-then-pass|20261030-v1`.
A real 2026-11-02 production DOM sweep returned HTTP 403 on `waarde-financiering` and showed Netlify's “We are verifying your connection” challenge (original job 125303998860; run 41453415237). The same protected workflow's next attempt, job 125306153752, passed 15 checks with 1 intentional skip, pinned to live SHA `75c4500a4e90afa1f001f748d7081a75e09aa803`. Original WAF/Identity/SSO protections were not altered; the provider's specific risk heuristic remains unknown.
- Identify this as `NETLIFY_SECURITY_CHALLENGE_READBACK_BLOCKED` **only** when HTTP 403 and real Netlify challenge body coincide. For any other 4xx/5xx, keep normal fail-closed HTTP error.
- Preserve failed attempt, challenge identifier, original provider URL, actual deployed commit, owner, and subsequent exact-SHA authorized readback. A later pass is new evidence, not a rewrite of the earlier failed attempt.
- Use only the existing protected, bounded browser workflow for a retest; no firewall bypass, fake cookies, JS challenge solver, security exception, skipped assertion or parallel scheduler. If the original authorized retest is blocked again, preserve OPEN/BLOCKED_EXTERNAL and investigate Netlify security with the existing Security Agent.
- Do not claim this provider behavior will never recur. Independently prove each future production release, authenticated two-tenant journeys and real user experience.
- Canonical regression `tests/brain-portal-netlify-security-challenge-20261102.test.mjs`, deterministic classifier `tests/integration/portal-v2-readback-security-challenge.mjs`; original Brain incident fingerprint above.

## 2026-11-05 — originele 271-route browserherstel bewezen, volgende release opnieuw bewijzen

Originele Website Cross-Browser Screenshot Assurance, geen tweede runner. Na de beschermde merge van PR #5474 (`c6a2718e0de7eea4fdb87fe2a54026db21dfc218`) heeft de **oorspronkelijke** productie-run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42081117654 zelfstandig SUCCESS gerapporteerd. Onafhankelijke log: contract 20/20, alle 271 Chromium-mobiele én 271-desktoproutes, Firefox/WebKit met echte screenshots, `routeCount=271`, `resultCount=640`, `interactionCount=24`, `failures=0`, `failed=[]`; artifact `13440742777` (148990878 bytes). Deze aantallen zijn het bewijs **voor die run**, geen vast voorgeschreven toekomstige sitemapgrootte. De productie-deploy voor exact de geteste code was `6aecc573342de9b9ea08a889`.

Preventie van de echte fout in run #42075945749: `document:/blog/wat-is-een-bedrijfsgeheugen:net::ERR_CONNECTION_RESET` kwam vóór de 301 van no-slash naar slash; de uiteindelijke canonieke pagina was 200. Alleen in het bestaande `filterSettledCoreFailures` mag een **bekende tijdelijk mislukte documentaanvraag** als hersteld gelden wanneer het definitieve HTTP-document 2xx is en de route uitsluitend qua optionele afsluitende slash afwijkt. Test `tools/site-shell/core-request-recovery.mjs` via `tests/brain-website-cross-browser-screenshot-assurance-v1.test.mjs`. Een andere route, 3xx zonder definitieve pagina, 4xx/5xx, mislukte script/CSS-aanvraag, echte blijvende netwerkfout, CLS/overflow, gebroken afbeelding, verdwenen H1 en ontbrekende interacties blijven FAIL. Geen blanket ignore voor `ERR_CONNECTION_RESET`.

De originele browserowner moet bij **iedere nieuwe site-release** de huidige gepubliceerde Netlify-SHA en oorspronkelijke workflow-run vergelijken, een nieuw screenshotartifact/failed[] aflezen en ONE BRAIN bijwerken. Een CI-kandidaat-pass of oud artifact is geen nieuwe productie-pass. Zelfs volledig groen browserbewijs bewijst géén nood-back-updeploy-schrijfactie: die blijft gescheiden `BACKUP_PROVIDER_EFFECT_DEPLOY_EVIDENCE_DUE` in #4447. Regressie `tests/brain-netlify-git-deploy-first-v1.test.mjs`.


## 12 november 2026 — Engelse contactpagina mag NL-only behoeftecheck niet vervalsen

De post-merge originele `Canonical brand shell live readback` run #43299724834 op beschermd main `6f0497afb07051cf06f62f38efdea59cf7507bf2` ontdekte tijdens de volledige 279-route Playwright-sweep exact één echte ongeldige href: `/en/contact` verwees naar niet-gepubliceerd `/en/behoeftecheck` (`INTERNAL_TARGET_NOT_IN_FINAL_SITEMAP`). De werkende originele gratis behoeftecheck staat uitsluitend op `https://www.bedrijfsgeheugen.nl/behoeftecheck` (bewust noindex, bronregister `PUBLIC_UTILITY_ROUTES`). De oorspronkelijke Engelse static-i18n-builder en browser locale-sync mogen deze exacte bronroute niet blind naar `/en/` prefixen; behoud de volledige canonieke HTTPS-URL inclusief eventuele query/fragmenten, ook bij taalwissel. Geen algemene `noindex`-vrijstelling, nooit ontbrekende gewone EN-productpagina's naar NL maskeren, nooit de sitewide validator uitschakelen. Regressie `tests/brain-english-need-discovery-href-20261112.test.mjs` toetst beide bestaande locale-writers én oorspronkelijke href-gate. Nieuwe protected Required/browser/CodeQL, main merge, Netlify CURRENT READY exact SHA en de hele productie 279-route sweep moeten zonder deze bevinding slagen; historisch falen blijft in ONE BRAIN en #4447/#4198 vastgelegd. Geen tweede vertaler/scheduler/agent.
