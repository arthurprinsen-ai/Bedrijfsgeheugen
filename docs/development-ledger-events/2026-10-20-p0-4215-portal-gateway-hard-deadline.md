# Development ledger — fail-closed Netlify portal gateway 2026-10-20

Obligation p0-4215-portal-gateway-hard-deadline-20261020.

Observed: Supabase portal-state-eu v218 deployed, but database and signed readback still degraded. Netlify entrepreneur proxy lacks bounded request deadline; cached error response headers are improperly shared with successful read responses.

Change: 23s bounded transport abort of entrepreneur intelligence only; 503/no-store for errors; no new tenant data storage or active retries, no migration or scheduler changes.

Verification required before live: native CI and CodeQL, Netlify preview and exact production source, two authenticated tenants, recovered Supabase/API HTTP 200. Do not claim database recovered.
