# Development ledger: Portal V2 prioritized decisions and truthful simulations

- Date: 2026-10-08
- Obligation: portal-v2-three-priorities-truth-20261008-v1
- Candidate: PR #4138
- Existing-state evidence: `/portaal` redirects to Portal V2; native cockpit and simulator are available; canonical Supabase portfolio and NBA projections contain nonzero rows.
- Defect: simulator `Number(null)` and `Number('')` coerced missing metrics to zero; customer-cockpit formatting also presented unknown values as €0/0%.
- Implementation: guard unknown numeric values, restrict primary decision surface to top three, keep the rest expandable, and test with explicit unknown/baseline-zero examples.
- CI incident: original PR failed admission because mandatory metadata and delivery-closure artifacts were absent. Corrective delivery evidence is included here; protected checks must rerun on the revised HEAD.
- Production claim: NOT_PROVEN; no provider send, commercial outcome or production deployment is claimed.
