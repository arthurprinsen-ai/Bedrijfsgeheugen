# GA4-bronbewijs en kanaaltoeschrijving — 12 november 2026

**Één bestaande keten:** `bg-analytics-sync-composio` → originele ONE BRAIN-verplichting → Powerhouse SEO Order Engine → Heartbeat → Portal → effectmeting. Geen tweede scheduler.

## Wat er misging
De originele GA4-synchronisatie haalde daadwerkelijk negen paginarijen op (productie 12 november 12:05 UTC), maar kon nul metingen aan bekende social-postcampagnes koppelen en rapporteerde toch `ok`. Dezelfde schijnzekerheid ontstond bij bestaande duplicate- en Windsor-cache-readbacks. Een lege sociale campagnekoppeling betekent geen nul websitebezoekers. Rechtstreekse GA4-Windsor-data gaf in de gecontroleerde 30 dagen 37 sessies uitgesplitst naar verkeersbron.

## Herstel in de originele collector
De bestaande import onderscheidt nu provider-paginarijen, bronverkeer zonder sociale campagne, getagde campagnerijen en echt geverifieerd geïmporteerde postmetingen. Bij nul gekoppelde postmetingen of een onopgeloste getagde campagne staat de bronoverdracht op `PARTIAL`, niet volledig `IMPORTED/ok`. Bij echte, getagde campagneproblemen wordt uitsluitend de bestaande CAS-bewaakte ONE BRAIN-reparatie gebruikt. Legitiem zoek-/direct verkeer zonder social-campagne is bronbewijs en op zichzelf geen defect.

De SEO-agent en skill erkennen deze scheiding; de huidige GA4-/GSC-bronnen blijven voor website-acquisitie leidend. DataForSEO-zoekwoorddata (laatste bron 25 oktober) heeft nog een aparte versheidsopgave bij de oorspronkelijke uitvoerder.

## Grenzen en verplichte livecontrole
Dit is een source-code-herstel, niet automatisch nieuwe bezoekers, nieuwe artikelen of gerealiseerde omzet. Eerst Required/BRAIN/CodeQL, beschermde merge en correcte Supabase Edge-deploy van exact dezelfde versie. Daarna een natuurlijke originele scheduler-run met onafhankelijke `bg_ga4_csv_batches`- en `bg_ga4_sync`-readback, ONE BRAIN producer/consumer-ACK en reële website-/scan-/leadmeting. Zonder bewijs blijft de status OPEN.

Regression: `tests/brain-ga4-empty-source-autonomous-owner-20261104.test.mjs`.
Learning: `brain/learning/2026-11-12-ga4-source-attribution-truth-v1.json`.
Ledger: `docs/development-ledger-events/2026-11-12-ga4-source-attribution-truth-v1.md`.
Original fingerprint: `growth|ga4|observed-website-source-vs-social-post-attribution|20261112-v1`.
