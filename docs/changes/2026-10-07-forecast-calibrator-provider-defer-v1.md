# Forecast calibrator — fail-soft upstream AI dependency

Date: 7 October 2026  
Obligation: `forecast-calibrator-provider-defer-20261007-v1`

Production live proof on provider version 51 reached the corrected forecast-calibrator runtime but the upstream Anthropic API returned HTTP 400 because provider credit was unavailable. The runtime therefore no longer failed on its own DirectQuery error path, but it still promoted a non-critical external dependency failure into an application HTTP 500.

The correction keeps calibration truth boundaries intact:

- an unavailable AI provider never creates a materialized, missed or uncertain calibration outcome;
- the affected learning obligation stays open and is durably deferred for one hour with `AI_PROVIDER_UNAVAILABLE`;
- after the first provider failure in a run, the remaining due obligations are deferred without issuing more provider calls;
- the function returns HTTP 200 with `degraded=true` only after defer evidence is persisted;
- a failure to persist the defer state remains fail-closed.

Authentication, database schema, scheduler ownership and forecast scoring semantics are unchanged.

Terminal proof requires exact-HEAD CI, protected merge, provider source parity, one production invocation with real due calibrations, durable defer evidence, and a fresh application 401/500/503/522 window.
