# Public copy gekoppeld aan statische Engelse cache — 25 september 2026

## Probleem
Na de bewezen versioned cache veranderde publieke websitecopy opnieuw. De homepage en nieuwe AI-ecosysteempagina voegden samen met de money-page delta 126 vertaalbare strings toe. Productie is bewust cache-only en faalde daarom terecht gesloten.

## Oplossing
- 126 bronstrings krijgen een versioned Engelse cachepatch.
- Productie blijft STATIC_I18N_NETWORK=0 en STATIC_I18N_REQUIRE_CACHE=1.
- Twee historische regressies die nog provider/network-fallback verwachtten zijn aangepast aan de huidige fail-closed authority.
- Nieuwe publieke copy moet voortaan zijn cachepatch in dezelfde delivery-lineage meenemen.

## Terminal bewijs
Protected merge is niet genoeg. Exacte Netlify production SHA en een echte NL naar EN naar NL browserroundtrip blijven verplicht.
