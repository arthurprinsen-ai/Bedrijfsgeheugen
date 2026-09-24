# Pricing toggles and language runtime — 2026-09-24 v1

## Root cause

Two production checks were too shallow. The pricing proof verified that toggle markers existed in HTML, but did not prove that clicking changed visible state. A later remediation then created a contradictory i18n contract: one regression/document path required unprefixed public pages to translate in place, while the canonical prevention rule required public language selection to use prebuilt static localized routes.

That split authority allowed the English switch to regress.

## Fix

- Pricing route, plan and billing controls keep explicit semantic state and visible state through the delegated rescue runtime.
- Public website language selection now navigates to prebuilt `/nl/*` and `/en/*` localized routes.
- Portal language switching keeps runtime/in-place translation as fallback where public-route navigation is not the contract.
- The contradictory legacy in-place regression has been rewritten to enforce this split explicitly.
- Production proof remains browser-level and verifies visible English behavior, not just markers.

## Prevention

Public website i18n has one canonical rule: **static localized routes primary, runtime translation fallback**. Tests, docs, learning and runtime code must agree on that rule. Any contradictory in-place/static-route assertion fails CI.

## Terminal delivery

`LIVE_BEWEZEN` still requires protected merge, exact Netlify production SHA/context/deploy-id and production browser interaction proof.
