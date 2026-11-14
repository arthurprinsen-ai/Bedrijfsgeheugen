# 2026-11-14 — first-party source page false completion

Fingerprint: `powerhouse|contacts|first-party-website-guessed-paths-zero-readable-sources|20261114-v1`.
Parent: P0 #4198, same original #116 → original source Edge → ONE BRAIN #138 → Heartbeat.

Source: independent native Supabase after protected main PR #5787, production Edge ACTIVE v28 and exact GitHub-source equality for 3 files, SQL 20261114211500 applied. 8 canonical `relationship-research:public-domain:2026-11-14:*` tasks recorded, zero `public_email_sites_checked`, zero candidates, zero independent original downstream `PROCESSED` receipts. 605 sender-visible addresses unchanged across 23.295 contacts. Production `bg_gezondheid` showed 8 companies attempted and 0 sites; next readback 0 companies because daily cap was reached.

Cause: two guesses `https://domain/team` and `https://domain/contact` plus `redirect:'error'` did not yield a successful HTML source. Do not mark the original research as an e-mail success; existing per-action `public_email_source_checked=false` + 4h retry remains original safe path.

Fix: same Edge only, bounded homepage + actual same-host published link; same-host-only canonical redirects (HTTPS www/apex), new privacy/security negatives, Europe/Amsterdam date key. No SQL or cron change, no new provider spend. Actual readback is pending; keep original incident OPEN until measured pages, candidate status, exact source consumer ACK and learning are proven. No invented address, no Gmail send.

## Midnight retry gap found and remediated in same original worker (2026-11-14)

Original eight public-domain keys were dated `2026-11-14` and had `public_email_next_attempt_at=2026-11-14T23:12:44.234Z`, which is **2026-11-15 00:12:44 Europe/Amsterdam**. The original worker rotated to different contact keys on November 15 and would never search the previous day's eight due keys: deferred work could be silently stranded. The exact same original #116 Edge now uses a bounded historical `status=done` source-action due read, max two per invocation, and reuses the common `processOriginalFirstPartyPublicSource` implementation. No new scheduler, sender, vendor search, idempotency key or database. Original source disposition stores real `public_email_source_attempts`, new retry date or terminal source evidence; daily telemetry reports `historical_due_retries`. This repair still requires exact-head CI, original protected merge and provider Edge code readback; actual source HTML and recipient PROCESSED remain UNKNOWN until production proves them.
