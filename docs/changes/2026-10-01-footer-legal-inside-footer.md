# Wijziging: juridische links staan nu in de footer

De footer bevat nu zichtbaar en rechtstreeks: Algemene gebruiksvoorwaarden, Privacybeleid, Cookiebeleid en Systeemstatus. De links staan in de canonical footer zelf zodat de shell-projectie ze sitebreed meeneemt.

Aanvullend productieherstel: de Netlify-build herstelt de homepage uit een pinned V18-payload. De vier links worden daarom nu ook in `tools/bouw-v18-production-core.mjs` in de daadwerkelijke productiefooter geïnjecteerd; de gedeelde footercomponent is gelijkgetrokken.
