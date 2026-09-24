# Netlify Vault proxy expiry hard boundary — 24 september 2026

## Bewijs
Production Source Snapshot run `36010221414` draaide op main SHA `dbb0c54d8685b63f2d31f0105fae36f0b1771a10`.

De GitHub OIDC stap slaagde. Daarna:
- linked repository build trigger: `ok=false`;
- MCP fallback upload: `401 Unauthorized`;
- productie bleef op deploy `6ab5131f10d7810008497634`.

Daarmee is de foutklasse deploy-authenticatie/credential-expiry, niet website-, pricing-, SEO- of i18n-code.

## Preventie
Bij deze combinatie stopt Powerhouse met applicatiecode wijzigen. Alleen geautoriseerde credential-rotatie in de secret store mag delivery hervatten. Na herstel blijft exact SHA + providerstatus + browser-readback verplicht voor `LIVE_BEWEZEN`.

De tijdelijke credential zelf wordt nergens in GitHub, documentatie of logs opgeslagen.
