# 12 november — herclassificeer originele SKIPPED/provider-referentieoverdracht

## Bewezen productiebron

Er zijn 16 historische canonical `content_publication_obligations` met `status=SKIPPED` maar een opgeslagen `external_id`, `published_at` en/of `live_proven_at`: Instagram 5, LinkedIn bedrijf 4 en LinkedIn persoonlijk 7. Na een exact-source CAS-containment dragen alle 16 `republish_forbidden=true`, `possible_provider_side_effect=true`, `reconciliation_required=true` en de oorspronkelijke providerreconciliatie als eigenaar. Er is geen nieuw bericht verzonden. Onafhankelijke verbonden GET-controles op twee Instagram-IDs gaven 400 en op twee LinkedIn-URNs 403; die fouten bewijzen niet dat een oorspronkelijk provider side effect niet bestaat. 24-hex interne IDs zijn geen automatische externe provider ID.

De live bestaande `public.powerhouse_content_handoff_receipts_v1` (byte-identiek aan originele migratie `20261112162500`) behandelt elk van deze 16 in `IF NOT v_pub THEN` als `OVERDUE_PUBLICATION`, hoewel de eerste actie *de oorspronkelijke provider-ID controleren* moet zijn en publiceren onveilig is. De 439 oorspronkelijke open content/181 sociale leermetingen/5 commerciële verplichtingen worden niet administratief gesloten.

## Originele bron- en consumentcorrectie

De nieuwe append-only `supabase/migrations/20261112211000_original_skipped_provider_reference_readback_handoff_v1.sql` vervangt alleen de bestaande `powerhouse_content_handoff_receipts_v1` met een fail-closed branch vóór de ontbrekende-publicatie fallback. Uitsluitend historische `SKIPPED`-rijen met expliciete `source_state_conflict`, `reconciliation_required=true`, `republish_forbidden=true` en een bron-ID/tijd krijgen `OVERDUE_PROVIDER_READBACK`; dezelfde oorspronkelijke provider-publisher blijft eigenaar. De handoff bevat de oorspronkelijke bronreferentie en `provider_readback_verified=false`, en stuurt `ORIGINAL_EXACT_PROVIDER_OWNER_AND_POST_READBACK_REQUIRED` als echte volgende actie. De provider-gevalideerde `v_pub`, exacte meting, analyse, experiment, `FULFILLED`-gate, tenant, originele #171 cron, service-role-ACL en alle overige kanaalregels blijven onveranderd. Geen nieuwe scheduler, providercreate, rekening, tabel of fallback.

## Veilig vrijgeven en meten

Deze bron is een **PR-kandidaat, niet live**. Eerst protected Required, CodeQL en originele BRAIN/Preview-controles, daarna main-merge en de bestaande Supabase native GitOps-migratie. Pas na `supabase_migrations.schema_migrations`-readback en live `pg_get_functiondef` mag deze migratie als actief worden gemeld. De officiële toegepaste provider-lock `supabase/migration-history.lock.json` wordt niet vooruitgeschreven; append pas na werkelijk toegepaste productieversie. De originele #171 assurance moet daarna bij een bestaande historische rij de nieuwe `OVERDUE_PROVIDER_READBACK`-stage, exacte eigenaar, ID en `OPEN` aantonen. Statusverbetering is géén onafhankelijk provider-GET, meting, omzet of causale leeruitkomst.

Regressie: `tests/brain-original-skipped-provider-reference-readback-handoff-20261112.test.mjs`. Leren: `brain/learning/2026-11-12-original-skipped-provider-reference-handoff-v1.json`. Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
