# Pricing mobile lifecycle tabs zichtbaar — 24 september 2026

## Root cause
De productie-readback op 390px vond `data-bg-stage="loss"` wel in de DOM, maar kon de knop niet zichtbaar/stabiel klikken. De zes lifecycle-routes stonden in één horizontaal scrollbare rij.

## Fix
Onder 900px gebruikt de lifecycle-selector nu een 2-koloms grid. Alle zes routes staan direct in de zichtbare paginaflow, labels mogen afbreken en iedere knop heeft minimaal 48px touchhoogte.

## Preventie
De production verifier blijft gewoon klikken zonder `force`. De nieuwe regressietest bewaakt dat mobiel geen horizontale lifecycle-scroll terugkomt.
