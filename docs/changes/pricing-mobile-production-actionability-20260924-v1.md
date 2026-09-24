# Pricing mobile production actionability — 24 september 2026

## Incident
Exact production SHA and pricing content were already live, but the 390px production browser proof timed out on the real pointer click for `[data-bg-stage="loss"]`.

## Root cause
Automatic Playwright scrolling could position the later lifecycle control inside the sticky-site-chrome actionability region. DOM presence and interaction-runtime readiness therefore did not prove a real mobile pointer action.

## Fix
The production verifier explicitly scrolls the target into view, moves it below sticky chrome, verifies a non-zero bounding box, and then performs a normal Playwright pointer click. `force:true` and DOM-click bypasses remain forbidden.

The same candidate refreshes `Production Source Snapshot`, so protected merge automatically deploys the exact merged main through the canonical Netlify OIDC/MCP route.

## Terminal proof
Protected merge → exact Netlify production SHA → affected-route readback → real mobile lifecycle click → run/yearly/English pricing interaction proof.
