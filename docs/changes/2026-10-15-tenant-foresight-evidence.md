# Powerhouse Foresight — tenantgebonden signalen in de scenariocontext

Obligation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4420
Fingerprint: powerhouse|portal-v2|tenant-source-intelligence-overlay|v1

## Source of truth
The existing `GET /api/portal-ondernemersdata` invokes Netlify Identity, resolves the customer tenant and calls the EU portal-state gateway. The gateway returns canonical external signals plus independently tenant-filtered `companyImpacts` and `actionCandidates`. The current scenario engine keeps historical customer goals as numerical prediction inputs.

## Delta
- Add a read-only Powerhouse source context overlay directly below each mounted scenario studio in existing Portal V2.
- Only show independently tenant-matched and recently SCORED company impacts linked to known external signals.
- Show explicitly unscored canonical source signals as external context, not as company-specific proven exposure.
- Show tenant-bound candidate actions separately, never 'executed' or realised.
- Show source catalog state as catalog/observed counts without claiming every provider is connected to the individual customer.
- Strictly separate data provenance and trend extrapolations; no resulting numeric forecast is modified by signal scores or action scores.
- Fail closed on missing JWT/tenant match, timeout or unavailable gateway. Show readable no-data state instead of invented source items.
- Stop stale concurrent UI mounts from leaking data when identity or page changes.

## Remaining
Independent numerical cross-domain forecasting still requires calibrated, source-bound driver models, backtesting and tenant-specific heartbeat proof. This overlay does not verify platform Heartbeat SLA, contractual AI model activation, financial cash results, or causal business effects.

## Acceptance
Native regression: `portal-v2/tests/foresight-tenant-evidence.test.mjs`. Canonical replay/shadow/canary: `tests/brain-foresight-tenant-evidence.test.mjs`. Protected CI, CodeQL, exact Netlify production readback and customer-authenticated Portal V2 acceptance remain mandatory.
