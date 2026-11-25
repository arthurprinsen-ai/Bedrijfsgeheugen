# 13 november 2026 — oorspronkelijke provider-lock 845 na bewezen no-publishroutering

## Bewijs vóór administratieve registratie

Originele nieuwe no-publishroutering is via [PR #5736](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5736) beschermd gemerged op `32c550f963dae8ddba21f39edf14a4a8b358190d`, Required/CodeQL en native preview groen. Het **echte** Supabase-productieproject `adhjwmvyoixzjtmiroln` werd onafhankelijk alleen-lezen op `2026-11-13T13:12:15.617685Z` geïnspecteerd: `supabase_migrations.schema_migrations` had **845** werkelijk toegepaste migraties, hoogste `20261113132000` en exacte naam `original_skipped_no_publish_evidence_routing_v1`. De oorspronkelijke beschermde functie bevat de nieuwe `SKIPPED`-besluitroute; service_role en terminal-proof trigger zijn behouden. De oude Git-lock was nog legitiem **844**, want vóór provider-deployment mag geen toekomstige migratie als toegepast worden geregistreerd.

## Precies één originele vervolgwijziging

In de **bestaande** `supabase/migration-history.lock.json` is exact dit enige door provider bewezen versie/naam-paar toegevoegd; eerdere 844 records zijn exact ongewijzigd. De timestamp `captured_at` is de oorspronkelijke onafhankelijke providerobservatie. Geen tweede lock, nieuw SQL-bestand, scheduler, provider send, voorgestelde besluitcode of herhaalde pagina-/postpublicatie. Geen aanpassing aan no-publish terminal CANCELLED-guard.

Regressie `tests/brain-original-skipped-provider-845-migration-lock-20261113.test.mjs` vereist exact 845 geordende unieke provideridentiteiten, de originele toepasselijke migratie, de echte veilige `SKIPPED`-routing, bestaande grants en onveranderde terminal-proof guard. Machineleerregel `brain/learning/2026-11-13-original-skipped-provider-845-migration-lock-v1.json`, append-only ledger `docs/development-ledger-events/2026-11-13-original-skipped-provider-845-migration-lock.md`.

Acceptatie: beschermde Required/CodeQL en owner-lease, main merge, zelfstandige `Supabase schema_migrations`-READBACK versie+naam plus Git-lock 845, en originele ONE BRAIN postmerge terminal SUCCESS. Dat sluit uitsluitend de release- en bronlockoverdracht. Operationele historische source decisions zonder originele `decision_code` en providerreadbacks blijven OPEN; geen schijnresultaat of kunstmatig FULL_GREEN.

Origineel centraal incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
