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

## Production promotion

Current protected main source for this recovery: `c0e255d2d003c56d3eeda5f0980dd1ceb7691556`.

The fix is only terminal when the existing canonical `Production Source Snapshot` promotes the resulting protected-main SHA and readback proves:
- Netlify `state=ready`;
- `context=production`;
- `commit_ref` equals protected `main`;
- the pricing lifecycle, plan-group, billing and NL→EN browser proof succeeds in production.

Status before promotion: `PROMOTION_PENDING`.

## Regression scope correction

A follow-up learning gate exposed an over-broad assertion: it rejected every `body visible` wait in the verifier. The actual production invariant is narrower:
- before pricing interactions, readiness authority is `html[data-bg-pricing-interactions="ready-v3"]`;
- after navigating to the static English document, a document/body visibility check is legitimate and independent.

The regression now scopes the negative body-visibility assertion to the pre-interaction verifier section only.

