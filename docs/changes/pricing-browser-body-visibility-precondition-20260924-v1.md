# Pricing browser body-visibility precondition — 24 september 2026

## Incident
Productie stond exact op commit `4623d87946758e3e2749a387999c75067b34ac9b` en de generieke routecheck was groen, maar de specifieke pricing/i18n browsergate stopte vóór de eerste lifecycle-click.

## Root cause
De verifier wachtte op Playwright-state `visible` voor het complete `<body>`-element. Dat is geen passend bewijs voor de pricinginteractie en blokkeerde de autoritatieve control-level checks.

## Fix
De verifier wacht alleen op DOM-attachment en de bestaande pricing-runtime readiness marker. Daarna moet hij nog steeds met normale clicks de lifecyclekeuze, plan-tab en jaarbilling uitvoeren en zichtbare state changes bewijzen. Na de Engelse route wordt aanvullend een daadwerkelijk zichtbaar element met `Pricing` vereist.

## Preventie
Geen `force` clicks en geen versoepeling van control-level bewijs. De generieke body-voorwaarde is verwijderd; de specifieke UI-gates zijn juist strenger gemaakt op het echte gebruikersgedrag.
