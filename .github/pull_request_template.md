## V18 deelontwikkeling

Doelbranch: `v18-test`

V18-SCOPE-TAGS: <!-- bv. component:mobile-menu,area:navigation -->

### Waarom deze scope
<!-- Leg in 1–3 zinnen uit welk onderdeel verandert, waarom dit nodig is en waarom andere onderdelen niet geraakt hoeven te worden. -->

### Regels
- Gebruik de kleinste mogelijke combinatie van `component:*` en `area:*` tags.
- Alleen governancebestanden wijzigen? Voeg `scope:governance` toe.
- Een bestand buiten de gedeclareerde scope blokkeert de PR automatisch.
- Niet-overlappende scopes mogen simultaan worden ontwikkeld.
- Overlappende scopes moeten eerst opnieuw synchroniseren met `v18-test` en alle V18-contracttests opnieuw groen krijgen.
- Bestaande V18-testpagina is leidend; ontbrekende V18-linkpagina wordt nieuw in V18-stijl geschreven; bestaande productiepagina blijft behouden wanneer geen V18-vervanger bestaat.
- Geen zichtbare interne link of CTA mag naar een ontbrekende pagina leiden.
- Productie blijft buiten deze PR; promotie vereist afzonderlijke expliciete visuele/businessgoedkeuring.
