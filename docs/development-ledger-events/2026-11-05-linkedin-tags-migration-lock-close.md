# 2026-11-05 — Lock-rij tags-migratie toegevoegd

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `supabase|migration-lock|809th-provider-applied-source-lock-lag|20261105-v1`.
- Aanleiding: tags-migratie `20261105165702` is door de provider toegepast en de bron is gemerged (#5467); de lock mag pas daarna volgen en niet in dezelfde PR.
- Wijziging: precies één rij in `supabase/migration-history.lock.json`, geen SQL.
- Controle: provider 809 = bronbestanden 809; lock 808 voor deze PR.
- Tests: `tests/brain-linkedin-tags-lock-close-20261105.test.mjs`. Learning: `brain/learning/2026-11-05-linkedin-tags-lock-close-v1.json`.
- Geen effectclaim: de natuurlijke lus-run en een gepubliceerde tagpost zijn nog niet bewezen.
