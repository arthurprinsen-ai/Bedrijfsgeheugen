# Supabase: 818 officiële migraties en één historische bron

De originele BRAIN-vervolgmeting is in productie hersteld en de succesvolle herhaalcontrole schreef nul extra gegevens. Tijdens de vrijgave van PR #5550 heeft de bestaande Supabase/GitHub-integratie de SQL al met versie `20261109152200` toegepast. Daarna werd de identieke idempotente functie via een afzonderlijke officiële SQL-migratie als versie `20261109152945` geregistreerd. Dit was onnodig en is als incident en preventieregel vastgelegd.

De providerhistorie is leidend en mag niet worden teruggedraaid of stilzwijgend geredigeerd. Daarom bewaren we beide werkelijk uitgevoerde versies: het originele bestand op versie `20261109152200` en een exacte bronspiegel op versie `20261109152945`. De canonieke lock krijgt precies deze twee reeds toegepaste versies. Zo voorkomt de originele CI-/Supabase-keten een mismatch tussen productie- en repositoryhistorie; een nieuwe omgeving kan beide idempotente versies veilig lezen zonder een tweede scheduler of publicatie.

**Preventieregel voor release-agents:** na beschermd PR-merge eerst altijd de **echte** Supabase-schema_migrations opvragen. Is dezelfde functionele migratie al via originele GitOps toegepast, dan geen aparte `apply_migration` uitvoeren. Versienummers en SQL-bronnen moeten exact overeenkomen; voer geen destructieve migratie- of historiebewerking uit om tellers te verbergen. Security-definer functie alleen bij `service_role`; echte publieksstatistieken zijn beschrijvend, geen causale groei.

Tests: `tests/brain-original-818-migration-ledger-parity-20261109.test.mjs`. BRAIN fingerprint `powerhouse|supabase|original-refresh-double-migration-history|20261109-v1`. Oorspronkelijk incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.


## 9 november — definitieve gecorrigeerde herstelroute (één gecontroleerde kandidaat)

De geplande migratielock-in-3-PR's is **afgekeurd** door de onafhankelijke Supabase Preview: een lock-only 817-PR kan geen previewdatabase opstarten terwijl productie een 818e migratie-identiteit bevat zonder bronbestand. De eerdere ambitie om alleen het eerste lock-record te mergen wordt daarom nadrukkelijk niet als mogelijk of voltooid beschouwd.

De originele beveiligde admission accepteert in **één zeer smal herstelgeval** beide reeds provider-toegepaste identiteiten samen, zonder productie-DDL uit te voeren: bestaande 816 lockregels moeten byte-/inhoudelijk hetzelfde zijn, protected base-commit moet exact `3e55c792504ddbaf0916244213c58b9e827f120e` zijn, nieuwe bronfile alleen `20261109152945_original_social_provider_refresh_learning_v1.sql`, inhoud exact gelijk aan reeds beschermd `20261109152200` én onafhankelijk gemeten Supabase-migratiebody MD5 `0f713650278cf68f47011ec97ffd22f9`, lock eindigt exact op twee bevestigde provider-ID's en telt 818. Onbekende wijzigingen blijven geweigerd. **Vereiste Supabase Hosted Preview blijft actief en bepaalt onafhankelijk of de providerhistorie met de herstelde bron klopt.** Geen merge bij mislukte Required/CodeQL/Preview.

Deze herstelroute verzwakt de gewone migratiepoort niet; de uitzondering is onbruikbaar met enig ander base-SHA, migratie-ID, SQL-body, tenant, oude historie of extra file. Na beschermde merge verifieer 818 bronbestanden = 818 lockrijen = 818 werkelijk toegepaste provider-ID's en geen nieuwe SQL-uitvoering. Negatieve tests: `tests/brain-verified-provider-818-history-reconciliation-20261109.test.mjs`.
