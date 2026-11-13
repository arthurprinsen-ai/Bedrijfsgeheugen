# Immutable incident/release event — MIRA_RADAR_HTTP_200_WITH_SOURCE_RECOVERY_DUE_20261113

- **Detected:** 2026-11-13; original Mira source observation stopped after 2026-11-08.
- **Observed:** cron #120 active and successful enqueue; 2026-11-12 20:02 UTC original Edge HTTP 200; 2026-11-13 Instagram still PLANNED with no unique source winner.
- **Root cause:** HTTP-level 200 was returned for structured `ok:false, SOURCE_RECOVERY_DUE` even though original source materializer had no fresh eligible winner.
- **Fix:** status adapter in original Edge Function only, shared pure mapping; preserve ONE BRAIN failure receipt and source gate.
- **Regression:** healthy-source, no-source, provider/writeback errors, Edge wiring and original owner checks.
- **No duplicate producer:** original cron #120; original Edge; original source materializer; original one daily winner; original publisher.
- **Closure:** pending protected-merge and independent deployed Edge/provider readback. **Do not mark Instagram live or LOOP GREEN from HTTP status alone.**
