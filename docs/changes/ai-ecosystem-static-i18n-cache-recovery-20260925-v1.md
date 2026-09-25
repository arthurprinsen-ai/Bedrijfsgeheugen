# AI-ecosysteem static i18n cache recovery — 25 september 2026

De nieuwe publieke AI-ecosysteempagina voegde 126 vertaalbare strings toe nadat de immutable Engelse productiecache was vastgezet. Omdat productie bewust `STATIC_I18N_NETWORK=0` en `STATIC_I18N_REQUIRE_CACHE=1` gebruikt, blokkeerde de build terecht.

Herstel:
- de bestaande money-page patch is verhuisd van de retired `.cache` authority naar `config/bg-static-i18n-en.d`;
- de AI-ecosysteempagina heeft een versioned Engelse cachepatch;
- drie regressietests zijn aangepast aan de immutable/offline productiepolicy;
- een executable cache-completeness regression draait `build-localized-routes.mjs --validate-cache`.

Preventieregel: nieuwe of gewijzigde publieke copy en de Engelse cache horen in dezelfde delivery-lineage.
