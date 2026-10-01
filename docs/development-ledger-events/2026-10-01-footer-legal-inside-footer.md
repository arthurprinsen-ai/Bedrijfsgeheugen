# Footer legal links inside production footer — 1 oktober 2026

Obligation: `footer-legal-production-core-20261001`

Productiereadback na PR #3550 liet zien dat de vier juridische/statuslinks nog steeds niet zichtbaar waren. De echte oorzaak: `tools/bouw-v18-production-core.mjs` herstelt tijdens iedere Netlify-build de homepage uit een vastgezette gecomprimeerde V18-payload en overschrijft daarmee `index.html` vóór de sitebrede shell wordt geprojecteerd.

Herstel: de vier links worden nu direct in die production-core in de echte `<div class="legal">` van de V18-footer geïnjecteerd. De canonical footercomponent bevat dezelfde links en een dedicated Brain-regressietest bewaakt beide bronnen.
