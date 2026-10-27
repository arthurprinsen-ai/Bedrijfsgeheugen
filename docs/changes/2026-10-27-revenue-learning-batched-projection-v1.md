# Revenue learning: batched evidence projection

The hourly `revenue-learning-project` function previously sent one gateway call per candidate to the `revenue-learning-store` edge function and was cut off after about 15 seconds. It now sends evidence in batches of at most 100, stops after a 12 second budget, and falls back to per-item writes when a batch fails, recording a `PROJECTION_FAILED` obligation for any item that cannot be stored.

## Validation

`node --test tests/revenue-learning-project.test.mjs`

## Boundaries

Does not change `revenue-learning-evaluate`. If the edge function is not yet deployed when the Netlify function runs, the batch call is rejected and the previous per-item behaviour applies. Runtime effect is unproven until the merge, the edge function deployment and Netlify logs without HTTP 499 on `revenue-learning-project`.
