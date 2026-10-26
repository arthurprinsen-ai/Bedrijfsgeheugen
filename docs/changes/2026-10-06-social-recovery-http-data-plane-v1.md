# Social recovery HTTP data plane v1

Date: 2026-10-06

The canonical social recovery Edge Function no longer opens a direct Postgres socket.

Production evidence showed that the request reached `social-recovery-runner` v26 correctly, but Postgres authentication failed to complete within 15 seconds and Supabase returned HTTP 503. The runner now reads canonical state and resolves the scheduler secret through Supabase's HTTP Data API/PostgREST using the existing service-role credential.

The publishing contract is unchanged: same-day recovery only, existing provider side effects are never republished, and the canonical content-loop / social-publisher functions remain the only execution paths.

Direct `postgres`, pooler rewrites and `SUPABASE_DB_URL` are regression-forbidden in this function.
