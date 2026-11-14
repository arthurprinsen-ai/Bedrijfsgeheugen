# Original public work-email source-disposition assurance — 14 November 2026

Parent P0: [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198). ONE BRAIN obligation: `43c90754-3fd0-4c97-bb14-fbf815e12f47` (OPEN).

## Measured root cause, not a guessed provider failure
At 20:49 UTC native production had 23,295 original connections, 605 existing emails, 22,690 missing addresses; eight original idempotent public company-domain research actions were persisted with *zero* readable HTML pages and `NO_EXPLICIT_NAMED_OFFICIAL_MAILTO`, all with an original four-hour retry due 23:12:44 UTC. Original `relationship-public-research` health rows erroneously recorded `ok` for the zero-HTML run. New address candidates and original #138 consumer receipts remained zero.

## Narrow fix inside original owner
- Existing `powerhouse-relationship-public-research` source worker distinguishes `SOURCE_HTML_UNAVAILABLE` (0 published readable HTML pages) from `NO_EXPLICIT_NAMED_OFFICIAL_MAILTO` (actual HTML read, no identity-matched published address).
- Existing same original action IDs, `public_email_source_checked=false`, source attempt counters and four-hour `public_email_next_attempt_at` remain unchanged for unreadable sources. Historical cross-day retry continues on original worker; no second scheduler/queue.
- Original daily and historical replays count `html_unavailable` and `no_named_work_mailto` separately. Any source-read failure produces native `bg_gezondheid.status=waarschuwing`, not an unqualified green, while the worker may truthfully return HTTP 200 for completed safe processing.
- Existing `agent-reliability` and `agent-data-quality` duties and daily enrichment skill require owner, source revision, retry, original ONE BRAIN `PROCESSED` ACK and independent Heartbeat/effect readback.
- Original first-party lookup remains bounded, same-host HTTPS-only, source-validated. No guessed personal email, provider scraping, unsanctioned paid API, delivery permission, Gmail mutation or extra cron.

## Acceptance
Protected Required + CodeQL + existing BRAIN tests and native Supabase Edge deployment. Independently read back source runtime version/content, next original #116 natural run and `bg_gezondheid` warning when a URL cannot be read. Reconcile original #138 only when there is a real public business email candidate and source revision. The P0 and commercial obligation remain OPEN until real new sourced address/consumer/effect proofs; no source outcome is manufactured by the deployment.
