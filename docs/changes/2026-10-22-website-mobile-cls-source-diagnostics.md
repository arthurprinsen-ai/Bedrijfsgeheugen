# Website CLS-attributie zonder kwaliteitsverlaging — 22 oktober 2026

- Obligation: `website|mobile-cls|en-blog-afas-api|20261022-v1`; bestaande Brain-fingerprint, parent #4215.
- Exact #4606 Required rerun 39740060787: checkout NL/EN desktop/mobiel geslaagd; volledige mobiele zichtbaarheid faalt op `/en/blog/afas-api` met CLS 0,111 (grens 0,100).
- De huidige root cause is **onbekend**. Een offline reconstructie van het exacte Netlify-buildpakket met lokale CSS/scripts leverde nul shifts; externe HTTP-/font-/CMS-respons kon niet gelijkwaardig worden gesimuleerd.
- Diagnosefix: `PerformanceObserver` verzamelt maximaal 12 CLS-events; per event maximaal drie betrokken DOM-elementen (tag/id plus begrensde oude/nieuwe geometrie). Geen paginainhoud, cookies of URL-attributen gelogd. CLI rapporteert dit alleen bij falende CLS.
- Het oorspronkelijke CLS-limit `0.100`, route-inventaris, desktop/tablet/phone browsercheck, zichtbaarheid en checkout blijven strikt actief.
- Regression: `tests/brain-website-layout-shift-evidence-20261022.test.mjs`.
- Status: **diagnose kandidaat**, geen herstel van de zichtbare verschuiving, geen merge of productie-uitrol. Vervolg onder dezelfde foutfingerprint: provider-gebaseerde bronattributie ophalen, afwijkend element gericht herstellen, negatieve browsercanary en exact-head Required/CodeQL plus productie-readback.

- 22 oktober aanvullend: de onafhankelijke Netlify-preview bevestigt dat de gegenereerde Engelse V18-content meerdere verschillende `div.wrap`-ouders heeft. Herhaalde providerbrowserproef gaf slechts CLS 0,00037 in één warm-resource-ronde en sluit het eerdere reproduceerbare CI-falen niet uit. De nieuwe begrensde diagnose bewaart voor maximaal drie sources de bij het toevoegen vastgelegde parent-chain, isConnected, fontstatus en tijd, ook wanneer de bron later ontkoppelt. **Geen oorzaak bewezen, geen normverlaging, geen productie-groen.**
