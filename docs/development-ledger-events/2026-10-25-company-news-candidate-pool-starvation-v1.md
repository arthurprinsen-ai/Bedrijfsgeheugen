# Canonical append-only ledger — 2026-10-25 — stale connectie-bedrijfsnieuws

Fingerprint: `growth|company-news|top-200-before-30d-filter-starvation|20261025-v1` | Parent-P0 #4198
Obligation-ID: `growth:company-news-eligible-candidate-coverage:20261025-v1`
Writer: `fix/company-news-candidate-coverage-20261025`

Observed: `cron #20` completed transport, HTTP response business payload `bedrijven=5 nieuws=0` on 25-10-2026, latest admitted news 12-10-2026, top 200 exhausted ahead of company 30d cooldown. One owner bounded fix in existing SQL function, not new scheduler or provider bypass.

Semantic prevention: distinguish transport vs business outcome; maintain source freshness and sampling coverage separately, learned root cause deduped by fingerprint in existing Brain. Same bounded 15/day provider budget, <=20 returned, original pressure suppression.

Tests: `tests/brain-company-news-eligible-coverage-20261025.test.mjs`; Required+CodeQL; release via migration then original cron response and live consumer readback. No fake revenue, sales sends or claims of terminal GREEN.
