# Supabase: 818 officiële migraties en één historische bron

De originele BRAIN-vervolgmeting is in productie hersteld en de succesvolle herhaalcontrole schreef nul extra gegevens. Tijdens de vrijgave van PR #5550 heeft de bestaande Supabase/GitHub-integratie de SQL al met versie `20261109152200` toegepast. Daarna werd de identieke idempotente functie via een afzonderlijke officiële SQL-migratie als versie `20261109152945` geregistreerd. Dit was onnodig en is als incident en preventieregel vastgelegd.

De providerhistorie is leidend en mag niet worden teruggedraaid of stilzwijgend geredigeerd. Daarom bewaren we beide werkelijk uitgevoerde versies: het originele bestand op versie `20261109152200` en een exacte bronspiegel op versie `20261109152945`. De canonieke lock krijgt precies deze twee reeds toegepaste versies. Zo voorkomt de originele CI-/Supabase-keten een mismatch tussen productie- en repositoryhistorie; een nieuwe omgeving kan beide idempotente versies veilig lezen zonder een tweede scheduler of publicatie.

**Preventieregel voor release-agents:** na beschermd PR-merge eerst altijd de **echte** Supabase-schema_migrations opvragen. Is dezelfde functionele migratie al via originele GitOps toegepast, dan geen aparte `apply_migration` uitvoeren. Versienummers en SQL-bronnen moeten exact overeenkomen; voer geen destructieve migratie- of historiebewerking uit om tellers te verbergen. Security-definer functie alleen bij `service_role`; echte publieksstatistieken zijn beschrijvend, geen causale groei.

Tests: `tests/brain-original-818-migration-ledger-parity-20261109.test.mjs`. BRAIN fingerprint `powerhouse|supabase|original-refresh-double-migration-history|20261109-v1`. Oorspronkelijk incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
