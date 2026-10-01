# Final visual pixel polish

The last website coherence pass now includes an explicit responsive geometry contract.

Pricing cards keep equal CTA bottoms and fixed CTA height, the public header uses consistent desktop/tablet/mobile heights, empty shells cannot create duplicate whitespace, and Portal V2 visual models are constrained to their cards at the 1180px, 900px and 640px breakpoints.

Regression coverage lives in `tests/brain-website-coherence-v1.test.mjs`.

## Post-merge verification follow-up

Production browser readback exposed two remaining closure issues. On screens at or below 430px, a later portal-polish rule restacked the action row after hydration and pushed the topbar to 287.34px; the rule now preserves the compact two-column action layout. The Portal V2 live-preview workflow also still checked superseded copy and now validates the canonical “Zo werkt Powerhouse in je bedrijf” wording.

The product-truth source regression was narrowed to the actual rendered product-truth block so legacy cleanup patterns can remain without producing false failures.

## Replay assertion closure v2

The historical replay now matches the actual finalizer implementation: it extracts the `productTruth` template literal correctly and verifies insertion via `mainStart` and `firstSection` rather than obsolete hero-specific variables.

## Mobile production compactness closure

The exact 390×844 production readback still measured the hydrated Portal V2 topbar at 287.34px. The <=430px shell now hides the non-essential welcome subtitle, uses a 24px title, reduces utility controls to 40px and tightens header gaps/padding while preserving search, actions and the period selector.
