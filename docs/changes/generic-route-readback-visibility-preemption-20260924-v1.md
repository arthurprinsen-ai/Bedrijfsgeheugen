# Generic route readback visibility preemption — 24 september 2026

## Incident
De productie stond exact op `d55043434174a50b5d495563cc307d38f2db84c2`, maar de Production Release Readback stopte op `/prijzen` vóór de specifieke pricing-interactietest.

## Root cause
`verify-targeted-website-routes.mjs` wachtte op een Playwright-`visible` body. Die generieke routecheck hoort HTTP-status, canonical, zichtbare tekst/content, assets en page errors te beoordelen; hij hoort niet de interactie-specifieke zichtbaarheidscontracten van pricing over te nemen.

## Fix
De generieke verifier wacht nu alleen tot `body` aan de DOM is gekoppeld (`attached`). Daarna verzamelt hij route-evidence. De specifieke pricinggate blijft verantwoordelijk voor echte zichtbaarheid, normale clicks, state changes en de Engelse route.

## Borging
`tests/targeted-website-route-regression.test.mjs` bewaakt dat de generieke verifier niet terugvalt naar een `body visible` prerequisite. `tools/site-shell/verify-pricing-i18n-production.mjs` blijft de terminale interactiegate.
