# AanZET static i18n cache recovery — 28 september 2026

Fingerprint: `aanzet-static-i18n-cache-recovery-20260928-v1`.

De AanZET-radarcontent werd correct als publieke blogroute toegevoegd, maar de productiebuild staat bewust op `STATIC_I18N_REQUIRE_CACHE=1`. Nieuwe Nederlandse teksten zonder vooraf vastgelegde Engelse vertaling blokkeren daardoor productie.

De fix houdt die guard intact en voegt een deterministische cachepatch toe voor de nieuwe AanZET-blogtekst. Hiermee blijven Nederlands en Engels beide statisch reproduceerbaar en hoeft productie geen vertaalprovider aan te roepen.

Preventie: iedere nieuwe publieke contentroute moet voortaan in dezelfde candidate de volledige static-i18n-cachedekking meenemen en vóór merge de cache-completeness-regressie doorlopen.
