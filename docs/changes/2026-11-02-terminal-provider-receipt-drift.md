# Terminal Supabase provider readback — concurrent authorized redeploy

Date: 2026-11-02. Existing merged release: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5295. Original incident `powerhouse|delivery|terminal-stale-provider-receipts-after-authorized-redeploy|20261102-v1`.

## Reproducible original failure and cause

Original Obligation Terminal Closure https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41446530809 attempt 1 FAILED at `SUPABASE_PROVIDER_LIVE_MISMATCH:portal-state-eu`. The original Supabase Edge Production Authority had recorded active `portal-state-eu` v593, but another authorized source-sync deployed v594 before the final provider GET. Seven additional functions moved one version at the same time. The strict check was correct and its failure must remain visible; newer version is **not** proof of equivalent code.

## Original owner recovery verified

Read all eight active function versions/hashes from provider and independently retrieve all 20 active deployed source files. Compare every file byte-for-byte to current protected main SHA `805eb418edc36bb8c9cace3595a96109cb03060e` (20/20 matched). Correct only the eight stale `Terminal-Supabase-Provider-Readback` lines in the existing merged PR #5295, never write a guessed hash. Rerun the exact failed ORIGINAL terminal workflow; attempt 2 SUCCESS and original provider GET matched. No disabled checks, provider substitution, security scope changes, second scheduling route or additional deployment.

## Preventative improvement and limitations

Original terminal workflow now logs the exact function, expected version and observed active version alongside the same unconditional mismatch error, explicitly requiring full main-byte parity verification before any repeat. Existing release skill records the bounded steps. Regressions use real `verifyLiveProviderReadbacks`: same hash but newer version is *still rejected*, and same version but wrong hash is rejected. This yields a safer diagnosis and deterministic same-owner repair, **not automatic authorization for arbitrary version drift**. Machine lesson and human ledger are attached. Technical original release recovery is verified; future recurrence, portal status projection, daily external publication and paying-customer outcomes are separate proof obligations.
