# Development ledger — 2026-11-12 Portal V2 authored root-level readback

- Original P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
- Original agent/skill owner: `agent-data-quality`, `agent-website-ux`; existing `.agents/skills/portal-living-interface/SKILL.md`.
- Existing runtime: `createPortalStateClient.write`, no parallel executor.
- Observed defect: authenticated portal value equality tested `portal.*` but omitted other submitted canonical authored root fields.
- Scope: original portal state file, original persistence regression, original skill, ONE BRAIN learning, change explanation and this ledger.
- Correction: check all non-derived authored root fields against authenticated GET, while keeping provider and projection ACK gates.
- Tests: existing original portal-business-input-persistence plus its two root-level scenarios; protected Required, CodeQL and BRAIN remain mandatory.
- Candidate status at authoring: `EVIDENCE_DUE`; do not claim prod deployed, human user acceptance, Brain consumer receipt or measured outcomes.
- Next proof: protected CI/merge → exact Netlify main SHA → independent authenticated original tenant readback → original ONE BRAIN consumer ACK → Heartbeat/Powerhouse outcome evidence. No unapproved synthetic customer value.
