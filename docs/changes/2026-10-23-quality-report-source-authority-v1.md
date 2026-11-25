# Quality report — independently verified vs self-declared evidence
Date: 2026-10-23
Existing owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547
Related published report: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4761

## Production source finding
The live quality report treated a runtime object claiming `maturity: PROVEN` and `productionVerified: true` alongside a well-formed GitHub URL as proven knowledge. Likewise, caller supplied `tenantVerified: true`, `productionVerified: true`, `learningVerified: true`, `verificationStatus: VERIFIED` and two unrelated allowed-domain URLs became "BEWIJS GEKOPPELD". Allowed URL syntax only enforces safe navigation; it does not attest that an actual provider or tenant validated the asserted event. A GitHub pull request can exist without proving any revenue outcome.

## Contained correction
In the original authenticated Powerhouse Agent Intelligence read-only component, split **aangeleverde bronclaims** (deduplicated, counted and explained) from **onafhankelijk gevalideerde resultaten** (still unknown until a real provider-backed reconciliation pipeline exists). No automatic promotion from arbitrary flags, even when `providerReadbackVerified` or `authority` is self-declared. Keep links for human investigation, do not hide evidence, do not invent new provider signatures or consent.

This fix is a truthfulness boundary on *UI proof language*, not an assertion that server-origin records or customer outcomes are false. It does not revoke an existing customer's legitimate rights, mutate the database or replace the canonical Brain memory.

## Mandatory security & release acceptance
Existing `tests/brain-agent-intelligence-analytics.test.mjs` plus new adversarial forged-provider flags and provenance-label tests; canonical learning and development ledger; regenerated portal inventory; protected exact-head Required and CodeQL; squash merge; exact Netlify commit and independent authenticated production and DOM readback. No new scheduler, external connector, database table or measurement cost.

## Upgrade criterion
Promote a source claim only when the existing backend can independently reconcile a tenant-scoped outcome identifier with a provider-owned receipt and immutable production deployment lineage, with an auditable verification time, causal outcome measure, authorized provenance and regression tests. A UI boolean or URL string is never sufficient.
