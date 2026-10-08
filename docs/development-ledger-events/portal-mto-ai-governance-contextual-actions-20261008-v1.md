# Development ledger: MTO en AI-governance contextkaarten

- Datum: 2026-10-08
- Lineage: `portal-mto-ai-governance-contextual-actioncards-20261008-v1`
- Auditissue: #4215; actieve brede lossless-draaglaag: PR #4214 (andere bestanden en writer).
- Waarneming: MTO-formulier bevatte alleen frequentie; AI-governance had vooral volwassenheidsscore. Er was geen expliciet, reproduceerbaar contract voor brongekoppelde prioriteitskaarten en expliciete roadmapvoorstellen.
- Ontwerp: voeg feitelijke formvelden toe; lees native schemas exact; leid prioriteiten contextueel af uit tenant-input en bronstatus; verklaar onzekerheid, bewijsgebreken en ontbrekende financiële onderbouwing.
- Uitvoering: uitsluitend `functional-suite.js`, `full-company-input.js`, `foresight-context-ui.js`, nieuw `contextual-action-cards.js`, tests en leerdocumentatie. Hergebruik bestaande `domainState` en Brain-writeback.
- Preventie: verplicht een regressie voor ontbrekende data, AI-high-risk zelfinschatting, brononzekerheid, duplicate roadmap, geen verzonnen euro-impact, context in meer dan één pagina.
- Bewijsstatus bij commit: CANDIDATE; beschermde merge, Netlify productierelease en authentieke klantreadback nog afzonderlijk vast te stellen.
- Open: volledige auditeerbare veld/connector-inventaris en betrouwbare wettelijke bron-naar-klant impact zijn expliciete acceptatiecriteria van #4215.
