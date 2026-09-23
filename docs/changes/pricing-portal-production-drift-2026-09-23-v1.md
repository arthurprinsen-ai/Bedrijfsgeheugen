# Pricing production parity recovery — 2026-09-23

The pricing source on `main` already matched Portal V2 conceptually, but the public production page lagged behind that source.

## Root cause
The previous delivery chain proved repository parity but did not treat external production DOM readback as the terminal authority for this material website surface.

## Fix
This candidate deliberately touches `prijzen.html` to trigger the canonical website deploy from the exact head.

## Prevention
For future pricing changes, “merged” and “deployed” are separate states. A release is only complete after the public page shows the expected lifecycle routes, business-context separation, subscription entitlements, pricing and refresh semantics.

## Production acceptance
The public page must expose:
- common commercial routes for growth, recovery, acute continuity, buy-side, sell-side and portfolio;
- the distinction between business phase/context and subscription tier;
- Control / Scale / Enterprise limits and current pricing;
- Scale action approval plus audit trail;
- the same core intelligence across paid tiers.
