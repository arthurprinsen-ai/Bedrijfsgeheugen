# Registry alignment and canonical link owner (2026-10-27)

## Probleem
- Edge-deploy van `powerhouse-composio-linkedin-setup` faalde: productie-migratieregistry bevat versie `20261027170326` die niet in de repo staat.
- De bedrijfslink werd aan de testgebruiker gekoppeld, doordat de vorige statusrecord die gebruiker bewaarde.

## Wijziging
- `supabase/migrations/20261027170326_news_approved_contacts_first_v1.sql`: exact dezelfde, idempotente definitie als `20261027180000`, zodat registry en repo overeenkomen. Geen schema- of datawijziging.
- `powerhouse-composio-linkedin-setup`: bedrijfslink gebruikt altijd `USER_ID` (`bedrijfsgeheugen-owner`).
- Test: `tests/brain-registry-alignment-and-link-owner-20261027.test.mjs`.

## Uitgevoerd buiten de repo (productie-acties, akkoord van Arthur)
- Drie testverbindingen in Composio verwijderd (`ca_PrsY1ytSFpyY`, `ca_yXxAhLFH0931`, `ca_hOSdxQro3PTZ`).
- Statusrecord `linkedin-composio-setup-current-state-v1` op `bedrijfsgeheugen-owner` gezet.

## Open
- Database-registerregel `20261027170326` staat nog in productie; na merge hoort de repo-match dit te dekken.
- Persoonlijke en bedrijfs-OAuth-link pas maken na geslaagde deploy.
