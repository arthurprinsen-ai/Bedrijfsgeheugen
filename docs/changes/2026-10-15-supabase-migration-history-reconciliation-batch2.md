# Supabase migratiehistorie — batch 2/2 (15 oktober 2026)

PR #4383 is beschermd gemerged als `6cec28b051ae0ba5eeedaa2e1645b9f631934b93` na groen Required, CodeQL en een echte native Supabase Preview.

Deze PR herstelt de **zeven** nog ontbrekende productie-geregistreerde migratieversies:
`20261014130614`, `20261014133344`, `20261014140905`, `20261014144228`, `20261014162635`, `20261014163411`, `20261014163916`. De SQL komt rechtstreeks uit de opgeslagen productie-`supabase_migrations.schema_migrations.statements`, niet uit bedachte no-op migraties.

De drie resterende oorspronkelijke versies `20261014191753`, `20261014193133` en `20261014195237` staan **al** in actuele `main` door het parallel gemergede portaalwerk. Een vergelijking met het oorspronkelijke productieledger toont dezelfde uitvoerbare SQL na verwijderen van commentaar en opmaakverschillen. Bestaande gecontroleerde bestanden worden daarom bewaard, niet overschreven. Samen zijn de laatste tien versie-identiteiten aanwezig, maar deze PR voegt slechts zeven toe.

De publieke SECURITY DEFINER-runtime-mux-migratie behoudt de bestaande productierechten: `anon` en `authenticated` kunnen niet uitvoeren, `service_role` wel. De review gate accepteert alleen de eerder uit de productiebron gecontroleerde immutable Git-blob `9609cd69f89dbe746bd36b96b8bb7c0aaeca38f7`; gewijzigde SQL verliest de uitzondering.

**Niet bewezen:** volledige productiepariteit, schema-replay van de elf Git-only versies, live Edge-bronpariteit, Supabase Actions-tokenherstel of providerpublicaties. Geen database-SQL uitgevoerd, geen historie aangepast, geen beveiligingscontrole overgeslagen. De geslaagde native Supabase Preview, Required en CodeQL voor deze exacte branch blijven mergevoorwaarden.
