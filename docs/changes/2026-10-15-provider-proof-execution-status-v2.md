# POWERHOUSE publicatiebewijs in dagelijks dashboard herstellen

De oude SQL-functie `public.powerhouse_execution_status(date)` gebruikte `public.social_posts` voor de teller `published_social_count`, maar de actuele Composio-publicaties schrijven hun aantoonbare levering naar `powerhouse_channel_decisions.delivery_evidence`.

Op 15 oktober 2026 stonden de blog en LinkedIn-bedrijfspost met onafhankelijk publiek/providerbewijs geregistreerd, terwijl `social_posts` nul regels had. De persoonlijke LinkedIn-post beschikte wel over een provider-ID maar LinkedIn gaf bij uitlezen `403 Forbidden`, zodat `provider_truth_verified=false` bleef. De live functie rapporteerde onterecht `3/3 delivered` en `0 social`.

De nieuwe functie behoudt de bestaande API en zevenkanaalsbeslisstructuur, maar telt alleen daadwerkelijk gepubliceerde beslissingen met een niet-lege leveringsreferentie, `provider_truth_verified=true` en `provider_status=published`. De sociale teller telt alleen LinkedIn persoonlijk, LinkedIn bedrijf en Instagram onder dezelfde bewijsvoorwaarden. Geplande publicaties, claims zonder externe providerreadback en een post-ID met 403 blijven onopgelost. Andere hold-kanalen worden niet stilzwijgend geactiveerd.

Verwachte bewijswaarheid voor 15 oktober: drie bedoelde publicaties, twee bewezen leveringen (blog + bedrijfspost), één onbewezen persoonlijk bericht, één bewezen sociale publicatie. De werkelijke uitrol en providerbewijsgates moeten onafhankelijk worden bevestigd. Geen extra job, duplicaatpublicatie, credentiaalbewerking of SQL-historieaanpassing.

**NULL-randgeval:** de booleaanse providerbewijsvoorwaarde is nu volledig omhuld met `coalesce(..., false)`. Bij ontbrekende `delivery_evidence`, `delivery_ref` of een lege providerstatus wordt de beslissing expliciet onopgelost; SQL `UNKNOWN` kan haar niet laten verdwijnen uit de telregels.
