# Recovery: workshopscan production via complete static i18n cache

De workshopscan stond al op protected main, maar de productiepromotie stopte terecht: de statische Engelse vertaalcache was niet volledig voor de actuele website-output. Omdat productie fail-closed staat, blokkeert één ontbrekende vertaling de hele Netlify-build.

Deze recovery vult de ontbrekende vertalingen aan in de canonieke cachepatch. De beveiliging wordt dus niet uitgezet: `STATIC_I18N_REQUIRE_CACHE=1` blijft leidend.

## Verificatie
1. pre-merge Netlify-build-parity;
2. protected merge;
3. exact-main Netlify-deploy;
4. productie-readback van `https://www.bedrijfsgeheugen.nl/scan`;
5. daarna pas LIVE claimen.
