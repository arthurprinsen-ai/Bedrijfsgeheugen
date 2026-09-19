# CI path-scope refinement v1

Fingerprint: `github|ci-path-scope|specialist-fanout-v1`
Obligation-ID: `github-ci-path-scope-refinement-v1`

## Remaining production-delivery gap

After the broader specialist-workflow fanout fix landed on main, current-main readback still exposed four bounded gaps: the LinkedIn Revenue Cockpit did not explicitly watch the `powerhouse-runtime` directory that its contract reads, both specialist workflows split concurrency by event type, Revenue Learning pull/push migration filters had drifted apart, and Revenue Learning had no explicit runtime bound.

## Refinement

- add `supabase/functions/powerhouse-runtime/**` to LinkedIn Revenue Cockpit path admission;
- use PR/ref single-flight concurrency keys without event-type splitting;
- align Revenue Learning push migration filters with the pull-request revenue/growth scope;
- enforce `timeout-minutes: 10` for Revenue Learning;
- extend the existing regression, Brain learning and delivery skill rather than creating a second authority.

## Prevention

Specialist CI admission must follow direct runtime dependencies and stable semantic schema ownership. Pull and push filters must remain aligned where they represent the same capability, and auxiliary jobs must have bounded runtime.

## Terminal requirement

Exact-head Required, BRAIN, CodeQL and Skill Projection must be green, followed by protected merge and current-main readback.
