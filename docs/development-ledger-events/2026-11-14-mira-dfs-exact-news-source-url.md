# ONE BRAIN development event — 2026-11-14 Mira Google News link provenance

- Original production radar v974 post-deploy probe 31064: HTTP 503, 14 DataForSEO candidates, all 14 rejected for URL quality, google.com host, 0 eligible.
- Original source owner #120 remains; protected core quality and original #171 consumer/Heartbeat owner remain.
- Exact fix: original DataForSEO mapping now retains provider-declared publisher domain and safely extracts only actual explicit HTTPS publisher URL from approved Google `/url` links with matching domain; if none, block and record typed source shape.
- No browser redirect, invented URL/date, new provider budget, cron, secondary media/publisher, or policy threshold relaxation.
- Original 14 Nov Instagram `content_publication_obligations` stays OPEN until an actual Meta provider ID/permalink GET and Brain consumer ACK exist; actual OpenArt account credits 0 at this check.
- Tests: `tests/brain-mira-dataforseo-publisher-url-20261114.test.mjs` (historical replay, security shadow/canary). Protected merge and provider result not yet verified.
- Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
