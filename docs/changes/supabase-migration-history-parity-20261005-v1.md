# Supabase migration history parity hersteld

Datum: 5 oktober 2026  
Obligation: `supabase-migration-history-parity-20261005-v1`

Na merge van PR #3740 faalde de Supabase Preview-check met `Remote migration versions not found in local migrations directory`.

De eerste readback vond 296 productie-migratieversies zonder corresponderend bestand in `main/supabase/migrations`. Tijdens de recovery kwam daar één nieuw remote-only versie-alias bij voor de reeds op GitHub aanwezige closed-loop-v2 SQL. In totaal zijn daardoor 297 productieversies canoniek gespiegeld.

De originele SQL is gereconstrueerd uit `supabase_migrations.schema_migrations.statements` of, voor de laatste versie-alias, gekoppeld aan de byte-identieke reeds gemergde GitHub blob. Er zijn geen lege placeholder-migraties aangemaakt.

Actuele readback: remote-only migratieversies = 0.

Daarnaast is `Supabase Preview` nu een verplichte branch-protection check op `main`, naast `test` en `CodeQL javascript-typescript`. Daardoor blokkeert dezelfde driftklasse voortaan de merge in plaats van pas post-merge zichtbaar te worden.

Preview recovery: de mislukte disposable Supabase preview branch voor PR #3741 is na de replay-idempotence fix gereset. De volgende PR synchronize moet de volledige migration history opnieuw vanaf een schone preview database afspelen.

## Closure refresh

Exact candidate `5375bafbf4f60bc7005c530d69edbc19bcad9250` retains the recovery evidence after the latest main synchronization. Remote-only migration parity remains 0 and the historically context-sensitive autonomy trigger patch is replay-idempotent: old call is replaced, already-patched state is accepted, every other state fails closed.
