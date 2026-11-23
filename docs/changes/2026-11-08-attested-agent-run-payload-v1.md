# Attested agent-run payload (pilot: experimentcyclus-agent) — 8 nov 2026

**Aanleiding (gemeten, live):** laatste 24 uur 1.114 cyclus-events, 0 met `agent_id`, 0 met `skill_version`, 850 `UNKNOWN_NOT_ATTESTED`. Besluit Arthur 8 nov: "Wees autonoom / beslis autonoom".

**Wat:** `tools/brain/attested-agent-run-payload.mjs` — pure functie die alleen bij `VERIFIED_EVIDENCE` (bestaande validator) `agent_id`, `skill_version` (id@versie#hash12) en voor/na in de payload zet. Anders blijft het `UNKNOWN_NOT_ATTESTED` zonder `agent_id`.

**Wat niet:** geen scheduler, geen tabel, geen migratie, geen database-write, geen SQL-backfill, geen nieuwe autoriteit. SQL-schrijvers blijven `UNKNOWN_NOT_ATTESTED` (migratie 20261029125607).

**Proef:** één agent (experimentcyclus, maandag 08:24, eerste run 9 nov). Uitbreiden naar alle agents pas na bewezen natuurlijke run.

**Bewijs nog te leveren (EVIDENCE_DUE):** na de run van 9 nov: ≥1 event met `agent_id` + `skill_version` + voor/na in `powerhouse_cycle_events`. Zonder dat geen claim dat agents leren.

**Terugdraaien:** revert van deze PR; geen data aangepast.

Regressie: `tests/brain-attested-agent-run-payload.test.mjs` (in `lane-automation.yml`).
