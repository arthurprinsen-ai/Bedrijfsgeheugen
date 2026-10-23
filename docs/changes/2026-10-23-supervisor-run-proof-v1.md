# Real Recovery Supervisor evidence inside the existing Powerhouse Janitor

Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661

## Verified problem
The existing native expected-head-CAS supervisor was protected merged through PR #4781. [Executed run #39960974891](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39960974891) was **manual** (`workflow_dispatch`), not a scheduled trigger, and confirmed #4772 and #4778 were held on nonterminal writer leases despite green older-head Required + CodeQL. Neither scheduled liveness, recurring drift, nor the root cause of a CAS refusal can be claimed from YAML or generic HTTP errors.

## Implemented in the same architecture
The **original** hourly Janitor (`17 * * * *`) invokes one additional read-only Node observer with `continue-on-error`. It reads a **bounded maximum of five completed Recovery Supervisor runs within seven days**, each with one complete jobs-page and the exact supervised job log. No new cron, agent, branch writer, metadata mutation, GitHub check update, model, queue or error register.

`tools/delivery/supervisor-run-evidence.mjs` validates event, run ID, exact job, completed status, GitHub SHA, provider timestamps and actual log lines. It rejects echoed ANSI-colored shell source, duplicate run IDs, partial provider readback and non-typed CAS guesses. Separate counters track genuine scheduled vs. manual runs, independent recurring drift attempts per PR, terminal-lease denial and *explicitly typed* CAS errors. Generic HTTP 422 alone is **not** treated as proven CAS failure.

Readback artifact: `.artifacts/powerhouse-supervisor-runs.json`. It does not claim p50/p95 green-to-production times or improvement because independent protected merge/production receipts have not been joined; no customer or portal LIVE claim. The existing Brain tests replay both valid and adversarial provider samples.

## Acceptance
1. `node --test tests/brain-supervisor-run-evidence-v1.test.mjs`.
2. Exact immutable PR-head Required, CodeQL JS/Python and normal protected squash auto-merge; verify `main` source.
3. Observe a **naturally run** existing hourly Janitor and inspect actual `.artifacts/powerhouse-supervisor-runs.json`. A manually triggered sample is not evidence of scheduling reliability.
4. Use the existing owner leases to reconcile #4772/#4778, and compare matched cohorts of actual successful releases before asserting acceleration.

References: https://docs.github.com/en/rest/pulls/pulls#update-a-pull-request-branch and https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
