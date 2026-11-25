# Social metric ingestion — verified account binding recovery

## Incident
PR #4513 was merged after protected Required CI, CodeQL, exact Supabase Preview and protected merge. The new Edge function and pg_cron went live. The first authenticated production request #8095 was HTTP 503 with zero real social metric snapshots.

Provider setups were then invoked using the existing authorized scheduler token and returned **one confirmed healthy Instagram Business** connection to `bedrijfsgeheugen.nl` and **one verified LinkedIn** connection, both with exact connected account IDs and user IDs, but empty historical alias fields. The original adapter's alias and optional `user_info` filters therefore returned no eligible account.

## Recovery
The adapter now reads `brain_records` only for each existing verified `*-composio-setup-current-state-v1` identity, demands `ACTIVE`, `ready=true`, and `health_verified=true`, validates Instagram username, and matches the exact bound account ID and user ID to the fresh Composio `ACTIVE` catalog. It refuses ambiguous, revoked and differently scoped accounts. No new connection, new credential, posting call, Buffer dependency, or artificial insights are created.

Production OAuth evidence indicates Instagram identity is verified; LinkedIn company readback may be possible but personal readback scope `r_member_social` is absent. The personal-reactions API therefore remains **fail-closed** if forbidden. Do not assert that LinkedIn per-post impressions or company metrics work until each specific readback passes.

## Regression / acceptance
The targeted identity regression runs in the existing backend lane. Required CI, CodeQL and exact-head Supabase Preview must pass before protected merge. A second authorized production request must yield real Instagram observations with source IDs and the persisted metric readback. Partial LinkedIn permissions must remain honest. Separate customer revenue tracking to the €1m target remains a verified business outcome obligation.
