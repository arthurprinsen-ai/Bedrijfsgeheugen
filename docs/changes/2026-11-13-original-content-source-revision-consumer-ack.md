# 13 november 2026 — bronrevisie en consumentbevestiging in dezelfde originele contentlus

## Onafhankelijke productiediagnose
De beveiligd gemergede `#5709` heeft echte `NO_PUBLISH_POLICY_ACK`-statusoverdracht op gang gebracht. Read-only productiecontrole van de eerste **28** correct als `CANCELLED` gemarkeerde ONE BRAIN-records toont echter **0/28** expliciete `tenant_id`, `source_revision`, `source_correlation_id` en `consumer_ack`. De oorspronkelijke `content_publication_obligations` heeft **436/436** records met een concrete `updated_at`-tijd. Zonder per-record bronrevisie is een later auditbewijs over exact welke klant-/bronversie verwerkt werd onvoldoende. Dit is geen bewijs dat die 28 statusbeslissingen fout zijn; het is een provenance-/handofftekort.

## Enkelvoudig herstel, geen parallelle uitvoerder
De bestaande Postgres `powerhouse_content_handoff_receipts_v1` onder de **bestaande** `powerhouse-runtime-scheduler-mux-v1` / cron #171 krijgt uitsluitend extra, deterministische evidence:
- Originele `tenant_id`, `source_record_key` = tenant/kanaal/publicatiedatum, `source_revision` = bestaande `updated_at` in exact UTC met microseconden, en `source_correlation_id` = dezelfde onveranderlijke idempotente MD5 die het bestaande originele ONE BRAIN-obligation-record identificeert.
- `consumer_ack` herhaalt exact dezelfde revisie en correlatie, bestaande stage/owner en onderscheidt bronacceptatie van daadwerkelijk bewezen providerpublicatie, meting en leertoepassing. `accepted=true` betekent alleen dat het originele bronrecord in de transactionele BRAIN-evidence is opgenomen. Het veroorzaakt geen externe send.
- Bestaande historische terminale `CANCELLED`-beslissingen zijn eenmalig opnieuw te inspecteren als identity/revision/ACK ontbreekt of als de echte bronrevisie verandert. Daarna stopt de herhaling. Er wordt geen oude `FULFILLED`-publicatie geforceerd heropend; die houdt zijn oorspronkelijke bewijs.
- De onveranderde `OVERDUE_PROVIDER_READBACK`-voorrang voor mogelijke eerdere provider-side-effecten, `NO_PUBLISH`-veto, 24/48/72-uursgrenzen, bronevent-tijdcontrole en veiligheidsgrenzen blijven bestaan.

## Bestaande agents/skills
`agent-reliability` bewaakt dat geen originele overdracht zonder source-revision/consumer-ACK verdwijnt; `agent-data-quality` vergelijkt sleutel, tenant, revisie en correlatie onafhankelijk. De bestaande social/CRO-skill beschrijft de exacte acceptatie, foutafhandeling en geen-duplicatenregel. Het machineleesbare ONE BRAIN-incident en append-only ledger worden aan de oorspronkelijke #4198 / #4215 gekoppeld.

## Releasebewijs, niet op voorhand groen
Nieuwe bronmigratie `20261113071500_original_content_handoff_source_revision_receipt_v1.sql`; regressie `tests/brain-original-content-handoff-source-revision-ack-20261113.test.mjs`. Migratie geldt pas live na **native Supabase preview + exact-head Required/CodeQL + protected merge + productieversie/functie/ACL-readback + natuurlijke originele #171 consumer-ACK**. Tot die tijd niet claimen dat alle 436 bronnen of alle tenant- en klantprocessen al aantoonbaar gesloten zijn. Geen nieuwe taakscheduler, nieuw queuepad, nieuwe provider of direct ongecontroleerd schrijven.
