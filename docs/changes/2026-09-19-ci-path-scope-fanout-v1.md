# CI path-scope fanout prevention

Fingerprint: `github|ci-path-scope|specialist-fanout-v1`

## Incident
Specialist Revenue Learning and LinkedIn Revenue Cockpit workflows were starting on generic `supabase/migrations/**` changes. Revenue Learning also contained duplicate trigger entries. That consumed runner capacity for changes unrelated to those specialist capabilities.

## Fix
- Revenue Learning now reacts only to revenue/growth migrations plus its owned code/tests.
- LinkedIn Revenue Cockpit now reacts only to LinkedIn/revenue migrations plus its owned code/tests.
- Broad Supabase migration integrity remains covered by canonical Supabase Preview/Required gates.
- Regression: `tests/brain-ci-path-scope-fanout.test.mjs`.
- Skill authority: `powerhouse-delivery-self-optimization`.

## Terminal requirement
Exact-head Required + BRAIN + CodeQL + Skill Projection -> protected merge -> main production readback.
