# Restore true daily innovation while preserving the one-daily-run gate

**Original issue:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Verified 18 November incident

The existing `Powerhouse Daily Self Evolution` workflow's scoped `original_delivery_recovery` run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44256002607 completed successfully at 07:04 UTC and updated the 14 original innovation receipts. In the independent GitHub job list its `daily-admission`, `improve`, `model-freshness` and original code candidate jobs were **skipped**. The following full manual workflow run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44256077963 had its `daily-admission` rejected as a duplicate because the original source `tools/delivery/daily-learning-run-admission.mjs` treated **every** prior successful workflow_dispatch as a daily attempt. Its own downstream jobs were all skipped. The previous system therefore blocked real innovation after the source readback completed. No actual duplicated work or real full daily was observed in these two runs.

## Corrective architecture: same scheduler, same provider, same agents

The original daily fence now uses **native GitHub Actions job-list provider readback** for each earlier same-day manual `workflow_dispatch` run, with exact bounded job-count and six original job identities:

- An earlier run with daily admission **skipped**, with ordinary improve/model jobs skipped and exactly one existing intake/code/delivery recovery active or completed, is **not** a full daily.
- An earlier run whose daily admission **failed** and **all five other original workers were skipped** never executed daily learning, model, code or provider actions and can be retried without duplicating effects.
- An earlier full daily with daily-admission successful, pending or running (or other work evidence) still suppresses the later attempt.
- Schedule events continue to count as daily attempts. Missing/partial/malformed/ambiguous GitHub job histories remain fail closed; workflows do not infer success from a title or bare workflow conclusion.
- Original `concurrency`, `needs: daily-admission`, the one existing schedule, previous original candidate leases, existing Supabase source and security approvals stay exactly as before. No new cron, executor, queue, deploy bypass, publication or outbound send.

Canonical regression: `tests/brain-innovation-daily-scoped-recovery-fence-20261118.test.mjs` plus the existing `tests/brain-daily-learning-run-admission-v1.test.mjs`. Run both inside the same daily admission before any workers. The protected PR must pass Required/CodeQL; only after protected main and a native full daily dispatch followed by independent job+Brain readback may this incident be called resolved.

**Do not confuse:** a correctly admitted daily run is not automatically a built innovation, a PR is not a deployed feature, and a live feature is not independently measured customer value or Heartbeat ACK. Original 14 obligations remain open until all real stages complete.
