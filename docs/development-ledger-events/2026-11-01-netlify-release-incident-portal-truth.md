# Ontwikkellog — 2026-11-01 — oorspronkelijke Netlify-incidentstatus in Powerhouse-portaal

- Obligation: `p0-5241-original-release-incident-portal-20261101-v1`.
- Originele eigenaar: Netlify Production Truth / Powerhouse Observability / ONE BRAIN; geen nieuwe schakel of database.
- Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5241, parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
- Bronbewijs: oorspronkelijke mislukte full-build deploy `6ae79adf878b85f1eb84e757` exit 2, oorzaakfase niet bekend; latere beschermde main `10195dae004485ec728211aeef7151714455988e`, Netlify `6ae7a0e27f3f5dd85bf78b72` READY, originele productie-UI-test GREEN.
- Root cause: de bestaande Powerhouse Delivery-kaart toonde actuele release-status maar niet het open/gesloten statusbewijs van het **originele incident**. Dat kon actuele website-livegang met opgeloste oude buildoorzaak verwarren.
- Herstel: lees GitHub issue #5241 uitsluitend via bestaande geauthenticeerde backend, contract `original-netlify-release-incident-readback-v1`; toon bronstatus, eigenaar, volgende actie en originele volledige link naast live-bewijs in Portal V2. Geen herclassificatie van de oorspronkelijke website of 15-lussenstatus.
- Preventie: mismatch, onbeschikbare GitHub issue of ontbrekend exact liveproviderbewijs worden `UNVERIFIED`, nooit stilzwijgend gesloten. Een GREEN release ≠ historische root-cause sluiting ≠ betalende order.
- Regressie: `tests/brain-original-netlify-incident-portal-20261101.test.mjs`, learning `brain/learning/2026-11-01-netlify-release-incident-portal-truth-v1.json`, skill `.agents/skills/powerhouse-netlify-production-truth/SKILL.md`.
- Status van deze PR bij schrijven: **KANDIDAAT / NIET LIVE**. Merge- en productieuitkomst uitsluitend invullen na onafhankelijke GitHub-, Netlify- en portaalreadback.
