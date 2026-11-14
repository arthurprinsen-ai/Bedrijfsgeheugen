# Telefoonweergave Engelse zelfscan — gedeelde navigatie sluit native

## Waarneming
De oorspronkelijke canonical brand-shell live readback https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43378918503 controleerde 279 publieke routes. De exacte websitebron op Netlify READY `7d27a6bbc17887d7982ae23491007087d6d9e443` had al de juiste Trusted Advisor-teksten en de oorspronkelijke shell-, SEO-order- en growth-endpointcontrole doorlopen. Eén browservraag bleef rood: `/en/zelfscan phone: h1 is visually occluded by div.bg-shared-mobile-view`. Dat mag niet als volledig groen worden aangemerkt.

## Bestaande bronoorzaak en grens
`assets/js/menu.js` voegt de originele `#bgSharedMobileNav` dynamisch toe, terwijl `/assets/shared-mobile-drilldown.css?v=1` via een aparte stylesheet arriveert. Voorheen was de gesloten toestand slechts `aria-hidden=true`, wat geen visuele of layoutverberging garandeert. De originele globale mobile-ui sluitroute gebruikte dezelfde ontoereikende toestand. De sitewide mobiele geometrie geeft het nav-element ondertussen een vaste viewportlaag. Dit is een aantoonbaar bronrisico; of het de enige oorzaak van de waargenomen hit-test is, wordt pas bevestigd door een geslaagde exacte browserreplay.

## Kleine correctie, bestaande eigenaar
Het originele menu krijgt de native `hidden`-attribuut vóór het toevoegen aan `body`. De originele sluit- en sitewide-close-routes zetten ook `hidden`; alleen de bestaande bewuste open-actie verwijdert dit. De bestaande sitewide stylesheet verbergt de gesloten `aria-hidden=true` root expliciet tijdens late stylesheetlevering. Geen nieuw menu, geen tweede overlay, geen routewijziging, geen nieuwe scheduler en geen testwaiver.

De bestaande oorspronkelijke UX-nav-catalogus, H1/hit-testing, CLS≤0,100, responsive i18n, Escape, touch-targets, prijzen en beveiligingscontroles blijven behouden. Nieuwe BRAIN regressie `tests/brain-website-mobile-nav-hidden-overlay-20261113.test.mjs` bewaakt bron, sluitstaten, css en originele browserverifier.

## Acceptatie
Required, BRAIN en CodeQL op exacte huidige bron; volledige mobiele routeset op preview; beschermde merge; Netlify productiedeployment met exact merge-SHA; opnieuw uitvoeren van de oorspronkelijke canonical brand-shell run inclusief **alle** publieke phone/tablet/desktop routes en expliciete `/en/zelfscan` H1-hit-test. Alleen dan `LIVE_PROVEN`. Overkoepelende commerciële/tenant-ACK-status blijft losstaand.
