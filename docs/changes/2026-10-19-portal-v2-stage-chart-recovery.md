# Canonical Portal V2 — interactieve grafieken op mobiel

## Waarom
De iPhone-screenshots tonen overlappende labels in de vijf-stadia-kaarten, CMMI en de adoptiecurve. De eerste herstel-PR (#4495) raakte ten onrechte de behouden historische bron `klantportaal.html`. De browser-readback toonde dat `/klantportaal` redirect naar `/portaal` en daarmee `/portal-v2/index.html` en `portal-v2/visuals.js`. Die eerste PR is bewust gesloten, zonder release.

## Canoniek herstel
- `portal-v2/visuals.js`: `companyStateRail`, `adoptionBell` en `ladder` gebruiken native `details/summary` niveaukaarten. Geen SVG-teksten buiten de chart-viewBox.
- `portal-v2/chart-stages.css`: containerqueries per kaart; 1 kolom bij compacte breedte, 2 tussenmaten en 5 waar ruimte bestaat; 48px aanraakdoelen; hoveruitleg en focusring.
- `portal-v2/index.html`: laadt de CSS in de werkelijke productie-entrypoint.
- `tests/brain-portal-v2-stage-charts-mobile-20261019.test.mjs`: directe tests op de productiecomponenten, geen screenshot-only test.
- Niet geverifieerde percentielen en CMMI-certificering worden niet als echte cijfers gepresenteerd.
- Geen ingreep in klantdata, rechten, authenticatie of AI-connectoren.

## Acceptatie en status
Vóór groen: Required CI, CodeQL, build-parity, geverifieerde beschermde merge, Netlify productieverwijzing naar exact commit en visuele readback op iPhone-breedtes. Zonder deze bewijzen is dit code onder beoordeling en geen live-fix.

## Aanvullende bevinding: exact screenshot-pad
De screenshotlabels `Handwerk`, `Geordend`, `bovenste 25%`, `Late majority` en CMMI worden daadwerkelijk gegenereerd door `portal-v2/modules/legacy-overview-complete.js`. Dit tweede renderpad is daarom in dezelfde PR gerepareerd: de oude SVG/rail blijft in de DOM voor bestaande broncontracten, maar wordt visueel vervangen door native `details/summary`-fases met containerqueries en concrete uitleg. De bestaande test `tests/portal-v2-legacy-interactive-graphs.test.mjs` is aangepast aan de nieuwe semantische interactie en behoudt het oude databroncontract. Browseracceptatie na merge blijft verplicht.
