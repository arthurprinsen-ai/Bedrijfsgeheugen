# Websitebreed mobiel herstel — 11 november 2026

## Gebruikersbewijs
Vijf iPhone-schermen tonen (1) witte CTA zonder leesbare tekst op de homepage, (2) wisselende headergeometrie en niet-sticky navigatie, (3) een mobiel menu waarvan 'Sluit' niet werkt, (4) een kennisslider met onleesbaar overlappende helften en een bediening onder de afbeelding, en (5) interactieve bediening die niet reageert.

## Structurele oorzaak en herstel
De publieke site heeft meerdere header-generaties (.bgkop en V18), meerdere mobiele menu-implementaties en per-pagina overflow-x:hidden. Op iOS Safari kan overflow-x:hidden op html/body de sticky-header blokkeren. De homepage .pgl-btn.secondary erft een witte achtergrond maar behoudt witte tekst. De kennispagina heeft een eigen #compareRange onder de vergelijking, terwijl de bezoeker op de vergelijking probeert te schuiven.

De bestaande canonieke Netlify-build krijgt in de laatste cms-runtime-fase een idempotente publieke UX-laag: CSS inline vóór eerste paint, een versiegebonden JS-runtime, expliciete sluitknop met correcte aria-state en scroll-unlock, sticky header en consistente mobiele navigatie, zichtbare tweede CTA en één native range over de kennisslider. Geen tweede executor, geen parallel CMS, geen wijziging aan tenant/portal of commerciële integraties.

## Preventie en bewijs
De bestaande cross-browser website assurance controleert voortaan menu openen én sluiten, sticky gedrag na scroll en 0–100-toetsenbordgrenzen van de kennisvergelijking. /kennis/ wordt opgenomen in de Chromium/Firefox/WebKit-screenshotmatrix. Node-regressietests controleren de injectie, de code en de geïsoleerde scope.

**Bewijsgrens:** bronwijziging en PR betekenen nog niet dat de productie is gerepareerd. Alleen beschermde CI + geslaagde preview-browserchecks + merge naar main + exact Netlify READY-commit + onafhankelijke productiecontrole sluiten deze melding. Bij een rode gate blijft het incident open, zonder greenwashing.
