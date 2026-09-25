# Partiële static-i18n fallback

## Probleem
De productie-browsercheck bewees dat `/en/prijzen` nog de Nederlandse H1 toonde, terwijl de Engelse pricingvertaling al in de versioned static-i18n-cache stond.

## Root cause
`build-localized-routes.mjs` behandelde één ontbrekende vertaling ergens op de publieke site als een globale failure. Bij offline builds retourneerde `translateAll()` dan `null`, waardoor alle Engelse routes uit onvertaalde Nederlandse bron werden geschreven.

## Fix
De builder behoudt voortaan alle gevonden cached translations. Alleen ontbrekende strings blijven onvertaald en worden door de bestaande runtime fallback afgehandeld. Expliciete cache-validatie met `STATIC_I18N_REQUIRE_CACHE=1` blijft fail-closed.

## Productiecontract
Cached Engelse pricing-copy mag nooit meer door een ongerelateerde cache-miss elders op de site terugvallen naar Nederlands. `/en/prijzen` blijft onderdeel van de production browser readback.
