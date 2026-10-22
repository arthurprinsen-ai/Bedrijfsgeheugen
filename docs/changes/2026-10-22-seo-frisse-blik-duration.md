# Frisse Blik afspraakduur op bedrijfsprocessen automatiseren

Datum: 2026-10-22

Bestaande canonieke pagina: https://www.bedrijfsgeheugen.nl/bedrijfsprocessen-automatiseren

## Bewijs en beslissing

De openbare pagina beloofde een gratis kennismaking van 30 minuten in het aanbod en de FAQ, maar bij de afsluitende CTA een halve dag. De bestaande repositoryregel `commercial-website|orders-first|existing-pages|v1` bevestigt de 30 minuten als canonieke kwalificatiestap. Dit is een copy- en conversieconsistentiefout; er is geen externe ranking-, lead- of omzetwinst gemeten.

## Wijziging

Vervang uitsluitend de tegenstrijdige duurzin bij de bestaande afsluitende CTA door een transparante beschrijving van de gratis 30-minuten Frisse Blik. Behoud URL, canonical, CTA-bestemming, prijs, vormgeving en de bestaande intent-owner. Voeg de Engelse statische vertaling en een regressie toe.

## Acceptatie

`tests/seo-order-money-v2.test.mjs`, toepasselijke SEO/CRO/i18n gates, exact-head Required CI/CodeQL, protected merge, exact-main Netlify productie-identiteit, openbare pagina en functionele `/frisse-blik` CTA moeten slagen. Geen LIVE_PROVEN zonder provider/readback; echte CTA/lead/order/omzetuitkomsten uitsluitend na gemeten bronbewijs.
