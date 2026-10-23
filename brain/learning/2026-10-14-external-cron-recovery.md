# Operational learning: cron startup failure isolation

A PostgreSQL cron job that fails to start cannot invoke its in-job exception handling. Recording SQL exceptions inside job 116 does not detect startup failures. A scheduler outside PostgreSQL can remain reachable, but Supabase RPC can still time out when the database is saturated. Therefore retain independent invocation telemetry and do not mark a reconciliation complete without readback. Never automatically resend provider messages on ambiguous execution outcomes.
