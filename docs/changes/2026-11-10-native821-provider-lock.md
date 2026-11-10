# Originele native migratie 821: provider-lock nauwkeurig synchroniseren

De originele Supabase-productie heeft na de beveiligde merge van [PR #5556](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5556) de nieuwe, slechts eenmaal uitgevoerde migratie `20261110123000_original_content_handoff_no_aging_gap_v2` toegepast. Onafhankelijk uitgelezen: **821** provider-identiteiten, waaronder die nieuwe versie. GitHub main bevat 821 SQL-bronnen, maar de reeds toegepaste versies in `supabase/migration-history.lock.json` bleven op 820 staan. Alle eerste 820 provider/version-name-paren zijn exact gelijk aan de oorspronkelijke lock.

Deze herstel-PR wijzigt uitsluitend die originele lock naar **821**, met exact dezelfde versie/naam als de provider. Eerdere migraties, rechten, scheduler, data, blog, e-mail, LinkedIn en Instagram worden niet gewijzigd of opnieuw uitgevoerd. Protected Required, CodeQL en Hosted Preview zijn verplicht; alleen provider-onafhankelijke echte succesvolle controles autoriseren de merge.

De oorspronkelijke BRAIN-afhandeling blijft op cron #171, zonder tweede uitvoeringslus. Na release readback: provider 821, source 821, lock 821. Bron van fout en preventie in `brain/learning/2026-11-10-native821-provider-lock-v1.json` en bestaand incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
