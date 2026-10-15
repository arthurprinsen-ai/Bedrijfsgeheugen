# Delivery ledger — mobiele websiteheader en eerste scherm

**Obligation-ID:** website-mobile-header-first-fold-20261015

## Waargenomen productieproblemen
Op 15 oktober 2026 tonen door de gebruiker gemaakte iPhone-schermafbeeldingen van de homepage en /product een dubbelzinnig geel drie-streep-logo naast het menu, grote afgebroken hero-typografie, gele markerblokken door de titel en een vaste gele tijdverlies-berekening vóór de primaire CTA. De live Netlify-productieversie was deploy 6ad0c265a389b27cc7b2e8d0 op git-commit 7bad94fb9d84e951753543481461e8fb5810a832 bij de inspectie. De live HTML gebruikt V18-sjablonen en kan niet uitsluitend via het legacy index.html worden gerepareerd.

## Implementatie
- `assets/site-coherence-v1.css`: mobiele correcties voor V18-header, menuknop, homepage- en inhoudshero; tijdpopup `.bgx-lek` op mobiele breedte verborgen.
- `tools/site-shell/finalize-website-coherence-v1.mjs`: gecachete versie van het gedeelde stylesheet vervangen.
- `tests/site-shell-mobile-first-fold.test.mjs`: contracttest op bovenstaande selectors en versie.
- De bestaande menulogica, desktoplayout, cookie-toestemming, authenticatie en AI-governance niet gewijzigd.

## Acceptatie
De eerste workflow is geweigerd wegens ontbrekende Base-SHA metadata; deze is hersteld. De tweede wegens het onjuist geclassificeerde testbestand; hersteld door site-shell-testnaam. De daaropvolgende admission accepteerde de code maar vereiste integratiebewijzen, die in deze commit worden geregistreerd. Dit document claimt geen geslaagde Required CI, CodeQL, beschermde merge of Netlify-productie-uitrol. Na vrijgave visuele mobiele readback uitvoeren op / en /product bij 375–430px, met open/sluitbare navigatie en controle op overlap met CTA en WhatsApp.
