# Shared Netlify runtime deployment impact

Netlify Functions import shared server code from the repository. Therefore a change outside `netlify/functions/` can still change the deployed function bundle.

The production readback now treats these shared runtime roots as deployment-relevant:
- `platform/api/`
- `platform/saas/`
- `platform/connectors/`
- `platform/read-models/`

This closes the gap where a shared-runtime change could be merged and marked production-verified while Netlify still served the previous commit.
