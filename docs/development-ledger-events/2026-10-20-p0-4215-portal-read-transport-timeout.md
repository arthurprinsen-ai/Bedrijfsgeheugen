# Development ledger — portal transport cancellation, 2026-10-20

Obligation p0-4215-portal-read-transport-timeout-20261020; canonical existing portal-state-eu gateway only.

Evidence: Supabase PORTAL_READ_FAILED first three stages after 90–197s and production authenticated HTTP 504; existing sort-index migration #4537 in main.

Decision: no additional DB index, migration, scheduler or new store; apply bounded PostgREST request cancellation and real signal propagation, preserve all ten read stages and error semantics.

Regression tests + learning record created; status CANDIDATE pending provider preview, protected checks, Edge exact deploy and two-tenant end-to-end proof.
