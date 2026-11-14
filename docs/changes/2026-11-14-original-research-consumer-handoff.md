# 14 november 2026 — Eén originele commerciële keten met verplichte onderzoeks- en ontvangers-ACK

## Productieobservatie
- Bestaande job #116 stages 2/3 draaien. SQL-dispatch retourneert een pg_net request_id zonder dat daarmee is bewezen dat de externe onderzoeker of de volgende actor het resultaat heeft verwerkt
- Stage-registratie `commercial_stage_execution` gebruikt tot nu toe `actioned` bij elk niet-falend SQL-resultaat; dit is te optimistisch
- De 14 november 854 bron-cooldown werd correct in de originele Supabase-productie toegepast. Vijf goedgekeurde brononderzoeken zijn vandaag via de bestaande idempotente eigenaar uitgezet; één bronkandidaat, vier echt onderzochte acties met `NO_VERIFIED_SOURCE_IN_BOUNDED_ORIGINAL_SEARCH` en heronderzoek 15 november. Geen gegarandeerd of bewezen nieuw Gmail-bericht
- SERP-snippets inclusief `google.com/goto` zijn **onbevestigde kandidaten**, geen evidence om een klant te mailen. Het veld `freshness_verified=false` blijft waar

## Ontwerp (uitsluitend bestaande #116, geen tweede lus)
Nieuwe, service-only functie `powerhouse_reconcile_relationship_research_handoff_v1(date)` schrijft voor originele source acties deterministische `original-research-owner-handoff:<action_id>` runtime events. Event bevat correlation/research action ID, oorspronkelijke email action ID indien aanwezig, eigenaar, datum, due_at, echte DataForSEO bronpoging, eventuele kandidaat, exacte original composer readback, en expliciet `gmail_provider_delivery_proven=false`. Geen klant-e-mailadres in de receipt.

De originele `powerhouse_commercial_hourly_stage_v1` voert deze controle na stage 2 en 3 uit, schrijft het auditresultaat mee naar zijn **bestaande** stage-ontvangstbewijs en markeert afwijkingen `error`; zolang de volgende eigenaar nog geen bewijs heeft is het `waiting`, niet `actioned`. Een gequeuede HTTP-request blijft een transportbewijs, géén verwerking of mailverzending.

De originele onderzoek-dispatch doet voortaan alleen de reeds bestaande due onderzoekstaken (`due_at <= now()`) zodat de 24-uursretry niet steeds een onnodige externe zoekopdracht veroorzaakt. Eerdere terminale emailacties blijven immutable; geen automatische replay.

## Criteria voor volledig werkend
1. Protected Required/BRAIN/CodeQL + native Supabase preview en exacte protected merge/migratie
2. Onafhankelijke productie-readback op drie functies en service-role ACL; onveranderd één actieve cron #116
3. Volgende natuurlijke stage-2/3: vijf oorspronkelijke onderzoeksacties hebben elk precies één duurzame receipt, echte bronpoging versus ongetoetste bronkandidaat eerlijk onderscheiden, geen verkeerde `actioned`
4. Onderzoek met onvoldoende bron blijft bij dezelfde eigenaar, met veilige nieuwe due_at; geen duplicaat/provideruitvoering voor de datum
5. Alleen origineel geautoriseerd Gmail provider-ID en onafhankelijke ontvanger/inhoudsreadback kunnen `sent` aantonen. A/B, orders en omzet alleen na aparte waarneming

Oorspronkelijke verplichting: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Bronselectieherstel: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5763. Productiebronhistorie: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5764.

Status bij kandidaat: NOT_LIVE.

Extra score-isolation rule: administrative handoff receipts carry `person_key`/`company_key` only in evidence. Top-level runtime event `person_key` and `company_key` are NULL so the original relationship-ranking engine does not misread a technical ACK as a fresh sales signal. Original genuine source event remains separately attributable.

Native schema check: `powerhouse_runtime_events.state` only accepts observed/decided/actioned/closed/ignored/error. Therefore pending handoff is `state=observed` with explicit `evidence.handoff_status` and due_at; unacknowledged overdue transfers are `state=error`. Neither may be promoted to `actioned`. The migration and regressions preserve the existing state constraint, avoiding schema changes.
