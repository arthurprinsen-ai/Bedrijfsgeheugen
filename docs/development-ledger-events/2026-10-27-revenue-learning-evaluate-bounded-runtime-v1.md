# Revenue learning evaluate bounded runtime

- Obligation: revenue-learning-evaluate-bounded-runtime-20261027
- Change: bound the action-evidence reconcile to 6 seconds, run it beside the due-evidence read, process due targets with a worker pool of 4, and reconcile in parallel groups of 5 in the edge gateway. No new scheduler, writer or production DDL.
- Evidence: `tests/brain-revenue-learning-evaluate-bounded-runtime-20261027.test.mjs`; Netlify observability showed HTTP 499 after about 15 seconds on every attempt of revenue-learning-evaluate at 13:00 and 13:01 UTC on 2026-10-27.
- Status: candidate only; protected merge, edge function deployment and Netlify log readback pending.
