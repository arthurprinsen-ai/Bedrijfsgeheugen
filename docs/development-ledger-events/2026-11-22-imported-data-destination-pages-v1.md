# 2026-11-22 — CSV/XLSX op betreffende portaalpagina

- **Incident**: bevestigde import werd alleen in importvenster en geschiedenis getoond, niet bij een bijbehorende bedrijfsfunctie. Gebruiker zou geen concreet resultaat van zijn handeling zien.
- **Root cause**: ontbrekende view-projectie tussen `portal.dataImports.datasets[].semantic.area` en de bestaande native Portal V2 route.
- **Oplossing**: in originele `page-shell.js` één nieuwe, read-only bronkaart; doorzoekbare geauthenticeerde bronwaarden; expliciete bestemmingsmapping; centrale catalogus; directe link vanuit importgeschiedenis en succesbericht. Nooit automatisch KPI's wijzigen.
- **Borging in skills**: `.agents/skills/portal-living-interface/SKILL.md` schrijft voortaan zichtbare bronwaarden en auth-gebonden bronprojecties voor.
- **Regressies**: `tests/brain-portal-imported-data-destination-v1.test.mjs`. Faalt gesloten bij niet-herkende en ongeautoriseerde state; tabelwaarden worden echt in de DOM getoond, niet samengevat als fictieve metrics.
- **Releasecontract**: exact-head Required, preflight/hygiene, CodeQL, protected merge, Netlify READY exact SHA en onafhankelijke public browser. Authentieke klantuploadeffecten en named ONE BRAIN consumer ACK blijven apart bewijsverplicht.
- **Status vóór release**: CANDIDATE_EVIDENCE_DUE, niet live geclaimd.
