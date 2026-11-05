# 2026-11-05 — Tags als leervariabele in de bestaande LinkedIn-lus

## Wat en waarom
Arthur wil tags (hashtags) uit posts gebruiken om te leren wat werkt. De meting van 5 november liet zien dat dat nog niet kon: van 97 LinkedIn-teksten hadden er 4 een hashtag, 0 een vermelding, en nergens bestond een tagveld. Zonder vastgelegde variabele valt er niets te testen.

## Wat verandert (als de migratie is toegepast)
- `bg_post_kenmerken.tags` en `tags_bron`: de hashtags per post. `{}` betekent gekoppelde tekst zonder hashtag, `NULL` betekent onbekend.
- `bg_tags_uit_tekst(text)`: haalt hashtags uit een tekst (na begin, spatie of haakje, beginnend met een letter, kleine letters, unieke waarden).
- `bg_post_tags_backfill()`: koppelt posttekst aan een post alleen bij een 1-op-1 match per kanaal en dag met een gepubliceerd artifact. Bij meerdere posts of artifacts op dezelfde dag blijft het `NULL`. Opnieuw draaien verandert niets.
- `bg_social_lus_cyclus`: dezelfde functie als vóór deze wijziging, met de dimensie `tags` (`drie_hashtags`, `geen_hashtags`) voor bedrijf en persoonlijk, en de backfill aan het begin. Een fout in de backfill breekt de lus niet maar komt zichtbaar terug als `tags_backfill`.

## Wat niet verandert
Geen nieuwe cron, tabel, sender of publisher. `social_posts` en `social_metric_snapshots` worden niet geschreven. De lus kiest nog steeds één variabele per post, het eigenaarbesluit van 5 november (één experiment-eigenaar) blijft gelden, en `bg_social_lus_beoordelen` is ongewijzigd.

## Regels voor de tag-instructie
Precies 3 inhoudelijke hashtags op een eigen regel, geen merkhashtags, geen verzoek om te taggen, liken of delen, geen winnaar zonder controle. Een uitspraak over effect vraagt minimaal 6 posts per variant en een geverifieerde baseline.

## Toepassen (voor Arthur, via de beschermde route)
1. Het bestand staat bewust in `supabase/migrations-pending/` zodat de lock-tests (`lock = executable migrations`) niet rood worden voor een migratie die nog niet op de provider staat.
2. Pas `20261105160000_original_linkedin_tags_learning_v1.sql` één keer toe op de provider en lees de functies terug.
3. Verplaats het bestand in dezelfde wijziging naar `supabase/migrations/`, voeg de lock-rij toe aan `supabase/migration-history.lock.json` en zet `captured_at` op het echte observatiemoment. Nooit de SQL twee keer uitvoeren.
4. Bewijs daarna: een natuurlijke lus-run geeft `tags_backfill.state = OK`; `posts_zonder_tagbron` laat zien hoeveel posts onbekend blijven.

## Terugdraaien
Kolommen `tags` en `tags_bron` droppen en `bg_social_lus_cyclus` herstellen vanuit `20261105080000_original_linkedin_learning_source_truth.sql`.

## Gedrag nog niet bewezen
Lokaal gecontroleerd op Postgres 16 met nagebouwde tabellen (11 posts getagd, 3 onbekend gelaten, tweede run 0 wijzigingen, tagdimensie gekozen met expliciete instructie). Nog niet bewezen: toepassing op de provider, een echte lus-run, een gepubliceerde post met drie hashtags en enig effect op bereik of reacties.

Tests: `tests/brain-linkedin-tags-learning-20261105.test.mjs`. Machine learning: `brain/learning/2026-11-05-linkedin-tags-learning-v1.json`.
