# Content operations canonical auth recovery — activity ledger

Date: 2026-10-06  
Obligation: social-daily-publication-no-gap-auth-20261006

Observed:
- the live social recovery function called content-operations before the canonical publisher;
- content-operations v5 authenticated only with POWERHOUSE_SHARED_SECRET / POWERHOUSE_TOKEN Edge Function environment variables;
- those secrets were absent in the Supabase project secret inventory;
- the adjacent powerhouse-social-publisher already used the database-backed bg_geheim('powerhouse_daily_scheduler_token') authority;
- production PostgREST also returned HTTP 522 for multiple requests, including bg_geheim, during the incident window.

Implemented:
- content-operations resolves the canonical database scheduler token first;
- the old environment secret remains only as bounded fallback;
- the request auth path is now asynchronous and uses the same authority lineage as the publisher;
- production Edge Function content-operations v6 was deployed from the exact recovery branch source.

Safety boundary:
- no provider-side bypass was used while database truth was unavailable;
- no direct LinkedIn/Instagram post was created outside the canonical single-writer path;
- provider readback remains the terminal proof requirement.

Regional recovery hardening:
- canonical Supabase project: eu-central-1;
- social delivery scheduled function: region fra;
- deploy-triggered recovery: region fra;
- objective: remove the critical publication loop from the affected eastern-US network path while leaving the rest of the site unchanged.
