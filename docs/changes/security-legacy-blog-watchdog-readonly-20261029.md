# P0 preventive repair: legacy daily blog live watchdog now read-only

The existing `.github/workflows/daily-blog-live-watchdog.yml` used to check production HTML and then write `data/content-publication-ledger.json` plus an internal Brain learning record and private change/development-ledger notes to a new **public GitHub PR**. That creates a recurrence path for incident `SEC-2026-10-29-TWINFIELD-EXPOSURE`.

This change preserves the existing external HTTP production readback and its current triggers, but reduces GitHub permissions to `contents: read`, removes the internal materialization and public PR writer, and adds a dedicated security regression test that runs both in CI and at start of the watchdog. The current canonical Powerhouse daily blog publisher alone owns publication and production closure. The watchdog cannot claim independent published completion by writing a public proof candidate.

No new scheduler, blog channel, publisher, provider, webhook or unapproved draft is created. The repository history and historical public PR caches remain a separate OPEN forensic issue.
