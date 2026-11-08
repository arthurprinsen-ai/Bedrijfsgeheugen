# 2026-11-08 — CONTRACT_CHANGE — Trusted skill loader (onafhankelijk loader-receipt)

- **Fingerprint:** `brain|trusted-skill-loader|independent-load-receipt|20261108`
- **Signal:** na #5536 bleek dat geen natuurlijke run een `agent_id` kan krijgen, omdat het loader-receipt dat de validator eist nergens door code werd uitgegeven.
- **Impact:** zelfattestatie via een prompt zou de regel schenden dat het receipt niet van de agent zelf komt.
- **Root cause:** de validator en de payload-builder bestonden, maar de loader die het receipt uitgeeft ontbrak.
- **Final fix:** `tools/brain/trusted-skill-loader.mjs` geeft receipt en manifest uit op basis van de echte bytes van de skill.
- **Owner:** BREIN/Powerhouse agent-leren.
- **Regression gate:** `tests/brain-trusted-skill-loader.test.mjs` (in `lane-automation.yml`).
- **Verification boundary:** repository candidate. Niet bedraad in de geplande taak en niet live bewezen; EVIDENCE_DUE. Toepassing en onafhankelijke verifier ontbreken nog.
- **Rollback/last-known-good:** revert van de PR; geen data of schema aangepast.
