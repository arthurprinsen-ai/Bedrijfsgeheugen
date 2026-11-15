# 2026-11-15 — Canonieke backfill: bewezen externe grens wint na broncoalescing

- **P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- **Incidentfingerprint:** `powerhouse|completion-backfill|same-identity-boundary-veto-lost-by-representative-selection|20261115-v1`
- **Oorspronkelijke eigenaar:** Reliability / bestaande Completion Supervisor Backfill Resume
- **Bronoorzaak:** bron `candidateFromGroup` nam uitsluitend de eerste identieke identity-observatie voor de status; een latere oorspronkelijke `WAIT_EXTERNAL` met volledig, onafhankelijk aangetoond recovery packet kon in het coalescen verdwijnen.
- **Reparatie:** alle oorspronkelijke source-observaties beoordelen, één aantoonbaar `WAIT_EXTERNAL` veto laten winnen, ongeacht invoervolgorde. Bestaande oorspronkelijke `activeDispatches` geeft voor de geblokkeerde taak geen wake; alle auditbronnen blijven.
- **Bewijs en negatieve regressie:** `tests/brain-completion-supervisor-backfill.test.mjs` controleert beide volgordes, auditbehoud en nul dispatches. De Required hygiene learning-canonicalization replay/shadow/canary op PR #5859 head `fa22036909c7dfcbb719f9468ef3a8c0e0ef09ce` slaagden (15 nov 14:05 UTC); integratiebundel bleef terecht rood op ontbrekende `activity_ledger`, die met dit bestand wordt ingevuld.
- **Release-status:** bronwijziging kandidaat. Required/BRAIN/CodeQL, beschermde merge, exact productie-SHA en natuurlijke originele consumer-/provider-readback zijn afzonderlijke voorwaarden. Geen systeem-wide GREEN of daadwerkelijk ontvangen externe provideruitkomst geclaimd.
- **Preventie:** nooit volledige veiligheid baseren op alleen een willekeurig eerste representatief bronrecord; behoud het originele menselijke consent, idempotentie en alle historische identiteitspaden.
- **Volgende eigenaar/actie:** oorspronkelijke GitHub-lane verwerkt verplichte checks, merge en productie-readback. ONE BRAIN #4198 blijft OPEN totdat eigen uitvoerings- en meetbewijzen bestaan.
