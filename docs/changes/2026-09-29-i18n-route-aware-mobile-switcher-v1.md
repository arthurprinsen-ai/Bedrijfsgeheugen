# Route-aware NL/EN mobile switch — 29 september 2026

De productie-readback bewees dat de pricing-runtime zelf werkte, maar de mobiele taalwissel op `/prijzen` naar de Engelse homepage `/en/` wees. De broninjector gebruikte voor iedere pagina dezelfde hard-coded links.

De injector bepaalt nu per bestand de logische route en schrijft symmetrische links:
`/prijzen ↔ /en/prijzen`, `/systemen-koppelen ↔ /en/systemen-koppelen`, en alleen de homepage gebruikt `/ ↔ /en/`.

Bestaande mobiele switchers worden bovendien herschreven in plaats van stil overgeslagen. Daardoor kan een oude foutieve link niet blijven staan.

Terminale waarheid blijft: protected merge → exact production → pricing-interacties → NL→EN→NL browser-readback.


## Finale syntaxborging

De actuele main bevatte nog één verouderde `MOBILE_LANGUAGE`-literal in het compact-mobile pad. Die is vervangen door de canonieke `mobileLanguage + '$&'` invoeging. Een permanente `node --check` regression voorkomt dat dit opnieuw door build of merge komt.
