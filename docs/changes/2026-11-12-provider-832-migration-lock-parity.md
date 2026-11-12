# Provider-bestaande migratie 832/832 exact in source-lock borgen

12 november 2026. **Oorspronkelijke Supabase migration-history owner, geen nieuwe executor.** Productieproject `adhjwmvyoixzjtmiroln` bevat **832** daadwerkelijk toegepaste migraties, de laatste `20261112184500` / `original_daily_post_publication_metric_ack_v1`. De originele SQL staat al op main met blob `65d17b46f20448d1c41add348df8d5b723861994`. De Git source-lock telde 831 versies, waardoor de beschermde SEO-score PR #5659 faalde op migratie-pariteit.

Deze herstelkandidaat voegt **uitsluitend** de door de provider bevestigde versie en naam toe in `supabase/migration-history.lock.json`. Bestaande 831 records blijven ongewijzigd; dit is geen DDL, herdeploy, brondatafabricage of nieuwe scheduler. Provenance: provider `supabase_migrations.schema_migrations` 832/832 en de op main bewaarde echte SQL.

Beveiligde acceptatie: exacte Required + CodeQL en integriteitstest; protected merge; originele main 832/832 + provider 832/832 opnieuw lezen. Daarna moet de oorspronkelijke SEO-kandidaat #5659 op de nieuwe main worden herbeoordeeld. Geen websitepublicatie of omzetbewijs wordt door deze lockherstelactie geclaimd.
