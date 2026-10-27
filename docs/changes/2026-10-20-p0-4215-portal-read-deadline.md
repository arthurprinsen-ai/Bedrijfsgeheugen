# P0 #4215 — stop abandoned portal PostgREST reads

The production `portal-state-eu` v217 bounded-read helper limits concurrency to three but never interrupts hanging network requests. Provider traces on 2026-10-20 show `SOURCES` 197056ms, `EXTERNAL_SIGNALS` 149745ms, while Netlify authenticated `/api/portal-ondernemersdata` receives 504 after approximately 30s.

The original authentication/tenant keys, ten source selections, result ordering and three-at-once envelope stay intact. Add a per-read 5s abort deadline and attach the controller signal to each lazy PostgREST query via `.abortSignal(signal)`. Promise.race rejects even if the transport ignores abort; `finally` clears both timers and invokes abort. The controller only shortens reads that are already unavailable; errors still fail the whole call closed rather than invent metrics or partial results.

This is not database recovery. PostgreSQL index migration, CRM join pressure, cron startup timeouts and protected two-tenant production acceptance remain independent #4215 gates. This code must pass Required/CodeQL/Supabase Preview, protected merge and Edge/Netlify runtime checks before LIVE_PROVEN; do not deploy from an unreviewed branch.
