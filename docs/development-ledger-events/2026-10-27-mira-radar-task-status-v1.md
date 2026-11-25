# 2026-10-27 — Mira-radar: taakstatus providers

- Root cause: provider-taakfout werd als lege uitkomst behandeld; eerste productierun toonde dat (verzoek 14295).
- Bestaande radar aangepast (taakcontrole, één retry, diagnosetelling). Geen nieuwe route of scheduler.
- Tests: `tests/brain-mira-entrepreneur-radar-materializer-20261027.test.mjs`.
