# BRAIN portal two-measurement copy contract — exact regression source fix

2026-11-02. Original ONE BRAIN P0 #4439, prior original Portal read-model PRs #5255 and #5282.

## Exact independent failure
The protected #5282 release was actually published to Netlify (deploy `6ae86dd8a73579a77a4c21eb`, READY and exact merge SHA `295c12ab94303af30b9b9fc30207d15ecf88db1e`). The independent subsequent original BRAIN run `41433667027`, backend job `125238718390`, failed **1 of 5400** (5397 pass, 2 skip): original test index 3050 at line 58 of `tests/brain-portal-latest-original-backend-observation-20261102.test.mjs` expected obsolete `Laatste vastgelegde BRAIN-hertest`. Existing actual source now separately labels `Laatste vastgelegde mislukte BRAIN-run` and `Geregistreerde latere BRAIN-herstelproef` after introducing true software-only zero evidence; unlike the old wording this distinguishes recorded historical failures from later test recovery. The earlier full BRAIN run `41430758451` had independently verified 5392 total / 5390 pass / **0 fail** / 2 skip, but later failed run is the current regression truth.

## Targeted source repair
Change **only the outdated test oracle**, not the original Portal renderer, API, registry, RLS, business metrics or publisher. Assert BOTH real user-visible labels and the escaped later software-only GitHub proof link; retain historical original GitHub link, admin-check and no-independent-terminal text. Retain the separate `tests/brain-portal-zero-software-proof-20261102.test.mjs` negative/positive security assertions unchanged. Update the original post-merge CodeQL/ONE BRAIN skill and append-only learning, human runbook and ledger. Never forge software, commercial, terminal or future recurrence proof.

## Independent acceptance
Same original protected PR with scope-bounded source changes, Required + both CodeQL languages, original historical/shadow/canary tests and full postmerge BRAIN (0 failed is required for current green), Native Netlify READY exact production SHA, authenticated admin Portal UI with denied non-admin and cross-tenant readback, then next natural run to detect recurrence. One historical zero run does not override a subsequent failed original BRAIN run; existing owner-only Portal must show the chronological truth. Existing P0 #4439 remains source-of-truth until independent closure.
