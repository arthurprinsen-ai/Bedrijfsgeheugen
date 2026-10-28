# 2026-10-28 — Supabase bundel zonder build-time jsr-import

Obligation: supabase-bundle-no-jsr-20261028.

Oorzaak (bevestigd uit workflow_run_logs van Supabase-preview novbvfxewlesfgoniski): jsr.io-fetch timeout tijdens het bouwen van de graph, niet een code- of typefout. Fix: `jsr:`-import verwijderd uit vijf functies; test voorkomt herhaling.
