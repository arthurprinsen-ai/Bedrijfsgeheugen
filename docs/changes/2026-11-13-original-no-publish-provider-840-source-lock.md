# 13 november 2026 — originele Supabase source-lock voor toegepaste migratie 840

De oorspronkelijke provider `adhjwmvyoixzjtmiroln` heeft op 2026-11-13 06:53:13 UTC **840 unieke, werkelijk toegepaste** migraties, inclusief `20261113062500 / original_no_publish_terminal_handoff_ack_v1`. De beschermde main-branch bevat de originele uitvoerbare SQL uit PR #5709, maar `supabase/migration-history.lock.json` registreert nog 839. Dit is een **bronregistratie-achterstand**, geen opdracht om SQL opnieuw toe te passen.

Deze correctie voegt uitsluitend de echte provider-identiteit als 840e rij aan het **bestaande canonieke source-lockbestand** toe, zonder vorige 839 te wijzigen. ONE BRAIN-leerregel, append-only activiteitenlog en dit begrijpelijke verslag zijn dezelfde change closure. De originele beschermde Required/CodeQL en migratieregressies moeten groen zijn; na merge moet de 840/840 bron/provider-pariteit opnieuw worden uitgelezen.

**Geen nieuwe database-migratie, schema-aanpassing, scheduler, publisher, extra worker of omzeiling.** Een echte tenant-consumer-ACK, Instagram Meta-publicatie en Heartbeat/Portal-uitkomst zijn aparte bewijzen en worden niet als groen gemarkeerd.

Onderlinge oorzaak: Mira's bestaande [PR #5708](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5708) wacht door deze originele migratie-bronpariteit op een nieuwe succesvolle preflight. Volg de bestaande [originele BRAIN-keten #4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198).
