# 2026-10-22 BRAIN incident observer — candidate checkpoint
- Obligation: P0 #4681. Fingerprint: `brain|incident-observe|evidence-overwrite-and-crosswriter-runid-dup|20261022-v1`.
- Evidence: production source via pg_get_functiondef, two real cron alias formats, 20 historical raw occurrences vs 11 distinct cron #46 run IDs; exact incident stored in canonical BRAIN.
- Action: protected source migration and targeted regression test; preserve SECURITY DEFINER, only service_role EXECUTE, raw evidence and existing scheduler.
- Status: CANDIDATE. No source deployment or database verified PASS has been asserted.
- Promotion requirements: isolated SQL acceptance (especially concurrent writers), Required+CodeQL, provider readback, append-only learning/skill projection, then production confirmation and no customer exposure.
