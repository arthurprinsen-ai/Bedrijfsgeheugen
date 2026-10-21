# BRAIN baseline contract reconciliation — canonical SQL references

Obligation: `baseline-contract-current-sql-v1`; parent issue [#3742](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/3742), portal release blocked in [#4573](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4573).

Immutable baseline: `8f322681ba46045e5d65746c2b2f0fd5b40ffac1`. BRAIN run [39554866582](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39554866582) failed 355 tests, reproduced unchanged on base. This patch addresses **two** proven stale test-file SQL references only; it does not imply full release readiness.

1. `tests/brain-autonomous-improvement-currentstate-record-type.test.mjs`: expected missing `20260916182000_autonomous_improvement_currentstate_record_type_fix_v1.sql`; update pointer to existing `20260916161635_autonomous_improvement_currentstate_record_type_fix_v1.sql`.
2. `tests/supabase-tenant-identity-review-semantics-v2.test.mjs`: expected missing `20260918105000_tenant_identity_review_semantics_v2.sql`; update pointer to existing `20260918085708_tenant_identity_review_semantics_v2.sql`.

The canonical SQL was read from the same protected main commit. All eight existing assertions were independently matched against these source contents, including `CurrentState` correction, refusal of unsafe rewrite, classifying demo/smoke/anonymous identity, and denied browser SELECT with service-role-only grant. **Every assertion remains byte-identical.** No SQL added, removed or altered; no RLS, workflow gates, scheduler, account or production mutation.

## Verification and closure

This is a source-backed **draft candidate**. CI and current-head execution are not asserted green; other inherited errors include missing historical paths and semantic mismatches. Do not delete tests, fabricate migrations, skip BRAIN, or merge on a partial pass. Exact-head full BRAIN, Required, CodeQL, protected merge, Netlify/Supabase readback and genuine authenticated customer A/B acceptance remain mandatory, owned by their original obligations.
