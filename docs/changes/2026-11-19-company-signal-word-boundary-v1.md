# Verified company entity for external signals — 2026-11-19

## Problem
Trigger research actions expired unworked (898 expired vs 195 done in 7 days). 527 of 776 actions carried a short single-word "company" key such as "ster", "anva" or "appen", derived by substring-matching connection names in news text.

## Change
- `supabase/migrations/20261119090500_company_signal_word_boundary_verified_entity_v1.sql`: whole-word, exact-spelling, capitalised match with a common-word/month stoplist; trigger view ignores legacy substring-resolved signals and growth-swarm feedback. Same view, same columns, no data deleted.
- `tests/brain-company-signal-verified-entity-20261119.test.mjs` and `brain/learning/2026-11-19-company-signal-word-boundary-v1.json`.

## Evidence
Read-only production simulation: 1029 explicit-mention rows become 172, 215 keys become 72. Real brands such as Visma, Exact, Mollie, Stripe, Odoo stay.

## Known limit
Real brands written in another case (for example BLINQX) are now missed; conservative on purpose. Not proven in production until the migration applies and the next natural 05:45 resolver run reads back fewer short keys and more actions reaching "Bericht klaar".
