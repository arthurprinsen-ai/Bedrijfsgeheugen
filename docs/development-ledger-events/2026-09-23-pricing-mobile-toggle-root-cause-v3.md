# Pricing mobile/toggle root-cause recovery — 2026-09-23

## Change
PR #2666 fixes the mobile pricing-page rendering and consolidates pricing interaction ownership.

## Evidence
- global mobile selector affecting every table was removed;
- route and entitlement matrices now retain table semantics and scroll horizontally on narrow screens;
- duplicate `bg-pricing-interaction-guard-v2` was removed;
- `bg-pricing-neno-v1-js` remains the single canonical controller;
- regression test updated to lock these invariants.

## Acceptance
The candidate may only be promoted when required CI is green, merged to `main`, and public `/prijzen` readback confirms the promoted pricing source while lifecycle/package/billing behavior remains structurally correct.
