# Trusted skill loader — loader-receipt onafhankelijk van de agent — 8 nov 2026

**Aanleiding:** de payload-builder uit #5536 (`attested-agent-run-payload.mjs`) kan alleen een `agent_id` zetten als de validator `VERIFIED_EVIDENCE` geeft. Dat vraagt een loader-receipt dat niet uit de prose van de agent komt. Zo'n loader bestond niet; geen natuurlijke run kon dus ooit attesteren.

**Wat:** `tools/brain/trusted-skill-loader.mjs` leest `.agents/skills/<id>/SKILL.md`, hasht de echte bytes en geeft het manifest-item en het receipt uit (`loaderId: trusted-skill-loader`, versie `content-<hash12>`). Padontsnapping, onbekende, lege of dubbele skills en ongeldige identiteiten falen dicht.

**Wat niet:** het bewijst alleen welke exacte skilltekst voor welke run is geladen. Het bewijst geen toepassing en is niet de onafhankelijke verifier (volgende stap). Geen scheduler, geen tabel, geen migratie, geen database-write, geen aanpassing van de geplande taak.

**Status:** REGISTERED, niet WIRED. De geplande experimentcyclus roept dit nog niet aan; EVIDENCE_DUE.

**Terugdraaien:** revert van deze PR; geen data aangepast.

Regressie: `tests/brain-trusted-skill-loader.test.mjs` (in `lane-automation.yml`).
