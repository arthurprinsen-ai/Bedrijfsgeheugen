# 2026-09-25 — mobile language control idempotency

Observed on exact production SHA `c2bf6d4f059307579686f1b61d66f195b0ee2af7`:
- provider deploy ready;
- exact production identity green;
- pricing content green;
- browser gate failed with `visible mobile language select is missing after opening mobile navigation`.

Root cause:
- the i18n asset marker incorrectly short-circuited the whole page patch.

Permanent prevention:
- existing assets no longer skip mobile-control injection;
- regression locks this separation;
- the terminal production browser gate remains authoritative for real mobile NL/EN behavior.
