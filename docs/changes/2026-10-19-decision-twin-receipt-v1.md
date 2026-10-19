# Portal V2 Decision Twin — eerste werkende bewijslaag

Obligation-ID: `decision-twin-tenant-receipt-ui-20261019`
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4442

## Existing-state-first
Reuse `portal-v2/foresight-scenario-studio.js` and its existing authenticated tenant context, goal history and scenario explorer. Do not rebuild a dashboard or introduce another database/scheduler. The existing scenario remains a mathematical sensitivity exercise, not a validated or causal financial forecast.

## Implementation
- `portal-v2/decision-twin-receipt.js` assembles a read-only, fail-closed evidence receipt over the active goal.
- A receipt advances only with (a) >=3 historical observations with source refs + what-if, (b) exact matching tenant+goal action with independent source refs, (c) authorized provider confirmation bound to that action with verified timestamp, and (d) an outcome bound to the same tenant/action with verified timestamp and independent source refs.
- The foresight panel renders the evidence status and adds an existing-route action link to `next-best-actions`. All target buttons are correctly bound with querySelectorAll.
- The interface never sends an unapproved provider request or fabricates achieved business value. If no records meet the trust contract, it explicitly shows no decision/outcome proof.

## Acceptance
Run `node --test tests/brain-decision-twin-receipt-v1.test.mjs` and existing portal foresight regressions. Protected Required CI and CodeQL must pass, followed by merge, Netlify exact-deploy parity and authenticated portal route readback.

## Gaps not claimed solved
This UI is the honest foundation for the Decision Twin, **not** the full multi-tenant calibrated causal engine. Existing `portal_financial_forecasts_v1` had zero observed rows at last exact SQL check. Full action dispatch, experiment design, financial backtesting and verified outcome learning require real tenant data/authorization and further protected implementation. CMS draft content also still needs editorial review before publication.
