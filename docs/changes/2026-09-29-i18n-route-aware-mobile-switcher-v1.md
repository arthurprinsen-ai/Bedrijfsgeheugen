# Route-aware NL/EN mobile switch — 29 september 2026

De productie-readback bewees dat de pricing-runtime zelf werkte, maar de mobiele taalwissel op `/prijzen` naar de Engelse homepage `/en/` wees. De broninjector gebruikte voor iedere pagina dezelfde hard-coded links.

De injector bepaalt nu per bestand de logische route en schrijft symmetrische links:
`/prijzen ↔ /en/prijzen`, `/systemen-koppelen ↔ /en/systemen-koppelen`, en alleen de homepage gebruikt `/ ↔ /en/`.

Bestaande mobiele switchers worden bovendien herschreven in plaats van stil overgeslagen. Daardoor kan een oude foutieve link niet blijven staan.

Terminale waarheid blijft: protected merge → exact production → pricing-interacties → NL→EN→NL browser-readback.

Aanvullend is de publieke runtime nu een tweede guard: iedere NL/EN-anchor wordt op de actuele pagina opnieuw naar de equivalente locale-route gezet. De foutieve legacy fallback-concatenatie is syntactisch hersteld.
