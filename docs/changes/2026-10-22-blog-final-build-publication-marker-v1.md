# Final-artifact blog publication identity — 22 October 2026

The existing [Native daily blog live watchdog run 39851092322](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39851092322) failed after eight exact public reads. The requested [AanZET article](https://www.bedrijfsgeheugen.nl/blog/aanzet-2026-emissieloze-trucks/) is publicly rendered, but the provider runner reported `content_id marker missing`. Exact main source `blog/aanzet-2026-emissieloze-trucks/index.html` **does contain** the correct marker and canonical. Actual Netlify production deploy `6ada641b27965d068e1f8f5b` is ready for older source SHA `8d6dc6dd...`. The build stage restores the ledger marker early, prior to other HTML-mutating steps; late marker removal is the leading hypothesis, to be verified by an actual new Netlify build.

## Scoped recovery

The **existing** `tools/ci/netlify-build-entry.mjs` now applies the **existing** `applyLedgerPublicationMarkers` after the entire full-build or prebuilt-reuse sequence. Only known `data/content-publication-ledger.json` entries can receive this marker; all unknown IDs or conflicts are hard failures. The affected source page receives an additional inert identity meta; its semantic body and canonical remain unchanged. No blog republished, no source data deleted or ad hoc deploy.

## Release gates

Check the executable tests, exact-head Required/CodeQL, protected merge, existing Netlify ready deploy SHA and the independent exact public HTML readback via the **existing** Native daily blog watchdog. Only then may the 2026-09-28 daily ledger become LIVE through its own protected proof PR. This source repair is **not** equivalent to LIVE proof or closure of other missing historical days. Keep full Powerhouse DEGRADED while cron #46, Instagram and other independent obligations fail.
