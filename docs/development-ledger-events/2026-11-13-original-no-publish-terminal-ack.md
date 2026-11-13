# Append-only dossier — original #171 no-publish-veto consumer ACK

- Datum: 2026-11-13; P0 eigenaren #4198 en #4215; bestaande inhoudslus, geen nieuwe scheduler.
- Fingerprint: `powerhouse|content-handoff|historical-original-no-publish-reported-overdue|20261113-v1`.
- Waargenomen bron: `content_publication_obligations` telt 120 `SKIPPED`, waarvan 83 met alle oorspronkelijke no-publishvelden en zonder providerreferentie/publicatietijd. Onder andere 2026-11-03 Instagram is bronstatus SKIPPED met `veto.active=true`, `decision_code=STALE_BACKLOG_CLEAN_SLATE_20261108`, `decided_at` en geen extern ID.
- Waargenomen ontvanger: `brain_obligations` geeft voor dezelfde historische records `OPEN/OVERDUE_PUBLICATION`, terwijl `source_next_action` letterlijk meldt dat geen publicatie nodig is.
- Oorzaak: originele #171 consumer vereist voor elk niet-pub record een publicatiestap, ongeacht bewijsbaar terminale no-publishbeslissing.
- Herstelregel: exact-source volledige veto + expliciet geen side effect → `NO_PUBLISH_POLICY_ACK` / `CANCELLED`, nooit `FULFILLED` of verzonden; verworpen of conflicterend veto behoudt open oorspronkelijke eigenaar. Heropen bij bronwijziging. Bewaar één lineage en originele ACL.
- Bron: `supabase/migrations/20261113062500_original_no_publish_terminal_handoff_ack_v1.sql`; regressies `tests/brain-original-no-publish-terminal-ack-20261113.test.mjs`; machine-BRAIN `brain/learning/2026-11-13-original-no-publish-terminal-ack-v1.json`.
- Exact-head native Required/CodeQL, Supabase preview, merge, migratie-readback en originele natuurlijke #171 consumer-ACK: **NOT_YET_PROVEN**; ga niet direct naar provider of DB-write vanuit deze kandidaat.
- Nog open: 6 red originele loops, 7 commerciële onbewezen overdrachten, 181 social learning overdue. Geen nep-KPI of valse closed-loop claim.

## Stricte productiecohortreadback — 2026-11-13
Een tweede bron-join eiste naast veto/code/reason en afwezig provider-ID ook expliciet geen `source_state_conflict`, `possible_provider_side_effect`, `reconciliation_required` of `provider_truth_verified`. Uitkomst: 82 strikt eligible, 82 origineel `OPEN/OVERDUE_PUBLICATION`, 0 al CANCELLED, 0 ontbrekende BRAIN-rijen. Een 83e bron met alleen het basisveto wordt bewust uitgesloten; geen onterechte administratieve annulering. Dit zijn inputbewijzen, **geen** getoonde productiecorrectie.

## Supabase-preview providerincident — exacte kandidaat en onafhankelijke databasecheck
- Protected [Required run #43379691321](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43379691321): hygiene/admission, PostgreSQL lease, preflight, backend, Netlify build parity, Supabase source-contract, CodeQL **success**. Native Supabase preview **failure**: `schema_migrations_pkey` duplicate `20261010113715` / SQLSTATE 23505 tijdens providerhistorie-replay; Required terminal daardoor failure. Dit is GEEN pass of bewijs voor protected merge.
- Originele provider-previewbranch (uitsluitend geïsoleerde GitHub-PR #5709) `nzfmkerywyyayjmxqryc` meldde `MIGRATIONS_FAILED`, maar onafhankelijke read-only query zag exact één versie `20261010113715` plus de nieuwe `20261113062500`; `pg_get_functiondef` bevat `NO_PUBLISH_POLICY_ACK` en `OVERDUE_PROVIDER_READBACK`; `has_function_privilege`: anon=false, authenticated=false, service_role=true; `prosecdef=true` met vergrendeld `search_path`.
- De nieuwe migratie is in de previewbron aanwezig ondanks de providerstatusfout; de juiste actie is oorspronkelijke preview-providerreconciliatie en daarna opnieuw protected exact-head checks, **niet** handmatig de geschiedenis wissen, test omzeilen, providerpublicaties als succesvol tellen of ongeautoriseerd productie-SQL uitvoeren.
- Historische afwijking was in `supabase/migration-history.lock.json` reeds vastgelegd als originele, eenmaal toegepaste versie `20261010113715`. Root cause actuele previewstatus: dubbele poging tot INSERT van een reeds aanwezige migratieversie. Geen nieuwe migratiealias aangemaakt.
