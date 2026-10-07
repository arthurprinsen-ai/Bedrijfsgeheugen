# 2026-10-07 — Source Universe & Company Impact Engine v1

## Aanleiding

Portal V2 had al externe data voor onder meer wetgeving, arbeid, subsidies, economie en technologie, maar de bredere omgevingsradar en expliciete impactketen waren nog niet als één capability geborgd.

## Structurele wijziging

- Bestaande evidence spine en externe signalering hergebruikt.
- 45-domeinen taxonomie toegevoegd: 35 extern, 10 intern.
- Brede source catalog toegevoegd met onderscheid tussen publieke bron, provider, connector en handmatig bewijs.
- Derived signal-, company-impact-, action-candidate- en portal-snapshot projections toegevoegd.
- Impactscore faalt gesloten op ontbrekende company context; financiële waarde blijft NULL zonder bewijs.
- Bestaande `powerhouse_runtime_scheduler_mux_v3` uitgebreid; geen extra cron writer aangemaakt.
- Portal V2 Omgevingsradar toegevoegd onder Actueel & externe data.
- Netlify API blijft geauthenticeerd en server-side; intelligence tables hebben RLS en geen browser grants.
- Capability geregistreerd in System Map, Brain learning, skill en Loop Assurance.
- Action candidates krijgen geen provider-side-effect authority: alleen `READY` + `SCORED` company impact kan idempotent worden gematerialiseerd naar de bestaande `brain_obligations` authority.

## Delivery state

Source is op de feature branch vastgelegd. Productie mag pas LIVE_PROVEN heten na protected merge, Supabase migration/provider readback, Netlify exact-main readback en functionele Portal/API readback.
