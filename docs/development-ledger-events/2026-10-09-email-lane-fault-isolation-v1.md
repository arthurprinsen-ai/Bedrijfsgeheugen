# 2026-10-09 — P0 #4198 e-mail-lane fault isolation

- Evidence: hourly cron job 116 active; canonical enrichment refreshed 23.295/23.295 (2026-10-09); email preflight 0 candidates.
- In-place production edit executed through `cron.alter_job` to preserve the sole scheduler and protect eligible email follow-up if upstream commercial stages fail.
- Same-lineage source-of-truth: migration 20261009135700 and test `brain-email-lane-fault-isolation-v1.test.mjs`.
- No actual email or DM has been claimed sent; provider delivery and customer revenue are unproven.
- Recovery/acceptance tracked in GitHub #4198.
