# SEO production reconcile authority learning v2

- Date: 2026-09-25
- Type: RECOVERY / LEARNING / CONTRACT_CHANGE
- Fingerprint: `seo|production-reconcile|exact-head-sibling-proof|v1`
- Obligation: `seo-money-pages-commercial-intent-20260925-v1`
- Incident: SEO money-page code stond al op main terwijl productie achterliep.
- Historical blocker: de destijds actieve Required gate selecteerde exact-head BRAIN sibling evidence en accepteerde alleen `event=pull_request`.
- Recovery toen: bestaande PR-triggered BRAIN-run herstellen, Required opnieuw draaien, protected merge, exact-main Netlify reconcile.
- Control-plane evolution: de huidige Required-workflow is inmiddels de canonieke single-flight PR aggregate gate en pollt sibling workflows niet meer; Unified Brain Delivery is expliciete workflow_dispatch authority.
- Corrected prevention: inspecteer actuele producer/consumer workflows vóór herstel en herintroduceer nooit obsolete PR-triggered fan-out.
- Queue rule: geen duplicate BRAIN/Required/CodeQL runs om historische topology na te bootsen.
- Provider rule: `main_sha == Netlify commit_ref` blijft terminale production-drift identity proof; browserproof blijft scope-specifiek.
- Skills: seo-revenue-growth, powerhouse-continuity, powerhouse-delivery-concurrency, powerhouse-netlify-production-truth.
- Regression: `tests/brain-seo-production-reconcile-learning-v1.test.mjs`.
