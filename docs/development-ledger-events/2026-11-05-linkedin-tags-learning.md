# 2026-11-05 — Tag-leerlus: tags vastleggen en testen binnen de bestaande LinkedIn-lus

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `powerhouse|content-learning|linkedin-tags-not-captured-no-tag-dimension|20261105-v1`.
- Original owner: `bg_social_lus_cyclus`, aangeroepen door de bestaande powerhouse-content-orchestrator.
- Root: tags werden nergens als veld vastgelegd (4 van 97 LinkedIn-teksten met hashtag, 0 met vermelding), dus tags konden niet als variabele worden getest.
- Change: kandidaat-migratie in `supabase/migrations-pending/` met tagkolommen, extractie, idempotente backfill (alleen unieke kanaal-dag-koppeling) en de dimensie `tags` in de bestaande lus. Geen nieuwe sender, cron, tabel of publisher.
- Prevention: eerst per post vastleggen, dan testen; onbekend blijft NULL; één variabele per post; geen verzoek om te taggen.
- Tests: `tests/brain-linkedin-tags-learning-20261105.test.mjs`.
- Machine learning: `brain/learning/2026-11-05-linkedin-tags-learning-v1.json`.
- Human docs: `docs/changes/2026-11-05-linkedin-tags-learning.md`.
- Geen vals groen: de migratie is niet toegepast en niet in de lock. Eerst protected merge, daarna toepassing door Arthur met lock-rij in dezelfde wijziging, daarna een echte lus-run en een gepubliceerde post als bewijs. Effect van tags is onbewezen.
