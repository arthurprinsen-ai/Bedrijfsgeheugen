# Login noindex SEO scope — 24 september 2026

## Root cause
De route `/inloggen` is bewust `noindex`, maar `inloggen.html` zat nog in de publieke SEO-inventory. Daardoor verwachtte de SEO-gate onterecht dat deze utility-route in `sitemap.xml` stond.

## Fix
`inloggen.html` is toegevoegd aan `PUBLIC_PAGE_EXCLUDES`. Daarmee blijft de login bereikbaar voor gebruikers, maar buiten de indexeerbare SEO- en sitemap-scope.

## Preventie
`tests/seo-login-noindex-scope-v1.test.mjs` borgt dat een noindex-authentication utility niet opnieuw als publieke SEO-route wordt geclassificeerd.

## Delivery
Deze recovery blijft onderdeel van obligation `pricing-terminal-live-proof-20260924-v1` en retriggert de canonieke Production Source Snapshot zodat de pricing/i18n-fix op exact dezelfde beschermde delivery-keten naar productie gaat.

## Verfijning na diagnose
Alleen `inloggen.html` uit de indexeerbare inventory halen bleek onvoldoende: de technische SEO-linkvalidator eiste daarna dat elke interne link naar `/inloggen` alsnog een indexeerbare canonical route was. De structurele fix is daarom een expliciete utility-routeklasse in het gedeelde contract: bereikbaar en geldig als interne bestemming, maar bewust `noindex` en niet in de sitemap. De technische SEO-gate accepteert alleen expliciet geclassificeerde utility-routes; onbekende niet-indexeerbare bestemmingen blijven fouten.
