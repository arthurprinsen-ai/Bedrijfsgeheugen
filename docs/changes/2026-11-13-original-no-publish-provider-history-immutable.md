# 13 november 2026 — originele SKIPPED-beslisser mag nooit providerbewijs overschrijven

## Onafhankelijk aangetoonde oorspronkelijke fout

De werkende productiefunctie `public.record_content_publication_skip(text,date,text,text,jsonb)` is exact dezelfde als oorspronkelijke beschermde migratie `20261112131500_original_no_publish_provider_side_effect_fence_v1.sql` (afgezien van één afsluitende newline). Hoewel deze functie verzending terecht verbiedt als een provider-ID of `published_at` aanwezig is, controleert zij meerdere oorspronkelijke provider-success-vlaggen via `original_evidence || incoming_evidence`. Bij PostgreSQL JSONB `||` wint de waarde **rechts** van een gelijke sleutel. Een door een volgende caller aangeboden `{"provider_create_success":false}` kan dus een eerder opgeslagen `{"provider_create_success":true}` uit het resultaat laten verdwijnen voordat de veto-functie wordt aangeroepen. Een onafhankelijke, uitsluitend lezende productie-SELECT bevestigt `original=true, merged=false, separate_OR=true`. **Er is geen bewijs dat een dubbele publicatie daadwerkelijk heeft plaatsgevonden**, maar de originele beveiligingsfunctie kent een reproduceerbare fail-open conditie.

Ook registreert dezelfde oorspronkelijke RPC een `SKIPPED` als volledig goedgekeurde no-publish-beslissing zonder complete originele metadata. De productiegegevens bevatten **34** overgeslagen blogrecords; **20** missen `decision_code`, waarvan **19** al `veto.active=true` hebben. Deze records blijven terecht OPEN volgens de beschermde originele `brain_content_handoff_terminal_proof_guard_v1`. Een besluitcode uit tekst of uit een ander kanaal afleiden zou het bewijs vervalsen.

## Beschermde correctie binnen precies één oorspronkelijke eigenaar

Migration `supabase/migrations/20261113140500_original_no_publish_immutable_provider_receipt_v1.sql` herdefinieert ALLEEN de bestaande `public.record_content_publication_skip` met **dezelfde** argumenten, `SECURITY DEFINER`, search_path en service-role grants. De oorspronkelijke `content_publication_obligations`-tabel blijft de enige bron; originele `#171` consumer en scheduler blijven onaangeroerd.

1. Valideer dat binnenkomend JSON-bewijs een object is. Lees de oorspronkelijke bron en het nieuwe payload **afzonderlijk**.
2. Check `provider_create_success`, `provider_publication_ack_verified`, `provider_truth_verified`, `terminal_provider_side_effect`, `possible_provider_side_effect` en `reconciliation_required` elk met `original OR incoming` voordat iets wordt samengevoegd. Ook bestaande/nieuwe `source_state_conflict`, provider-ID of publicatietijd blokkeert de skipactie naar de oorspronkelijke provider-reconciliatie.
3. Een bestaand actief veto mag niet via nieuwe `false`, `null` of niet-object JSON worden verzwakt. Een deels ingevuld nieuw veto behoudt de originele `active=true` en de bestaande reden via veldgewijze merge.
4. Maak de original `SKIPPED` uitsluitend een bewezen afgeronde no-publish-beslissing wanneer **beide** originele gestructureerde waarden `veto.active=true` en een niet-lege `decision_code` aanwezig zijn. Bij ontbrekend bewijs blijft `SKIPPED` veilig zonder nieuwe send, maar `next_action=ORIGINAL_NO_PUBLISH_DECISION_CODE_VETO_DATE_REASON_REQUIRED_NO_RESEND`, `last_error=NO_PUBLISH_SOURCE_DECISION_PROOF_INCOMPLETE`. Dit is géén terminale ACK.
5. Historische twintig beslissingen niet muteren, geen besluitcodes fabriceren, geen provider posts opnieuw verzenden. Original #845 bronroutering naar `OVERDUE_NO_PUBLISH_SOURCE_DECISION_PROOF` blijft in gebruik.

Test: `tests/brain-original-no-publish-immutable-provider-evidence-20261113.test.mjs` vereist oorspronkelijke provider-ID-rechten, kwalificatie van alle zes veldindicaties, onverzwakbaar veto, geen fake decision code, één originele statuswriter, geen nieuw cron/trigger/sender en behoud van original ONE BRAIN terminale proof-guard.

## Exacte release-acceptatie

Protected Required/CodeQL + originele native Supabase preview → originele beschermde merge → echte Supabase provider-applied `schema_migrations` versie+naam+functiedefinitie + rol-ACL → natuurlijke #171 originele consumer en BRAIN-loop. Immuut historisch `migration-history.lock.json` mag **pas** worden bijgewerkt na onafhankelijke provider readback, niet op basis van PR/preview. Onderliggende 366 OPEN en 7 RED worden niet gefingeerd als afgewikkeld. Origineel incident [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198).
