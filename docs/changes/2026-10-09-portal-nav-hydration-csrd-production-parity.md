# Permanent Portal V2 navigation binding and production auth-aware parity

## Root cause
Live production run 37888919728 after PR #4225 contained two independent failures:
1. CSRD native navigation was clickable but failed to set `#portalView[data-page-id=csrd-impact]`. `app.js` reconstructs canonical sidebar buttons upon portal-state subscription and invalidates the direct per-button event handlers attached by `router.js` during initial boot.
2. Anonymous browser test of legacy compliance algorithms still required opening `compliance-governance`, although protected trust authorization intentionally denies anonymous access.

## Fix
- Bind one event-delegated click handler on the stable sidebar navigation container; reconstructed buttons continue to navigate through the existing canonical router. The new unit test creates the button *after* router binding and verifies exact CSRD route and handler activation.
- Keep production executable-parity smoke tests on accessible workspaces only. Add an explicit fail-closed anonymous assertion for `compliance-governance`. Never fake an authenticated principal and never remove the compliance trust gate.
- No new scheduler, Brain, browser state authority, or tenant data copying.

## Proof boundaries
Protected tests plus exact-main Netlify deploy and production DOM readback remain necessary. Separate authenticated customer session verification and official CSRD/ESRS source applicability are open under P0 #4215.