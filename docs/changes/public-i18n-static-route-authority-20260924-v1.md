# Public i18n static-route authority — 24 september 2026

## Productiesymptoom
De live prijzenpagina kon zonder gebruikersklik al `Switching language failed. Try again.` tonen.

## Root cause
`assets/js/i18n.js` gebruikte op een niet-geprefixte publieke route nog de opgeslagen `bg_locale`. Als daar `en` stond, probeerde de Nederlandse `/prijzen` pagina tijdens initialisatie runtime te vertalen. Daarmee werd de publieke taalervaring opnieuw afhankelijk van de runtime translation provider, terwijl de canonieke architectuur juist statische `/nl/*` en `/en/*` routes gebruikt.

## Fix
Publieke pagina's bepalen hun initiële taal nu uitsluitend uit de route. Een niet-geprefixte route initialiseert als Nederlands. De opgeslagen taalvoorkeur blijft alleen runtime-authoriteit voor het portaal. Een expliciete publieke taalswitch navigeert naar de statische locale-route.

## Preventie en bewijs
De regression `tests/brain-public-i18n-static-route-authority-v1.test.mjs` borgt deze scheiding. Terminale closure vereist daarnaast `tools/site-shell/verify-pricing-i18n-production.mjs` op productie en mag geen zichtbare language-switch failure meer aantreffen.
