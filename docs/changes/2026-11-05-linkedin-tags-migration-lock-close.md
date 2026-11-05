# 2026-11-05 — Lock-rij voor de toegepaste tags-migratie

Migratie `20261105165702_original_linkedin_tags_learning_v1` is op 5 november 2026 na Arthurs opdracht ("Zet live") op de provider toegepast en de bron is gemerged in PR #5467. De PR-gate staat een lock-rij in dezelfde PR niet toe, dus deze aparte PR voegt alleen die ene rij toe.

Onafhankelijke controle voor het toevoegen: provider 809 migraties, bronbestanden 809, lock 808; het enige verschil is deze migratie. Er wordt geen SQL uitgevoerd.

Na de merge moeten lock, bron en provider alle drie 809 tonen. Nog niet bewezen: een natuurlijke lus-run met `tags_backfill.state = OK`, een gepubliceerde post met drie hashtags en enig effect van tags.
