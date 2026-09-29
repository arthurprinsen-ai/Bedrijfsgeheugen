# Alle mobiele taalcontrols route-consistent — 29 september 2026

De productie-readback op `/prijzen` liet zien dat één zichtbare mobiele English-link nog naar `/en/` wees, terwijl de functionele authority `/prijzen ↔ /en/prijzen` vereist.

De oorzaak was niet de routefunctie zelf maar duplicatie van mobiele taalcontrols. De injector verving slechts de eerste bestaande `data-bg-language-switcher="mobile"`. Op pagina's met meerdere mobiele hosts kon een tweede control de oude homepage-link houden.

De injector herschrijft nu **alle** bestaande mobiele taalcontrols naar dezelfde logische route en gebruikt een nieuwe assetversie. De regressie `tests/brain-i18n-all-mobile-controls-same-route-v1.test.mjs` bootst twee stale controls op `prijzen.html` na en eist tweemaal `/en/prijzen`.

Terminale waarheid blijft de productie-browserroundtrip NL→EN→NL.
