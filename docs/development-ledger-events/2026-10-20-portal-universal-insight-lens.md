# Development ledger — Universele Inzichtlens (2026-10-20)

- Obligation: `portal-universal-insight-lens-20261020`.
- Canonical route: `/portal-v2/` via bestaande Portal V2 router.
- Diagnose: verspreide grafiek-, tabel- en canvasonderdelen missen één vergelijkbare, contextuele ondernemersinteractie. De bestaande Foresight-scenariostudio blijft de autoriteit voor scenario's.
- Ingreep: read-only contextpaneel, dynamische surfaceregistratie, tabelverkenning, 2-puntsvergelijking, bewijsonzekerheid expliciet en links naar bestaande scenario/actie/bronpagina's.
- Privacy/data: uitsluitend de al zichtbare DOM-gegevens voor de ingelogde gebruiker; geen nieuwe backend, lokale persistente opslag, bronbewijzen of gefingeerde causaliteit.
- Preventie: regressietests in `portal-v2/tests/insight-lens.test.mjs` en `tests/brain-portal-universal-insight-lens.test.mjs`, learning record `brain/learning/2026-10-20-portal-universal-insight-lens.json`.
- Open acceptatie: exacte-head Required CI, CodeQL, Netlify preview, mobiele touch/hover/keyboard browserchecks, tenantisolatie, gecontroleerde merge, productie-readback.
- GitHub PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4544
- Resultaatstatus: kandidaat, niet `LIVE_PROVEN`.
