# 14 november 2026 — echte provider-856 historie in de ene migratiebron

De productie-SQL van [#5768](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5768) is onafhankelijk teruggelezen: Supabase heeft nu **856** echt toegepaste migraties met exact `20261114142500/original_outreach_feedback_consumer_ack_v2` (3 statements); de onveranderde bron-lock telde slechts 855. Deze wijziging voegt de werkelijk bewezen provideridentiteit **eenmaal append-only** toe aan `supabase/migration-history.lock.json`. Geen opnieuw uitvoeren van SQL, geen nieuwe scheduler, ontvanger of verzender.

Twee historische regressies controleerden ten onrechte een vaste oude slotpositie `at(-1)` en exacte oude lock-lengte. Zij bewaren voortaan de vaste historische 854/855-identiteiten op `applied[853]` en `applied[854]` en valideren `length>=N`, unieke oplopende geschiedenis en echte uitvoerbare SQL. De actuele bron-versus-provider lock blijft exact.

Eerste echte consumer-ACK van de wachtende originele e-mailactie is onafhankelijk bewezen, met echte DataForSEO NO_SOURCE-uitkomst en herstel op 15 november. Geen geverifieerde nieuwe Gmail-mail. Voor de aangepaste Edge-code geldt daarnaast de aparte GitHub Integration production readback; merge en native SQL zijn hiervoor geen vervanging.

P0 incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
