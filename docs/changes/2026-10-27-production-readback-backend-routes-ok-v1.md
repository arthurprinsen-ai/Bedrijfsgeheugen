# Production readback: false red on backend-only merges

For merges that change only Netlify functions the browser route step is skipped. The backend production-truth step passed `steps.routes.outcome == 'success'`, which is false for a skipped step, so the readback reported `production_route_regression` although the exact deploy was ready. The step now uses `browser_required != 'true' || steps.routes.outcome == 'success'`, the same rule as the non-deployment step.

## Validation

`node --test tests/brain-production-readback-backend-routes-ok-20261027.test.mjs`

## Boundaries

Deploy identity, connector readiness and portal proof checks are unchanged. Effect is proven by a green Production Release Readback after the next backend-only merge to main.
