# Pricing production runtime-readiness recovery — 24 september 2026

## Incident
The exact production release and affected-route checks were green, but the pricing browser proof timed out waiting for generic `body` visibility.

A direct production GET of the same cache-busted pricing URL returned HTTP 200 with complete pricing HTML.

## Root cause
The verifier checked a weak generic readiness signal before its stronger domain-specific readiness contract. The pricing page exposes `html[data-bg-pricing-interactions="ready-v3"]`, which is the correct authority for interaction readiness.

## Fix
The verifier now:
- waits first for pricing runtime `ready-v3`;
- waits for the concrete `Verlies & herstel` control to be visible;
- positions it deterministically;
- performs a real Playwright pointer click.

Generic `body.isVisible()` is no longer a prerequisite.

## Prevention
Domain-specific readiness beats generic page readiness when the product already exposes an explicit runtime-ready contract.
