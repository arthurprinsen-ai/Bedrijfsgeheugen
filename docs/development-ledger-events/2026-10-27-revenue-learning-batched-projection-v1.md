# Revenue learning batched projection

- Obligation: revenue-learning-batched-projection-20261027
- Change: write revenue-learning evidence in bounded batches through a new upsert_evidence_batch action instead of one gateway call per candidate. No new scheduler, no new writer, no production DDL.
- Evidence: `tests/revenue-learning-project.test.mjs`; Netlify observability showed HTTP 499 on 13 of 13 hourly runs of revenue-learning-project in the 24 hours before this change.
- Status: candidate only; protected merge, edge function deployment and Netlify log readback pending.
