# Herstel Supabase migratiehistorie — batch 1 van 2 (15 oktober 2026)

De productiekoppeling van Supabase staat op **MIGRATIONS_FAILED**. De broncontrole vond 43 werkelijk toegepaste migraties waarvan de SQL niet als bestand in GitHub stond. Daarnaast bevatte GitHub 21 versienummers die niet door de database als toegepast zijn aangemerkt.

Deze eerste beperkte herstel-PR herstelt **33 van de 43** ontbrekende historische bestanden uit de opgeslagen oorspronkelijke database-SQL, en verwijdert **tien** Git-aliasen waarvan exact is bewezen dat dezelfde SQL onder het geregistreerde versienummer reeds is uitgevoerd. De resterende tien ontbrekende bestanden volgen in een afzonderlijke PR vanwege de maximale omvang van 40 gewijzigde bestanden.

De elf Git-only migraties zonder exacte bronmatch zijn niet gewijzigd. Niet blind opnieuw uitvoeren: enkele kunnen huidige functies of cronroosters overschrijven.

Geen wijziging aan databasehistorie, geen productie-Edge-deploy en geen bewezen e-mails, DM's of publicaties. Eindacceptatie vereist beide beschermde PR's, echte migratievalidatie, geautoriseerde Supabase-deployment en providerreadback.

## Historische SECURITY DEFINER-ACL readback, 2026-10-15

The original stored migration SQL for versions 20261010070959 and 20261011083139 was compared to the exact Git files (both content-identical excluding the final newline). Live pg_proc/proacl readback for both affected public functions confirmed SECURITY DEFINER=true, anon EXECUTE=false, authenticated EXECUTE=false, service_role EXECUTE=true and explicit deterministic search_path. The existing security gate's historical-production-mirror SHA allowlist is extended only for those two byte-exact Git blobs. Any modification changes the SHA and restores fail-closed security validation; no PUBLIC_INTENTIONAL escape and no loosening of production ACLs.

## Preview-specifieke cron-identiteitsfout — gecontroleerde replayaanpassing

De eerste echte Supabase Preview op PR #4383 faalde bij historische versie `20261011083139` met `CANONICAL_CONTENT_EXECUTOR_IDENTITY_MISMATCH`. De originele productierecord heeft een harde verwijzing naar pg_cron job 140. De productie-readback bevestigde: 59 cron-jobs, job 140 actief, `powerhouse-content-orchestrator-daily-v1`, schema `27 * * * *` en commando `select public.powerhouse_content_closed_loop_tick_v1();`. De geïsoleerde preview had **52 andere cron-jobs**, maar niet de productiecron of een andere `powerhouse-content-orchestrator%`-eigenaar; job-ID's en de productspecifieke schedulerstatus worden niet op dezelfde wijze gerepliceerd.

Daarom is precies dat ene eerder geïmporteerde SQL-bestand bewust niet meer byte-identiek aan de oorspronkelijke productieregistratie. Het originele, ongewijzigde bestand is nog reproduceerbaar via Git blob `043b74b1b87e2f0d45b332ad9f579878e6e60bce` en `supabase_migrations.schema_migrations.statements` in productie. De versie-identiteit en het werkelijke functionele migratiedoel blijven hetzelfde.

De replayaanpassing doet uitsluitend een no-op wanneer job 140 afwezig is **én er geen andere `powerhouse-content-orchestrator%`-eigenaar aanwezig is**. Als er enige cron-job bestaat en job 140 ontbreekt, of als naam of commando niet exact passen, blijft de oorspronkelijke harde fout behouden. Er wordt nooit een preview-cron aangelegd of naar het productie-endpoint verzonden. De productiejob wordt niet gewijzigd.

De aangepaste migration bevat bovendien expliciet `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` en uitsluitend een `GRANT ... TO service_role`; dit was al de geverifieerde productie-ACL. Het oude immutable-mirror-SHA-exemptiepad voor dit ene SQL-bestand is uit de security-gate verwijderd, waardoor de normale SECURITY DEFINER-veiligheidscontrole deze kandidaat opnieuw inspecteert. Regressietests controleren het lege-preview-pad, het fail-closed-pad en de ACL. Een groene volledige Supabase-preview en exacte productiereadback blijven vereist; deze bronwijziging is op zichzelf **geen** acceptatie.


## Tweede echte Supabase Preview-fout: ontbrekende identity-graph-eigenaar

De volgende provider-preview heeft het content-cron-herstel gepasseerd, maar faalde met `job_id can not be NULL` bij het eerstvolgende `cron.alter_job` in de historische migratie `20261011111234`. De native preview heeft veel reguliere jobs, maar geen `powerhouse-identity-graph-v1`; productie bezit wél de actieve job 138. De twee oorspronkelijke, in productie daadwerkelijk toegepaste SQL-scripts `20261011111234` en `20261011111903` verwachtten onvoorwaardelijk dat hun subquery een job-id oplevert.

Beide source-mirrors zijn daarom expliciet replaybaar gemaakt met dezelfde fail-closed-eigenaarselectie: alleen de exact bestaande job `powerhouse-identity-graph-v1` mag via `cron.alter_job` worden aangepast. Is die in de preview afwezig, dan volgt **geen nieuwe scheduler** en geen wijziging; een gelijknamig/conflicterend `powerhouse-identity-graph%`-record veroorzaakt een harde fout. De ongewijzigde productie-SQL is reproduceerbaar via Git blobs `1cd548f57e39706ed25203391594f7db8c51e797` en `a514b402c3d53905d3cfc42de907dc5623a2a338`, plus het productionele migratieledger. Geen SQL is in productie opnieuw uitgevoerd. Afsluiting blijft afhankelijk van een onafhankelijke preview die verder komt dan deze twee migraties en van alle overige verplichte checks.


## Aanvullende historische cron-replaycontroles

Een voorafgaande code-audit identificeerde naast de eerste twee bestanden nog `20261011112359`, `20261011112921` en `20261013145630` als migraties die dezelfde niet-geïmporteerde productiejob 138 hardcoded vereisten. Ook deze drie zijn uitsluitend op de testbare bron aangepast: bewerk alleen de aanwezige canonieke `powerhouse-identity-graph-v1`-eigenaar; ontbreken hiervan zonder conflicterende naam is in preview een no-op, zonder nieuw cron-systeem of externe call. Bij een conflicterende identity-jobnaam blijft een harde fout staan.

De ongewijzigde oorspronkelijke SQL-blob-ID's waren respectievelijk `b9659bdff8c21d2e86ea9d6b90ef98776a3cc4d8`, `35f1e0c81113ad58b7dbbd8a4ad4b0c1ad03f5fc` en `2f540d7260cf9e6c060232a5b997a8d5af0fc82f`. Deze blijven via de oorspronkelijke Git-blobgeschiedenis en het onveranderde productie-migratieledger beschikbaar. Geen productiedatabasebewerking of migratiehistorieherregistratie is uitgevoerd.
