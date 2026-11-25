# 2026-10-27 — Mira-radar: declaratievolgorde

- Root cause: temporal dead zone in de radar uit #4997; gevonden bij een echte uitvoering vóór uitrol, nooit in productie gedraaid.
- Bestaande radar hersteld, test toegevoegd. Geen nieuwe scheduler of providerroute.
- Tests: `tests/brain-mira-entrepreneur-radar-materializer-20261027.test.mjs`.
