# Website CLS-attributie zonder kwaliteitsverlaging — 22 oktober 2026

- Obligation: `website|mobile-cls|en-blog-afas-api|20261022-v1`; bestaande Brain-fingerprint, parent #4215.
- Exact #4606 Required rerun 39740060787: checkout NL/EN desktop/mobiel geslaagd; volledige mobiele zichtbaarheid faalt op `/en/blog/afas-api` met CLS 0,111 (grens 0,100).
- De huidige root cause is **onbekend**. Een offline reconstructie van het exacte Netlify-buildpakket met lokale CSS/scripts leverde nul shifts; externe HTTP-/font-/CMS-respons kon niet gelijkwaardig worden gesimuleerd.
- Diagnosefix: `PerformanceObserver` verzamelt maximaal 12 CLS-events; per event maximaal drie betrokken DOM-elementen (tag/id plus begrensde oude/nieuwe geometrie). Geen paginainhoud, cookies of URL-attributen gelogd. CLI rapporteert dit alleen bij falende CLS.
- Het oorspronkelijke CLS-limit `0.100`, route-inventaris, desktop/tablet/phone browsercheck, zichtbaarheid en checkout blijven strikt actief.
- Regression: `tests/website-layout-shift-evidence-20261022.test.mjs`.
- Status: **diagnose kandidaat**, geen herstel van de zichtbare verschuiving, geen merge of productie-uitrol. Vervolg onder dezelfde foutfingerprint: provider-gebaseerde bronattributie ophalen, afwijkend element gericht herstellen, negatieve browsercanary en exact-head Required/CodeQL plus productie-readback.
