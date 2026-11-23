# P0 — Native Supabase-productiehistorie en ONE BRAIN-lock exact reconciliëren (2 november 2026)

**Eigenaar:** oorspronkelijke Supabase native GitOps, ONE BRAIN backend, Powerhouse delivery, parent #4198 en #4439. Geen nieuwe executor/scheduler. **Status:** SOURCE CANDIDATE, nog niet beschermd gemerged.

## Onafhankelijk waargenomen productiefeiten
Na het bronherstel PR #5256 op `main` SHA `63ab2db777fbb48bfbcf1a503c1b573ba7c32c8c` heeft originele Supabase **790 applied migration versions**. GitHub originele uitvoerbare `supabase/migrations/*.sql` bevat exact **790 dezelfde timestamp+name identities**: geen ontbrekende, verkeerde of dubbele identiteit in beide richtingen. Beide publicatiehandoff-versies `20261031133000` en `20261031135451` zijn opgenomen, alsook intake- en rechtenmigraties `20261102074013` en `20261102075243`. Deze laatste twee zijn ook in de productie-ledger aanwezig. PostgreSQL originele trigger-readback verifieert nieuwe scan identity claim en niet-betaalde offerteproposal; `anon` en `authenticated` kunnen beide interne SECURITY DEFINER triggers niet direct uitvoeren. Alle bestaande 58 scans en 9 offertes bleven intact; €0 gerealiseerde omzet.

De bestaande `supabase/migration-history.lock.json` was een legitieme **historische snapshot van 29 oktober** maar bevatte **784** entries. De oorspronkelijke test `tests/brain-supabase-migration-lock-provider-20261029.test.mjs` verwachtte permanent **774** entries. BRAIN postmerge #41412246916 rapporteerde 5.364 tests, 5.330 geslaagd, 32 mislukt; daaronder gemeten oude migratielockassumpties. De andere 29+ fouten in editorial, portal, blog, CRO en release zijn NIET opgelost door deze lock.

## Bronherstel en structurele regel
- Vul uitsluitend uit het volledig gelezen **officiële Supabase production provider ledger** de oorspronkelijke lock `source=supabase_migration_history`, actuele snapshotdatum en alle 790 version/name entries. Geen verzonnen, handmatig toegevoegde of verwijderde applied records.
- Bewijs voor de write de exacte bidirectionele Git source/provider parity met zero missing, zero extra, zero duplicate.
- Vervang alleen de verouderde 774-vastzetting door volledige lock-vs-source pariteit met minimale historisch gedocumenteerde 790 records. Houd de vier oorspronkelijke oktober-migraties gepind.
- Nieuwe `tests/brain-production-supabase-790-provider-source-parity-20261102.test.mjs` herhaalt exact 790 en publicatie mirror byte-parity, twee productie-claim-migraties, twee originele ACL REVOKE statements en scheidt lockbewijs van betaalde inkomsten.
- Agentskill `.agents/skills/powerhouse-delivery-concurrency/SKILL.md` verplicht voortaan de **bestaande GitOps-eigenaar** om na iedere geldige providerrelease de lock te actualiseren, of fail-closed dezelfde ONE BRAIN fingerprint te heropenen. Dit is een regel en test, geen nieuwe periodieke taak. De actuele officiële provider-toestand moet opnieuw zelfstandig worden gelezen; een op datum vastgezette lock is geen realtime database.

## Onafhankelijke sluitingsvoorwaarden
Bron PR Exact Required, CodeQL, origineel System Map, protected main, volgende echte volledige BRAIN-backend suite, en later reguliere normale original-agent run. De drie migratielocktests kunnen eerst groen worden, maar dat mag **niet** het BRAIN-gemiddelde of alle 15 Powerhouse loops als volledig groen tonen. Portaal original recovery audit blijft echte incidentdebt/paid-orders=0 tonen. Oorspronkelijke ONE BRAIN fingerprint `supabase|revenue-learning|migration-history-lock-stale-after-production-20261029` wordt hergebruikt; `proven_fix=NULL` tot apart normaal-run bewijs. P0 #4198 en #4439 blijven open.

**Historische bron:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41412246916  
**Oorspronkelijke productiebron:** project `adhjwmvyoixzjtmiroln`, `supabase_migrations.schema_migrations`, source SHA `63ab2db777fbb48bfbcf1a503c1b573ba7c32c8c`.
