# 13 november 2026 — oorspronkelijke Supabase-migratielock exact 841/841

## Providerbewijs
Lees uitsluitend de **bestaande** Supabase-productieadministratie `supabase_migrations.schema_migrations`: op `2026-11-13T07:48:12.734Z` waren 841 versie-identiteiten toegepast en 841 uniek. De laatst werkelijk toegepaste was `20261113071500 / original_content_handoff_source_revision_receipt_v1`, als oorspronkelijke content-ONE BRAIN-release beschermd gemerged in [PR #5714](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5714).

De originele bronregistratie `supabase/migration-history.lock.json` op main `462eca7c5a36565a449f1a28a1a344245ad4dd60` bevatte nog 840 versies, laatst `20261113062500`. Dat is concreet een **historiebron-drift van één**, geen ontbrekende toepassing van SQL.

## Herstel door dezelfde originele GitOps-eigenaar
Voeg uitsluitend de werkelijk toegepaste 841e `version/name` toe aan de reeds bestaande lock; bewaar de vorige 840 bytegewijs als identiteiten. Actualiseer alleen het provider-afgeleide `captured_at`. Schrijf **geen** SQL opnieuw, maak geen extra migratiebestand, worker, publisher of scheduler; wijzig geen klantgegevens of authorisaties.

## Permanent agent-/skillcontract
De originele betrouwbaarheid-/datakwaliteitsagents en de bestaande `.agents/skills/powerhouse-self-improvement-layer/SKILL.md` borgen na iedere productiemigratie de 3-voudige vergelijking: provider werkelijk toegepast, ongewijzigde SQL-source, en precies dezelfde `(version,name)` in de lock. Test `tests/brain-original-provider-841-source-lock-20261113.test.mjs` eist exacte 841e identiteit en volledige inventarispariteit, maar bevriest toekomstige aantallen niet op 841.

## Onverminderd open
Deze reparatie maakt alleen de migratiehistorie weer precies controleerbaar. Zij bewijst **niet** dat de zes rode loops, zeven commerciële overdrachten, vier nog open e-mailafzenders, 181 social-learningverplichtingen, integrale twee-tenant Portal V2, experimenten of omzet hersteld zijn. Alle blijven hun oorspronkelijke owner, bewijsvereisten en vervolg krijgen. Status kandidaat tot exacte Required/CodeQL, beschermd main en onafhankelijke 841/841-bronreadback.