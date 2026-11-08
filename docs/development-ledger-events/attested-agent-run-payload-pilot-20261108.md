# 2026-11-08 — CONTRACT_CHANGE — Attested agent-run payload (proef experimentcyclus-agent)

- **Fingerprint:** `brain|attested-agent-run|pilot-experiment-cycle|20261108`
- **Signal:** live meting op 8 nov 2026: 1.114 cyclus-events in 24 uur, 0 met `agent_id`, 0 met `skill_version`, 850 `UNKNOWN_NOT_ATTESTED`.
- **Impact:** agentleren was niet te bewijzen; "alle agents leren" kon niet worden geclaimd.
- **Root cause:** de SQL-schrijvers zijn bewust geen agents en de bestaande validator voor skill-uitvoering werd in geen enkele natuurlijke run gebruikt.
- **Final fix:** `tools/brain/attested-agent-run-payload.mjs` zet alleen bij `VERIFIED_EVIDENCE` `agent_id`, `skill_version` en voor/na in de payload; anders `UNKNOWN_NOT_ATTESTED` zonder `agent_id`. Proef met één agent (experimentcyclus).
- **Owner:** BREIN/Powerhouse agent-leren.
- **Regression gate:** `tests/brain-attested-agent-run-payload.test.mjs` (in `lane-automation.yml`).
- **Verification boundary:** repository candidate. Niet live bewezen; EVIDENCE_DUE na de eerste natuurlijke run op 9 nov 2026 08:24.
- **Rollback/last-known-good:** revert van de PR; er is geen data of schema aangepast.
