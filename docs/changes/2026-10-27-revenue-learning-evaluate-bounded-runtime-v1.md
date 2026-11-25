# Revenue learning: bounded hourly evaluation

The hourly `revenue-learning-evaluate` function was cut off by its caller after about 15 seconds. The action-evidence reconcile now runs next to the due-evidence read with a 6 second budget (reported as `deferred` when exceeded; an error still fails the run), due targets are processed by a worker pool of 4, and the edge gateway reconciles executed actions in parallel groups of 5 with the same RPC.

## Validation

`node --test tests/revenue-learning-evaluate.test.mjs tests/brain-revenue-learning-fair-verified-20261025.test.mjs tests/brain-revenue-learning-no-starvation-20261025.test.mjs tests/brain-revenue-learning-evaluate-bounded-runtime-20261027.test.mjs`

## Boundaries

The edge function is not deployed by the Supabase integration while migration drift is open, so it must be deployed with the exact merged source and verified by the Supabase Edge Production Authority parity run. Runtime effect is unproven until Netlify logs show no HTTP 499 on `revenue-learning-evaluate`.
