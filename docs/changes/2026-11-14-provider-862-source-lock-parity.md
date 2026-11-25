# 14 november 2026 — één originele Supabase-bronhistorie 862/862

P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Dit is de huidige versie van de originele immutable production migration source lock, geen parallel distributiesysteem.

## Oorspronkelijke providerbevestiging
Supabase native productie `adhjwmvyoixzjtmiroln` bevatte 862 daadwerkelijk toegepaste migraties. De eerste 861 originele `supabase/migration-history.lock.json` versie- en naampaar-records matchten exact, 0 prefix-conflicten. Enig ontbrekend paar: `20261114211500 original_public_business_email_dispatch_v1`, reeds native-applied door de beschermde bestaande commerciële PR #5787, met daadwerkelijk uitvoerbaar bronbestand op main. Onafhankelijke SQL/native readback 2026-11-14 19:15:21 UTC.

## Gerichte append-only correctie
Voeg uitsluitend het 862e **al provider-toegepaste** versie/naampaar toe. Wijzig geen productiedatabasecode, grant, RLS, cron, queue, verzender, agents, publicatie, consent of bronhouderschap. De originele ONE BRAIN machine-learning-, changelog- en ledgerbestanden leggen oorzaak, bewijs, eigenaar, preventie en regressietest vast. Enige echte owner: originele Supabase source-lock release en P0 #4198.

## Beschermde volgende keten
Huidige originele bronconsumptie-PR [#5797](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5797) bevat dezelfde bestaande Reliability/Data Quality-agent- en source-universe-skillregels, met **nog niet toegepaste** voorgestelde migratie `20261114230000`. Dit lockherstel is niet bewijs dat die functionele PR live is, noch dat provider-sends, consumer-ACK, omzet of next-run learning zijn bewezen. Vereist exact-head Required, native Supabase Preview, CodeQL, protected merge en onafhankelijke main-provider-pariteit 862/862. Nieuwe oorspronkelijke PR-migraties worden nooit vooraf als toegepast geregistreerd.

Preventieregel: elke provider-migratierelease moet source-lock-pariteit met exact version/name als afzonderlijk geverifieerd handoffbewijs dragen voordat de volgende bronmigratie groen kan zijn. Geen tweede cron/scheduler om de checker te laten slagen.
