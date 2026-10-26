# POWERHOUSE optimization closure: evidence first

This protected change reuses the existing `powerhouse_optimization_candidate_v1`, human feedback, `brain_delivery_evidence`, `powerhouse_realized_values`, `brain_records` and the daily `powerhouse_self_improvement_control_v1` read model. It creates **only a read-only, service-role-only proof projection**: `powerhouse_optimization_closure_truth_v1`. No new executor, approval authority, scheduler, source-of-truth table or synthetic outcome is introduced.

A candidate remains REVIEW_REQUIRED until independently evidenced approval; EXECUTION_PENDING until protected production readback is linked; INDEPENDENT_MEASUREMENT_REQUIRED until an observed, non-synthetic, candidate-linked result with independent readback exists; LEARNING_WRITEBACK_REQUIRED until the canonical verified learning record exists. A fully observed cycle is labelled OBSERVED_CYCLE_VERIFIED_NOT_CAUSAL_UPLIFT; causal uplift requires independent controlled comparison.

Existing rows and append-only records are not modified. The existing daily self-improvement view retains its columns but `candidate_measured` no longer trusts populated outcome JSON alone. Existing health/CI gates remain in force. No candidate is automatically approved, published, or counted as revenue by this patch.

## Validation

`node --test tests/brain-optimization-closure-truth-v1.test.mjs`. After protected merge, verify the exact migration is applied in Supabase, the service role can SELECT the new projection, public/anon/authenticated cannot SELECT it, and the three existing candidates remain unproven until external proof arrives. Reconcile the daily read model and deploy proof before terminal closure.
