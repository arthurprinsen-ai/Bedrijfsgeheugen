# 2026-11-16 — P0 #4198 original scheduler signal-exception rollback

- **Fingerprint:** `powerhouse|runtime171|infinity-source-required-rollbacks-other-tasks|20261116-v1`
- **Evidence:** Original Supabase `cron.job_run_details` job #171 failed at 2026-11-16 06:41 UTC with `POWERHOUSE_INFINITY_CURRENT_SIGNAL_REQUIRED`. Current production v3 function directly invokes Infinity on local 07:41 without a nested exception handler.
- **Cause:** Missing fresh externally sourced intelligence signal is a valid fail-closed condition, but unhandled exception makes the entire original scheduler SQL transaction fail, potentially rolling back unrelated completed steps.
- **Owner:** Original ONE BRAIN/Powerhouse #171 runtime owner; retain original function/cron and exclusive lease.
- **Change:** One protective migration to the *existing* v3 function, one executable regression, original Brain learning artifact, documentation and this ledger. Exact missing-signal exception becomes `SOURCE_EVIDENCE_DUE`, parent health `false`, explicit failed task receipt. Any unrelated exception still propagates.
- **Result now:** SOURCE_CANDIDATE. No migration, protected PR, main merge, production deploy, natural run, provider result or effect is claimed by this record.
- **Required proof:** exact-head Required/BRAIN/CodeQL/Supabase Preview, protected merge, read function definition/ACL in production, next natural #171 task receipt, then original ONE BRAIN and portal incident reconciliation.
- **No bypass:** no second cron, no synthetic provider signal, no resend or out-of-band customer action. Rollback by protected revert to last known v3 definition if subsequent verified regression occurs.
- **Incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
