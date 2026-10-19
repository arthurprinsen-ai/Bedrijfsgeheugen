# Mobiele grafieken klantportaal – 19 oktober 2026

## Probleem
Op de meegestuurde iPhone-screenshots overlappen de labels van “De staat van je bedrijf” en “Waar je staat op de adoptiecurve”. Procesvolwassenheidsfasen worden afgesneden, en tikken/hoveren levert geen betrouwbare interactie.

## Aanpassing in het bestaande portaal
- **Bron:** bestaande `klantportaal.html`, geen tweede portaalroute.
- **Componentlaag:** `assets/js/portal-charts-v3.js` met native semantische knoppen; `assets/css/portal-charts-v3.css` gebruikt de bestaande CSS-tokens van de portaalstijl/CMS.
- **Data:** score uitsluitend uit de reeds beschikbare `S.niveaus` en `DIM`; `B()` is expliciet een *indicatieve* branchevergelijking. Geen gesimuleerde dataset of aantoonbaar onjuiste 25%-percentielen tonen.
- **Interactie:** tik/click selecteert de fase, hover/focus laat details zien, focusring en Enter zijn bruikbaar met toetsenbord.
- **Layout:** geen vaste tekstposities in het zichtbare chartgedeelte; mobiele kaartgrid tot 490px, twee kolommen tot 950px, vijf kolommen op grotere schermen.

## Validatie en open punten
- Contracttest: `tests/brain-portal-charts-v3-mobile.test.mjs`.
- Na verplichte PR-controles en beschermde merge: Netlify-productie-SHA, CSS/JS downloads en visuele readback op 320/375/390/430/768/1024 px.
- Nog geen formele CMMI-audit, geen externe brancheverdeling en geen automatisch bewezen actuele financiële gegevens.
- Bij niet-geladen JS blijft de oorspronkelijke pagina zichtbaar; geen onbewijsbare live-claim zonder geauthenticeerde readback.
